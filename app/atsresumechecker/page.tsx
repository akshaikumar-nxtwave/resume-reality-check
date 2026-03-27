'use client';

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Label,
} from 'recharts';
import {
  AlertTriangle, CheckCircle, Info, User, Mail, Phone,
  MapPin, Briefcase, Code, Terminal,
  TrendingUp, FileText, Zap, Target, ExternalLink,
  ShieldAlert, Lightbulb, CircleDotDashed, Link2, ArrowRight,
  Github, Globe, Play,
} from 'lucide-react';
import { useResumeStore } from '@/stores/useResumeStore';
import { useRouter } from 'next/navigation';
import { ApiResult } from '@/types/resume';
import { pdfjs } from 'react-pdf';

// if (typeof window !== 'undefined') {
//   pdfjs.GlobalWorkerOptions.workerSrc =
//     `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
// }

// ─── Types ────────────────────────────────────────────────────────────────────

interface Candidate {
  name?: string;
  career_level?: string;
  current_title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  years_of_experience?: number;
}

interface ParsingMeta {
  parsing_success_percentage?: number;
  detected_format?: string;
  total_pages?: number;
  sections_detected?: string[];
  sections_normalized?: Record<string, string>;
  unrecognized_sections?: string[];
}

interface CategoryValue {
  score: number;
  weight: number;
  reasoning: string;
}
type CategoriesMap = Record<string, CategoryValue>;

interface CategoryRow {
  key: string;
  name: string;
  score: number;
  weight: number;
  reason: string;
  color: string;
}

interface ApiKeywords {
  strong_keywords?: string[];
  weak_or_vague_keywords?: string[];
  missing_industry_keywords?: string[];
  keyword_density_score?: number;
  keyword_notes?: string;
}

// ── Project: matches API schema exactly ──────────────────────────────────────
interface Project {
  name: string;                   // API returns "name" not "title"
  description: string;
  tech_stack: string[];
  github_url: string;
  live_url: string;
  demo_url: string;
  other_url: string;
  has_github: boolean;
  has_live_deployment: boolean;
  has_demo: boolean;
  impact_mentioned: boolean;
  impact_description: string;
  date_range: string;
  is_tutorial_clone: boolean;
  completeness_score: number;
  missing_elements: string[];     // API returns "missing_elements" not "gaps"
  positive_signals: string[];
  red_flags: string[];
}

interface ProjectsAnalysis {
  score?: number;
  total_projects?: number;
  has_projects_section?: boolean;
  projects?: Project[];
  project_gaps?: string[];
  github_presence?: string;
  notes?: string;
}

interface AtsWarning {
  type?: string;   // "error" | "warning" | "pass"
  check: string;
  detail: string;
}

interface CriticalFix {
  severity: 'critical' | 'major' | 'minor' | string;
  section: string;
  issue: string;
  fix: string;
}

interface RewriteSuggestion {
  original: string;
  improved: string;
  reason: string;
}

interface Improvement {
  priority: 'high' | 'medium' | 'low' | string;
  section?: string;
  suggestion: string;
}


// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  contact_information:           '#6366f1',
  work_experience:               '#ef4444',
  education:                     '#10b981',
  skills:                        '#f59e0b',
  formatting_parseability:       '#3b82f6',
  action_verbs_impact:           '#8b5cf6',
  achievements_quantification:   '#f97316',
  resume_length_relevance:       '#14b8a6',
  career_progression:            '#ec4899',
  online_presence:               '#64748b',
};

