import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", {
  variants: {
    variant: {
      default: "border-transparent bg-primary text-primary-foreground",
      secondary: "border-transparent bg-secondary text-secondary-foreground",
      outline: "text-foreground",
      low: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      medium: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300",
      high: "border-orange-500/25 bg-orange-500/10 text-orange-600 dark:text-orange-300",
      critical: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-300"
    }
  },
  defaultVariants: { variant: "default" }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
