import { NextRequest, NextResponse } from "next/server";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
const MISTRAL_BASE    = "https://api.mistral.ai/v1";

// pdfjs needs a worker — in Node (Next.js API route) we disable it
pdfjs.GlobalWorkerOptions.workerSrc = "";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedLinks {
  all: string[];          // every URL found in the PDF
  github: string[];       // github.com links
  linkedin: string[];     // linkedin.com links
  live: string[];         // deployment URLs (vercel, netlify, custom domains, etc.)
  demo: string[];         // demo/video links (youtube, loom, etc.)
  other: string[];        // everything else
}

interface ScoreResult {
  content: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// ─── Drive URL → direct download URL ─────────────────────────────────────────

function convertDriveLink(url: string): string {
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
  return url;
}

// ─── PDF hyperlink extractor (pdfjs-dist) ─────────────────────────────────────
// OCR reads visible text but CANNOT see embedded hyperlink metadata.
// pdfjs reads the PDF annotation layer to get the actual href values.

async function extractLinksFromPDF(fileBytes: Uint8Array): Promise<ExtractedLinks> {
  const result: ExtractedLinks = {
    all: [], github: [], linkedin: [], live: [], demo: [], other: [],
  };

  try {
    const loadingTask = pdfjs.getDocument({ data: fileBytes, disableFontFace: true });
    const pdf = await loadingTask.promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page      = await pdf.getPage(pageNum);
      const annotations = await page.getAnnotations();

      for (const ann of annotations) {
        // URI annotations are hyperlinks embedded in the PDF
        if (ann.subtype === "Link" && ann.url) {
          const url = ann.url.trim();
          if (!url || url.startsWith("mailto:") || result.all.includes(url)) continue;

          result.all.push(url);

          if (/github\.com/i.test(url))                              result.github.push(url);
          else if (/linkedin\.com/i.test(url))                       result.linkedin.push(url);
          else if (/youtube\.com|youtu\.be|loom\.com|demo\./i.test(url)) result.demo.push(url);
          else if (
            /vercel\.app|netlify\.app|herokuapp\.com|pages\.dev|\.io|\.com|\.dev|\.app/i.test(url)
          )                                                            result.live.push(url);
          else                                                         result.other.push(url);
        }
      }
    }
  } catch (err) {
    // Non-fatal — if pdfjs fails we still proceed with OCR text alone
    console.warn("[pdfjs] Link extraction failed (non-fatal):", err instanceof Error ? err.message : err);
  }

  return result;
}

// ─── Mistral REST helpers ─────────────────────────────────────────────────────

async function uploadFile(fileBytes: Uint8Array, mimeType: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(fileBytes)], { type: mimeType }), "resume.pdf");
  form.append("purpose", "ocr");

  const res = await fetch(`${MISTRAL_BASE}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${MISTRAL_API_KEY}` },
    body: form,
  });

  if (!res.ok) throw new Error(`File upload failed (${res.status}): ${await res.text()}`);
  return (await res.json()).id as string;
}

async function getSignedUrl(fileId: string): Promise<string> {
  const res = await fetch(`${MISTRAL_BASE}/files/${fileId}/url?expiry=1`, {
    headers: { Authorization: `Bearer ${MISTRAL_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Signed URL failed (${res.status}): ${await res.text()}`);
  return (await res.json()).url as string;
}

async function runOCR(signedUrl: string): Promise<string> {
  const res = await fetch(`${MISTRAL_BASE}/ocr`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: { type: "document_url", document_url: signedUrl },
      include_image_base64: false,
    }),
  });
  if (!res.ok) throw new Error(`OCR failed (${res.status}): ${await res.text()}`);

  const data = await res.json();
  const pages: Array<{ markdown: string }> = data.pages ?? [];
  return pages.map((p, i) => `--- Page ${i + 1} ---\n${p.markdown}`).join("\n\n");
}

async function deleteFile(fileId: string): Promise<void> {
  await fetch(`${MISTRAL_BASE}/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${MISTRAL_API_KEY}` },
  }).catch(() => {});
}

