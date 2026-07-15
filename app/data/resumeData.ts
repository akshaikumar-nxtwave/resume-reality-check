// Type for the full analysis result structure (matches API response)
export type CandidateAnalysisData = typeof candidateData;

export const candidateData = {
  parsing_meta: {
    parsing_success_percentage: 94,
    detected_format: "DOCX",
    total_pages: 2,
    sections_detected: ["Header", "Profile", "Employment", "Tech Stack", "Projects", "Hobbies"],
    sections_normalized: {
      Employment: "Experience",
      "Tech Stack": "Skills",
    } as Record<string, string>,
    unrecognized_sections: ["Personal Philosophy", "References Available Upon Request"] as string[],
  },
  candidate: {
    name: "Jordan Smith",
    email: "j.smith.dev@example.com",
    phone: "+1-202-555-0198",
    location: "Remote / Seattle, WA",
    linkedin: "linkedin.com/in/jsmith-engineering",
    portfolio: "jsmith.io",
    current_title: "Senior Frontend Developer",
    years_of_experience: 6,
    career_level: "Senior",
  },
  header_section_links: {
    github: "github.com/jsmith-codes",
    linkedin: "linkedin.com/in/jsmith-engineering",
    portfolio: "jsmith.io",
    other_links: ["behance.net/jsmith-ui"] as string[],
  },
  overall_score: 78,
  grade: "B",
  summary:
    "Senior Developer with a focus on high-performance React applications and scalable CSS architectures. Expert in mentoring teams and streamlining CI/CD pipelines.",
  scoring_notes:
    "Great technical depth, but the resume contains several parsing red flags that might hinder automated screening.",
  categories: {
    skills: { score: 95, weight: 20, reasoning: "Strong alignment with modern frontend requirements." },
    projects: { score: 60, weight: 30, reasoning: "Projects lack clear documentation links and impact metrics." },
    experience: { score: 85, weight: 20, reasoning: "Consistent career progression in reputable firms." },
    education: { score: 100, weight: 5, reasoning: "B.S. in Computer Science confirmed." },
    ats: { score: 50, weight: 15, reasoning: "Unrecognized sections and non-standard headers detected." },
    links: { score: 90, weight: 10, reasoning: "Most links functional, but GitHub profile is private." },
  } as Record<string, { score: number; weight: number; reasoning: string }>,
  skills: {
    languages: ["JavaScript", "TypeScript", "HTML5", "Sass"],
    frameworks: ["React", "Vue.js", "Tailwind CSS", "Next.js"],
    tools: ["Vite", "Webpack", "Docker", "Figma"],
    databases: ["Firebase", "PostgreSQL"],
    skill_score: { "UI/UX": 90, Architecture: 85 } as Record<string, number>,
    skill_project_mapping: {
      Tailwind: ["Dashboard Refresh"],
      "Next.js": ["SaaS Marketing Site"],
    } as Record<string, string[]>,
  },
  projects_analysis: {
    score: 60,
    total_projects: 2,
    has_projects_section: true,
    projects: [
      {
        name: "CryptoTracker Pro",
        description: "A real-time dashboard for monitoring cryptocurrency price fluctuations.",
        tech_stack: ["React", "D3.js", "WebSockets"],
        github_url: "",
        live_url: "crypto-pro-demo.io",
        has_github: false,
        has_live_deployment: true,
        impact_mentioned: false,
        impact_description: "",
        is_tutorial_clone: true,
        completeness_score: 45,
        missing_elements: ["GitHub Repository Link", "Quantified User Metrics", "Role Description"],
        positive_signals: ["Live Demo Link", "Complex Data Visualization"],
        red_flags: ["Tutorial Clone Detected", "Missing Source Code", "Vague Tech Implementation"],
      },
    ],
    project_gaps: ["No backend-heavy projects", "Lack of testing suites mentioned"],
    notes: "Projects feel a bit generic; needs more unique, high-impact contributions.",
  },
  measurable_impact: {
    score: 40,
    quantified_bullets: ["Reduced build time by 15%"],
    unquantified_bullets: ["Improved UI consistency across the app", "Helped with onboarding"],
    quantification_rate: 20,
    notes: "The experience section is very task-oriented rather than result-oriented.",
  },
  keywords: {
    tracked_keywords: ["Agile", "React", "TDD"],
    keyword_scores: { Frontend: 10, Leadership: 6 } as Record<string, number>,
    strong_keywords: ["React", "TypeScript", "Webpack"],
    weak_or_vague_keywords: ["Passionate", "Detail-oriented", "Team player"],
    missing_industry_keywords: ["Cypress", "Unit Testing", "AWS Lambda"],
    keyword_density_score: 70,
    keyword_notes: "Heavy on skills, light on methodology keywords.",
  },
  formatting: {
    score: 55,
    is_single_column: false,
    uses_tables: true,
    uses_images_or_graphics: false,
    uses_headers_footers: true,
    font_consistency: "Inconsistent (Arial and Calibri)",
    bullet_style_consistent: false,
    section_spacing_adequate: false,
    contact_at_top: true,
    notes: "Tables and headers/footers are high-risk for ATS parsing errors.",
  },
  layout_insights: {
    score: 75,
    section_order: ["Profile", "Hobbies", "Employment", "Skills", "Projects"],
    recommended_section_order: ["Profile", "Skills", "Employment", "Projects", "Education"],
    section_order_issues: ["Hobbies section appears too high in the hierarchy."],
    missing_recommended_sections: ["Certifications", "Education"],
    unnecessary_sections: ["Hobbies", "Personal Philosophy"],
    notes: "Move hobbies to the bottom or remove entirely.",
  },
  jd_evaluation: undefined,
  critical_fixes: [
    {
      severity: "critical",
      section: "Layout",
      issue: "Use of tables for alignment.",
      fix: "Remove all tables; use standard tabs and margins for layout.",
    },
  ] as Array<{ severity: string; section: string; issue: string; fix: string }>,
  keyword_gaps: {
    missing_technical_skills: ["Jest", "Testing Library"],
    missing_soft_skills: ["Project Management", "Stakeholder Communication"],
    missing_certifications: ["Meta Front-End Developer Certificate"],
    overused_buzzwords: ["Self-starter", "Guru"],
    notes: "The resume lacks testing-related keywords.",
  },
  ats_warnings: [
    {
      type: "error",
      check: "Table Detection",
      detail: "Data inside tables may not be correctly associated with sections.",
    },
  ] as Array<{ type: string; check: string; detail: string }>,
  improvements: [
    {
      priority: "medium",
      section: "Skills",
      issue: "Skill density is too high.",
      suggestion: "Group skills by category (e.g., Languages, Frameworks) for better readability.",
    },
  ] as Array<{ priority: string; section: string; issue: string; suggestion: string }>,
  rewrite_suggestions: [
    {
      original: "Worked on the main company website using React.",
      improved:
        "Spearheaded the migration of the flagship enterprise dashboard to React, improving lighthouse performance scores by 35%.",
      reason: "Uses a strong action verb and provides a specific metric.",
    },
  ] as Array<{ original: string; improved: string; reason: string }>,
};


