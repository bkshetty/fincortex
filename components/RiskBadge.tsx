import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { RiskScore } from "@/lib/types";

export default function RiskBadge({ score }: { score: RiskScore }) {
  if (score === "HIGH") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <AlertTriangle size={12} />
        {score}
      </span>
    );
  }
  if (score === "MEDIUM") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
        <AlertTriangle size={12} />
        {score}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle2 size={12} />
      {score}
    </span>
  );
}