async function scoreResume(resumeText: string, links: ExtractedLinks): Promise<ScoreResult> {
  // Build the links context block that gets appended to the user message
  const linksBlock = links.all.length > 0
    ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HYPERLINKS EXTRACTED FROM PDF METADATA
(These are the actual embedded URLs — use these for github_url, live_url, linkedin, etc.)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GitHub  : ${links.github.length   ? links.github.join(", ")   : "none found"}
LinkedIn: ${links.linkedin.length ? links.linkedin.join(", ") : "none found"}
Live    : ${links.live.length     ? links.live.join(", ")     : "none found"}
Demo    : ${links.demo.length     ? links.demo.join(", ")     : "none found"}
Other   : ${links.other.length    ? links.other.join(", ")    : "none found"}
All URLs: ${links.all.join(", ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT:
- Always prefer these extracted URLs over any URLs visible in the OCR text.
- Match each URL to the correct project or section based on surrounding context.
- If a github.com URL is present here, set has_github: true and populate github_url for the relevant project.
- If a live URL is present here, set has_live_deployment: true and populate live_url.
- A candidate who has these links embedded (even if invisible in plain text) DOES have them — do not penalise for missing links if they appear above.
`
    : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HYPERLINKS EXTRACTED FROM PDF METADATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No embedded hyperlinks were found in the PDF annotation layer.
Any URLs present are only what appears as plain text in the OCR output.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  const res = await fetch(`${MISTRAL_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.1,
      max_tokens: 8000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here is the resume text extracted via OCR, followed by all hyperlinks extracted directly from the PDF metadata.\n\nAnalyse both thoroughly and return the ATS score report as a single valid JSON object.\n\n${resumeText}\n\n${linksBlock}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Chat completion failed (${res.status}): ${await res.text()}`);

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    usage:   data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

// ─── Safe JSON extractor ──────────────────────────────────────────────────────

function extractJSON(raw: string): string {
  const stripped = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  if (stripped.startsWith("{")) return stripped;

  const start = raw.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in response");

  let depth = 0, inString = false, escape = false;

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (escape)               { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true;  continue; }
    if (ch === '"')           { inString = !inString; continue; }
    if (inString)             continue;
    if (ch === "{")           depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }

  throw new Error("Incomplete JSON object in response");
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.driveLink) {
      return NextResponse.json({ error: "driveLink is required." }, { status: 400 });
    }
    if (!MISTRAL_API_KEY) {
      return NextResponse.json({ error: "MISTRAL_API_KEY is not set." }, { status: 500 });
    }

    // ── Step 1: Fetch PDF from Google Drive ───────────────────────────────────
    const fileUrl = convertDriveLink(body.driveLink);
    const fileRes = await fetch(fileUrl, { redirect: "follow" });

    if (!fileRes.ok) {
      return NextResponse.json(
        { error: `Could not fetch file (${fileRes.status}). Make sure it is shared as "Anyone with the link can view".` },
        { status: 400 }
      );
    }

    const contentType = fileRes.headers.get("content-type") ?? "";
    const isDOCX = contentType.includes("word") || contentType.includes("openxmlformats");
    const mimeType = isDOCX
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";

    const fileBuffer = await fileRes.arrayBuffer();
    const fileBytes  = new Uint8Array(fileBuffer);

    // ── Step 2: Run OCR + extract PDF links IN PARALLEL ───────────────────────
    // Both read from the same fileBytes already in memory — no extra network call.
    let resumeText: string;
    let links: ExtractedLinks = { all: [], github: [], linkedin: [], live: [], demo: [], other: [] };
    let fileId = "";

    try {
      fileId = await uploadFile(fileBytes, mimeType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Upload error: ${msg}` }, { status: 502 });
    }

    let signedUrl: string;
    try {
      signedUrl = await getSignedUrl(fileId);
    } catch (err) {
      await deleteFile(fileId);
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Signed URL error: ${msg}` }, { status: 502 });
    }

    // Run OCR and pdfjs link extraction simultaneously
    try {
      [resumeText, links] = await Promise.all([
        runOCR(signedUrl),
        isDOCX ? Promise.resolve(links) : extractLinksFromPDF(fileBytes),
        // DOCX link extraction would need a different parser — skip for now, OCR covers plain-text URLs
      ]);
    } catch (err) {
      await deleteFile(fileId);
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `OCR error: ${msg}` }, { status: 502 });
    }

    deleteFile(fileId); // fire-and-forget cleanup

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from the file. The PDF may be image-only or corrupted." },
        { status: 422 }
      );
    }

    // ── Step 3: Score with mistral-small (text + links combined) ─────────────
    let rawContent: string;
    let tokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    try {
      const scoreResult = await scoreResume(resumeText, links);
      rawContent  = scoreResult.content;
      tokenUsage  = scoreResult.usage;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Scoring error: ${msg}` }, { status: 502 });
    }

    // ── Step 4: Parse JSON ────────────────────────────────────────────────────
    let parsed: object;
    try {
      parsed = JSON.parse(extractJSON(rawContent));
    } catch {
      console.error("[ATS] JSON parse failed. Raw:", rawContent.slice(0, 600));
      return NextResponse.json(
        { error: "AI returned an unexpected format. Please try again." },
        { status: 502 }
      );
    }

    // ── Logging ───────────────────────────────────────────────────────────────

    const resumeCharCount = resumeText.length;
    const resumeWordCount = resumeText.trim().split(/\s+/).length;
    const resumeEstTokens = Math.round(resumeCharCount / 4);

    console.log("\n══════════════════════════════════════════════════════");
    console.log("  ATS SCORE REPORT — TOKEN & PARSE LOG");
    console.log("══════════════════════════════════════════════════════");

    console.log("\n─ Resume (after OCR) ──────────────────────────────────");
    console.log(`  Characters : ${resumeCharCount.toLocaleString()}`);
    console.log(`  Words      : ${resumeWordCount.toLocaleString()}`);
    console.log(`  Est. tokens: ~${resumeEstTokens.toLocaleString()} (rough, 4 chars/token)`);
    console.log("\n  Resume text preview (first 500 chars):");
    console.log("  " + resumeText.slice(0, 500).replace(/\n/g, "\n  "));

    console.log("\n─ Extracted PDF Links (pdfjs annotation layer) ────────");
    console.log(`  Total  : ${links.all.length}`);
    console.log(`  GitHub : ${links.github.length   ? links.github.join(", ")   : "none"}`);
    console.log(`  LinkedIn: ${links.linkedin.length ? links.linkedin.join(", ") : "none"}`);
    console.log(`  Live   : ${links.live.length     ? links.live.join(", ")     : "none"}`);
    console.log(`  Demo   : ${links.demo.length     ? links.demo.join(", ")     : "none"}`);
    console.log(`  Other  : ${links.other.length    ? links.other.join(", ")    : "none"}`);

    console.log("\n─ Token Usage (real counts from Mistral API) ──────────");
    console.log(`  Input  (prompt_tokens)     : ${tokenUsage.prompt_tokens.toLocaleString()}`);
    console.log(`  Output (completion_tokens) : ${tokenUsage.completion_tokens.toLocaleString()}`);
    console.log(`  Total                      : ${tokenUsage.total_tokens.toLocaleString()}`);

    console.log("\n─ Parsed JSON Result ──────────────────────────────────");
    console.log(JSON.stringify(parsed, null, 2));

    console.log("\n══════════════════════════════════════════════════════\n");

    return NextResponse.json(parsed, { status: 200 });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    console.error("[ATS API Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are a senior ATS (Applicant Tracking System) analyst and career coach with 15+ years of experience evaluating resumes. Your job is to analyse the resume text provided and return an honest, highly accurate ATS score report as a single JSON object.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Return ONLY a single valid JSON object. No markdown fences, no backticks, no preamble, no explanation, no text after the closing brace.
2. Every field in the schema must be present. Use [] for empty arrays and "" for empty strings. NEVER omit a field.
3. All score fields must be integers between 0 and 100.
4. overall_score MUST equal the exact weighted average of all category scores (compute it precisely).
5. If the text is not a resume, return overall_score: 0, grade: "Poor", and explain in summary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HONESTY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- NEVER inflate scores. Weak resumes score 30-50. Reserve 80+ for genuinely strong resumes.
- NEVER deflate scores to seem harsh.
- Every score must be justified with specific evidence from the resume text.
- Do not reward buzzwords lacking substance ("team player", "results-driven", "passionate", "hardworking").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HYPERLINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The user message will include a block labelled "HYPERLINKS EXTRACTED FROM PDF METADATA".
These are the actual embedded URLs from the PDF annotation layer — they are ground truth.
- Always use these extracted URLs to populate github_url, live_url, linkedin, demo_url fields.
- They take priority over any URL visible in the OCR text.
- If a github.com link is present in the extracted links, the candidate DOES have a GitHub — do not penalise for a missing GitHub link.
- Match each URL to the most relevant project or section based on surrounding context in the resume text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION NAME NORMALISATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Map every detected section header to its canonical system name:

CONTACT: "About", "About Me", "Personal Info", "Personal Details", "Profile",
  "Contact Details", "Header", "Bio", "Personal Information" → "contact"

SUMMARY: "Objective", "Career Objective", "Professional Summary", "Personal Statement",
  "Summary of Qualifications", "Profile Summary", "Career Summary",
  "Overview", "Executive Summary" → "summary"

EXPERIENCE: "Work Experience", "Work History", "Employment History", "Professional Experience",
  "Career History", "Experience", "Positions Held", "Relevant Experience",
  "Industry Experience", "Job History", "Internship Experience",
  "Internships", "Professional Background", "Employment" → "experience"

EDUCATION: "Academic Background", "Academic History", "Educational Qualifications",
  "Degrees", "Academic Credentials", "Schooling", "Qualifications",
  "Academic Education", "Educational Background" → "education"

SKILLS: "Technical Skills", "Core Competencies", "Key Skills", "Skill Set",
  "Expertise", "Proficiencies", "Technologies", "Tools", "Tech Stack",
  "Areas of Expertise", "Competencies", "Hard Skills", "Soft Skills",
  "Key Competencies", "Technical Proficiencies", "Abilities" → "skills"

CERTIFICATIONS: "Certificates", "Licenses", "Professional Development", "Credentials",
  "Accreditations", "Professional Certifications", "Training",
  "Courses", "Coursework", "Professional Courses" → "certifications"

PROJECTS: "Key Projects", "Notable Projects", "Selected Projects", "Portfolio",
  "Personal Projects", "Academic Projects", "Project Work",
  "Case Studies", "Projects & Portfolios" → "projects"

AWARDS: "Honors", "Honours", "Achievements", "Recognition", "Accomplishments",
  "Distinctions", "Prizes", "Awards & Recognition" → "awards"

LANGUAGES: "Language Skills", "Spoken Languages", "Language Proficiency",
  "Foreign Languages", "Multilingual", "Languages Known" → "languages"

PUBLICATIONS: "Papers", "Research", "Published Work", "Research Publications" → "publications"

VOLUNTEERING: "Volunteer Work", "Community Service", "Social Work",
  "Extracurricular", "Extra-Curricular Activities" → "volunteering"

Anything else → "other"

In sections_normalized: map each exact original header text → canonical name.
Only include sections actually present in the resume.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORING METHODOLOGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Score each category 0-100. overall_score = exact weighted average.

Weights:
  contact_information           →  5%
  work_experience               → 25%
  education                     → 10%
  skills                        → 15%
  formatting_parseability       → 10%
  action_verbs_impact           →  8%
  achievements_quantification   → 12%
  resume_length_relevance       →  5%
  career_progression            →  7%
  online_presence               →  3%

Grade: 85-100 = "Excellent", 70-84 = "Good", 50-69 = "Fair", 0-49 = "Poor"
Anchors: 90-100 Exceptional · 75-89 Strong · 60-74 Average · 45-59 Weak · 0-44 Poor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY CRITERIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

contact_information: Name, email, phone, location present? LinkedIn/portfolio? Contact at top? Professional email?
work_experience: Title, company, dates per role? Consistent date formats? Gaps >6 months? Experience is most prominent section?
education: Degree, institution, graduation year? GPA/honours if strong? Placed after experience for experienced candidates?
skills: Specific and technical? Logically grouped? Penalise filler ("MS Word", "Email", "Typing").
formatting_parseability: Single column? No tables/text-boxes? No critical info in headers/footers? Consistent fonts and dates?
action_verbs_impact: Bullets open with strong past-tense verbs? Penalise "Responsible for", "Helped with", "Worked on", "Was involved in". Variety?
achievements_quantification: % of bullets with a number/$/% /scale? quantification_rate = quantified/total × 100.
resume_length_relevance: <2 yrs → 1 page, 2-10 yrs → 1-2 pages, 10+ yrs → 2-3 pages max.
career_progression: Upward trajectory? Logical moves? Short tenures (<1 yr) unexplained?
online_presence: LinkedIn personalised? Relevant GitHub/portfolio? No broken links?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECTS ANALYSIS (Dedicated Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyse EVERY project in the resume (projects section AND projects inside work experience).

For each project extract:
NAME: Title as written. Unnamed → "Unnamed Project N".
DESCRIPTION: What it does. Flag if vague or missing.
TECH STACK: Every language, framework, library, tool mentioned. Flag if absent.
LINKS: Use the extracted PDF hyperlinks first. Match URLs to projects by context.
  github_url → github.com link for this project
  live_url   → deployed URL (vercel.app, netlify.app, custom domain, etc.)
  demo_url   → demo video (youtube, loom, etc.)
  other_url  → devpost, npm, etc.
IMPACT: Numbers, users, scale, performance gains? Penalise vague outcomes.
COMPLETENESS: Name + Description + Tech stack + GitHub + Live/demo + Impact
RECENCY: Extract dates if present.

Positive signals: open source stars/forks, production users, hackathon placement, published package, CI/CD.
Red flags: tutorial clones (Todo, Netflix clone), no GitHub for technical project, no description, no tech stack.

SCORING (0-100):
  90-100: name + description + tech stack + GitHub + live/demo + impact on every project
  70-89:  most have GitHub and tech stack, some missing live links or impact
  50-69:  GitHub links or descriptions missing on several projects
  30-49:  few links, generic descriptions, or only tutorial clones
  0-29:   no projects section or projects with no useful information

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEYWORD ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

strong_keywords: Industry-relevant, specific, high-value terms found.
weak_or_vague_keywords: Generic/overused terms present.
missing_industry_keywords: Based on candidate's field/title, important absent terms.
keyword_density_score (0-100): Ratio of strong to weak/total.
Always flag: "go-getter", "team player", "results-driven", "dynamic", "passionate",
"detail-oriented", "hardworking", "synergy", "proactive", "self-starter",
"motivated", "enthusiastic", "innovative thinker".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXACT JSON SCHEMA TO RETURN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "parsing_meta": {
    "parsing_success_percentage": <number 0-100>,
    "detected_format": <"PDF" | "DOCX" | "Unknown">,
    "total_pages": <number>,
    "sections_detected": [<exact header text as found in resume>],
    "sections_normalized": { "<original header>": "<canonical name>" },
    "unrecognized_sections": [<section names that could not be mapped>]
  },
  "candidate": {
    "name": <string>,
    "email": <string>,
    "phone": <string>,
    "location": <string>,
    "linkedin": <string>,
    "portfolio": <string>,
    "current_title": <string>,
    "years_of_experience": <number>,
    "career_level": <"Entry" | "Mid" | "Senior" | "Lead" | "Executive">
  },
  "overall_score": <integer 0-100, exact weighted average>,
  "grade": <"Excellent" | "Good" | "Fair" | "Poor">,
  "summary": <string, 2-3 sentence honest overview>,
  "scoring_notes": <string, what pulled the score up or down>,
  "categories": {
    "contact_information":          { "score": <int>, "weight": 5,  "reasoning": <string> },
    "work_experience":              { "score": <int>, "weight": 25, "reasoning": <string> },
    "education":                    { "score": <int>, "weight": 10, "reasoning": <string> },
    "skills":                       { "score": <int>, "weight": 15, "reasoning": <string> },
    "formatting_parseability":      { "score": <int>, "weight": 10, "reasoning": <string> },
    "action_verbs_impact":          { "score": <int>, "weight": 8,  "reasoning": <string> },
    "achievements_quantification":  { "score": <int>, "weight": 12, "reasoning": <string> },
    "resume_length_relevance":      { "score": <int>, "weight": 5,  "reasoning": <string> },
    "career_progression":           { "score": <int>, "weight": 7,  "reasoning": <string> },
    "online_presence":              { "score": <int>, "weight": 3,  "reasoning": <string> }
  },
  "keywords": {
    "strong_keywords": [<string>],
    "weak_or_vague_keywords": [<string>],
    "missing_industry_keywords": [<string>],
    "keyword_density_score": <integer 0-100>,
    "keyword_notes": <string>
  },
  "measurable_impact": {
    "score": <integer 0-100>,
    "quantified_bullets": [<string>],
    "unquantified_bullets": [<string>],
    "quantification_rate": <number, percentage>,
    "notes": <string>
  },
  "projects_analysis": {
    "score": <integer 0-100>,
    "total_projects": <number>,
    "has_projects_section": <boolean>,
    "projects": [
      {
        "name": <string>,
        "description": <string>,
        "tech_stack": [<string>],
        "github_url": <string or "">,
        "live_url": <string or "">,
        "demo_url": <string or "">,
        "other_url": <string or "">,
        "has_github": <boolean>,
        "has_live_deployment": <boolean>,
        "has_demo": <boolean>,
        "impact_mentioned": <boolean>,
        "impact_description": <string or "">,
        "date_range": <string or "">,
        "is_tutorial_clone": <boolean>,
        "completeness_score": <integer 0-100>,
        "missing_elements": [<string>],
        "positive_signals": [<string>],
        "red_flags": [<string>]
      }
    ],
    "project_gaps": [<string>],
    "github_presence": <"strong" | "partial" | "none">,
    "notes": <string>
  },
  "formatting": {
    "score": <integer 0-100>,
    "is_single_column": <boolean>,
    "uses_tables": <boolean>,
    "uses_images_or_graphics": <boolean>,
    "uses_headers_footers": <boolean>,
    "font_consistency": <"consistent" | "minor inconsistencies" | "inconsistent">,
    "bullet_style_consistent": <boolean>,
    "section_spacing_adequate": <boolean>,
    "contact_at_top": <boolean>,
    "notes": <string>
  },
  "layout_insights": {
    "score": <integer 0-100>,
    "section_order": [<canonical names in order they appear>],
    "recommended_section_order": [<canonical names in ideal order for this candidate>],
    "section_order_issues": [<string>],
    "missing_recommended_sections": [<canonical names>],
    "unnecessary_sections": [<string>],
    "notes": <string>
  },
  "critical_fixes": [
    { "severity": <"critical"|"major"|"minor">, "section": <canonical name>, "issue": <string>, "fix": <string> }
  ],
  "keyword_gaps": {
    "missing_technical_skills": [<string>],
    "missing_soft_skills": [<string>],
    "missing_certifications": [<string>],
    "overused_buzzwords": [<string>],
    "notes": <string>
  },
  "improvements": [
    { "priority": <"high"|"medium"|"low">, "section": <canonical name>, "suggestion": <string> }
  ],
  "ats_warnings": [
    { "type": <"error"|"warning"|"pass">, "check": <string>, "detail": <string> }
  ],
  "rewrite_suggestions": [
    { "original": <string>, "improved": <string>, "reason": <string> }
  ]
}
`.trim();