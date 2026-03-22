import { Badge } from "@repo/design-system/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { COMMITMENT_STATUS } from "@/lib/contracts";

type BadgeVariant = "default" | "destructive" | "secondary" | "outline";

interface StatusDisplay {
  icon: typeof CheckCircle2;
  label: string;
  variant: BadgeVariant;
}

function getStatusDisplay(
  status: number | undefined,
  paid: boolean,
  completed: boolean
): StatusDisplay {
  if (paid) {
    return { label: "Completed", variant: "secondary", icon: CheckCircle2 };
  }
  if (status === COMMITMENT_STATUS.CLAIMED_BY_USER) {
    return {
      label: "Claimed (Success)",
      variant: "default",
      icon: CheckCircle2,
    };
  }
  if (status === COMMITMENT_STATUS.CLAIMED_BY_PENALTY) {
    return { label: "Penalty Claimed", variant: "destructive", icon: XCircle };
  }
  if (status === COMMITMENT_STATUS.SUCCEEDED) {
    return {
      label: "Success - Claim Stake",
      variant: "default",
      icon: CheckCircle2,
    };
  }
  if (status === COMMITMENT_STATUS.FAILED) {
    return { label: "Failed", variant: "destructive", icon: XCircle };
  }
  if (status === COMMITMENT_STATUS.ACTIVE) {
    return { label: "Active", variant: "outline", icon: Clock };
  }
  if (completed) {
    return { label: "Completed", variant: "secondary", icon: CheckCircle2 };
  }
  return { label: "Pending", variant: "outline", icon: Clock };
}

interface StatusBadgeProps {
  completed: boolean;
  paid: boolean;
  status: number | undefined;
}

export function StatusBadge({ status, paid, completed }: StatusBadgeProps) {
  const statusDisplay = getStatusDisplay(status, paid, completed);
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="flex items-center gap-2">
      <StatusIcon className="h-6 w-6" />
      <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
    </div>
  );
}

export type { StatusDisplay };