const PRETTY_NAMES: Record<string, string> = {
  contact_information:           'Contact Info',
  work_experience:               'Work Experience',
  education:                     'Education',
  skills:                        'Skills',
  formatting_parseability:       'Formatting',
  action_verbs_impact:           'Action Verbs',
  achievements_quantification:   'Achievements',
  resume_length_relevance:       'Length & Relevance',
  career_progression:            'Career Progression',
  online_presence:               'Online Presence',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseCategoriesMap(map?: CategoriesMap): CategoryRow[] {
  if (!map) return [];
  return Object.entries(map)
    .map(([key, val]) => ({
      key,
      name:   PRETTY_NAMES[key] ?? key.replace(/_/g, ' '),
      score:  val.score,
      weight: val.weight,
      reason: val.reasoning,
      color:  CATEGORY_COLORS[key] ?? '#94a3b8',
    }))
    .sort((a, b) => b.score - a.score);
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-rose-500';
};

const getPieColor = (score: number): string => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

// Severity → colour mapping (handles critical / major / minor)
const getSeverityStyle = (severity: string) => {
  switch (severity) {
    case 'critical': return { badge: 'bg-rose-900 text-white',  icon: 'bg-rose-200 text-rose-700' };
    case 'major':    return { badge: 'bg-rose-600 text-white',  icon: 'bg-rose-100 text-rose-600' };
    default:         return { badge: 'bg-amber-500 text-white', icon: 'bg-amber-100 text-amber-600' };
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

type TabId = 'overview' | 'projects' | 'keywords' | 'fixes' | 'suggestions';

interface Tab { id: TabId; label: string; icon: React.ElementType; }
interface VitalItem { label: string; value?: string; icon: React.ElementType; }
interface TooltipPayloadItem { value: number; payload: CategoryRow; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayloadItem[]; }

function CustomTooltip({ active, payload }: CustomTooltipProps): React.JSX.Element | null {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg max-w-xs">
      <p className="font-bold text-slate-800 border-b pb-1 mb-1">{item.payload.name}</p>
      <p className="text-sm font-semibold mb-1" style={{ color: item.payload.color }}>
        Score: {item.value}/100
      </p>
      <p className="text-[11px] text-slate-500 leading-tight italic">{item.payload.reason}</p>
    </div>
  );
}

function LinkChip({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors"
    >
      <Icon size={13} /> {label}
    </a>
  );
}

function CompletenessBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-black text-slate-500">{score}%</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function App(): React.JSX.Element {
  const [driveLink, setDriveLink] = useState<string>('');
  const [loading,   setLoading]   = useState<boolean>(false);
  const [error,     setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const router = useRouter();

  const result        = useResumeStore((s) => s.result);
  const lastDriveLink = useResumeStore((s) => s.lastDriveLink);
  const persistResult = useResumeStore((s) => s.setResult);
  const clearResult   = useResumeStore((s) => s.clearResult);

  async function handleAnalyze(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!driveLink) { setError('Please provide a valid Google Drive link.'); return; }
    if (driveLink.trim() === lastDriveLink.trim() && result) { setError(null); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveLink }),
      });
      const data = await res.json() as ApiResult & { error?: string };
      if (!res.ok) { setError(data?.error ?? 'Something went wrong.'); return; }
      persistResult(data as ApiResult, driveLink.trim());
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // ── Input screen ─────────────────────────────────────────────────────────────
  if (!result) {
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
              AI-powered analysis for modern resumes. Enter your Google Drive link to begin.
            </p>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Link2 size={20} />
              </div>
              <input
                type="text"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="block w-full pl-12 pr-4 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-slate-700 font-medium"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-2">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !driveLink}
              className={`w-full pointer-events-none opacity-50 cursor-not-allowed py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${
                loading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.98]'
              }`}
            >
              {loading ? <CircleDotDashed className="animate-spin" /> : <>This Feature Will Be Available Soon </>}
              {/* <ArrowRight /> */}
            </button>
          </form>

          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            Supports Publicly Accessible Google Drive Links Only
          </p>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  const categoryRows = normaliseCategoriesMap(result.categories);

  const strongKeywords  = result.keywords?.strong_keywords          ?? [];
  const missingKeywords = result.keywords?.missing_industry_keywords ?? [];
  const weakKeywords    = result.keywords?.weak_or_vague_keywords    ?? [];

  // Only show actual problems in the ATS Risk panel — skip "pass" entries
  const atsIssues = (result.ats_warnings ?? []).filter(
    (w) => w.type === 'error' || w.type === 'warning'
  );

  const tabs: Tab[] = [
    { id: 'overview',    label: 'Dashboard',         icon: Target      },
    { id: 'projects',    label: 'Projects Analysis', icon: Code        },
    { id: 'keywords',    label: 'Skill Matrix',      icon: Terminal    },
    { id: 'fixes',       label: 'Critical Fixes',    icon: ShieldAlert },
    { id: 'suggestions', label: 'AI Roadmap',        icon: Lightbulb   },
  ];

  const vitals: VitalItem[] = [
    { label: 'Email',     value: result.candidate?.email,     icon: Mail         },
    { label: 'Phone',     value: result.candidate?.phone,     icon: Phone        },
    { label: 'Location',  value: result.candidate?.location,  icon: MapPin       },
    { label: 'LinkedIn',  value: result.candidate?.linkedin,  icon: User         },
    { label: 'Portfolio', value: result.candidate?.portfolio, icon: ExternalLink },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">

      {/* ── Header ── */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button
            onClick={() => clearResult()}
            className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-1 hover:underline"
          >
            ← Analyze New File
          </button>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {result.candidate?.name ?? 'Candidate Name'}
            </h1>
            {result.candidate?.career_level && (
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                {result.candidate.career_level} Level
              </span>
            )}
          </div>
          <p className="text-slate-500 flex items-center gap-2 text-lg">
            <Briefcase size={20} className="text-indigo-500" />
            {result.candidate?.current_title}
          </p>
        </div>

        <div className="flex gap-6 items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase font-black tracking-widest">Overall Grade</p>
            <p className={`text-3xl font-black ${getScoreColor(result.overall_score)}`}>{result.grade}</p>
          </div>
          <div className="relative w-20 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ value: result.overall_score }, { value: 100 - result.overall_score }]}
                  innerRadius="70%"
                  outerRadius="100%"
                  paddingAngle={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  <Cell fill={getPieColor(result.overall_score)} />
                  <Cell fill="#f1f5f9" />
                  <Label value={`${result.overall_score}%`} position="center" className="font-black fill-slate-800 text-xl" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </header>

      {/* ── Nav ── */}
      <nav className="max-w-7xl mx-auto mb-8 border-b border-slate-200">
        <div className="flex gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto space-y-8 pb-12">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">

              <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-black mb-4 flex items-center gap-3 text-slate-800">
                  <FileText className="text-indigo-600" size={24} /> Evaluation Summary
                </h2>
                <p className="text-slate-600 leading-relaxed text-lg mb-6 italic border-l-4 border-indigo-100 pl-6">
                  {result.summary}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-400 text-xs uppercase mb-3">Scoring Insights</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{result.scoring_notes}</p>
                  </div>
                  <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <h4 className="font-bold text-indigo-400 text-xs uppercase mb-3 text-center">ATS Success Rate</h4>
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <span className="text-4xl font-black text-indigo-700">
                        {result.parsing_meta?.parsing_success_percentage}%
                      </span>
                      <div className="flex flex-wrap justify-center gap-1">
                        {result.parsing_meta?.sections_detected?.map((s) => (
                          <span key={s} className="text-[10px] bg-white text-indigo-500 px-2 py-0.5 rounded border border-indigo-100 font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-800">
                  <TrendingUp className="text-indigo-600" size={24} /> Detailed Metric Score
                </h2>
                {categoryRows.length > 0 ? (
                  <div className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={categoryRows} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="name" width={145} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="score" radius={[0, 12, 12, 0]} barSize={32}>
                          {categoryRows.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic">No category data returned.</p>
                )}
              </section>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-black mb-6 border-b pb-4">Candidate Vitals</h2>
                <div className="space-y-6">
                  {vitals.map((vit, i) => {
                    const isMissing = !vit.value?.trim();
                    return (
                      <div key={i} className="flex items-start gap-4">
                        <div className="p-2 rounded-xl bg-slate-50 text-slate-400"><vit.icon size={20} /></div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{vit.label}</p>
                          <p className={`text-sm font-bold truncate ${isMissing ? 'text-rose-500 italic' : 'text-slate-700'}`}>
                            {isMissing ? 'Not Provided' : vit.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Only show errors and warnings — not passing checks */}
              {atsIssues.length > 0 && (
                <section className="bg-rose-50 border border-rose-100 p-6 rounded-3xl">
                  <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-rose-700">
                    <ShieldAlert size={20} /> ATS Risk Profile
                  </h2>
                  <div className="space-y-4">
                    {atsIssues.map((warn, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100">
                        <div className="flex items-center gap-2 mb-1">
                          {warn.type === 'error'
                            ? <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                            : <Info size={13} className="text-amber-500 shrink-0" />
                          }
                          <p className="text-[10px] font-black text-rose-600 uppercase">{warn.check}</p>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">{warn.detail}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {/* ── PROJECTS ── */}
        {activeTab === 'projects' && (
          <div className="space-y-8">
            {/* Summary bar */}
            {result.projects_analysis && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Projects Found',    value: result.projects_analysis.total_projects ?? 0 },
                  { label: 'Section Score',      value: `${result.projects_analysis.score ?? 0}/100` },
                  { label: 'GitHub Presence',    value: result.projects_analysis.github_presence ?? '—' },
                  { label: 'Has Projects Section', value: result.projects_analysis.has_projects_section ? 'Yes' : 'No' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-800 capitalize">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Per-project cards — uses proj.name and proj.missing_elements */}
            {result.projects_analysis?.projects && result.projects_analysis.projects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.projects_analysis.projects.map((proj, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">

                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black text-slate-800">{proj.name}</h3>
                        {proj.date_range && (
                          <p className="text-[11px] text-slate-400 font-bold mt-0.5">{proj.date_range}</p>
                        )}
                      </div>
                      {proj.is_tutorial_clone && (
                        <span className="shrink-0 text-[10px] bg-amber-100 text-amber-700 font-black px-2 py-1 rounded-xl uppercase">
                          Tutorial Clone
                        </span>
                      )}
                    </div>

                    {/* Completeness bar */}
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Completeness</p>
                      <CompletenessBar score={proj.completeness_score ?? 0} />
                    </div>

                    {/* Description */}
                    <p className="text-slate-500 text-sm leading-relaxed">{proj.description}</p>

                    {/* Tech stack */}
                    {proj.tech_stack?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {proj.tech_stack.map((t, j) => (
                          <span key={j} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex flex-wrap gap-2">
                      {proj.github_url && <LinkChip href={proj.github_url} label="GitHub" icon={Github} />}
                      {proj.live_url   && <LinkChip href={proj.live_url}   label="Live"   icon={Globe}  />}
                      {proj.demo_url   && <LinkChip href={proj.demo_url}   label="Demo"   icon={Play}   />}
                      {proj.other_url  && <LinkChip href={proj.other_url}  label="Other"  icon={ExternalLink} />}
                    </div>

                    {/* Impact */}
                    {proj.impact_mentioned && proj.impact_description && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 font-medium">
                        {proj.impact_description}
                      </div>
                    )}

                    {/* Positive signals */}
                    {proj.positive_signals?.length > 0 && (
                      <div className="space-y-1">
                        {proj.positive_signals.map((s, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-emerald-700">
                            <CheckCircle size={12} className="shrink-0" /> {s}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Missing elements (was "gaps" — now correct field name) */}
                    {proj.missing_elements?.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Missing</p>
                        {proj.missing_elements.map((m, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">
                            <AlertTriangle size={11} className="shrink-0" /> {m}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Red flags */}
                    {proj.red_flags?.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Red Flags</p>
                        {proj.red_flags.map((f, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                            <AlertTriangle size={11} className="shrink-0 text-amber-500" /> {f}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Overall project gaps */}
            {result.projects_analysis?.project_gaps && result.projects_analysis.project_gaps.length > 0 && (
              <section className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
                <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                  <ShieldAlert className="text-rose-500" /> Overall Project Gaps
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.projects_analysis.project_gaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-800 p-4 rounded-2xl border border-slate-700">
                      <div className="p-1 bg-rose-500/20 text-rose-400 rounded-lg shrink-0">
                        <AlertTriangle size={16} />
                      </div>
                      <span className="text-xs text-slate-300 leading-normal">{gap}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!result.projects_analysis?.has_projects_section && (
              <div className="bg-amber-50 border border-amber-200 p-8 rounded-3xl text-center">
                <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3" />
                <p className="font-black text-amber-800 text-lg mb-1">No Projects Section Detected</p>
                <p className="text-amber-700 text-sm">Adding a projects section significantly improves ATS scores, especially for technical roles.</p>
              </div>
            )}
          </div>
        )}

        {/* ── KEYWORDS ── */}
        {activeTab === 'keywords' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-100">
              <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-emerald-700 uppercase tracking-tighter">
                <CheckCircle className="text-emerald-500" /> Strong Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {strongKeywords.length > 0
                  ? strongKeywords.map((k) => (
                      <span key={k} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-100">{k}</span>
                    ))
                  : <p className="text-slate-400 text-sm italic">None detected.</p>
                }
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-rose-100">
              <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-rose-700 uppercase tracking-tighter">
                <AlertTriangle className="text-rose-500" /> Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {missingKeywords.length > 0
                  ? missingKeywords.map((k) => (
                      <span key={k} className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-100">{k}</span>
                    ))
                  : <p className="text-slate-400 text-sm italic">None detected.</p>
                }
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-amber-100">
              <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-amber-700 uppercase tracking-tighter">
                <Info className="text-amber-500" /> Soft Skills / Buzzwords
              </h3>
              <div className="flex flex-wrap gap-2">
                {weakKeywords.length > 0
                  ? weakKeywords.map((k) => (
                      <span key={k} className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-100">{k}</span>
                    ))
                  : <p className="text-slate-400 text-sm italic">None detected.</p>
                }
              </div>
            </div>
          </div>
        )}

        {/* ── CRITICAL FIXES ── */}
        {activeTab === 'fixes' && result.critical_fixes && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black px-4">Action Priority List</h2>
            {result.critical_fixes.map((fix, i) => {
              const sev = getSeverityStyle(fix.severity);
              return (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6">
                  <div className={`p-4 rounded-2xl shrink-0 h-fit ${sev.icon}`}>
                    <ShieldAlert size={32} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${sev.badge}`}>
                        {fix.severity} severity
                      </span>
                      <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{fix.section}</span>
                    </div>
                    <h4 className="text-xl font-black text-slate-800 mb-2">{fix.issue}</h4>
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 text-emerald-800 font-medium text-sm">
                      {fix.fix}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SUGGESTIONS ── */}
        {activeTab === 'suggestions' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Lightbulb className="text-amber-500" /> Improvements
                </h3>
                {result.improvements?.length
                  ? result.improvements.map((imp, i) => (
                      <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-start gap-4 shadow-sm">
                        <div className={`shrink-0 w-2 h-2 rounded-full mt-2 ${
                          imp.priority === 'high' ? 'bg-rose-500' :
                          imp.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <div>
                          {imp.section && (
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{imp.section}</p>
                          )}
                          <p className="text-sm font-medium text-slate-700">{imp.suggestion}</p>
                        </div>
                      </div>
                    ))
                  : <p className="text-slate-400 text-sm italic">No improvements listed.</p>
                }
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Zap className="text-indigo-500" /> AI Content Rewrite
                </h3>
                {result.rewrite_suggestions?.length
                  ? result.rewrite_suggestions.map((rw, i) => (
                      <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-6 space-y-4">
                          <p className="text-xs italic text-slate-400 line-through leading-relaxed">{rw.original}</p>
                          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-sm font-bold text-slate-800 leading-relaxed">
                            {rw.improved}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            <span className="font-black text-indigo-500 uppercase">Reason: </span>{rw.reason}
                          </p>
                        </div>
                      </div>
                    ))
                  : <p className="text-slate-400 text-sm italic">No rewrite suggestions available.</p>
                }
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}