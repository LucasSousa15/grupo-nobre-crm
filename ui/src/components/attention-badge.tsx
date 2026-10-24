import { attentionLabels, type AttentionStatus } from "@/hooks/opportunities/types";

const styles: Record<AttentionStatus, string> = {
  NORMAL: "bg-slate-100 text-slate-700",
  DUE_SOON: "bg-sky-100 text-sky-800",
  OVERDUE: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export function AttentionBadge({ status }: { status: AttentionStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{attentionLabels[status]}</span>;
}
