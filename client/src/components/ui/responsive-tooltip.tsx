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
  const longPressTriggeredRef = React.useRef(false)
  const isTouchDeviceRef = React.useRef(false)
  const fullContent = `${content} - ask Ava for more info`

  const handleTouchStart = () => {
    isTouchDeviceRef.current = true
    longPressTriggeredRef.current = false
    timeoutRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      setOpen(true)
    }, 400)
  }

  const handleTouchEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (longPressTriggeredRef.current) {
      setTimeout(() => setOpen(false), 2500)
    }
  }

  const handleTouchCancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isTouchDeviceRef.current) {
      if (longPressTriggeredRef.current) {
        e.preventDefault()
        e.stopPropagation()
        longPressTriggeredRef.current = false
        return
      }
      setOpen(true)
      setTimeout(() => setOpen(false), 2500)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={open} onOpenChange={(newOpen) => {
        if (!isTouchDeviceRef.current) {
          setOpen(newOpen)
        }
      }}>
        <TooltipTrigger asChild>
          <span
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
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
