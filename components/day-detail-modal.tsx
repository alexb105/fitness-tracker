"use client"

import { useState } from "react"
import { Plus, Dumbbell, ChevronRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { WorkoutDay, WorkoutSession } from "@/app/page"
import NewSessionDialog from "./new-session-dialog"

interface DayDetailModalProps {
  day: WorkoutDay | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (day: WorkoutDay) => void
  onSessionSelect: (session: WorkoutSession) => void
}

export default function DayDetailModal({ day, open, onOpenChange, onUpdate, onSessionSelect }: DayDetailModalProps) {
  const [showNewSession, setShowNewSession] = useState(false)

  if (!day) return null

  const addSession = (name: string) => {
    const newSession: WorkoutSession = {
      id: crypto.randomUUID(),
      name,
      exercises: [],
    }
    onUpdate({
      ...day,
      sessions: [...day.sessions, newSession],
    })
    setShowNewSession(false)
  }

  const loadTemplate = (session: WorkoutSession) => {
    onUpdate({
      ...day,
      sessions: [...day.sessions, session],
    })
    setShowNewSession(false)
  }

  const deleteSession = (id: string) => {
    onUpdate({
      ...day,
      sessions: day.sessions.filter((s) => s.id !== id),
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {new Date(day.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              onClick={() => setShowNewSession(true)}
              variant="outline"
              className="w-full h-11"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Session
            </Button>

            {day.sessions.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No sessions yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Add a workout session like Push Day or Leg Day
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {day.sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors group"
                    onClick={() => {
                      onSessionSelect(session)
                      onOpenChange(false)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{session.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {session.exercises.length} exercise{session.exercises.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSession(session.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <NewSessionDialog
        open={showNewSession}
        onOpenChange={setShowNewSession}
        onAdd={addSession}
        onLoadTemplate={loadTemplate}
      />
    </>
  )
}

