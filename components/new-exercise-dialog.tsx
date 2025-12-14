"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Search, Palette } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAllExercises, addExercise, getExerciseColor, setExerciseColor, getAllExercisesWithColors } from "@/lib/exercises"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface NewExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string, color?: string) => void
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

export default function NewExerciseDialog({ open, onOpenChange, onAdd }: NewExerciseDialogProps) {
  const [name, setName] = useState("")
  const [existingExercises, setExistingExercises] = useState<string[]>([])
  const [exercisesWithColors, setExercisesWithColors] = useState<Array<{ name: string; color?: string }>>([])
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined)
  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    if (open) {
      setExistingExercises(getAllExercises())
      setExercisesWithColors(getAllExercisesWithColors())
      setShowCreateNew(false)
      setName("")
      setSelectedColor(undefined)
      setShowColorPicker(false)
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
    setSelectedColor(undefined)
    onOpenChange(false)
  }

  const handleCreateNew = () => {
    if (name.trim()) {
      addExercise(name.trim(), selectedColor)
      onAdd(name.trim(), selectedColor)
      setName("")
      setShowCreateNew(false)
      setSelectedColor(undefined)
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
      <DialogContent className="sm:max-w-[425px]">
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
                <Label>Color (Optional)</Label>
                <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowColorPicker(true)}
                    >
                      <Palette className="w-4 h-4 mr-2" />
                      {selectedColor ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: selectedColor }}
                          />
                          <span>Change Color</span>
                        </div>
                      ) : (
                        "Choose Color"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <div className="grid grid-cols-6 gap-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              setSelectedColor(color)
                              setShowColorPicker(false)
                            }}
                            className="w-8 h-8 rounded-full border-2 border-transparent hover:border-foreground transition-colors"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedColor(undefined)
                          setShowColorPicker(false)
                        }}
                      >
                        Clear Color
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
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

