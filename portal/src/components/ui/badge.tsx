import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-0.5 text-[11px] font-mono font-medium leading-tight whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "border-[#DDD8CE] bg-[#EAE6DD] text-[#47453F]",
        sheet: "border-[#DDD8CE] bg-[#FCFBF8] text-[#5C5850]",
        leak: "border-[#E9B8B2] bg-[#FDF2F0] text-[#A42216]",
        ok: "border-[#AEDCC9] bg-[#EDF7F3] text-[#095E49]",
        warn: "border-[#E6CE9E] bg-[#FCF6E8] text-[#8F5100]",
        bay: "border-[#2C2F2A] bg-[#1B1D1A] text-[#EAE8E1]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