export interface ResumeData {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  portfolio?: string;
  skills: string[][];
  skillLabels?: string[];
  projects: {
    title: string;
    description: string[];
    tech?: string;
    links?: { label: string; url: string }[];
  }[];
  experience: {
    role: string;
    company: string;
    duration: string;
    points: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    duration: string;
    extra?: string;
  }[];
  achievements: {
    text: string;
    link?: string;
  }[];
}

export const notHiredResume: ResumeData = {
  name: "Rahul Kumar",
  phone: "9876543210",
  email: "rahul123@gmail.com",
  linkedin: "linkedin.com/in/rahul",
  github: "github.com/rahul",
  skills: [
    [
      "HTML", "CSS", "JavaScript", "React", "Node.js", "Express", "MongoDB",
      "Python", "Java", "C++", "SQL", "Bootstrap", "Tailwind", "Git",
      "Docker", "AWS", "Firebase", "Redux", "TypeScript", "Next.js",
      "GraphQL", "REST API", "Figma", "Photoshop"
    ]
  ],
  projects: [
    {
      title: "Todo App",
      description: [
        "Created a todo application using React",
        "Users can add, delete and mark tasks as complete",
        "Used local storage for data persistence"
      ]
    },
    {
      title: "Weather App",
      description: [
        "Built a weather app using HTML, CSS and JavaScript",
        "Fetches weather data from an API",
        "Shows current temperature and weather conditions"
      ]
    },
    {
      title: "E-commerce Website",
      description: [
        "Developed an e-commerce website",
        "Has product listing page and cart functionality",
        "Used React and Node.js"
      ]
    }
  ],
  experience: [
    {
      role: "Web Development Intern",
      company: "XYZ Technologies",
      duration: "Jan 2024 - Mar 2024",
      points: [
        "Worked on the frontend team",
        "Was responsible for building UI components",
        "Attended daily standup meetings",
        "Helped with bug fixes and testing"
      ]
    }
  ],
  education: [
    {
      degree: "B.Tech in Computer Science and Engineering",
      institution: "ABC Institute of Technology, Hyderabad",
      duration: "2021 - 2025",
      extra: "Relevant Coursework: Data Structures, Algorithms, DBMS, OS, Computer Networks, Software Engineering, Compiler Design, Theory of Computation, Discrete Mathematics"
    },
    {
      degree: "Intermediate (MPC)",
      institution: "Sri Chaitanya Junior College, Vijayawada",
      duration: "2019 - 2021",
      extra: "Score: 95%"
    },
    {
      degree: "SSC",
      institution: "St. Mary's High School, Guntur",
      duration: "2019",
      extra: "GPA: 9.8"
    }
  ],
  achievements: [
    { text: "Completed 100+ problems on LeetCode" },
    { text: "Participated in college hackathon" },
    { text: "Completed Python certification from Udemy" },
    { text: "Member of college coding club" },
    { text: "Completed web development bootcamp" }
  ]
};

