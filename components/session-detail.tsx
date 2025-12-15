"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Plus, Trophy, Trash2, TrendingUp, BarChart3, Bookmark, BookmarkCheck, Pencil, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { WorkoutSession, Exercise, WorkoutDay } from "@/app/page"
import NewExerciseDialog from "./new-exercise-dialog"
import NewPBDialog from "./new-pb-dialog"
import ExerciseStats from "./exercise-stats"
import { getBestPBForExercise, getMuscleGroupColor } from "@/lib/exercises"
import { saveTemplate, templateExists, unsaveTemplate, getAllTemplates, loadTemplate, type SessionTemplate } from "@/lib/session-templates"
import { useToast } from "@/hooks/use-toast"

interface SessionDetailProps {
  session: WorkoutSession
  workoutDate: string
  onBack: () => void
  onUpdate: (session: WorkoutSession) => void
  allDays?: WorkoutDay[]
}

export default function SessionDetail({ session, workoutDate, onBack, onUpdate, allDays = [] }: SessionDetailProps) {
  const [showNewExercise, setShowNewExercise] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [viewingExerciseStats, setViewingExerciseStats] = useState<string | null>(null)
  const [isTemplateSaved, setIsTemplateSaved] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(session.name)
  const [availableTemplates, setAvailableTemplates] = useState<SessionTemplate[]>([])
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setIsTemplateSaved(templateExists(session.name))
    setAvailableTemplates(getAllTemplates())
  }, [session.name])

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  const handleSaveName = () => {
    const trimmedName = editedName.trim()
    if (trimmedName && trimmedName !== session.name) {
      onUpdate({ ...session, name: trimmedName })
    } else {
      setEditedName(session.name)
    }
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName()
    } else if (e.key === "Escape") {
      setEditedName(session.name)
      setIsEditingName(false)
    }
  }

  const handleLoadTemplate = (template: SessionTemplate) => {
    const loadedSession = loadTemplate(template)
    onUpdate({
      ...session,
      name: loadedSession.name,
      exercises: loadedSession.exercises,
    })
    setEditedName(loadedSession.name)
    toast({
      title: "Template loaded",
      description: `"${template.name}" has been loaded`,
    })
  }

  const addExercise = (name: string, color?: string, type?: string) => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name,
      pbs: [],
      color,
      type,
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
              date: workoutDate, // Use the workout day's date, not today
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
              {isEditingName ? (
                <Input
                  ref={nameInputRef}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleNameKeyDown}
                  className="text-2xl font-bold h-auto py-0 px-1 -ml-1 border-primary"
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="group flex items-center gap-2 text-left"
                >
                  <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
                  <Pencil className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </button>
              )}
              <p className="text-sm text-muted-foreground">
                {new Date(workoutDate).toLocaleDateString("en-US", { 
                  weekday: "long", 
                  month: "short", 
                  day: "numeric" 
                })}
              </p>
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
          <div className="space-y-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No exercises yet</p>
              <p className="text-sm text-muted-foreground/70">Add exercises or load a saved template</p>
            </div>
            
            {availableTemplates.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FolderOpen className="w-4 h-4" />
                  <span>Load from saved templates</span>
                </div>
                <div className="grid gap-2">
                  {availableTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleLoadTemplate(template)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium group-hover:text-primary transition-colors">{template.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {template.exercises.length} exercise{template.exercises.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: exercise.type ? (exercise.color || getMuscleGroupColor(exercise.type)) : "hsl(var(--muted-foreground) / 0.3)" }}
                          title={exercise.type || "Uncategorized"}
                        />
                        <h3 className="font-semibold text-lg">{exercise.name}</h3>
                        {exercise.type && (
                          <span className="text-xs text-muted-foreground">{exercise.type}</span>
                        )}
                      </div>
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

        <NewPBDialog 
          exercise={selectedExercise} 
          onClose={() => setSelectedExercise(null)} 
          onAdd={addPB} 
          allTimeBest={selectedExercise ? getAllTimeBestPB(selectedExercise.name) : null}
        />
      </div>
    </main>
  )
}
