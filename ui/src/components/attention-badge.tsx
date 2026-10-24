import { attentionLabels, type AttentionStatus } from "@/hooks/opportunities/types";

const styles: Record<AttentionStatus, string> = {
  NORMAL: "border border-nobre-forest/15 bg-nobre-paper-shade text-nobre-ink-soft",
  DUE_SOON: "border border-nobre-forest/15 bg-nobre-moss text-nobre-forest-deep",
  OVERDUE: "border border-nobre-crown/70 bg-nobre-crown/25 text-nobre-pitch",
  CRITICAL: "bg-nobre-pitch text-nobre-sprout",
};

export function AttentionBadge({ status }: { status: AttentionStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{attentionLabels[status]}</span>;
}
