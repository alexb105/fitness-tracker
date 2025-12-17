"use client"

import { useEffect, useState } from "react"
import { RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ServiceWorkerUpdater() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none", // Always check for updates
        })

        console.log("[App] Service Worker registered")

        // Check for updates immediately
        registration.update()

        // Check for updates periodically (every 60 seconds)
        const updateInterval = setInterval(() => {
          registration.update()
        }, 60 * 1000)

        // Handle updates found
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (!newWorker) return

          console.log("[App] New service worker installing...")

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available
              console.log("[App] New version available!")
              setWaitingWorker(newWorker)
              setShowUpdatePrompt(true)
            }
          })
        })

        // If there's already a waiting worker, show the update prompt
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
          setShowUpdatePrompt(true)
        }

        // Listen for controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // Reload the page to get the latest version
          window.location.reload()
        })

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "SW_UPDATED") {
            console.log("[App] Service worker updated to:", event.data.version)
          }
        })

        // Cleanup interval on unmount
        return () => clearInterval(updateInterval)
      } catch (error) {
        console.error("[App] Service Worker registration failed:", error)
      }
    }

    registerServiceWorker()
  }, [])

  const handleUpdate = () => {
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting and activate
      waitingWorker.postMessage({ type: "SKIP_WAITING" })
      setShowUpdatePrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowUpdatePrompt(false)
  }

  if (!showUpdatePrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-lg mx-auto bg-primary text-primary-foreground rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-foreground/20 rounded-full">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Update Available</h3>
            <p className="text-xs opacity-90 mt-0.5">
              A new version of PBTrackPro is ready. Refresh to get the latest features!
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 flex-shrink-0"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            onClick={handleUpdate}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handleDismiss}
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  )
}

