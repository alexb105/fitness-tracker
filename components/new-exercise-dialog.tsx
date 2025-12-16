"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Plus, Search, Dumbbell, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAllExercisesWithColors, addExercise, getMuscleGroupColor, MUSCLE_GROUP_TYPES, type GlobalExercise } from "@/lib/exercises"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NewExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string, color?: string, type?: string) => void
}

// Popular exercises to suggest for new users
const SUGGESTED_EXERCISES = [
  { name: "Bench Press", type: "Chest" },
  { name: "Squat", type: "Legs" },
  { name: "Deadlift", type: "Back" },
  { name: "Overhead Press", type: "Shoulders" },
  { name: "Barbell Row", type: "Back" },
  { name: "Pull-ups", type: "Back" },
]

export default function NewExerciseDialog({ open, onOpenChange, onAdd }: NewExerciseDialogProps) {
  const [name, setName] = useState("")
  const [exercisesWithColors, setExercisesWithColors] = useState<GlobalExercise[]>([])
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [filterType, setFilterType] = useState<string | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setExercisesWithColors(getAllExercisesWithColors())
      setShowCreateNew(false)
      setName("")
      setFilterType(undefined)
    }
  }, [open])

  const handleSelectExercise = (exerciseName: string, exerciseType?: string) => {
    const color = exerciseType ? getMuscleGroupColor(exerciseType) : undefined
    addExercise(exerciseName, color, exerciseType)
    onAdd(exerciseName, color, exerciseType)
    resetAndClose()
  }

  const handleCreateNew = () => {
    if (name.trim()) {
      const color = filterType ? getMuscleGroupColor(filterType) : undefined
      addExercise(name.trim(), color, filterType)
      onAdd(name.trim(), color, filterType)
      resetAndClose()
    }
  }

  const resetAndClose = () => {
    setName("")
    setShowCreateNew(false)
    setFilterType(undefined)
    onOpenChange(false)
  }

  const handleInputChange = (value: string) => {
    setName(value)
    const matches = exercisesWithColors.some(
      (ex) => ex.name.toLowerCase() === value.toLowerCase().trim()
    )
    setShowCreateNew(value.trim().length > 0 && !matches)
  }

  const filteredExercises = exercisesWithColors.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(name.toLowerCase())
    const matchesType = !filterType || ex.type === filterType
    return matchesSearch && matchesType
  })

  // Show suggestions when user has no exercises
  const showSuggestions = exercisesWithColors.length === 0 && !name.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Add Exercise
          </DialogTitle>
          <DialogDescription>
            Search your exercises or create a new one
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input + Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search or type to create..."
                value={name}
                onChange={(e) => handleInputChange(e.target.value)}
                className="pl-9 pr-9 h-11 min-h-[44px]"
              />
              {name && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    setName("")
                    setShowCreateNew(false)
                    inputRef.current?.focus()
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter by Type - only show when there are exercises */}
            {exercisesWithColors.length > 0 && (
              <Select 
                value={filterType || "all"} 
                onValueChange={(value) => setFilterType(value === "all" ? undefined : value)}
              >
                <SelectTrigger className="h-11 w-[130px] min-h-[44px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {MUSCLE_GROUP_TYPES.map((type) => (
                    <SelectItem key={type.name} value={type.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Exercise List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Suggestions for new users */}
            {showSuggestions && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Get started with popular exercises:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTED_EXERCISES.map((exercise) => (
                    <button
                      key={exercise.name}
                      onClick={() => handleSelectExercise(exercise.name, exercise.type)}
                      className="text-left p-3 rounded-lg border hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getMuscleGroupColor(exercise.type) }}
                      />
                      <span className="text-sm font-medium truncate">{exercise.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Or type above to create your own exercise
                </p>
              </div>
            )}

            {/* Existing Exercises */}
            {filteredExercises.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-1 mb-2">
                  {name.trim() ? "Matching" : "Your"} Exercises ({filteredExercises.length})
                </p>
                <div className="space-y-1 max-h-[250px] overflow-y-auto">
                  {filteredExercises.map((exercise) => (
                    <button
                      key={exercise.name}
                      onClick={() => handleSelectExercise(exercise.name, exercise.type)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-accent transition-colors flex items-center gap-2 group"
                    >
                      {exercise.color && (
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: exercise.color }}
                        />
                      )}
                      <span className="flex-1 font-medium">{exercise.name}</span>
                      {exercise.type && (
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                          {exercise.type}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredExercises.length === 0 && !showCreateNew && !showSuggestions && (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {name.trim() || filterType 
                    ? "No exercises found" 
                    : "No exercises saved yet"}
                </p>
                {(name.trim() || filterType) && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Try a different search or clear filters
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Create New Exercise */}
          {showCreateNew && (
            <div className="pt-3 border-t animate-in fade-in slide-in-from-bottom-2 duration-200">
              <Button onClick={handleCreateNew} className="w-full h-11" disabled={!name.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Create "{name.trim()}"
                {filterType && (
                  <span className="ml-2 inline-flex items-center gap-1.5 text-xs opacity-80">
                    <span>·</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getMuscleGroupColor(filterType) }}
                    />
                    {filterType}
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
