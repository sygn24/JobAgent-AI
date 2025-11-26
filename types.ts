export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  tags: string[];
  description: string;
  requirements: string[];
  applyUrl?: string;
  postedDate?: string; // e.g., "3 days ago", "2023-10-25"
}

export interface UserProfile {
  fullName: string;
  experience: string; // Brief summary of experience
  skills: string; // Comma separated
  education: string;
}

export interface GeneratedResume {
  markdownContent: string;
  jobId: string;
}

export enum AppStep {
  SEARCH = 'SEARCH',
  RESULTS = 'RESULTS',
  PROFILE_INPUT = 'PROFILE_INPUT',
  RESUME_EDITOR = 'RESUME_EDITOR',
}

export interface SearchParams {
  role: string;
  location: string;
}

export interface SearchResult {
  jobs: JobListing[];
  sources: { title: string; uri: string }[];
}

export interface ResumeData {
  fullName: string;
  contactInfo: string;
  summary: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    period: string;
    details: string[];
  }[];
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
  projects?: {
    name: string;
    description: string;
  }[];
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  themeColor: string;
}