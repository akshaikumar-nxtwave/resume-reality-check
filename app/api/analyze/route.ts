import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

const SYSTEM_PROMPT = `You are a resume analysis engine.

Return ONLY valid JSON. No text. 
No hallucination. Use null if missing.
Extract links exactly as present.
Map skills to projects only if clearly used.
Scores must be integers.
SCORING (0-100)
overall = skills(20)+projects(30)+experience(20)+ats(15)+education(5)+links(10)
skills = coverage(5)+alignment(10)+depth(5)
projects = count(5)+complexity(5)+impact(10)+links(5)+originality(5)
experience = years(5)+relevance(5)+impact(10)
ats = formatting(5)+keyword_match(5)+readability(5)
links = github(4)+live(3)+others(3)
impact:
0 none | 5 vague | 10 measurable (%/users/performance)
KEYWORD ANALYSIS:
1. Extract keywords from:
   - skills, projects, experience
2. Normalize:
   - lowercase
   - merge duplicates (react.js → react)
3. Select top 15-25 keywords
4. Score each keyword:
   0 = not present
   3 = mentioned only
   6 = used in project
   10 = used with measurable impact
PENALIZE:
- skills without proof
- projects without links
- no measurable impact
BOOST:
- quantified results
- deployed apps
- github activity
IMPROVEMENT RULES:
- Every issue MUST have a fix
- No generic suggestions
- All suggestions must be specific & actionable
critical_fixes:
- blocking issues (ATS, missing links, no impact)
improvements:
- prioritized (high|medium|low)
- must include issue + exact fix
rewrite_suggestions:
- convert weak bullets → strong bullets
- use action verbs
- add measurable impact
OUTPUT JSON:
{
  "parsing_meta": {
    "parsing_success_percentage": 0,
    "detected_format": "",
    "total_pages": 0,
    "sections_detected": [],
    "sections_normalized": {},
    "unrecognized_sections": []
  },
  "candidate": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "portfolio": "",
    "current_title": "",
    "years_of_experience": 0,
    "career_level": ""
  },
  "header_section_links": {
    "github": "",
    "linkedin": "",
    "portfolio": "",
    "other_links": []
  },
  "overall_score": 0,
  "grade": "",
  "summary": "",
  "scoring_notes": "",
  "categories": {
    "skills": { "score": 0, "weight": 20, "reasoning": "" },
    "projects": { "score": 0, "weight": 30, "reasoning": "" },
    "experience": { "score": 0, "weight": 20, "reasoning": "" },
    "education": { "score": 0, "weight": 5, "reasoning": "" },
    "ats": { "score": 0, "weight": 15, "reasoning": "" },
    "links": { "score": 0, "weight": 10, "reasoning": "" }
  },
  "skills": {
    "languages": [],
    "frameworks": [],
    "tools": [],
    "databases": [],
    "skill_score": {},
    "skill_project_mapping": {}
  },
  "projects_analysis": {
    "score": 0,
    "total_projects": 0,
    "has_projects_section": false,
    "projects": [
      {
        "name": "",
        "description": "",
        "tech_stack": [],
        "github_url": "",
        "live_url": "",
        "has_github": false,
        "has_live_deployment": false,
        "impact_mentioned": false,
        "impact_description": "",
        "is_tutorial_clone": false,
        "completeness_score": 0,
        "missing_elements": [],
        "positive_signals": [],
        "red_flags": []
      }
    ],
    "project_gaps": [],
    "notes": ""
  },
  "measurable_impact": {
    "score": 0,
    "quantified_bullets": [],
    "unquantified_bullets": [],
    "quantification_rate": 0,
    "notes": ""
  },
  "keywords": {
    "tracked_keywords": [],
    "keyword_scores": {},
    "strong_keywords": [],
    "weak_or_vague_keywords": [],
    "missing_industry_keywords": [],
    "keyword_density_score": 0,
    "keyword_notes": ""
  },
  "formatting": {
    "score": 0,
    "is_single_column": false,
    "uses_tables": false,
    "uses_images_or_graphics": false,
    "uses_headers_footers": false,
    "font_consistency": "",
    "bullet_style_consistent": false,
    "section_spacing_adequate": false,
    "contact_at_top": false,
    "notes": ""
  },
  "layout_insights": {
    "score": 0,
    "section_order": [],
    "section_order_issues": [],
    "missing_recommended_sections": [],
    "unnecessary_sections": [],
    "notes": ""
  },
  "critical_fixes": [
    {
      "severity": "critical|major|minor",
      "section": "",
      "issue": "",
      "fix": ""
    }
  ],
  "keyword_gaps": {
    "missing_technical_skills": [],
    "missing_soft_skills": [],
    "missing_certifications": [],
    "overused_buzzwords": [],
    "notes": ""
  },
  "ats_warnings": [
    {
      "type": "error|warning|pass",
      "check": "",
      "detail": ""
    }
  ],
  "improvements": [
    {
      "priority": "high|medium|low",
      "section": "",
      "issue": "",
      "suggestion": ""
    }
  ],
  "rewrite_suggestions": [
    {
      "original": "",
      "improved": "",
      "reason": ""
    }
  ]
}
RULES:
- Use null if unknown
- Keep responses concise
- Evidence-based scoring only
- Do not repeat content`;

