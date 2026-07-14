// ─── Shared resume types — matches API response schema exactly ───────────────
// Source of truth: app/api/analyze/route.ts JSON schema
// Used by: page.tsx, useResumeStore, and any other consumers

export interface Candidate {
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

export interface ParsingMeta {
  parsing_success_percentage?: number;
  detected_format?: string;
  total_pages?: number;
  sections_detected?: string[];
  sections_normalized?: Record<string, string>;
  unrecognized_sections?: string[];
}

export interface CategoryValue {
  score: number;
  weight: number;
  reasoning: string;
}

export type CategoriesMap = Record<string, CategoryValue>;

export interface ApiKeywords {
  strong_keywords?: string[];
  weak_or_vague_keywords?: string[];
  missing_industry_keywords?: string[];
  keyword_density_score?: number;
  keyword_notes?: string;
}

// ── Project: every field the API returns ─────────────────────────────────────
export interface Project {
  name: string;                 // was "title" in old types — FIXED
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
  date_range: string;           // was missing in old types — FIXED
  is_tutorial_clone: boolean;
  completeness_score: number;
  missing_elements: string[];   // was "gaps" in old types — FIXED
  positive_signals: string[];
  red_flags: string[];
}

export interface ProjectsAnalysis {
  score?: number;
  total_projects?: number;
  has_projects_section?: boolean;
  projects?: Project[];
  project_gaps?: string[];
  github_presence?: string;
  notes?: string;
}

export interface MeasurableImpact {
  score?: number;
  quantified_bullets?: string[];
  unquantified_bullets?: string[];
  quantification_rate?: number;
  notes?: string;
}

export interface Formatting {
  score?: number;
  is_single_column?: boolean;
  uses_tables?: boolean;
  uses_images_or_graphics?: boolean;
  uses_headers_footers?: boolean;
  font_consistency?: string;
  bullet_style_consistent?: boolean;
  section_spacing_adequate?: boolean;
  contact_at_top?: boolean;
  notes?: string;
}

export interface LayoutInsights {
  score?: number;
  section_order?: string[];
  recommended_section_order?: string[];
  section_order_issues?: string[];
  missing_recommended_sections?: string[];
  unnecessary_sections?: string[];
  notes?: string;
}

export interface AtsWarning {
  type?: 'error' | 'warning' | 'pass';
  check: string;
  detail: string;
}

export interface CriticalFix {
  severity: 'critical' | 'major' | 'minor';
  section: string;
  issue: string;
  fix: string;
}

export interface KeywordGaps {
  missing_technical_skills?: string[];
  missing_soft_skills?: string[];
  missing_certifications?: string[];
  overused_buzzwords?: string[];
  notes?: string;
}

export interface Improvement {
  priority: 'high' | 'medium' | 'low';
  section?: string;
  suggestion: string;
}

export interface RewriteSuggestion {
  original: string;
  improved: string;
  reason: string;
}

export interface Skills {
  languages?: string[];
  frameworks?: string[];
  tools?: string[];
  databases?: string[];
  skill_score?: Record<string, number>;
  skill_project_mapping?: Record<string, string[]>;
}

export interface HeaderSectionLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
  other_links?: string[];
}

export interface ApiResult {
  candidate?: Candidate;
  header_section_links?: HeaderSectionLinks;
  skills?: Skills;
  overall_score: number;
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  summary?: string;
  scoring_notes?: string;
  parsing_meta?: ParsingMeta;
  categories?: CategoriesMap;
  keywords?: ApiKeywords;
  measurable_impact?: MeasurableImpact;
  projects_analysis?: ProjectsAnalysis;
  formatting?: Formatting;
  layout_insights?: LayoutInsights;
  critical_fixes?: CriticalFix[];
  keyword_gaps?: KeywordGaps;
  improvements?: Improvement[];
  ats_warnings?: AtsWarning[];
  rewrite_suggestions?: RewriteSuggestion[];
}
