"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", children, ...props }, ref) => {
        const variants = {
            primary:
                "bg-white text-black hover:bg-zinc-100 font-medium shadow-lg shadow-blue-500/10",
            secondary:
                "bg-zinc-800/80 text-white border border-white/10 hover:bg-zinc-800 hover:border-white/20",
            ghost: "text-white hover:bg-zinc-800/50",
        };

        return (
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                    "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    className
                )}
                ref={ref}
                {...(props as any)}
            >
                {children}
            </motion.button>
        );
    }
);
Button.displayName = "Button";

export { Button };
