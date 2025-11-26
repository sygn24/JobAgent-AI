import { GoogleGenAI } from "@google/genai";
import { JobListing, UserProfile, SearchResult, ResumeData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-2.5-flash for speed
const MODEL_NAME = "gemini-2.5-flash";

export const searchJobs = async (role: string, location: string, page: number = 1): Promise<SearchResult> => {
  // Prompt tailored for Chinese output and JSON structure, using real search data with pagination logic
  const prompt = `
    请在Google上搜索 "${location}" 地区关于 "${role}" 的最新招聘职位信息。
    这是第 ${page} 页的搜索请求。请尝试寻找与之前页面不同的、更多样化的职位。
    
    请尽量筛选出 9 个真实且相关的职位 (来源可以是各大招聘网站、公司官网等全网数据)。
    
    请严格按照以下JSON数组格式提取并返回信息 (不要包含Markdown代码块标记，直接返回JSON字符串):
    [
      {
        "id": "unique_id_string",
        "title": "职位名称",
        "company": "公司名称",
        "location": "工作地点",
        "salaryRange": "薪资范围 (如未提及请填'面议')",
        "tags": ["标签1", "标签2"],
        "description": "职位描述摘要 (50-100字)",
        "requirements": ["要求1", "要求2", "要求3"],
        "applyUrl": "职位详情或申请页面的URL",
        "postedDate": "发布时间 (例如: '3天前', '2小时前', '2023-10-25', '刚刚')"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let jobs: JobListing[] = [];
    const text = response.text || "";

    try {
      // Attempt to extract JSON array from the text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jobs = JSON.parse(jsonMatch[0]);
        // Ensure IDs are strings and unique if model duplicated them
        jobs = jobs.map((job, index) => ({
             ...job, 
             id: job.id && job.id !== "unique_id_string" ? job.id : `job-${page}-${index}-${Date.now()}` 
        }));
      } else {
          console.warn("No JSON array found in response text:", text);
      }
    } catch (parseError) {
      console.error("Error parsing job JSON:", parseError);
    }

    const sources: { title: string; uri: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return { jobs, sources };
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};

export const generateUserProfile = async (job: JobListing | null): Promise<UserProfile> => {
    let prompt = "";
    
    if (job) {
        prompt = `
          请根据以下职位描述，生成一个虚构但高度匹配的求职者画像（JSON格式）。
          
          目标职位:
          职位: ${job.title}
          公司: ${job.company}
          描述: ${job.description}
          要求: ${job.requirements.join(", ")}
      
          请返回一个JSON对象，包含以下字段 (使用中文):
          - fullName: 一个真实的中文姓名
          - education: 教育背景 (学校+专业，例如：xx大学 计算机科学与技术 本科)
          - skills: 核心技能 (逗号分隔，匹配职位要求)
          - experience: 工作经验摘要 (100字左右，以第一人称描述，突出与该职位匹配的成就和经验)
      
          只返回JSON字符串，不要Markdown标记。
        `;
    } else {
        prompt = `
          请生成一个通用的、优秀的求职者画像（JSON格式），假设求职者是一名有3-5年经验的专业人士（可以是软件工程师、产品经理或市场营销等通用热门岗位）。
      
          请返回一个JSON对象，包含以下字段 (使用中文):
          - fullName: 一个真实的中文姓名
          - education: 教育背景 (学校+专业)
          - skills: 核心技能 (逗号分隔)
          - experience: 工作经验摘要 (100字左右，以第一人称描述)
      
          只返回JSON字符串，不要Markdown标记。
        `;
    }
  
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
  
      const text = response.text || "{}";
      return JSON.parse(text) as UserProfile;
    } catch (error) {
      console.error("Error generating user profile:", error);
      // Fallback data
      return {
        fullName: "李明",
        education: "某知名大学 相关专业 本科",
        skills: "沟通能力, 项目管理, 专业技能",
        experience: "拥有相关行业工作经验，熟悉业务流程。"
      };
    }
  };

export const generateResumeJSON = async (job: JobListing | null, profile: UserProfile): Promise<ResumeData> => {
  let contextPrompt = "";
  
  if (job) {
      contextPrompt = `
        目标职位:
        职位名称: ${job.title}
        公司: ${job.company}
        职位描述: ${job.description}
        职位要求: ${job.requirements.join(", ")}
        
        任务:
        根据求职者的资料，为该目标职位量身定制一份专业的简历内容。
      `;
  } else {
      contextPrompt = `
        任务:
        根据求职者的资料，整理一份专业的通用简历。
      `;
  }

  const prompt = `
    请扮演一位资深的职业顾问和简历撰写专家。
    
    ${contextPrompt}

    求职者资料:
    姓名: ${profile.fullName}
    工作经验摘要: ${profile.experience}
    技能: ${profile.skills}
    教育背景: ${profile.education}
    
    请严格返回以下JSON格式 (不要Markdown标记):
    {
      "fullName": "${profile.fullName}",
      "contactInfo": "电话: 138-xxxx-xxxx | 邮箱: example@email.com | 所在地: ${job ? job.location.split(' ')[0] : '城市'}",
      "summary": "个人优势总结（100字以内）",
      "skills": ["技能1", "技能2", "技能3", "技能4", "技能5"],
      "experience": [
        {
          "role": "职位名称",
          "company": "公司名称",
          "period": "20xx.xx - 20xx.xx",
          "details": ["工作内容描述1 (使用STAR法则)", "工作内容描述2", "工作内容描述3"]
        }
      ],
      "education": [
        {
          "degree": "学位/专业",
          "school": "学校名称",
          "year": "毕业年份"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as ResumeData;
  } catch (error) {
    console.error("Error generating resume JSON:", error);
    throw error;
  }
};

export const optimizeResumeContent = async (currentContent: string, instruction: string): Promise<string> => {
  // Escaping backticks to prevent template literal syntax errors
  const prompt = `
    你是一个Markdown简历编辑器助手。
    用户希望根据以下指令修改当前的简历 Markdown 内容。

    指令: "${instruction}"

    当前的 Markdown 内容:
    ${currentContent}

    要求:
    1. 仅返回修改后的 Markdown 内容，不要包含 \`\`\`markdown 标记。
    2. 保持 Markdown 格式的完整性。
    3. 如果指令是关于润色语言，请使其更专业、更有说服力。
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text?.trim() || currentContent;
  } catch (error) {
    console.error("Error optimizing resume:", error);
    throw error;
  }
};