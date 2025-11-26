import { ResumeData, ResumeTemplate } from "../types";

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'classic',
    name: '经典通用',
    description: '结构清晰，适合大多数职位的标准格式',
    themeColor: 'from-indigo-500 via-purple-500 to-pink-500',
  },
  {
    id: 'modern',
    name: '精简现代',
    description: '紧凑布局，强调个人优势，适合互联网行业',
    themeColor: 'from-blue-600 via-blue-400 to-cyan-400',
  },
  {
    id: 'skill-focused',
    name: '技能导向',
    description: '优先展示核心技能，适合技术类岗位',
    themeColor: 'from-emerald-500 via-teal-500 to-cyan-500',
  }
];

export const renderMarkdown = (data: ResumeData, templateId: string): string => {
  switch (templateId) {
    case 'modern':
      return renderModernTemplate(data);
    case 'skill-focused':
      return renderSkillFocusedTemplate(data);
    case 'classic':
    default:
      return renderClassicTemplate(data);
  }
};

const renderClassicTemplate = (data: ResumeData): string => {
  return `
# ${data.fullName}

> ${data.contactInfo}

## 个人简介
${data.summary}

## 核心技能
${data.skills.map(skill => `* ${skill}`).join('\n')}

## 工作经历
${data.experience.map(exp => `
### ${exp.role} | ${exp.company}
*${exp.period}*

${exp.details.map(detail => `* ${detail}`).join('\n')}
`).join('\n')}

## 教育背景
${data.education.map(edu => `
### ${edu.school}
${edu.degree} | ${edu.year}
`).join('\n')}
`;
};

const renderModernTemplate = (data: ResumeData): string => {
  return `
# ${data.fullName}
${data.contactInfo.split('|').map(info => `* ${info.trim()}`).join(' ')}

---

## 关于我
> ${data.summary}

## 工作经历
${data.experience.map(exp => `
**${exp.role}** @ ${exp.company}  
_${exp.period}_

${exp.details.map(detail => `- ${detail}`).join('\n')}
`).join('\n\n')}

## 技能专长
${data.skills.join(' • ')}

## 教育
${data.education.map(edu => `**${edu.school}** - ${edu.degree} (${edu.year})`).join('\n')}
`;
};

const renderSkillFocusedTemplate = (data: ResumeData): string => {
  return `
# ${data.fullName}
${data.contactInfo}

## 核心竞争力
${data.skills.map(skill => `* **${skill}**`).join('\n')}

## 职业目标
${data.summary}

## 职业经历
${data.experience.map(exp => `
### ${exp.role}
**${exp.company}** | ${exp.period}

${exp.details.map(detail => `* ${detail}`).join('\n')}
`).join('\n')}

## 教育背景
${data.education.map(edu => `* ${edu.school}，${edu.degree}，${edu.year}`).join('\n')}
`;
};
