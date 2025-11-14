import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function VerifiedBadge({ className, size = "md" }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <CheckCircle2
      className={cn(
        "text-primary fill-primary/10",
        sizeClasses[size],
        className
      )}
      aria-label="Verified Pro User"
    />
  );
}
