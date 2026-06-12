import { Badge } from "@/components/ui/badge";
import {
  statusLabel,
  statusVariant,
  type StatusVariant,
} from "@/components/kit/status-variant";
import { cn } from "@/lib/utils";

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-info/30 bg-info/10 text-info",
  neutral: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  /** Raw status value from the database, e.g. "pending_approval". */
  status: string;
  /** Override the auto-humanized label. */
  label?: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(VARIANT_CLASSES[statusVariant(status)], className)}
    >
      {label ?? statusLabel(status)}
    </Badge>
  );
}
