'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, CircleDotDashed, FileText, FileUp, Trash2 } from 'lucide-react';
import ATSResumeScore from "@/components/ATSResumeScore";
import type { ApiResult as CandidateAnalysisData } from "@/types/resume";

interface ApiResult {
  success: boolean;
  data: CandidateAnalysisData;
  meta: {
    modelUsed: string;
    timestamp: string;
  };
}

interface ATSResumeScoreProps {
  data: CandidateAnalysisData;
}

export default function ResumeAnalyzer() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [provider, setProvider] = useState<'gemini' | 'mistral'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [includeJD, setIncludeJD] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedResult = localStorage.getItem('ats_resume_result');

      if (savedResult) {
        try {
          setResult(JSON.parse(savedResult));
        } catch (e) {
          console.error('Error parsing stored ATS result:', e);
        }
      }
    }
  }, []);

  const persistResult = (data: ApiResult) => {
    setResult(data);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('ats_resume_result', JSON.stringify(data));
    }
  };

  const handleUploadAnother = () => {
    setResult(null);
    setFile(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('ats_resume_result');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const selectedFile = e.dataTransfer.files?.[0];
    if (!selectedFile) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setError('File size exceeds the 5MB limit. Please upload a smaller file.');
      setFile(null);
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setError('File size exceeds the 5MB limit. Please upload a smaller file.');
      setFile(null);
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
  };

  async function handleAnalyze(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }

    if (!apiKey.trim()) {
      setError(`Please enter your ${provider === 'gemini' ? 'Gemini' : 'Mistral'} API key.`);
      return;
    }

    if (includeJD && !jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('provider', provider);
      formData.append('apiKey', apiKey.trim());
      formData.append('includeJD', includeJD ? 'true' : 'false');
      formData.append('jobDescription', jobDescription.trim());

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as ApiResult & { error?: string };

      if (!res.ok) {
        setError(data?.error ?? 'Something went wrong.');
        return;
      }

      persistResult(data as ApiResult);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // Show raw JSON data on success
  if (result) {
    return (
      <ATSResumeScore data={result.data} onUploadAnother={handleUploadAnother} />
    );
  }

  // Show form
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="space-y-4">
          <button
            onClick={() => router.push('/')}
            className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-1 hover:underline"
          >
            ← Go to Home
          </button>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-200 mb-4 -rotate-6">
            <FileText size={40} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter">Resume Intelligence</h1>
          <p className="text-slate-500 text-lg">
            AI-powered analysis for modern resumes. Upload a PDF to begin.
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
            <label className="group block text-left">
              {/* Label with improved letter-spacing and color transitions */}
              <span className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200">
                AI Provider
              </span>

              {/* Container to position custom arrow */}
              <div className="relative">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as 'gemini' | 'mistral')}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50/80 disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="gemini">Gemini</option>
                  <option value="mistral">Mistral</option>
                </select>

                {/* Custom SVG Chevron Arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-200">
                  <svg
                    className="h-4 w-4 stroke-current"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </label>

            <label className="text-left">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                API Key
              </span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'gemini' ? 'Enter Gemini API key' : 'Enter Mistral API key'}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                disabled={loading}
              />
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-600">
            <p className="mb-2 font-semibold text-slate-800">How to create an API key</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Click on the following link to create an API key for your chosen provider:<br />
                <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Google API Key
                </a>
                {" or "}
                <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Mistral API Key
                </a>
              </li>
              <li>Click on "API Key".</li>
              <li>Name your API key and click "Create".</li>
            </ol>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 cursor-pointer hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={includeJD}
                onChange={(e) => setIncludeJD(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>
                Include JD-specific evaluation for skills, associated projects, and relevant experience
              </span>
            </label>

            {includeJD && (
              <div className="text-left space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Job Description (JD)
                </span>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here (e.g. required skills, experience, project requirements)..."
                  rows={5}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all resize-y"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* File Upload Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 transition-all relative flex flex-col items-center justify-center cursor-pointer bg-white ${dragActive
              ? 'border-indigo-600 bg-indigo-50/50 shadow-inner'
              : 'border-slate-200 hover:border-indigo-400 hover:shadow-md'
              }`}
          >
            <input
              id="file-upload"
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={loading}
            />

            <div className="flex flex-col items-center text-center space-y-3 pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileUp size={24} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">
                  {file ? 'PDF file selected' : 'Upload your resume PDF'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Drag and drop, or <span className="text-indigo-600 font-bold hover:underline">browse</span>
                </p>
              </div>
            </div>

            {file && (
              <div className="mt-4 flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <span className="truncate max-w-[200px]">{file.name}</span>
                <span className="text-slate-400 font-normal">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-2 justify-center">
              <AlertTriangle size={18} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${loading || !file
              ? 'bg-slate-200 text-slate-400 opacity-50'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.98]'
              }`}
          >
            {loading ? (
              <>
                <CircleDotDashed className="animate-spin" size={20} />
                Analyzing...
              </>
            ) : (
              <>
                Analyze Resume <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          Supports PDF resumes up to 5MB
        </p>
      </div>
    </div>
  );

}


