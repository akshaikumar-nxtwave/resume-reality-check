import { ResumeData } from "../data/resumeData";
import { Mail, Phone, Linkedin, Github, Globe, ExternalLink } from "lucide-react";

interface ResumePreviewProps {
  data: ResumeData;
  variant: "not-hired" | "hired";
}

const ResumePreview = ({ data, variant }: ResumePreviewProps) => {
  const isHired = variant === "hired";

  return (
    <div className="resume-document p-6 sm:p-10 max-w-180 mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[hsl(var(--resume-heading))] tracking-tight">
          {data.name}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 resume-muted">
          <span className="inline-flex items-center gap-1">
            <Phone className="w-3 h-3" /> {data.phone}
          </span>
          <span className="inline-flex items-center gap-1">
            <Mail className="w-3 h-3" /> {data.email}
          </span>
          <span className="inline-flex items-center gap-1">
            <Linkedin className="w-3 h-3" />
            {isHired ? (
              <a href={`https://${data.linkedin}`} className="underline text-blue-700">
                {data.linkedin}
              </a>
            ) : (
              data.linkedin
            )}
          </span>
          <span className="inline-flex items-center gap-1">
            <Github className="w-3 h-3" />
            {isHired ? (
              <a href={`https://${data.github}`} className="underline text-blue-700">
                {data.github}
              </a>
            ) : (
              data.github
            )}
          </span>
          {data.portfolio && (
            <span className="inline-flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <a href={`https://${data.portfolio}`} className="underline text-blue-700">
                {data.portfolio}
              </a>
            </span>
          )}
        </div>
      </div>

      {/* Skills */}
      <section className="mb-5">
        <h3 className="resume-heading">Skills</h3>
        {isHired && data.skillLabels ? (
          <div className="space-y-1.5">
            {data.skillLabels.map((label, i) => (
              <div key={label} className="resume-text">
                <span className="font-medium text-[hsl(var(--resume-heading))]">{label}:</span>{" "}
                {data.skills[i]?.join(", ")}
              </div>
            ))}
          </div>
        ) : (
          <p className="resume-text">{data.skills[0]?.join(", ")}</p>
        )}
      </section>

      {/* Experience */}
      <section className="mb-5">
        <h3 className="resume-heading">Experience</h3>
        {data.experience.map((exp) => (
          <div key={exp.role}>
            <div className="flex items-baseline justify-between flex-wrap gap-1">
              <h4 className="font-semibold text-sm text-[hsl(var(--resume-heading))]">
                {exp.role}
              </h4>
              <span className="resume-muted">{exp.duration}</span>
            </div>
            <p className="resume-muted">{exp.company}</p>
            <ul className="list-disc list-inside mt-1.5 space-y-0.5">
              {exp.points.map((p, i) => (
                <li key={i} className="resume-text">{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Projects */}
      <section className="mb-5">
        <h3 className="resume-heading">Projects</h3>
        <div className="space-y-4">
          {data.projects.map((project) => (
            <div key={project.title}>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <h4 className="font-semibold text-sm text-[hsl(var(--resume-heading))]">
                  {project.title}
                </h4>
                {project.links && (
                  <div className="flex gap-3">
                    {project.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {project.tech && (
                <p className="text-black mt-0.5 font-mono text-xs">{project.tech}</p>
              )}
              <ul className="list-disc list-inside mt-1.5 space-y-0.5">
                {project.description.map((d, i) => (
                  <li key={i} className="resume-text">{d}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="mb-5">
        <h3 className="resume-heading">Education</h3>
        <div className="space-y-3">
          {data.education.map((edu) => (
            <div key={edu.degree}>
              <div className="flex items-baseline justify-between flex-wrap gap-1">
                <h4 className="font-semibold text-sm text-[hsl(var(--resume-heading))]">
                  {edu.degree}
                </h4>
                <span className="resume-muted">{edu.duration}</span>
              </div>
              <p className="resume-muted">{edu.institution}</p>
              {edu.extra && <p className="resume-text mt-1 italic text-xs">{edu.extra}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <h3 className="resume-heading">Achievements & Certifications</h3>
        <ul className="list-disc list-inside space-y-1">
          {data.achievements.map((a, i) => (
            <li key={i} className="resume-text">
              {a.text}
              {a.link && (
                <a
                  href={a.link}
                  className="ml-2 inline-flex items-center gap-0.5 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Verify
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ResumePreview;
