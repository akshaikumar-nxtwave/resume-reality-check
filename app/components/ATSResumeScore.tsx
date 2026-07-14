import { useMemo, useState } from "react";
import { CandidateAnalysisData } from "@/data/resumeData";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Circle,
  Code2,
  ExternalLink,
  FileText,
  FolderGit2,
  Gauge,
  Github,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  Link2,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ===================== Helpers =====================
const isMissing = (v: unknown): boolean => {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    return t === "" || t === "null" || t === "n/a" || t === "undefined";
  }
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
};

const fallback = (v: unknown, label: string): string =>
  isMissing(v) ? `No ${label} found` : String(v);

const ensureUrl = (raw?: string | null) => {
  if (!raw || isMissing(raw)) return "";
  // Strip markdown-style "[label](url)" wrappers if present
  const m = raw.match(/\((https?:[^)]+)\)/);
  let url = m ? m[1] : raw.replace(/^\[|\]$/g, "").trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
};

const scoreTone = (
  pct: number,
): "success" | "warning" | "destructive" | "accent" => {
  if (pct >= 80) return "success";
  if (pct >= 60) return "accent";
  if (pct >= 40) return "warning";
  return "destructive";
};

// ===================== Atoms =====================
type Tone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "destructive"
  | "muted";

const Tag = ({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) => {
  const tones: Record<Tone, string> = {
    neutral: "bg-secondary text-secondary-foreground border-border",
    muted: "bg-muted text-muted-foreground border-border",
    accent: "bg-indigo-600/10 text-indigo-600 border-indigo-600/30",
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const Empty = ({
  children = "No data found",
}: {
  children?: React.ReactNode;
}) => <p className="text-sm italic text-muted-foreground">{children}</p>;

const SectionCard = ({
  title,
  icon,
  children,
  description,
  right,
}: {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="rounded-lg bg-secondary p-2 text-foreground">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-serif text-xl font-semibold tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {right}
    </div>
    {children}
  </div>
);

const ProgressBar = ({
  value,
  tone = "accent",
}: {
  value: number;
  tone?: Tone;
}) => {
  const colors: Record<string, string> = {
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
    accent: "bg-accent",
  };
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full ${colors[tone]} transition-all`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
};

const Stat = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) => (
  <div className="rounded-xl border border-border bg-background p-4">
    <p className="text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 font-serif text-2xl font-semibold">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const Check = ({
  ok,
  children,
}: {
  ok: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-2.5">
    {ok ? (
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
    ) : (
      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
    )}
    <span className="text-sm text-foreground">{children}</span>
  </div>
);

const ScoreRing = ({ score, grade }: { score: number; grade?: string }) => {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <circle
          cx="60"
          cy="60"
          r={r}
          className="fill-none stroke-muted"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          className="fill-none stroke-indigo-600 transition-all"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-3xl font-bold leading-none">
          {score}
        </span>
        {grade && (
          <span className="mt-1 text-xs font-medium text-muted-foreground">
            Grade {grade}
          </span>
        )}
      </div>
    </div>
  );
};

// ===================== Tabs =====================
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "skills", label: "Skills", icon: Code2 },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "experience", label: "Impact", icon: TrendingUp },
  { id: "keywords", label: "Keywords", icon: KeyRound },
  { id: "formatting", label: "Formatting", icon: Gauge },
  { id: "actions", label: "Action Items", icon: Lightbulb },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ===================== Page =====================
interface ATSResumeScoreProps {
  data: CandidateAnalysisData;
  onUploadAnother?: () => void;
}

const ATSResumeScore = ({ data, onUploadAnother }: ATSResumeScoreProps) => {
  const d = data;
  const [tab, setTab] = useState<TabId>("overview");

  const totalPossible = useMemo(
    () =>
      Object.values(d.categories || {}).reduce(
        (sum, c) => sum + (c?.weight || 0),
        0,
      ),
    [d.categories],
  );

  // ---------- Header ----------
  const Header = () => {
  const router = useRouter();

  return (
    <header className="border-b border-border bg-sky-50/90">
      <div className="mx-auto max-w-3/4 px-6 py-10">

        {/* ← Upload another */}
        <div className="mb-4">
          <button
            onClick={() => {
              if (onUploadAnother) {
                onUploadAnother();
              } else {
                router.push("/atsresumechecker");
              }
            }}
            className="inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Upload another
          </button>
        </div>

        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Resume Analysis Report
              </span>
            </div>

            <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
              {fallback(d.candidate?.name, "name")}
            </h1>

            <p className="mt-1 font-serif text-sm text-wrap leading-snug">
              {fallback(d.summary, "summary available")}
            </p>

            {/* Contact row */}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {fallback(d.candidate?.email, "email")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {fallback(d.candidate?.phone, "phone")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {fallback(d.candidate?.location, "location")}
              </span>
            </div>

            {/* Links row */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                {
                  icon: Github,
                  key: "github",
                  url: d.header_section_links?.github,
                },
                {
                  icon: Linkedin,
                  key: "linkedin",
                  url: d.header_section_links?.linkedin,
                },
                {
                  icon: Globe,
                  key: "portfolio",
                  url: d.header_section_links?.portfolio,
                },
              ].map(({ icon: Icon, key, url }) =>
                isMissing(url) ? (
                  <Tag key={key} tone="muted">
                    <Icon className="h-3 w-3" /> No {key} found
                  </Tag>
                ) : (
                  <a
                    key={key}
                    href={ensureUrl(url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium"
                  >
                    <Icon className="h-3 w-3" /> {key}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )
              )}

            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-y-4 rounded-2xl">
            <ScoreRing score={d.overall_score ?? 0} grade={d.grade} />
            <div className="max-w-xs flex flex-col items-center text-center">
              <p className="text-xs uppercase text-muted-foreground">
                Overall <strong>Resume Score</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

  // ---------- Tab Bar ----------
  const TabBar = (
    <div className="sticky top-0 z-20 border-b border-border bg-white/50 backdrop-blur">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 py-3">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? "border-foreground bg-foreground text-background shadow-elegant"
                  : "border-border bg-card text-foreground hover:border-foreground/40"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ===================== Tab Content =====================
  return (
    <div className="min-h-screen bg-white/50">
      <Header/>
      {TabBar}

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              <SectionCard
                title="Scoring Notes"
                icon={<FileText className="h-5 w-5" />}
              >
                {isMissing(d.scoring_notes) ? (
                  <Empty>No scoring notes found</Empty>
                ) : (
                  <p className="text-sm leading-relaxed">{d.scoring_notes}</p>
                )}
              </SectionCard>

              <SectionCard
                title="Category Breakdown"
                icon={<Target className="h-5 w-5" />}
                description={`Total possible weight: ${totalPossible}`}
              >
                {isMissing(d.categories) ? (
                  <Empty>No categories found</Empty>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(d.categories).map(([key, c]) => {
                      const tone = scoreTone(c.score);
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium capitalize">
                                {key}
                              </span>
                              <Tag tone="muted">Weight {c.weight}</Tag>
                            </div>
                            <span className="font-serif text-lg font-semibold">
                              {c.score}
                            </span>
                          </div>

                          <ProgressBar value={c.score} tone={tone} />

                          <p className="text-sm text-muted-foreground leading-snug">
                            {fallback(c.reasoning, "reasoning provided")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              <SectionCard
                title="Parsing Metadata"
                icon={<FileText className="h-5 w-5" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Stat
                    label="Parsing Success"
                    value={`${d.parsing_meta?.parsing_success_percentage ?? "—"}%`}
                  />
                  <Stat
                    label="Detected Format"
                    value={fallback(
                      d.parsing_meta?.detected_format,
                      "format detected",
                    )}
                  />
                  <Stat
                    label="Total Pages"
                    value={fallback(d.parsing_meta?.total_pages, "page count")}
                  />
                </div>
              </SectionCard>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SectionCard
                  title="Sections Detected"
                  icon={<CheckCircle2 className="h-5 w-5" />}
                >
                  {isMissing(d.parsing_meta?.sections_detected) ? (
                    <Empty>No sections detected</Empty>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {d.parsing_meta!.sections_detected.map((s) => (
                        <Tag key={s} tone="success">
                          {s}
                        </Tag>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard
                  title="Unrecognized Sections"
                  icon={<AlertTriangle className="h-5 w-5" />}
                >
                  {isMissing(d.parsing_meta?.unrecognized_sections) ? (
                    <Empty>No unrecognized sections — clean parse!</Empty>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {d.parsing_meta!.unrecognized_sections.map((s) => (
                        <Tag key={s} tone="warning">
                          {s}
                        </Tag>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>

              <SectionCard
                title="Section Normalization"
                icon={<ArrowRight className="h-5 w-5" />}
              >
                {isMissing(d.parsing_meta?.sections_normalized) ? (
                  <Empty>No normalization applied</Empty>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(d.parsing_meta!.sections_normalized).map(
                      ([from, to]) => (
                        <div
                          key={from}
                          className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                        >
                          <span className="text-sm font-medium truncate">
                            {from}
                          </span>

                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />

                          <span className="text-sm truncate">{to}</span>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        )}

        {/* PARSING */}

        {/* SKILLS */}
        {tab === "skills" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  label: "Languages",
                  items: d.skills?.languages,
                  tone: "accent" as const,
                },
                {
                  label: "Frameworks",
                  items: d.skills?.frameworks,
                  tone: "success" as const,
                },
                {
                  label: "Tools",
                  items: d.skills?.tools,
                  tone: "neutral" as const,
                },
                {
                  label: "Databases",
                  items: d.skills?.databases,
                  tone: "warning" as const,
                },
              ].map(({ label, items, tone }) => (
                <SectionCard
                  key={label}
                  title={label}
                  icon={<Code2 className="h-5 w-5" />}
                >
                  {isMissing(items) ? (
                    <Empty>No {label.toLowerCase()} found</Empty>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {items!.map((s) => (
                        <Tag key={s} tone={tone}>
                          {s}
                        </Tag>
                      ))}
                    </div>
                  )}
                </SectionCard>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <SectionCard
                title="Skill Scores"
                icon={<Gauge className="h-5 w-5" />}
              >
                {isMissing(d.skills?.skill_score) ? (
                  <Empty>No skill scores found</Empty>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(d.skills!.skill_score).map(([k, v]) => (
                      <div key={k}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-sm font-medium">{k}</span>
                          <span className="font-serif text-base font-semibold">
                            {v}
                          </span>
                        </div>
                        <ProgressBar
                          value={Number(v)}
                          tone={scoreTone(Number(v))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Skill → Project Mapping"
                icon={<Link2 className="h-5 w-5" />}
                description="Skills validated by being used in actual projects"
              >
                {isMissing(d.skills?.skill_project_mapping) ? (
                  <Empty>No skill-to-project mapping found</Empty>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(d.skills!.skill_project_mapping).map(
                      ([skill, projects]) => (
                        <div
                          key={skill}
                          className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <Tag tone="accent">{skill}</Tag>
                          <div className="flex flex-wrap gap-1.5">
                            {projects.map((p) => (
                              <Tag key={p} tone="muted">
                                {p}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        )}

        {/* PROJECTS */}
        {tab === "projects" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Stat
                label="Project Score"
                value={`${d.projects_analysis?.score ?? "—"}/100`}
              />
              <Stat
                label="Total Projects"
                value={fallback(
                  d.projects_analysis?.total_projects,
                  "project count",
                )}
              />
              <Stat
                label="Has Projects Section"
                value={d.projects_analysis?.has_projects_section ? "Yes" : "No"}
              />
            </div>

            {isMissing(d.projects_analysis?.projects) ? (
              <SectionCard
                title="Projects"
                icon={<FolderGit2 className="h-5 w-5" />}
              >
                <Empty>No projects found</Empty>
              </SectionCard>
            ) : (
              d.projects_analysis!.projects.map((p, idx) => (
                <SectionCard
                  key={idx}
                  title={fallback(p.name, "project name")}
                  icon={<FolderGit2 className="h-5 w-5" />}
                  description={fallback(p.description, "description")}
                  right={
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Completeness
                      </p>
                      <p className="font-serif text-2xl font-semibold">
                        {p.completeness_score ?? "—"}%
                      </p>
                    </div>
                  }
                >
                  <div className="space-y-5">
                    {/* Tech */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Tech Stack
                      </p>
                      {isMissing(p.tech_stack) ? (
                        <Empty>No tech stack listed</Empty>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {p.tech_stack.map((t) => (
                            <Tag key={t} tone="neutral">
                              {t}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Links + flags */}
                    <div className="flex flex-wrap gap-2">
                      {p.has_github && !isMissing(p.github_url) ? (
                        <a
                          href={ensureUrl(p.github_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:border-indigo-600 hover:text-indigo-600"
                        >
                          <Github className="h-3 w-3" /> Source
                        </a>
                      ) : (
                        <Tag tone="muted">
                          <Github className="h-3 w-3" /> No GitHub link
                        </Tag>
                      )}
                      {p.has_live_deployment && !isMissing(p.live_url) ? (
                        <a
                          href={ensureUrl(p.live_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:border-indigo-600 hover:text-indigo-600"
                        >
                          <Globe className="h-3 w-3" /> Live Demo
                        </a>
                      ) : (
                        <Tag tone="muted">
                          <Globe className="h-3 w-3" /> No live deployment
                        </Tag>
                      )}
                      {p.is_tutorial_clone && (
                        <Tag tone="destructive">
                          <AlertTriangle className="h-3 w-3" /> Tutorial Clone
                        </Tag>
                      )}
                    </div>

                    {/* Impact */}
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Measurable Impact
                      </p>
                      {p.impact_mentioned &&
                      !isMissing(p.impact_description) ? (
                        <p className="text-sm">{p.impact_description}</p>
                      ) : (
                        <Empty>No impact metrics mentioned</Empty>
                      )}
                    </div>

                    {/* Signals grid */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-success">
                          Positive Signals
                        </p>
                        {isMissing(p.positive_signals) ? (
                          <Empty>None</Empty>
                        ) : (
                          <ul className="space-y-1.5">
                            {p.positive_signals.map((s) => (
                              <li key={s} className="flex gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" />{" "}
                                {s}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-warning">
                          Missing Elements
                        </p>
                        {isMissing(p.missing_elements) ? (
                          <Empty>None</Empty>
                        ) : (
                          <ul className="space-y-1.5">
                            {p.missing_elements.map((s) => (
                              <li key={s} className="flex gap-2 text-sm">
                                <Circle className="h-4 w-4 shrink-0 text-warning mt-0.5" />{" "}
                                {s}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-destructive">
                          Red Flags
                        </p>
                        {isMissing(p.red_flags) ? (
                          <Empty>None</Empty>
                        ) : (
                          <ul className="space-y-1.5">
                            {p.red_flags.map((s) => (
                              <li key={s} className="flex gap-2 text-sm">
                                <XCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />{" "}
                                {s}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              ))
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <SectionCard
                title="Project Gaps"
                icon={<AlertTriangle className="h-5 w-5" />}
              >
                {isMissing(d.projects_analysis?.project_gaps) ? (
                  <Empty>No project gaps reported</Empty>
                ) : (
                  <ul className="space-y-2">
                    {d.projects_analysis!.project_gaps.map((g) => (
                      <li key={g} className="flex gap-2 text-sm">
                        <Circle className="mt-1 h-3 w-3 shrink-0 text-warning" />
                        {g}
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
              <SectionCard
                title="Reviewer Notes"
                icon={<FileText className="h-5 w-5" />}
              >
                {isMissing(d.projects_analysis?.notes) ? (
                  <Empty>No notes provided</Empty>
                ) : (
                  <p className="text-sm leading-relaxed">
                    {d.projects_analysis!.notes}
                  </p>
                )}
              </SectionCard>
            </div>
          </div>
        )}

        {/* IMPACT */}
        {tab === "experience" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Stat
                label="Impact Score"
                value={`${d.measurable_impact?.score ?? "—"}/100`}
                hint="Quality of measurable outcomes"
              />
              <Stat
                label="Quantification Rate"
                value={`${d.measurable_impact?.quantification_rate ?? "—"}%`}
                hint="Bullets containing concrete metrics"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <SectionCard
                title="Quantified Bullets"
                icon={<TrendingUp className="h-5 w-5" />}
              >
                {isMissing(d.measurable_impact?.quantified_bullets) ? (
                  <Empty>No quantified bullets found</Empty>
                ) : (
                  <ul className="space-y-3">
                    {d.measurable_impact!.quantified_bullets.map((b, i) => (
                      <li
                        key={i}
                        className="flex gap-2 rounded-lg border border-success/20 bg-success/5 p-3 text-sm"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                title="Unquantified Bullets"
                icon={<AlertTriangle className="h-5 w-5" />}
              >
                {isMissing(d.measurable_impact?.unquantified_bullets) ? (
                  <Empty>No unquantified bullets — great work!</Empty>
                ) : (
                  <ul className="space-y-3">
                    {d.measurable_impact!.unquantified_bullets.map((b, i) => (
                      <li
                        key={i}
                        className="flex gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3 text-sm"
                      >
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>

            <SectionCard
              title="Reviewer Notes"
              icon={<BookOpen className="h-5 w-5" />}
            >
              {isMissing(d.measurable_impact?.notes) ? (
                <Empty>No notes provided</Empty>
              ) : (
                <p className="text-sm leading-relaxed">
                  {d.measurable_impact!.notes}
                </p>
              )}
            </SectionCard>
          </div>
        )}

        {/* KEYWORDS */}
        {tab === "keywords" && (
          <div className="space-y-6">
            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Stat
                label="Keyword Density"
                value={`${d.keywords?.keyword_density_score ?? "—"}%`}
              />
              <Stat
                label="Tracked Keywords"
                value={
                  isMissing(d.keywords?.tracked_keywords)
                    ? "—"
                    : d.keywords!.tracked_keywords.length
                }
              />
            </div>

            {/* KEYWORD SCORES */}
            <SectionCard
              title="Keyword Scores"
              icon={<Gauge className="h-5 w-5" />}
            >
              {isMissing(d.keywords?.keyword_scores) ? (
                <Empty>No keyword scores found</Empty>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(d.keywords!.keyword_scores).map(([k, v]) => (
                    <div key={k} className="space-y-2 max-w-md">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium truncate">
                          {k}
                        </span>
                        <span className="font-serif text-sm font-semibold shrink-0">
                          {v}/10
                        </span>
                      </div>

                      <div className="w-full max-w-xs">
                        <ProgressBar
                          value={Number(v) * 10}
                          tone={scoreTone(Number(v) * 10)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* KEYWORD TAG SECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard
                title="Strong Keywords"
                icon={<CheckCircle2 className="h-5 w-5" />}
              >
                {isMissing(d.keywords?.strong_keywords) ? (
                  <Empty>No strong keywords found</Empty>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {d.keywords!.strong_keywords.map((k) => (
                      <Tag key={k} tone="success">
                        {k}
                      </Tag>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Weak / Vague Keywords"
                icon={<AlertTriangle className="h-5 w-5" />}
              >
                {isMissing(d.keywords?.weak_or_vague_keywords) ? (
                  <Empty>No weak keywords found</Empty>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {d.keywords!.weak_or_vague_keywords.map((k) => (
                      <Tag key={k} tone="warning">
                        {k}
                      </Tag>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Tracked Keywords"
                icon={<KeyRound className="h-5 w-5" />}
              >
                {isMissing(d.keywords?.tracked_keywords) ? (
                  <Empty>No tracked keywords found</Empty>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {d.keywords!.tracked_keywords.map((k) => (
                      <Tag key={k} tone="accent">
                        {k}
                      </Tag>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Missing Industry Keywords"
                icon={<XCircle className="h-5 w-5" />}
              >
                {isMissing(d.keywords?.missing_industry_keywords) ? (
                  <Empty>No missing keywords flagged</Empty>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {d.keywords!.missing_industry_keywords.map((k) => (
                      <Tag key={k} tone="destructive">
                        {k}
                      </Tag>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* KEYWORD GAPS */}
            <SectionCard
              title="Keyword Gaps"
              icon={<Target className="h-5 w-5" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  {
                    label: "Missing Technical Skills",
                    items: d.keyword_gaps?.missing_technical_skills,
                    tone: "destructive",
                  },
                  {
                    label: "Missing Soft Skills",
                    items: d.keyword_gaps?.missing_soft_skills,
                    tone: "warning",
                  },
                  {
                    label: "Missing Certifications",
                    items: d.keyword_gaps?.missing_certifications,
                    tone: "accent",
                  },
                  {
                    label: "Overused Buzzwords",
                    items: d.keyword_gaps?.overused_buzzwords,
                    tone: "muted",
                  },
                ].map(({ label, items, tone }) => (
                  <div key={label} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {label}
                    </p>

                    {isMissing(items) ? (
                      <Empty>No {label.toLowerCase()} found</Empty>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {items!.map((k) => (
                          <Tag key={k}>{k}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!isMissing(d.keyword_gaps?.notes) && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {d.keyword_gaps?.notes}
                </p>
              )}
            </SectionCard>

            {/* NOTES */}
            {!isMissing(d.keywords?.keyword_notes) && (
              <SectionCard
                title="Notes"
                icon={<FileText className="h-5 w-5" />}
              >
                <p className="text-sm leading-relaxed">
                  {d.keywords?.keyword_notes}
                </p>
              </SectionCard>
            )}
          </div>
        )}

        {/* FORMATTING */}
        {tab === "formatting" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Stat
                label="Formatting Score"
                value={`${d.formatting?.score ?? "—"}/100`}
              />
              <Stat
                label="Layout Score"
                value={`${d.layout_insights?.score ?? "—"}/100`}
              />
            </div>

            <SectionCard
              title="ATS Formatting Checks"
              icon={<Gauge className="h-5 w-5" />}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Check ok={!!d.formatting?.is_single_column}>
                  Single column layout
                </Check>
                <Check ok={!d.formatting?.uses_tables}>No tables used</Check>
                <Check ok={!d.formatting?.uses_images_or_graphics}>
                  No images/graphics
                </Check>
                <Check ok={!d.formatting?.uses_headers_footers}>
                  No headers/footers
                </Check>
                <Check ok={!!d.formatting?.bullet_style_consistent}>
                  Consistent bullet style
                </Check>
                <Check ok={!!d.formatting?.section_spacing_adequate}>
                  Adequate section spacing
                </Check>
                <Check ok={!!d.formatting?.contact_at_top}>
                  Contact info at top
                </Check>
                <Check ok={d.formatting?.font_consistency === "Consistent"}>
                  Font consistency:{" "}
                  {fallback(d.formatting?.font_consistency, "data")}
                </Check>
              </div>
              {!isMissing(d.formatting?.notes) && (
                <p className="mt-5 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                  {d.formatting?.notes}
                </p>
              )}
            </SectionCard>

            <SectionCard
              title="ATS Warnings"
              icon={<AlertTriangle className="h-5 w-5" />}
            >
              {isMissing(d.ats_warnings) ? (
                <Empty>No ATS warnings — clean parse!</Empty>
              ) : (
                <ul className="space-y-3">
                  {d.ats_warnings.map((w, i) => {
                    const tone =
                      w.type === "error"
                        ? "destructive"
                        : w.type === "pass"
                          ? "success"
                          : "warning";
                    return (
                      <li
                        key={i}
                        className="rounded-lg border border-border bg-background p-4"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <Tag tone={tone}>{w.type}</Tag>
                          <span className="text-sm font-semibold">
                            {w.check}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {w.detail}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Section Order Comparison"
              icon={<LayoutDashboard className="h-5 w-5" />}
              description="Current order vs. recommended"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current
                  </p>
                  {isMissing(d.layout_insights?.section_order) ? (
                    <Empty>No section order detected</Empty>
                  ) : (
                    <ol className="space-y-2">
                      {d.layout_insights!.section_order.map((s, i) => (
                        <li
                          key={s}
                          className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                          <span className="font-serif text-base font-semibold text-muted-foreground">
                            {i + 1}
                          </span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    Recommended
                  </p>
                  <ol className="space-y-2">
                      {[
                        "Contact Info",
                        "About Me",
                        "Experience(if applicable)",
                        "Projects",
                        "Skills",
                        "Education",
                        "Certifications",
                        "Achievements/Activities",
                      ].map((s, i) => (
                        <li
                          key={s}
                          className="flex items-center gap-3 rounded-lg border border-indigo-600/30 bg-indigo-600/5 px-3 py-2 text-sm"
                        >
                          <span className="font-serif text-base font-semibold text-indigo-600">
                            {i + 1}
                          </span>
                          {s}
                        </li>
                      ))}
                    </ol>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-warning">
                    Order Issues
                  </p>
                  {isMissing(d.layout_insights?.section_order_issues) ? (
                    <Empty>None</Empty>
                  ) : (
                    <ul className="space-y-1.5">
                      {d.layout_insights!.section_order_issues.map((x) => (
                        <li key={x} className="flex gap-2 text-sm">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{" "}
                          {x}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-destructive">
                    Missing Recommended
                  </p>
                  {isMissing(
                    d.layout_insights?.missing_recommended_sections,
                  ) ? (
                    <Empty>None</Empty>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {d.layout_insights!.missing_recommended_sections.map(
                        (x) => (
                          <Tag key={x} tone="destructive">
                            {x}
                          </Tag>
                        ),
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Unnecessary Sections
                  </p>
                  {isMissing(d.layout_insights?.unnecessary_sections) ? (
                    <Empty>None</Empty>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {d.layout_insights!.unnecessary_sections.map((x) => (
                        <Tag key={x} tone="muted">
                          {x}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!isMissing(d.layout_insights?.notes) && (
                <p className="mt-5 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                  {d.layout_insights?.notes}
                </p>
              )}
            </SectionCard>
          </div>
        )}

        {/* ACTION ITEMS */}
        {tab === "actions" && (
          <div className="space-y-6">
            <SectionCard
              title="Critical Fixes"
              icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
              description="High-severity issues to address first"
            >
              {isMissing(d.critical_fixes) ? (
                <Empty>No critical fixes — looking good!</Empty>
              ) : (
                <ul className="space-y-3">
                  {d.critical_fixes.map((f, i) => {
                    const tone =
                      f.severity === "critical"
                        ? "destructive"
                        : f.severity === "major"
                          ? "warning"
                          : "muted";
                    return (
                      <li
                        key={i}
                        className="rounded-lg border border-border bg-background p-4"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Tag tone={tone}>{f.severity}</Tag>
                          <Tag tone="muted">{f.section}</Tag>
                        </div>
                        <p className="font-semibold">
                          {fallback(f.issue, "issue description")}
                        </p>
                        <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                          {fallback(f.fix, "fix recommendation")}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Improvements"
              icon={<Lightbulb className="h-5 w-5 text-warning" />}
              description="Suggested enhancements"
            >
              {isMissing(d.improvements) ? (
                <Empty>No improvement suggestions</Empty>
              ) : (
                <ul className="space-y-3">
                  {d.improvements.map((imp, i) => {
                    const tone =
                      imp.priority === "high"
                        ? "destructive"
                        : imp.priority === "medium"
                          ? "warning"
                          : "muted";
                    return (
                      <li
                        key={i}
                        className="rounded-lg border border-border bg-background p-4"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Tag tone={tone}>{imp.priority} priority</Tag>
                          <Tag tone="muted">{imp.section}</Tag>
                        </div>
                        <p className="font-semibold">
                          {fallback(imp.issue, "issue")}
                        </p>
                        <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                          {fallback(imp.suggestion, "suggestion")}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Rewrite Suggestions"
              icon={<Briefcase className="h-5 w-5" />}
              description="Before vs. After bullet rewrites"
            >
              {isMissing(d.rewrite_suggestions) ? (
                <Empty>No rewrite suggestions</Empty>
              ) : (
                <ul className="space-y-4">
                  {d.rewrite_suggestions.map((r, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-border bg-background p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-destructive">
                            Before
                          </p>
                          <p className="text-sm line-through">
                            {fallback(r.original, "original text")}
                          </p>
                        </div>
                        <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-success">
                            After
                          </p>
                          <p className="text-sm">
                            {fallback(r.improved, "improved text")}
                          </p>
                        </div>
                      </div>
                      {!isMissing(r.reason) && (
                        <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                          <Award className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                          {r.reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Resume analysis report · Generated for{" "}
        {fallback(d.candidate?.name, "candidate")}
      </footer>
    </div>
  );
};

export default ATSResumeScore;