export const hiredResume: ResumeData = {
  name: "Rahul Kumar",
  phone: "9876543210",
  email: "rahul.kumar.dev@gmail.com",
  linkedin: "linkedin.com/in/rahul-kumar-example",
  github: "github.com/rahulkumar-dev-example",
  portfolio: "rahulkumar.example.dev",
  skills: [
    ["React.js", "Next.js", "TypeScript", "JavaScript (ES6+)"],
    ["Node.js", "Express.js", "REST APIs"],
    ["MongoDB", "PostgreSQL", "Firebase"],
    ["Git", "GitHub Actions", "Docker", "AWS (S3, EC2)"],
    ["Tailwind CSS", "Figma (Basic)"]
  ],
  skillLabels: [
    "Frontend",
    "Backend",
    "Databases",
    "DevOps & Tools",
    "Styling & Design"
  ],
  projects: [
    {
      title: "SpendWise — Personal Finance Tracker",
      description: [
        "Built a full-stack expense tracking app that helps users categorize spending, set monthly budgets, and visualize trends through interactive charts",
        "Implemented JWT-based authentication, role-based access, and a REST API with Node.js and Express",
        "Reduced average page load time by 40% using code splitting and lazy loading in React"
      ],
      tech: "React, Node.js, Express, MongoDB, Chart.js, Tailwind CSS",
      links: [
        { label: "Live link", url: "https://example.com/" },
        { label: "GitHub", url: "https://github.com/example" }
      ]
    },
    {
      title: "DevConnect — Developer Networking Platform",
      description: [
        "Designed and developed a platform where developers can create profiles, share projects, and connect with peers based on tech stack interests",
        "Integrated real-time messaging using Socket.io and implemented infinite scrolling for the feed",
        "Achieved 200+ registered users within the first month of deployment"
      ],
      tech: "Next.js, TypeScript, PostgreSQL, Socket.io, Tailwind CSS",
      links: [
        { label: "Live link", url: "https://example.com/" },
        { label: "GitHub (with README & Demo Video)", url: "https://github.com/example" }
      ]
    },
    {
      title: "QuickPoll — Real-time Polling Application",
      description: [
        "Created a polling app that allows users to create polls, vote in real-time, and see results update live with animated charts",
        "Built a custom webhook system for poll result notifications via email",
        "Deployed on AWS EC2 with CI/CD pipeline using GitHub Actions"
      ],
      tech: "React, Firebase, Node.js, AWS EC2, GitHub Actions",
      links: [
        { label: "Live link", url: "https://example.com/" },
        { label: "GitHub", url: "https://github.com/example" }
      ]
    }
  ],
  experience: [
    {
      role: "Frontend Developer Intern",
      company: "XYZ Technologies, Hyderabad",
      duration: "Jan 2024 - Mar 2024",
      points: [
        "Rebuilt the customer dashboard using React and TypeScript, improving load performance by 35% and reducing bounce rate by 20%",
        "Developed 12 reusable UI components adopted across 3 product teams, reducing development time for new features by 25%",
        "Collaborated with backend engineers to integrate RESTful APIs and implemented client-side caching with React Query"
      ]
    }
  ],
  education: [
    {
      degree: "B.Tech in Computer Science and Engineering",
      institution: "ABC Institute of Technology, Hyderabad",
      duration: "2021 - 2025"
    }
  ],
  achievements: [
    {
      text: "Solved 400+ problems on LeetCode (Rating: 1850+)",
      link: "https://leetcode.com/rahulkumar-dev"
    },
    {
      text: "Winner — Smart India Hackathon 2023 (College Level)",
      link: "https://drive.google.com/certificate-sih"
    },
    {
      text: "AWS Certified Cloud Practitioner",
      link: "https://aws.amazon.com/verification/cert-123"
    },
    {
      text: "Published technical blog with 5,000+ monthly readers",
      link: "https://blog.example.com"
    }
  ]
};
