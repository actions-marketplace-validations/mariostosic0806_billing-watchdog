import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[3px] text-[13px] font-medium transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#141413] text-[#FCFBF8] hover:bg-[#2B2B28]",
        outline: "border border-[#DDD8CE] bg-[#FCFBF8] text-[#141413] hover:bg-[#EAE6DD] hover:border-[#C5BEB1]",
        secondary: "border border-[#DDD8CE] bg-[#EAE6DD] text-[#141413] hover:bg-[#DDD8CE]",
        ghost: "text-[#47453F] hover:bg-[#EAE6DD] hover:text-[#141413]",
        bay: "border border-[#2C2F2A] bg-[#1B1D1A] text-[#EAE8E1] hover:bg-[#262925] hover:border-[#3E423B]",
      },
      size: {
        default: "h-9 px-3.5 py-2",
        sm: "h-7 px-2.5 text-[12px]",
        lg: "h-10 px-4 text-[13.5px]",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
