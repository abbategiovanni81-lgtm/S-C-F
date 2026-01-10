"use client"

import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ResponsiveTooltipProps {
  content: string
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
}

export function ResponsiveTooltip({ content, children, side = "top" }: ResponsiveTooltipProps) {
  const [open, setOpen] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const fullContent = `${content} - ask Ava for more info`

  const handleTouchStart = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(true)
    }, 500)
  }

  const handleTouchEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setTimeout(() => setOpen(false), 2000)
  }

  const handleClick = (e: React.MouseEvent) => {
    if ('ontouchstart' in window) {
      setOpen(!open)
      if (!open) {
        setTimeout(() => setOpen(false), 3000)
      }
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <span
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={handleClick}
            className="inline-flex"
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[200px] text-center">
          <p>{fullContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
