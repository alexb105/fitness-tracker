"use client"

import { useState } from "react"
import { ArrowLeft, Plus, Dumbbell, ChevronRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { WorkoutDay, WorkoutSession } from "@/app/page"
import NewSessionDialog from "./new-session-dialog"
import SessionDetail from "./session-detail"

interface DayDetailProps {
  day: WorkoutDay
  onBack: () => void
  onUpdate: (day: WorkoutDay) => void
}

export default function DayDetail({ day, onBack, onUpdate }: DayDetailProps) {
  const [showNewSession, setShowNewSession] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null)

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

  const deleteSession = (id: string) => {
    onUpdate({
      ...day,
      sessions: day.sessions.filter((s) => s.id !== id),
    })
  }

  const updateSession = (updatedSession: WorkoutSession) => {
    const updatedDay = {
      ...day,
      sessions: day.sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
    }
    onUpdate(updatedDay)
    setSelectedSession(updatedSession)
  }

  if (selectedSession) {
    return (
      <SessionDetail 
        session={selectedSession} 
        workoutDate={day.date}
        onBack={() => setSelectedSession(null)} 
        onUpdate={updateSession}
        onDelete={(sessionId) => {
          deleteSession(sessionId)
          setSelectedSession(null)
        }}
      />
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto p-6">
        <header className="mb-6">
          <Button variant="ghost" className="mb-4 -ml-2" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {new Date(day.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h1>
          <p className="text-muted-foreground">Add workout sessions to this day</p>
        </header>

        <Button onClick={() => setShowNewSession(true)} variant="outline" className="w-full mb-6 h-11">
          <Plus className="w-4 h-4 mr-2" />
          Add Session
        </Button>

        {day.sessions.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No sessions yet</p>
            <p className="text-sm text-muted-foreground/70">Add a workout session like Push Day or Leg Day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {day.sessions.map((session) => (
              <Card
                key={session.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors group"
                onClick={() => setSelectedSession(session)}
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

        <NewSessionDialog open={showNewSession} onOpenChange={setShowNewSession} onAdd={addSession} />
      </div>
    </main>
  )
}
