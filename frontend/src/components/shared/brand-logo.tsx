"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  hideText?: boolean; // ✅ Added this (To fix the error)
  variant?: "glass" | "default";
}

export default function BrandLogo({
  href,
  className,
  size = "md",
  withText = true,
  hideText = false, // ✅ Added default value
  variant = "default",
}: BrandLogoProps) {
  
  // Logic: Text tabhi dikhega jab withText TRUE ho aur hideText FALSE ho
  const showText = withText && !hideText;

  const iconSize =
    size === "sm" ? "w-6 h-6" : size === "lg" ? "w-12 h-12" : "w-8 h-8";

  const baseStyles =
    variant === "glass"
      ? "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2"
      : "";

  const content = (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn("flex items-center gap-2", baseStyles, className)}
    >
      <div
        className={cn(
          "rounded-xl bg-cyan-500 flex items-center justify-center shadow-md",
          iconSize
        )}
      >
        <span className="font-black text-black text-lg">C</span>
      </div>
      
      {/* ✅ Updated Logic here */}
      {showText && (
        <span className="font-bold text-xl tracking-tight">Curocity</span>
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}