import { useState } from "react";

interface ATSResult {
  candidate: {
    name: string;
    email: string;
    phone: string;
    location: string;
    current_title: string;
    years_of_experience: number;
  };
  overall_score: number;
  grade: "Excellent" | "Good" | "Fair" | "Poor";
  summary: string;
  categories: {
    contact_information: CategoryScore;
    work_experience: CategoryScore;
    education: CategoryScore;
    skills: CategoryScore;
    formatting_parseability: CategoryScore;
    action_verbs_impact: CategoryScore;
    achievements_quantification: CategoryScore;
    resume_length_relevance: CategoryScore;
  };
  keywords: {
    strong_keywords: string[];
    weak_or_missing_keywords: string[];
  };
  improvements: Improvement[];
  ats_warnings: ATSWarning[];
  scoring_notes: string;
}

interface CategoryScore {
  score: number;       // 0–100
  weight: number;      // contribution % to overall score
  reasoning: string;
}

interface Improvement {
  priority: "high" | "medium" | "low";
  section: string;
  suggestion: string;
}

interface ATSWarning {
  type: "error" | "warning" | "pass";
  check: string;
  detail: string;
}

export default function ATSResumeScore() {
  const [driveLink, setDriveLink] = useState("");
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!driveLink.trim()) {
      setError("Please enter a Google Drive link.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driveLink }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Is your dev server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <input
        type="url"
        placeholder="Paste Google Drive link here..."
        value={driveLink}
        onChange={(e) => setDriveLink(e.target.value)}
        disabled={loading}
      />

      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {error && <p>{error}</p>}

      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}