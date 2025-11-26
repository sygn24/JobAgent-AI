import React, { useState, useRef } from 'react';
import { AppStep, JobListing, UserProfile, SearchParams, ResumeData } from './types';
import { searchJobs, generateUserProfile, generateResumeJSON, optimizeResumeContent } from './services/geminiService';
import { RESUME_TEMPLATES, renderMarkdown } from './services/templateService';
import JobCard from './components/JobCard';
import { SearchIcon, MapPinIcon, BackIcon, DownloadIcon, SparklesIcon, PhotoIcon, ZoomInIcon, ZoomOutIcon } from './components/Icons';
import MarkdownRenderer from './components/MarkdownRenderer';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.SEARCH);
  const [searchParams, setSearchParams] = useState<SearchParams>({ role: '', location: '' });
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewOnly, setShowNewOnly] = useState(false);
  
  // Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: '',
    experience: '',
    skills: '',
    education: '',
  });
  const [autoFilling, setAutoFilling] = useState(false);

  // Resume State
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeContent, setResumeContent] = useState<string>('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(RESUME_TEMPLATES[0].id);
  
  // AI Editor State
  const [aiInstruction, setAiInstruction] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const performSearch = async (role: string, location: string, page: number) => {
    setLoading(true);
    setJobs([]); // Clear previous results to show loading state effectively
    try {
      const result = await searchJobs(role, location, page);
      setJobs(result.jobs);
      setSources(result.sources);
      setStep(AppStep.RESULTS);
    } catch (error) {
      alert("搜索失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.role || !searchParams.location) return;
    setCurrentPage(1);
    await performSearch(searchParams.role, searchParams.location, 1);
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1) return;
    setCurrentPage(newPage);
    await performSearch(searchParams.role, searchParams.location, newPage);
    window.scrollTo(0, 0);
  };

  const handleJobSelect = (job: JobListing) => {
    setSelectedJob(job);
    setStep(AppStep.PROFILE_INPUT);
  };

  const handleStandaloneCreate = () => {
      setSelectedJob(null);
      setStep(AppStep.PROFILE_INPUT);
  };

  const handleAutoFill = async () => {
    setAutoFilling(true);
    try {
        const profile = await generateUserProfile(selectedJob);
        setUserProfile(profile);
    } catch (e) {
        alert("自动生成失败，请稍后重试");
    } finally {
        setAutoFilling(false);
    }
  };

  const handleGenerateResume = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // 1. Generate Structured Data (handles null job for generic resume)
      const data = await generateResumeJSON(selectedJob, userProfile);
      setResumeData(data);
      
      // 2. Render Initial Markdown
      const markdown = renderMarkdown(data, selectedTemplateId);
      setResumeContent(markdown);
      
      setStep(AppStep.RESUME_EDITOR);
    } catch (error) {
      alert("简历生成失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (resumeData) {
        if (confirm("切换模板将覆盖您当前的编辑内容，确定要切换吗？")) {
            const markdown = renderMarkdown(resumeData, templateId);
            setResumeContent(markdown);
        }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([resumeContent], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${userProfile.fullName.replace(' ', '_')}_简历.md`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  const handleExportHTML = () => {
    const printContent = document.getElementById('print-container');
    if (!printContent) {
        alert("无法获取简历内容");
        return;
    }

    // Get the inner HTML. 
    // Note: This captures the current state, including base64 images from the state.
    const contentHtml = printContent.innerHTML;

    const htmlDocument = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${userProfile.fullName} - 简历</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', "Microsoft YaHei", sans-serif; background: #525252; margin: 0; padding: 20px; display: flex; justify-content: center; }
    .resume-paper {
        background: white;
        width: 210mm;
        min-height: 297mm;
        padding: 15mm;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
        overflow-wrap: break-word; 
    }
    /* Ensure float layout works in the export */
    .float-right { float: right; }
    .ml-8 { margin-left: 2rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    
    @media print {
      body { margin: 0; padding: 0; background: white; display: block; }
      .resume-paper {
        width: 100%;
        margin: 0;
        padding: 15mm;
        box-shadow: none;
        min-height: auto;
      }
      /* Prevent page breaks inside elements */
      h1, h2, h3, h4, p, li, blockquote {
        break-inside: avoid;
      }
      h2 {
        break-after: avoid;
      }
      @page { margin: 0; size: auto; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div class="resume-paper">
    ${contentHtml}
  </div>
  <script>
    window.onload = () => {
      // Delay slightly to ensure Tailwind loads
      setTimeout(() => {
        window.print();
      }, 1000);
    };
  </script>
</body>
</html>
    `;

    const blob = new Blob([htmlDocument], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userProfile.fullName}_简历_打印版.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAIOptimize = async () => {
    if (!aiInstruction.trim()) return;
    setIsOptimizing(true);
    try {
      const optimizedContent = await optimizeResumeContent(resumeContent, aiInstruction);
      setResumeContent(optimizedContent);
      setAiInstruction('');
    } catch (e) {
      alert("AI 润色失败，请重试");
    } finally {
      setIsOptimizing(false);
    }
  };

  const goBack = () => {
    if (step === AppStep.RESUME_EDITOR) {
        setStep(AppStep.PROFILE_INPUT);
    } else if (step === AppStep.PROFILE_INPUT) {
        if (selectedJob) {
            setStep(AppStep.RESULTS);
        } else {
            setStep(AppStep.SEARCH);
        }
    } else if (step === AppStep.RESULTS) {
        setStep(AppStep.SEARCH);
    }
  };

  // Helper for filtering new jobs (same logic as JobCard for consistency)
  const isJobNew = (dateStr?: string) => {
    if (!dateStr) return false;
    const lower = dateStr.toLowerCase();
    if (/(hour|minute|second|just now|today|yesterday|小时|分钟|秒|刚刚|今天|昨天)/.test(lower)) return true;
    const dayMatch = lower.match(/(\d+)\s*(day|天)/);
    if (dayMatch && parseInt(dayMatch[1]) <= 7) return true;
    return false;
  };

  const displayedJobs = showNewOnly 
    ? jobs.filter(job => isJobNew(job.postedDate)) 
    : jobs;

  // --- Views ---

  const renderSearch = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-block p-3 bg-white rounded-2xl shadow-lg mb-4">
             <SparklesIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            求职助手 <span className="text-indigo-600">AI</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            利用先进的AI技术，搜索真实职位信息，并为您一键定制专业简历。
          </p>
        </div>

        <div className="space-y-4">
            <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-xl mx-auto border border-gray-100 relative z-10">
            <div className="flex-1 flex items-center px-4 py-3 bg-gray-50 rounded-xl">
                <SearchIcon className="w-5 h-5 text-gray-400 mr-3" />
                <input
                type="text"
                placeholder="职位名称 (如：前端工程师)"
                className="bg-transparent w-full outline-none text-gray-800 placeholder-gray-400"
                value={searchParams.role}
                onChange={(e) => setSearchParams({ ...searchParams, role: e.target.value })}
                required
                />
            </div>
            <div className="flex-1 flex items-center px-4 py-3 bg-gray-50 rounded-xl">
                <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                <input
                type="text"
                placeholder="地点 (如：上海)"
                className="bg-transparent w-full outline-none text-gray-800 placeholder-gray-400"
                value={searchParams.location}
                onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                required
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
            >
                {loading ? '搜索中...' : '搜索职位'}
            </button>
            </form>

            <div className="text-center">
                <button 
                    onClick={handleStandaloneCreate}
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors py-2 px-4 rounded-lg hover:bg-indigo-50"
                >
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    不需要找工作？直接制作简历 &rarr;
                </button>
            </div>
        </div>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <button onClick={goBack} className="text-gray-500 hover:text-gray-700 flex items-center mb-2 text-sm font-medium">
            <BackIcon className="w-4 h-4 mr-1" /> 返回搜索
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            关于 "{searchParams.role}" 在 "{searchParams.location}" 的搜索结果
          </h2>
          <p className="text-gray-500 mt-1">
            第 {currentPage} 页 • AI为您全网筛选相关职位
          </p>
        </div>
        
        {/* Filter Toggle */}
        {!loading && jobs.length > 0 && (
            <label className="flex items-center cursor-pointer select-none bg-white py-2 px-4 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="relative">
                    <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={showNewOnly} 
                        onChange={() => setShowNewOnly(!showNewOnly)} 
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${showNewOnly ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showNewOnly ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-medium text-gray-700">仅显示新职位</div>
            </label>
        )}
      </div>
      
      {loading ? (
        <div className="flex-grow flex items-center justify-center py-20">
             <div className="text-center">
                 <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                 <p className="text-gray-600 font-medium">正在全网搜索并整理第 {currentPage} 页数据...</p>
             </div>
        </div>
      ) : (
        <>
          {displayedJobs.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
                <p className="text-lg">
                    {showNewOnly ? "没有找到符合条件的'新职位'。" : "本页未找到相关职位。"}
                </p>
                <div className="flex justify-center gap-4 mt-4">
                    {showNewOnly ? (
                         <button onClick={() => setShowNewOnly(false)} className="text-indigo-600 hover:underline">
                            查看所有职位
                        </button>
                    ) : (
                        <>
                            {currentPage > 1 && (
                                <button onClick={() => handlePageChange(currentPage - 1)} className="text-indigo-600 hover:underline">
                                    返回上一页
                                </button>
                            )}
                            <button onClick={() => handlePageChange(currentPage + 1)} className="text-indigo-600 hover:underline">
                                尝试下一页
                            </button>
                        </>
                    )}
                </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {displayedJobs.map((job) => (
                <JobCard key={job.id} job={job} onSelect={handleJobSelect} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {jobs.length > 0 && !showNewOnly && (
            <div className="flex justify-center items-center space-x-4 mb-8">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    上一页
                </button>
                <span className="text-gray-600 font-medium">第 {currentPage} 页</span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    下一页
                </button>
            </div>
          )}
        </>
      )}

      {/* Grounding Sources */}
      {!loading && sources.length > 0 && (
        <div className="mt-auto pt-8 border-t border-gray-200">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">信息来源</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
                {sources.map((source, idx) => (
                    <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline truncate max-w-xs"
                    >
                        {source.title || source.uri}
                    </a>
                ))}
            </div>
        </div>
      )}
    </div>
  );

  const renderProfileInput = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 px-8 py-6 flex justify-between items-center">
          <div>
            <button onClick={goBack} className="text-indigo-200 hover:text-white flex items-center mb-2 text-sm font-medium transition-colors">
                <BackIcon className="w-4 h-4 mr-1" /> {selectedJob ? '返回职位列表' : '返回首页'}
            </button>
            <h2 className="text-2xl font-bold text-white">{selectedJob ? '完善个人信息' : '创建新简历'}</h2>
            <p className="text-indigo-200 mt-1">{selectedJob ? 'AI 将根据这些信息为您定制简历' : '填写基本信息，AI 将为您生成通用简历模板'}</p>
          </div>
          <button
            onClick={handleAutoFill}
            disabled={autoFilling}
            className="flex items-center bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-75 shadow-sm"
          >
            {autoFilling ? (
                <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent mr-2"></div>
                生成中...
                </>
            ) : (
                <>
                <SparklesIcon className="w-5 h-5 mr-1" />
                AI 一键填写
                </>
            )}
          </button>
        </div>

        <form onSubmit={handleGenerateResume} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={userProfile.fullName}
              onChange={(e) => setUserProfile({ ...userProfile, fullName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">教育背景</label>
            <input
              type="text"
              placeholder="学校、专业、学位"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={userProfile.education}
              onChange={(e) => setUserProfile({ ...userProfile, education: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">核心技能 (逗号分隔)</label>
            <input
              type="text"
              placeholder="React, TypeScript, Node.js..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={userProfile.skills}
              onChange={(e) => setUserProfile({ ...userProfile, skills: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工作经验简述</label>
            <textarea
              rows={5}
              placeholder="简要描述您的主要工作经历和成就..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
              value={userProfile.experience}
              onChange={(e) => setUserProfile({ ...userProfile, experience: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center shadow-lg"
          >
            {loading ? (
                 <>
                 <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                 正在生成简历...
                 </>
            ) : (
                '生成简历预览'
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const renderEditor = () => {
    // Hidden file input for photo upload
    return (
        <div className="h-screen flex flex-col bg-gray-100 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                className="hidden" 
                accept="image/*"
            />
            {/* Toolbar */}
            <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-sm print:hidden">
                <div className="flex items-center space-x-4">
                    <button onClick={goBack} className="text-gray-500 hover:text-gray-900 transition-colors">
                        <BackIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">简历编辑器</h1>
                        <p className="text-xs text-gray-500 flex items-center">
                            双击照片更换
                            <span className="mx-1">•</span>
                            拖拽调整位置
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                     {/* Template Selector */}
                     <select 
                        value={selectedTemplateId} 
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                    >
                        {RESUME_TEMPLATES.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>

                    <div className="h-8 w-px bg-gray-300 mx-1"></div>

                     {/* Zoom Controls */}
                     <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                        <button 
                            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                            className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                            title="缩小"
                        >
                            <ZoomOutIcon className="w-4 h-4" />
                        </button>
                        <span className="text-xs w-10 text-center font-medium text-gray-700">{Math.round(zoomLevel * 100)}%</span>
                        <button 
                            onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))}
                            className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                            title="放大"
                        >
                            <ZoomInIcon className="w-4 h-4" />
                        </button>
                     </div>

                    <div className="h-8 w-px bg-gray-300 mx-1"></div>

                    <button 
                        onClick={handleDownloadMarkdown}
                        className="flex items-center text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
                    >
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Markdown
                    </button>
                    <button 
                        onClick={handleExportHTML}
                        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-bold shadow-sm"
                    >
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        PDF (打印版)
                    </button>
                </div>
            </header>

            {/* Main Content Split */}
            <div className="flex-1 flex overflow-hidden print:overflow-visible print:block">
                {/* Left: Editor & AI Tools */}
                <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white print:hidden">
                    {/* AI Optimization Bar */}
                    <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                        <label className="block text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-2">
                            AI 智能润色
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={aiInstruction}
                                onChange={(e) => setAiInstruction(e.target.value)}
                                placeholder="输入指令 (例如：'让经历描述更专业' 或 '精简摘要')..."
                                className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAIOptimize()}
                            />
                            <button
                                onClick={handleAIOptimize}
                                disabled={isOptimizing || !aiInstruction.trim()}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                            >
                                {isOptimizing ? '优化中...' : '优化'}
                            </button>
                        </div>
                    </div>

                    {/* Markdown Textarea */}
                    <textarea
                        className="flex-1 w-full p-6 resize-none focus:outline-none text-gray-800 font-mono text-sm leading-relaxed"
                        value={resumeContent}
                        onChange={(e) => setResumeContent(e.target.value)}
                        placeholder="在此编辑 Markdown 内容..."
                    />
                </div>

                {/* Right: Preview */}
                <div className="w-1/2 bg-gray-100 overflow-y-auto p-8 flex justify-center print:w-full print:p-0 print:overflow-visible relative">
                    {/* 
                       Changes:
                       Added transform scale based on zoomLevel.
                       Added transform-origin-top to keep it centered/top aligned.
                       Overflow behavior improvements.
                    */}
                    <div 
                        id="print-container" 
                        className="resume-paper bg-white w-[210mm] min-h-[297mm] h-auto shadow-2xl p-[15mm] relative box-border mb-10 transition-transform duration-200 origin-top print:transform-none print:shadow-none print:m-0 print:w-full print:mb-0"
                        style={{ transform: `scale(${zoomLevel})` }}
                    >
                        <MarkdownRenderer 
                            content={resumeContent} 
                            photoUrl={userPhoto}
                            onPhotoClick={triggerFileInput}
                            themeColor={RESUME_TEMPLATES.find(t => t.id === selectedTemplateId)?.themeColor}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {step === AppStep.SEARCH && renderSearch()}
      {step === AppStep.RESULTS && renderResults()}
      {step === AppStep.PROFILE_INPUT && renderProfileInput()}
      {step === AppStep.RESUME_EDITOR && renderEditor()}
    </div>
  );
};

export default App;