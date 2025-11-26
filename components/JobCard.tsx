import React from 'react';
import { JobListing } from '../types';
import { MapPinIcon, BriefcaseIcon, SparklesIcon } from './Icons';

interface JobCardProps {
  job: JobListing;
  onSelect: (job: JobListing) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onSelect }) => {
  
  // Helper to determine if a job is "New"
  const isNew = (dateStr?: string) => {
    if (!dateStr) return false;
    const lower = dateStr.toLowerCase();
    // Keywords for immediate/recent
    if (/(hour|minute|second|just now|today|yesterday|小时|分钟|秒|刚刚|今天|昨天)/.test(lower)) return true;
    
    // Check "X days ago" / "X天前"
    const dayMatch = lower.match(/(\d+)\s*(day|天)/);
    if (dayMatch && parseInt(dayMatch[1]) <= 7) return true;
    
    return false;
  };

  // Helper to determine if a job is potentially "Old" (e.g., > 30 days)
  const isOld = (dateStr?: string) => {
    if (!dateStr) return false;
    const lower = dateStr.toLowerCase();
    if (/(month|year|月|年)/.test(lower)) return true;
    const dayMatch = lower.match(/(\d+)\s*(day|天)/);
    if (dayMatch && parseInt(dayMatch[1]) > 30) return true;
    return false;
  };

  const isRecent = isNew(job.postedDate);
  const isOlder = isOld(job.postedDate);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200 flex flex-col h-full relative overflow-hidden">
      
      {/* Date Badge */}
      <div className="flex justify-between items-start mb-2">
         {isRecent && (
            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                New
            </span>
         )}
         {isOlder && (
            <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {job.postedDate}
            </span>
         )}
         {!isRecent && !isOlder && job.postedDate && (
             <span className="bg-blue-50 text-blue-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {job.postedDate}
             </span>
         )}
         {/* If it's new, we still want to see the specific text sometimes, but let's keep it clean. 
             If recent, showing the 'New' badge is priority. 
             Let's show the date text next to it if recent. 
         */}
         {isRecent && (
             <span className="text-xs text-gray-400 ml-2">{job.postedDate}</span>
         )}
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{job.title}</h3>
          <p className="text-gray-600 font-medium line-clamp-1">{job.company}</p>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 shrink-0 ml-2">
          {job.salaryRange}
        </span>
      </div>

      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center">
          <MapPinIcon className="h-4 w-4 mr-1" />
          {job.location}
        </div>
        <div className="flex items-center">
          <BriefcaseIcon className="h-4 w-4 mr-1" />
          全职
        </div>
      </div>

      <div className="mb-4 flex-grow">
        <p className="text-gray-600 text-sm line-clamp-3">{job.description}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {job.tags.slice(0, 3).map((tag, idx) => (
          <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex gap-2 mt-auto">
        {job.applyUrl && (
            <a 
                href={job.applyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-lg font-medium transition-colors duration-200"
            >
                查看详情
            </a>
        )}
        <button
            onClick={() => onSelect(job)}
            className="flex-1 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 gap-2"
        >
            <SparklesIcon className="w-5 h-5" />
            生成简历
        </button>
      </div>
    </div>
  );
};

export default JobCard;