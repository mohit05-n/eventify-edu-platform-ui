"use client"

import { Sparkles } from "lucide-react"



export default function Logo({ size = "default", showIcon = true, className }) {
  const sizeClasses = {
    small: "h-8",
    default: "h-10",
    large: "h-16",
    xl: "h-24"
  }[size] || "h-10"

  // If showIcon is false, we might want to show nothing or just text? 
  // The previous implementation showed text if showIcon was true OR false (it was always "EventifyEDU" text + optional icon).
  // The new logo likely contains the text.
  // So we just show the image.

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="EventifyEDU"
        className={`${sizeClasses} w-auto object-contain`}
      />
    </div>
  )
}

