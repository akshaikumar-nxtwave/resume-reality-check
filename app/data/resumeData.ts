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
