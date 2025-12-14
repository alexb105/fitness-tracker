"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Trophy, Trash2, TrendingUp, BarChart3, Bookmark, BookmarkCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { WorkoutSession, Exercise, WorkoutDay } from "@/app/page"
import NewExerciseDialog from "./new-exercise-dialog"
import NewPBDialog from "./new-pb-dialog"
import ExerciseStats from "./exercise-stats"
import { getBestPBForExercise } from "@/lib/exercises"
import { saveTemplate, templateExists, unsaveTemplate } from "@/lib/session-templates"
import { useToast } from "@/hooks/use-toast"

interface SessionDetailProps {
  session: WorkoutSession
  onBack: () => void
  onUpdate: (session: WorkoutSession) => void
  allDays?: WorkoutDay[]
}

export default function SessionDetail({ session, onBack, onUpdate, allDays = [] }: SessionDetailProps) {
  const [showNewExercise, setShowNewExercise] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [viewingExerciseStats, setViewingExerciseStats] = useState<string | null>(null)
  const [isTemplateSaved, setIsTemplateSaved] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsTemplateSaved(templateExists(session.name))
  }, [session.name])

  const addExercise = (name: string) => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name,
      pbs: [],
    }
    onUpdate({
      ...session,
      exercises: [...session.exercises, newExercise],
    })
    setShowNewExercise(false)
  }

  const deleteExercise = (id: string) => {
    onUpdate({
      ...session,
      exercises: session.exercises.filter((e) => e.id !== id),
    })
  }

  const addPB = (exerciseId: string, reps: number, weight: number) => {
    const updatedExercises = session.exercises.map((e) => {
      if (e.id === exerciseId) {
        return {
          ...e,
          pbs: [
            ...e.pbs,
            {
              id: crypto.randomUUID(),
              reps,
              weight,
              date: new Date().toISOString(),
            },
          ],
        }
      }
      return e
    })
    onUpdate({ ...session, exercises: updatedExercises })
    setSelectedExercise(null)
  }

  const deletePB = (exerciseId: string, pbId: string) => {
    const updatedExercises = session.exercises.map((e) => {
      if (e.id === exerciseId) {
        return {
          ...e,
          pbs: e.pbs.filter((pb) => pb.id !== pbId),
        }
      }
      return e
    })
    onUpdate({ ...session, exercises: updatedExercises })
  }

  const getBestPB = (exercise: Exercise) => {
    if (exercise.pbs.length === 0) return null
    return exercise.pbs.reduce((best, current) => {
      const currentTotal = current.reps * current.weight
      const bestTotal = best.reps * best.weight
      return currentTotal > bestTotal ? current : best
    })
  }

  const getAllTimeBestPB = (exerciseName: string) => {
    return getBestPBForExercise(exerciseName, allDays)
  }

  if (viewingExerciseStats) {
    return (
      <ExerciseStats
        exerciseName={viewingExerciseStats}
        allDays={allDays}
        onBack={() => setViewingExerciseStats(null)}
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
              <p className="text-muted-foreground">Add exercises and track your PBs</p>
            </div>
            {session.exercises.length > 0 && (
              <Button
                variant={isTemplateSaved ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (isTemplateSaved) {
                    // Unsave template
                    const unsaved = unsaveTemplate(session.name)
                    if (unsaved) {
                      setIsTemplateSaved(false)
                      toast({
                        title: "Template unsaved",
                        description: `"${session.name}" has been removed from templates`,
                      })
                    }
                  } else {
                    // Save template
                    const result = saveTemplate(session)
                    if (result.saved) {
                      setIsTemplateSaved(true)
                      toast({
                        title: result.isUpdate ? "Template updated" : "Template saved",
                        description: result.isUpdate
                          ? `"${session.name}" template has been updated`
                          : `"${session.name}" has been saved as a template`,
                      })
                    }
                  }
                }}
                className="ml-4"
              >
                {isTemplateSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                    Unsave Template
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save Template
                  </>
                )}
              </Button>
            )}
          </div>
        </header>

        <Button onClick={() => setShowNewExercise(true)} variant="outline" className="w-full mb-6 h-11">
          <Plus className="w-4 h-4 mr-2" />
          Add Exercise
        </Button>

        {session.exercises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No exercises yet</p>
            <p className="text-sm text-muted-foreground/70">Add your first exercise!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {session.exercises.map((exercise) => {
              const sessionBestPB = getBestPB(exercise)
              const allTimeBestPB = getAllTimeBestPB(exercise.name)

              return (
                <Card key={exercise.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{exercise.name}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        {sessionBestPB && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <span>
                              This Session: {sessionBestPB.reps} reps × {sessionBestPB.weight}kg
                            </span>
                          </div>
                        )}
                        {allTimeBestPB && 
                          (!sessionBestPB || 
                           allTimeBestPB.reps !== sessionBestPB.reps || 
                           allTimeBestPB.weight !== sessionBestPB.weight) && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>
                              All-Time Best: {allTimeBestPB.reps} reps × {allTimeBestPB.weight}kg
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedExercise(exercise)}
                        variant={exercise.pbs.length > 0 ? "outline" : "default"}
                      >
                        {exercise.pbs.length > 0 ? (
                          <>
                            Edit
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            PB
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingExerciseStats(exercise.name)}
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Stats
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteExercise(exercise.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                </Card>
              )
            })}
          </div>
        )}

        <NewExerciseDialog open={showNewExercise} onOpenChange={setShowNewExercise} onAdd={addExercise} />

        <NewPBDialog exercise={selectedExercise} onClose={() => setSelectedExercise(null)} onAdd={addPB} />
      </div>
    </main>
  )
}
