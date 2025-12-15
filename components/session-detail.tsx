"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Plus, Trophy, Trash2, TrendingUp, BarChart3, Bookmark, BookmarkCheck, Pencil, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
  onDelete?: (sessionId: string) => void
  allDays?: WorkoutDay[]
}

export default function SessionDetail({ session, workoutDate, onBack, onUpdate, onDelete, allDays = [] }: SessionDetailProps) {
  const [showNewExercise, setShowNewExercise] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [viewingExerciseStats, setViewingExerciseStats] = useState<string | null>(null)
  const [isTemplateSaved, setIsTemplateSaved] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(session.name)
  const [availableTemplates, setAvailableTemplates] = useState<SessionTemplate[]>([])
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false)
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
    setShowTemplatesDialog(false)
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
    const remainingExercises = session.exercises.filter((e) => e.id !== id)
    
    // If no exercises left, delete the entire session and go back
    if (remainingExercises.length === 0 && onDelete) {
      onDelete(session.id)
      onBack()
      toast({
        title: "Workout cleared",
        description: "Day returned to rest state",
      })
      return
    }
    
    onUpdate({
      ...session,
      exercises: remainingExercises,
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
      <div className="max-w-lg mx-auto p-4 sm:p-6">
        <header className="mb-4 sm:mb-6">
          <Button variant="ghost" className="mb-3 sm:mb-4 -ml-2 h-9" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1.5 sm:mr-2" />
            Back
          </Button>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <Input
                  ref={nameInputRef}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleNameKeyDown}
                  className="text-xl sm:text-2xl font-bold h-auto py-0 px-1 -ml-1 border-primary"
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="group flex items-center gap-2 text-left max-w-full"
                >
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight break-words">{session.name}</h1>
                  <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                </button>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground">
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
                className="flex-shrink-0 h-8 sm:h-9 px-2 sm:px-3"
              >
                {isTemplateSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline text-sm">Unsave</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline text-sm">Save</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </header>

        <div className="flex gap-2 mb-4 sm:mb-6">
          <Button onClick={() => setShowNewExercise(true)} variant="outline" className="flex-1 h-10 sm:h-11 text-sm sm:text-base">
            <Plus className="w-4 h-4 mr-1.5 sm:mr-2" />
            Add Exercise
          </Button>
          {availableTemplates.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setShowTemplatesDialog(true)}
              className="h-10 sm:h-11 px-3 sm:px-4"
            >
              <FolderOpen className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline text-sm sm:text-base">Templates</span>
            </Button>
          )}
        </div>

        {session.exercises.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No exercises yet</p>
            <p className="text-sm text-muted-foreground/70">Add exercises or load a saved template</p>
          </div>
        ) : (
          <div className="space-y-4">
            {session.exercises.map((exercise) => {
              const sessionBestPB = getBestPB(exercise)
              const allTimeBestPB = getAllTimeBestPB(exercise.name)

              const borderColor = exercise.type 
                ? (exercise.color || getMuscleGroupColor(exercise.type))
                : "hsl(var(--muted-foreground) / 0.3)"
              
              return (
                <Card 
                  key={exercise.id} 
                  className="p-3 sm:p-4 border-l-4"
                  style={{ borderLeftColor: borderColor }}
                  title={exercise.type || "Uncategorized"}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg break-words">{exercise.name}</h3>
                          {exercise.type && (
                            <span className="text-xs text-muted-foreground hidden sm:inline">{exercise.type}</span>
                          )}
                        </div>
                      </div>
                      {(sessionBestPB || allTimeBestPB) && (
                        <div className="flex flex-col gap-0.5 mt-1 text-xs sm:text-sm text-muted-foreground">
                          {sessionBestPB && (
                            <span>
                              Session: {sessionBestPB.reps}×{sessionBestPB.weight}kg
                            </span>
                          )}
                          {allTimeBestPB && 
                            (!sessionBestPB || 
                             allTimeBestPB.reps !== sessionBestPB.reps || 
                             allTimeBestPB.weight !== sessionBestPB.weight) && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Best: {allTimeBestPB.reps}×{allTimeBestPB.weight}kg
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedExercise(exercise)}
                        variant={exercise.pbs.length > 0 ? "outline" : "default"}
                        className="h-8 px-2 sm:px-3"
                      >
                        {exercise.pbs.length > 0 ? (
                          <span className="text-xs sm:text-sm">Edit</span>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 sm:mr-1" />
                            <span className="hidden sm:inline text-sm">PB</span>
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingExerciseStats(exercise.name)}
                        className="h-8 px-2 sm:px-3"
                      >
                        <BarChart3 className="w-3.5 h-3.5 sm:mr-1" />
                        <span className="hidden sm:inline text-sm">Stats</span>
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => deleteExercise(exercise.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
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

        {/* Load Template Dialog */}
        <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                Load Template
              </DialogTitle>
              <DialogDescription>
                Choose a saved workout template to load
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
