import React from "react";
import {
  Code2,
  Briefcase,
  GraduationCap,
  Award,
  Link2,
  Lightbulb,
  XCircle,
  CheckCircle,
} from "lucide-react";

interface GuidanceCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  dos: string[];
  donts: string[];
}

const GuidanceCard = ({ icon, title, children, dos, donts }: GuidanceCardProps) => (
  <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col h-full">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h3 className="font-bold text-lg text-card-foreground">{title}</h3>
    </div>
    
    <div className="text-sm leading-relaxed space-y-3 mb-6 grow">
      {children}
    </div>

    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
      <div className="space-y-2">
        <h4 className="text-sm font-bold uppercase tracking-wider text-green-600 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" /> Do's
        </h4>
        <ul className="text-sm space-y-1.5">
          {dos.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <li className="text-green-500">-</li>
              <span>{item}</span>
            </div>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-bold uppercase tracking-wider text-red-600 flex items-center gap-1">
          <XCircle className="w-4 h-4" /> Don'ts
        </h4>
        <ul className="text-sm space-y-1.5">
          {donts.map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="text-red-500">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const GuidanceSection = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 border-b-2">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Skills Section */}
        <GuidanceCard 
          icon={<Lightbulb className="w-5 h-5" />} 
          title="Skills"
          dos={[
            "Categorize skills (Languages, Frameworks, Tools)",
            "Only list what you can explain deeply",
            "Order by proficiency (strongest first)"
          ]}
          donts={[
            "Using progress bars or percentage scales (e.g. 80% Java)",
            "Listing tools you've only seen in a single tutorial",
            "Cluttering with soft skills like 'Hardworking'"
          ]}
        >
          <p>
            Group your skills by category: Frontend, Backend, Databases, Tools, so recruiters can quickly scan what you know. Every important
            skill should be backed by at least one project.
          </p>
        </GuidanceCard>

        {/* Projects Section */}
        <GuidanceCard 
          icon={<Code2 className="w-5 h-5" />} 
          title="Projects"
          dos={[
            "Include a clear 'Problem-Solution' description",
            "Provide live links and clear README files",
            "Highlight specific technical challenges solved"
          ]}
          donts={[
            "Listing generic tutorial clones (e.g. basic Todo app)",
            "Ignoring GitHub links for 'incomplete' projects",
            "Vague descriptions like 'Made a website using HTML'"
          ]}
        >
          <p>
            Avoid generic tutorial projects. Build something that solves a real 
            problem. Recruiters should be able to see your code and your 
            work running live.
          </p>
        </GuidanceCard>

        {/* Experience Section */}
        <GuidanceCard 
          icon={<Briefcase className="w-5 h-5" />} 
          title="Experience"
          dos={[
            "Use action verbs (Developed, Optimized, Led)",
            "Quantify results (e.g. 'Reduced latency by 20%')",
            "Focus on ownership and individual impact"
          ]}
          donts={[
            "Listing daily responsibilities instead of achievements",
            "Using 'We' too much—explain what YOU did",
            "Paragraph formats; always use bullet points"
          ]}
        >
          <p>
            Don't write responsibilities — write contributions. Focus on what 
            you actually built, improved, or fixed. Use numbers wherever possible.
          </p>
        </GuidanceCard>

        {/* Education Section */}
        <GuidanceCard 
          icon={<GraduationCap className="w-5 h-5" />} 
          title="Education"
          dos={[
            "Highlight relevant coursework or specializations",
            "Include GPA/Percentage if it's high (8.0+ / 75%+)",
            "List honors, scholarships, or dean's list"
          ]}
          donts={[
            "Listing your high school details (if you're a Grad)",
            "Including irrelevant hobby classes or workshops",
            "Occupying too much space with old credentials"
          ]}
        >
          <p>
            Keep it clean and simple — degree, college name, and timeline.
            Avoid listing every course unless they add significant value to 
            the specific job role.
          </p>
        </GuidanceCard>

        {/* Achievements Section */}
        <GuidanceCard 
          icon={<Award className="w-5 h-5" />} 
          title="Achievements"
          dos={[
            "Include links to certificates or contest results",
            "Focus on technical wins (Hackathons, Coding ranks)",
            "Mention scale (e.g. 'Top 1% out of 5000+')"
          ]}
          donts={[
            "Vague claims like 'Best Student' without context",
            "Listing non-verifiable participation certificates",
            "Using outdated school-level achievements"
          ]}
        >
          <p>
            Every achievement should have proof. Quality over quantity—three 
            verifiable technical achievements are better than ten generic claims.
          </p>
        </GuidanceCard>

        {/* Links Section */}
        <GuidanceCard 
          icon={<Link2 className="w-5 h-5" />} 
          title="Links & Online Presence"
          dos={[
            "Hyperlink all project titles and social icons",
            "Ensure LinkedIn profile matches your resume",
            "Clean up GitHub (Pin your best 4 repositories)"
          ]}
          donts={[
            "Using unprofessional emails (e.g. coolguy99@)",
            "Dead links or 'Site under construction' pages",
            "Private GitHub repos that recruiters can't see"
          ]}
        >
          <p>
            Your online presence is part of your story. Use a professional email, 
            complete your LinkedIn, and ensure your GitHub demonstrates your skills.
          </p>
        </GuidanceCard>
      </div>

      {/* Note callout */}
      <div className="note-callout text-sm">
        <p className="font-semibold mb-1">📌 Note:</p>
        <p>
          NxtWave projects are designed for learning purposes. It is recommended not to include them in your resume. Instead, focus on building independent, real-world projects.
        </p>
      </div>
    </div>
  );
};

export default GuidanceSection;
