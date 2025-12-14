"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAllExercises, addExercise, getExerciseColor, setExerciseColor, getAllExercisesWithColors, MUSCLE_GROUP_TYPES, getMuscleGroupColor, getExerciseType } from "@/lib/exercises"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NewExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string, color?: string, type?: string) => void
}

export default function NewExerciseDialog({ open, onOpenChange, onAdd }: NewExerciseDialogProps) {
  const [name, setName] = useState("")
  const [existingExercises, setExistingExercises] = useState<string[]>([])
  const [exercisesWithColors, setExercisesWithColors] = useState<Array<{ name: string; color?: string; type?: string }>>([])
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined)
  const [filterType, setFilterType] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (open) {
      setExistingExercises(getAllExercises())
      setExercisesWithColors(getAllExercisesWithColors())
      setShowCreateNew(false)
      setName("")
      setSelectedType(undefined)
      setFilterType(undefined)
    }
  }, [open])


  const handleSelectExercise = (exerciseName: string) => {
    // Get color and type from library if they exist
    const color = getExerciseColor(exerciseName)
    const type = getExerciseType(exerciseName)
    // Ensure exercise is in library (for backwards compatibility)
    addExercise(exerciseName, color, type)
    onAdd(exerciseName, color, type)
    setName("")
    setShowCreateNew(false)
    setSelectedType(undefined)
    setFilterType(undefined)
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

  const filteredExercisesWithColors = exercisesWithColors.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(name.toLowerCase())
    const matchesType = !filterType || ex.type === filterType
    return matchesSearch && matchesType
  })

  const filteredExercises = filteredExercisesWithColors.map(ex => ex.name)

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

          <div className="space-y-2">
            <Label>Filter by Type</Label>
            <Select 
              value={filterType || "all"} 
              onValueChange={(value) => setFilterType(value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
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
          </div>

          {filteredExercisesWithColors.length > 0 && (
            <div className="border rounded-md max-h-[300px] overflow-y-auto p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                {name.trim() ? "Matching Exercises" : "All Exercises"} ({filteredExercisesWithColors.length})
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
                  <span className="flex-1">{exercise.name}</span>
                  {exercise.type && (
                    <span className="text-xs text-muted-foreground">{exercise.type}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {filteredExercisesWithColors.length === 0 && !showCreateNew && (
            <div className="border rounded-md p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {name.trim() || filterType 
                  ? "No exercises found matching your criteria" 
                  : "No exercises saved yet"}
              </p>
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

