"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAllExercises, addExercise } from "@/lib/exercises"

interface NewExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string) => void
}

export default function NewExerciseDialog({ open, onOpenChange, onAdd }: NewExerciseDialogProps) {
  const [name, setName] = useState("")
  const [existingExercises, setExistingExercises] = useState<string[]>([])
  const [showCreateNew, setShowCreateNew] = useState(false)

  useEffect(() => {
    if (open) {
      setExistingExercises(getAllExercises())
      setShowCreateNew(false)
      setName("")
    }
  }, [open])

  const handleSelectExercise = (exerciseName: string) => {
    // Ensure exercise is in library (for backwards compatibility)
    addExercise(exerciseName)
    onAdd(exerciseName)
    setName("")
    setShowCreateNew(false)
    onOpenChange(false)
  }

  const handleCreateNew = () => {
    if (name.trim()) {
      addExercise(name.trim())
      onAdd(name.trim())
      setName("")
      setShowCreateNew(false)
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
                  {filteredExercises.map((exercise) => (
                    <button
                      key={exercise}
                      onClick={() => handleSelectExercise(exercise)}
                      className="w-full text-left px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm"
                    >
                      {exercise}
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
              {existingExercises.slice(0, 10).map((exercise) => (
                <button
                  key={exercise}
                  onClick={() => handleSelectExercise(exercise)}
                  className="w-full text-left px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm"
                >
                  {exercise}
                </button>
              ))}
            </div>
          )}

          {showCreateNew && (
            <Button onClick={handleCreateNew} className="w-full" disabled={!name.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Create "{name.trim()}"
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

