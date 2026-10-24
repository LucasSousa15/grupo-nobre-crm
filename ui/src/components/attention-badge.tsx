import { attentionLabels, type AttentionStatus } from "@/hooks/opportunities/types";

const styles: Record<AttentionStatus, string> = {
  NORMAL: "bg-nobre-paper-shade text-nobre-ink-soft",
  DUE_SOON: "bg-nobre-moss text-nobre-forest-deep",
  OVERDUE: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export function AttentionBadge({ status }: { status: AttentionStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{attentionLabels[status]}</span>;
}
