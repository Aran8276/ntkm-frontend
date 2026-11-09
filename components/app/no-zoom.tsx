"use client"

import * as React from "react"

/**
 * iOS Safari ignores `user-scalable=no`, so pinch zoom is blocked through its
 * gesture events and multi-touch moves. Other browsers honour the viewport tag.
 */
export function NoZoom() {
  React.useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()
    const pinch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    document.addEventListener("gesturestart", prevent, { passive: false })
    document.addEventListener("gesturechange", prevent, { passive: false })
    document.addEventListener("touchmove", pinch, { passive: false })
    return () => {
      document.removeEventListener("gesturestart", prevent)
      document.removeEventListener("gesturechange", prevent)
      document.removeEventListener("touchmove", pinch)
    }
  }, [])
  return null
}
