"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAllExercises, addExercise, getExerciseColor, setExerciseColor, getAllExercisesWithColors, MUSCLE_GROUP_TYPES, getMuscleGroupColor } from "@/lib/exercises"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NewExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string, color?: string, type?: string) => void
}

export default function NewExerciseDialog({ open, onOpenChange, onAdd }: NewExerciseDialogProps) {
  const [name, setName] = useState("")
  const [existingExercises, setExistingExercises] = useState<string[]>([])
  const [exercisesWithColors, setExercisesWithColors] = useState<Array<{ name: string; color?: string }>>([])
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (open) {
      setExistingExercises(getAllExercises())
      setExercisesWithColors(getAllExercisesWithColors())
      setShowCreateNew(false)
      setName("")
      setSelectedType(undefined)
    }
  }, [open])


  const handleSelectExercise = (exerciseName: string) => {
    // Get color from library if it exists
    const color = getExerciseColor(exerciseName)
    // Ensure exercise is in library (for backwards compatibility)
    addExercise(exerciseName, color)
    onAdd(exerciseName, color)
    setName("")
    setShowCreateNew(false)
    setSelectedType(undefined)
    onOpenChange(false)
  }

  const handleCreateNew = () => {
    if (name.trim()) {
      const color = selectedType ? getMuscleGroupColor(selectedType) : undefined
      addExercise(name.trim(), color, selectedType)
      onAdd(name.trim(), color, selectedType)
      setName("")
      setShowCreateNew(false)
      setSelectedType(undefined)
      onOpenChange(false)
    }
  }

  const handleInputChange = (value: string) => {
    setName(value)
    // Show create new option if input doesn't match any existing exercise
    const matches = existingExercises.some(
      (ex) => ex.toLowerCase() === value.toLowerCase().trim()
    )
    setShowCreateNew(value.trim().length > 0 && !matches)
  }

  const filteredExercises = existingExercises.filter((ex) =>
    ex.toLowerCase().includes(name.toLowerCase())
  )

  const filteredExercisesWithColors = exercisesWithColors.filter((ex) =>
    ex.name.toLowerCase().includes(name.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exercise-name">Exercise Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="exercise-name"
                placeholder="Search or type to create new..."
                value={name}
                onChange={(e) => handleInputChange(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          {name.trim() && (filteredExercises.length > 0 || !showCreateNew) && (
            <div className="border rounded-md max-h-[200px] overflow-y-auto p-2">
              {filteredExercises.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                    Existing Exercises
                  </p>
                  {filteredExercisesWithColors.map((exercise) => (
                    <button
                      key={exercise.name}
                      onClick={() => handleSelectExercise(exercise.name)}
                      className="w-full text-left px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm flex items-center gap-2"
                    >
                      {exercise.color && (
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: exercise.color }}
                        />
                      )}
                      {exercise.name}
                    </button>
                  ))}
                </div>
              )}
              {filteredExercises.length === 0 && !showCreateNew && (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No exercises found
                </div>
              )}
            </div>
          )}

          {!name.trim() && existingExercises.length > 0 && (
            <div className="border rounded-md max-h-[200px] overflow-y-auto p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                Recent Exercises
              </p>
              {exercisesWithColors.slice(0, 10).map((exercise) => (
                <button
                  key={exercise.name}
                  onClick={() => handleSelectExercise(exercise.name)}
                  className="w-full text-left px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm flex items-center gap-2"
                >
                  {exercise.color && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: exercise.color }}
                    />
                  )}
                  {exercise.name}
                </button>
              ))}
            </div>
          )}

          {showCreateNew && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Type (Optional)</Label>
                <Select value={selectedType} onValueChange={(value) => setSelectedType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select muscle group" />
                  </SelectTrigger>
                  <SelectContent>
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
                {selectedType && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedType(undefined)}
                  >
                    Clear Type
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  Selecting a type will automatically set the color
                </p>
              </div>
              <Button onClick={handleCreateNew} className="w-full" disabled={!name.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Create "{name.trim()}"
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

