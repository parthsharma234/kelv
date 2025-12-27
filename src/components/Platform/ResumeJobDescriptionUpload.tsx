import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Briefcase, CheckCircle, Loader, AlertCircle } from 'lucide-react';

export interface ParsedInterviewData {
  role: string;
  industry: string;
  experienceLevel: string;
  skills: string[];
  targetCompany?: string;
  keyResponsibilities?: string[];
}

interface ResumeJobDescriptionUploadProps {
  onParsed: (data: ParsedInterviewData) => void;
}

const ResumeJobDescriptionUpload: React.FC<ResumeJobDescriptionUploadProps> = ({
  onParsed
}) => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescText, setJobDescText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File, type: 'resume' | 'jd') => {
    if (file.type === 'application/pdf') {
      try {
        const text = await extractTextFromPDF(file);
        if (type === 'resume') {
          setResumeText(text);
          setResumeFile(file);
        } else {
          setJobDescText(text);
          setJdFile(file);
        }
      } catch (err) {
        setError('Failed to extract PDF text. Please paste the text directly instead.');
      }
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.type === '') {
      try {
        const text = await file.text();
        if (type === 'resume') {
          setResumeText(text);
          setResumeFile(file);
        } else {
          setJobDescText(text);
          setJdFile(file);
        }
      } catch (err) {
        setError('Failed to read file. Please try pasting the text directly.');
      }
    } else {
      setError('Please upload PDF or TXT files only.');
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // Import pdfjs-dist
      const pdfjs = await import('pdfjs-dist');

      // Set worker with cache-busting timestamp
      const workerUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

      const arrayBuffer = await file.arrayBuffer();

      // Load PDF with explicit worker configuration
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });

      const pdf = await loadingTask.promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (err) {
      console.error('PDF extraction error:', err);
      throw new Error('Failed to extract text from PDF. Please paste text directly.');
    }
  };

  const parseDocuments = async () => {
    if (!resumeText || !jobDescText) {
      setError('Both resume and job description are required to continue');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Parse using keyword extraction and pattern matching
      const parsed = await intelligentParse(resumeText, jobDescText);
      onParsed(parsed);
    } catch (err: any) {
      setError(err.message || 'Failed to parse documents');
    } finally {
      setIsProcessing(false);
    }
  };

  const intelligentParse = async (
    resumeText: string,
    jdText: string
  ): Promise<ParsedInterviewData> => {
    const combined = `${resumeText}\n\n${jdText}`.toLowerCase();

    // Extract Role
    const rolePatterns = [
      /(?:position|role|title):\s*([^\n]+)/i,
      /(?:seeking|hiring|looking for)\s+(?:a\s+)?([^,.]+(?:engineer|developer|manager|designer|analyst|specialist))/i,
      /(software engineer|product manager|data scientist|ux designer|marketing manager|sales representative)/i
    ];

    let role = 'Software Engineer'; // Default
    for (const pattern of rolePatterns) {
      const match = combined.match(pattern);
      if (match) {
        role = match[1].trim();
        break;
      }
    }

    // Extract Industry
    const industries = [
      'technology', 'finance', 'healthcare', 'marketing', 'sales',
      'education', 'consulting', 'retail', 'manufacturing', 'government'
    ];

    let industry = 'Technology'; // Default
    for (const ind of industries) {
      if (combined.includes(ind)) {
        industry = ind.charAt(0).toUpperCase() + ind.slice(1);
        break;
      }
    }

    // Extract Experience Level
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
      /experience:\s*(\d+)\s*years?/i
    ];

    let experienceYears = 3; // Default mid-level
    for (const pattern of experiencePatterns) {
      const match = combined.match(pattern);
      if (match) {
        experienceYears = parseInt(match[1]);
        break;
      }
    }

    let experienceLevel = 'Mid Level (3-5 years)';
    if (experienceYears <= 2) experienceLevel = 'Entry Level (0-2 years)';
    else if (experienceYears >= 3 && experienceYears <= 5) experienceLevel = 'Mid Level (3-5 years)';
    else if (experienceYears >= 6 && experienceYears <= 10) experienceLevel = 'Senior Level (6-10 years)';
    else if (experienceYears > 10) experienceLevel = 'Executive Level (10+ years)';

    // Extract Skills (common tech skills as example)
    const skillKeywords = [
      'javascript', 'python', 'react', 'node', 'java', 'sql', 'aws',
      'leadership', 'communication', 'project management', 'agile'
    ];

    const skills: string[] = [];
    for (const skill of skillKeywords) {
      if (combined.includes(skill)) {
        skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    }

    // Extract Target Company (from JD)
    const companyMatch = jdText.match(/(?:company|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    const targetCompany = companyMatch ? companyMatch[1] : undefined;

    // Extract Key Responsibilities
    const responsibilityPatterns = [
      /responsibilities?:\s*([^\n]+(?:\n[^\n]+)*)/i,
      /you will:\s*([^\n]+(?:\n[^\n]+)*)/i
    ];

    const keyResponsibilities: string[] = [];
    for (const pattern of responsibilityPatterns) {
      const match = jdText.match(pattern);
      if (match) {
        const respText = match[1];
        const bullets = respText.split(/[•\-\*\n]/).filter(r => r.trim().length > 10);
        keyResponsibilities.push(...bullets.slice(0, 5).map(r => r.trim()));
        break;
      }
    }

    return {
      role,
      industry,
      experienceLevel,
      skills: skills.slice(0, 8), // Top 8 skills
      targetCompany,
      keyResponsibilities
    };
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl w-full space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-3">Smart Interview Setup</h1>
          <p className="text-gray-400">
            Upload your resume and job description - Kelv will auto-configure the perfect interview for you
          </p>
          <p className="mt-4 text-sm text-orange-400 font-medium">
            Required: Both documents needed to continue
          </p>
        </div>

        {/* Upload Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Resume Upload */}
          <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="font-bold">Your Resume</h3>
                <p className="text-xs text-gray-500">PDF or TXT format</p>
              </div>
            </div>

            <label className="block">
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'resume');
                }}
                className="hidden"
              />
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-blue-400/50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                <p className="text-sm text-gray-400">Click to upload resume</p>
                {resumeFile && (
                  <div className="flex items-center justify-center gap-2 mt-2 text-blue-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">{resumeFile.name}</span>
                  </div>
                )}
              </div>
            </label>

            <div className="relative">
              <div className="text-center text-xs text-gray-600 my-2">OR</div>
            </div>

            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors resize-none"
            />
          </div>

          {/* Job Description Upload */}
          <div className="bg-[#0f0f12] border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-orange-400" />
              <div>
                <h3 className="font-bold">Job Description</h3>
                <p className="text-xs text-gray-500">PDF or TXT format</p>
              </div>
            </div>

            <label className="block">
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'jd');
                }}
                className="hidden"
              />
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-orange-400/50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                <p className="text-sm text-gray-400">Click to upload job description</p>
                {jdFile && (
                  <div className="flex items-center justify-center gap-2 mt-2 text-orange-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">{jdFile.name}</span>
                  </div>
                )}
              </div>
            </label>

            <div className="relative">
              <div className="text-center text-xs text-gray-600 my-2">OR</div>
            </div>

            <textarea
              value={jobDescText}
              onChange={(e) => setJobDescText(e.target.value)}
              placeholder="Paste job description here..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={parseDocuments}
          disabled={isProcessing || !resumeText || !jobDescText}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Analyzing Documents...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Analyze & Continue
            </>
          )}
        </button>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-gray-300">
          <p className="font-bold text-blue-400 mb-1">How it works:</p>
          <ul className="space-y-1 text-xs list-disc list-inside">
            <li><strong>Both documents required:</strong> Resume + Job Description</li>
            <li>Kelv extracts your role, industry, and experience level from resume</li>
            <li>Job description analysis identifies key skills and responsibilities</li>
            <li>Interview questions are auto-customized to match the exact role</li>
            <li>Your documents are processed locally and never stored</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default ResumeJobDescriptionUpload;