function normalizeExtractedText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

async function extractPdfContent(buffer: Buffer) {
  const workerPath = resolve(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.worker.mjs');
  GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    disableFontFace: true,
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pages: Array<{ pageNumber: number; text: string; hyperlinks: string[] }> = [];
  const hyperlinks = new Set<string>();
  const textSnippets: string[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = normalizeExtractedText(
      (textContent.items as Array<{ str?: string }>)
        .map((item) => item.str || '')
        .join(' ')
    );

    const annotations = await page.getAnnotations();
    const pageLinks = annotations
      .map((annotation: any) => annotation.url || annotation.action?.url || null)
      .filter(Boolean) as string[];

    pageLinks.forEach((link) => hyperlinks.add(link));
    textSnippets.push(pageText);
    pages.push({
      pageNumber,
      text: pageText,
      hyperlinks: pageLinks,
    });
  }

  await pdf.destroy();

  const fullText = textSnippets.filter(Boolean).join('\n\n');
  const linkList = Array.from(hyperlinks);

  return {
    pageCount,
    text: fullText,
    hyperlinks: linkList,
    pages,
  };
}

function getMistralTextContent(content: unknown): string {
  if (content == null) {
    return '';
  }

  if (typeof content === 'string') {
    return content.trim();
  }

  if (typeof content === 'number' || typeof content === 'boolean') {
    return String(content).trim();
  }

  if (Array.isArray(content)) {
    return content.map(getMistralTextContent).join('').trim();
  }

  if (typeof content === 'object') {
    const obj = content as Record<string, unknown>;

    if (typeof obj.text === 'string') {
      return obj.text.trim();
    }

    if (typeof obj.content === 'string') {
      return obj.content.trim();
    }

    if (Array.isArray(obj.content)) {
      return getMistralTextContent(obj.content);
    }

    return Object.values(obj).map(getMistralTextContent).join(' ').trim();
  }

  return '';
}

function parseJsonFromText(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const objectStart = trimmed.indexOf('{');
    const objectEnd = trimmed.lastIndexOf('}');
    if (objectStart !== -1 && objectEnd > objectStart) {
      const candidate = trimmed.slice(objectStart, objectEnd + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // ignore
      }
    }

    const arrayStart = trimmed.indexOf('[');
    const arrayEnd = trimmed.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      const candidate = trimmed.slice(arrayStart, arrayEnd + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // ignore
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    let file: File | null = null;
    let provider: string = 'gemini';
    let apiKey: string = '';
    let includeJD = false;
    let jobDescription = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      file = formData.get('file') as File | null;
      provider = (formData.get('provider') as string | null)?.toLowerCase() || 'gemini';
      apiKey = (formData.get('apiKey') as string | null)?.trim() || '';
      includeJD = (formData.get('includeJD') as string | null) === 'true';
      jobDescription = (formData.get('jobDescription') as string | null)?.trim() || '';
    } else {
      return NextResponse.json({ error: 'Multipart form data is required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'A PDF file upload is required' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds the 5MB limit' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'An API key is required for the selected provider' }, { status: 400 });
    }

    if (!['gemini', 'mistral'].includes(provider)) {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const resumeBuffer = Buffer.from(arrayBuffer);
    const extractedPdf = await extractPdfContent(resumeBuffer);

    console.log('📄 Extracted PDF data:', {
      pageCount: extractedPdf.pageCount,
      text: extractedPdf.text,
      hyperlinks: extractedPdf.hyperlinks,
      pages: extractedPdf.pages,
    });

    const promptText = `Analyze this resume thoroughly and return the complete JSON analysis. Use the extracted PDF content below as the source of truth.\n\nExtracted text:\n${extractedPdf.text || 'No text detected.'}\n\nDetected hyperlinks:\n${extractedPdf.hyperlinks.length > 0 ? extractedPdf.hyperlinks.join('\n') : 'No hyperlinks detected.'}`;

    const jdPrompt = (includeJD && jobDescription)
      ? `\n\nJob Description (JD) specific evaluation is requested.
Here is the Job Description:
"""
${jobDescription}
"""

You MUST evaluate the candidate's resume specifically against this Job Description. Include a "jd_evaluation" object in the returned JSON with the following fields:
- "score": score (0-100 integer) indicating how well the candidate's resume matches the Job Description. The score should ONLY reflect:
  a. Whether the skills required by the JD are present ("built") in the candidate's resume.
  b. Whether the associated projects for those JD skills/requirements are built/present in the resume.
  c. If any experience listed in the resume is applicable to the JD requirements.
- "summary": a brief summary of how well the candidate matches the JD based on the above criteria.
- "matching_skills": list of skills from the Job Description that the candidate has (or states they have) in the resume.
- "matching_projects": list of projects from the resume that demonstrate skills or requirements listed in the Job Description, or explain if none are built/associated.
- "experience_match": description of whether the candidate's experience is applicable/relevant to the JD requirements.
- "notes": additional evaluation notes.
- "gap_analysis": list of objects for each required skill from the JD that is missing/not demonstrated in the resume. Each object MUST contain:
  1. "missing_skill": (string) the name of the missing skill.
  2. "foundation_status": (string, must be "none" or "adjacent") whether a related foundation exists in the resume. "adjacent" means the resume already has a related/adjacent skill or project (e.g. resume has HTML/CSS/JS projects but JD wants React). "none" means there is no related foundation at all (e.g. JD wants React but resume has no frontend work at all, or JD wants Python backend but resume only has static HTML).
  3. "related_skills_or_projects": (array of strings, optional) list of related skills or existing projects by name found in the resume.
  4. "actionable_suggestion": (string) the specific learning or building plan:
     - If foundation_status is "none": suggest a new project idea from scratch that demonstrates the missing skill.
     - If foundation_status is "adjacent": DO NOT suggest a new project. Instead, point to one or more existing projects (by name) from the resume and suggest extending it with the missing skill.
     In either case, be extremely specific about what to add or build (e.g., fetching data from a public API and rendering it dynamically, managing UI state such as loading/error states, or handling a client-side interaction like a form/filter without needing a backend). Keep each suggestion short, specific to what's already in the resume, and actionable. AVOID generic advice like "learn React basics".
If this option was not selected, do not include any "jd_evaluation" object (or set it to null).`
      : '';

    const fullPrompt = `${promptText}${jdPrompt}`;

    let responseText = '';
    let modelUsed = 'gemini-2.5-flash';

    if (provider === 'gemini') {
      const gemini = new GoogleGenerativeAI(apiKey);
      const model = gemini.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const usage = result.response.usageMetadata;
      const inputTokens = usage?.promptTokenCount || 0;
      const outputTokens = usage?.candidatesTokenCount || 0;
      const totalTokens = usage?.totalTokenCount || 0;

      console.log('-----------------------------------------');
      console.log('📊 GEMINI API USAGE REPORT');
      console.log(`🔹 Input Tokens:  ${inputTokens}`);
      console.log(`🔹 Output Tokens: ${outputTokens}`);
      console.log(`🔹 Total Tokens:  ${totalTokens}`);
      console.log('-----------------------------------------');

      responseText = result.response.text();
    } else {
      const mistral = new Mistral({ apiKey });
      const response = await mistral.chat.complete({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: fullPrompt },
        ],
        responseFormat: { type: 'json_object' },
      });

      modelUsed = 'mistral-large-latest';
      responseText = getMistralTextContent(response.choices?.[0]?.message?.content ?? '');
    }

    // 5. Final Parse & Return
    try {
      const parsed = parseJsonFromText(responseText);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON output from AI');
      }

      return NextResponse.json({
        success: true,
        data: parsed,
        meta: {
          modelUsed,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (parseError) {
      console.error('JSON Parse Error. Raw Response:', responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

