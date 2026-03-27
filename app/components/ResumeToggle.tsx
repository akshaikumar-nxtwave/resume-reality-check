import { useState } from "react";
import { notHiredResume, hiredResume } from "../data/resumeData";
import ResumePreview from "./ResumePreview";
import { useRouter } from "next/navigation";
import { XCircle, CheckCircle } from "lucide-react";

const ResumeToggle = () => {
  const [isHired, setIsHired] = useState(false);

  const router = useRouter()
  function navigate(){
    router.push("/atsresumechecker")
  }

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={() => setIsHired(false)}
          className={`flex items-center cursor-pointer gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            !isHired
              ? "bg-destructive text-destructive-foreground shadow-md"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          <XCircle className="w-4 h-4" />
          Your Resume{" (Click here)"}
        </button>
        <button
          onClick={() => setIsHired(true)}
          className={`flex items-center cursor-pointer gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isHired
              ? "bg-accent text-accent-foreground shadow-md"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Company Expected Resume{" (Click here)"}
        </button>
        <button
          onClick={() => navigate()}
          className={`flex items-center border-2 cursor-pointer gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all `}
        >
          Get ATS for you resume{" (Click here)"}
        </button>

      </div>

      {/* Label */}
      <div className="text-center mb-4">
        {!isHired ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive bg-destructive/10 px-3 py-1 rounded-full">
            <XCircle className="w-3.5 h-3.5" /> Not Hired — Common Student Resume
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent bg-accent/10 px-3 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" /> Hired — Company Expected Resume
          </span>
        )}
      </div>

      {/* Resume */}
      <div className="transition-all duration-300">
        {isHired ? (
          <ResumePreview data={hiredResume} variant="hired" />
        ) : (
          <ResumePreview data={notHiredResume} variant="not-hired" />
        )}
      </div>
    </div>
  );
};

export default ResumeToggle;
