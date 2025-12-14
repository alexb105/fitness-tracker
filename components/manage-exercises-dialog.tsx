"use client"

import { useState, useEffect } from "react"
import { Trash2, Palette, Search, Edit2, Check, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card } from "@/components/ui/card"
import {
  getAllExercisesWithColors,
  setExerciseColor,
  renameExercise,
  type GlobalExercise,
} from "@/lib/exercises"
import type { WorkoutDay } from "@/app/page"
import { useToast } from "@/hooks/use-toast"

interface ManageExercisesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  allDays?: WorkoutDay[]
  onDaysUpdate?: (days: WorkoutDay[]) => void
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#64748b", // slate
  "#84cc16", // lime
  "#14b8a6", // teal
  "#f59e0b", // amber
]

export default function ManageExercisesDialog({
  open,
  onOpenChange,
  allDays = [],
  onDaysUpdate,
}: ManageExercisesDialogProps) {
  const [exercises, setExercises] = useState<GlobalExercise[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [editingColorFor, setEditingColorFor] = useState<string | null>(null)
  const [editingNameFor, setEditingNameFor] = useState<string | null>(null)
  const [editingNameValue, setEditingNameValue] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadExercises()
      setSearchQuery("")
      setEditingColorFor(null)
      setEditingNameFor(null)
      setEditingNameValue("")
    }
  }, [open])

  const loadExercises = () => {
    setExercises(getAllExercisesWithColors())
  }

  const handleDeleteExercise = (exerciseName: string) => {
    if (confirm(`Are you sure you want to delete "${exerciseName}" from your exercise library?`)) {
      const stored = localStorage.getItem("workout-exercises")
      if (stored) {
        const allExercises: GlobalExercise[] = JSON.parse(stored)
        const filtered = allExercises.filter(
          (e) => e.name.toLowerCase() !== exerciseName.toLowerCase()
        )
        localStorage.setItem("workout-exercises", JSON.stringify(filtered))
        loadExercises()
      }
    }
  }

  const handleUpdateColor = (exerciseName: string, color: string | undefined) => {
    setExerciseColor(exerciseName, color)
    loadExercises()
    setEditingColorFor(null)
  }

  const handleStartEditName = (exerciseName: string) => {
    setEditingNameFor(exerciseName)
    setEditingNameValue(exerciseName)
  }

  const handleCancelEditName = () => {
    setEditingNameFor(null)
    setEditingNameValue("")
  }

  const handleSaveEditName = (oldName: string) => {
    if (!editingNameValue.trim()) {
      toast({
        title: "Invalid name",
        description: "Exercise name cannot be empty",
        variant: "destructive",
      })
      return
    }

    if (editingNameValue.trim().toLowerCase() === oldName.toLowerCase()) {
      handleCancelEditName()
      return
    }

    const result = renameExercise(oldName, editingNameValue.trim(), allDays)
    
    if (result.success) {
      loadExercises()
      setEditingNameFor(null)
      setEditingNameValue("")
      
      // Reload days if callback provided
      if (onDaysUpdate) {
        const stored = localStorage.getItem("workout-days")
        if (stored) {
          onDaysUpdate(JSON.parse(stored))
        }
      }
      
      toast({
        title: "Exercise renamed",
        description: result.message,
      })
    } else {
      toast({
        title: "Rename failed",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Exercises</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-exercises">Search Exercises</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search-exercises"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No exercises found" : "No exercises saved yet"}
              </p>
              <p className="text-sm text-muted-foreground/70">
                {searchQuery
                  ? "Try a different search term"
                  : "Exercises will appear here as you add them to sessions"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredExercises.map((exercise) => (
                  <Card key={exercise.name} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {exercise.color && (
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: exercise.color }}
                          />
                        )}
                        {editingNameFor === exercise.name ? (
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <Input
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveEditName(exercise.name)
                                } else if (e.key === "Escape") {
                                  handleCancelEditName()
                                }
                              }}
                              className="h-8 flex-1"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleSaveEditName(exercise.name)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={handleCancelEditName}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-medium truncate">{exercise.name}</span>
                        )}
                      </div>
                      {editingNameFor !== exercise.name && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleStartEditName(exercise.name)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        <Popover
                          open={editingColorFor === exercise.name}
                          onOpenChange={(open) =>
                            setEditingColorFor(open ? exercise.name : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Palette className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64">
                            <div className="space-y-2">
                              <Label>Exercise Color</Label>
                              <div className="grid grid-cols-6 gap-2">
                                {PRESET_COLORS.map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => handleUpdateColor(exercise.name, color)}
                                    className="w-8 h-8 rounded-full border-2 border-transparent hover:border-foreground transition-colors"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => handleUpdateColor(exercise.name, undefined)}
                              >
                                Clear Color
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteExercise(exercise.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

