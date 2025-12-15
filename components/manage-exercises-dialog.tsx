"use client"

import { useState, useEffect } from "react"
import { Trash2, Tag, Search, Edit2, Check, X, Dumbbell, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  getAllExercisesWithColors,
  addExercise,
  renameExercise,
  MUSCLE_GROUP_TYPES,
  getMuscleGroupColor,
  type GlobalExercise,
} from "@/lib/exercises"
import type { WorkoutDay } from "@/app/page"
import { useToast } from "@/hooks/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ManageExercisesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  allDays?: WorkoutDay[]
  onDaysUpdate?: (days: WorkoutDay[]) => void
}

export default function ManageExercisesDialog({
  open,
  onOpenChange,
  allDays = [],
  onDaysUpdate,
}: ManageExercisesDialogProps) {
  const [exercises, setExercises] = useState<GlobalExercise[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [editingTypeFor, setEditingTypeFor] = useState<string | null>(null)
  const [editingNameFor, setEditingNameFor] = useState<string | null>(null)
  const [editingNameValue, setEditingNameValue] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadExercises()
      setSearchQuery("")
      setEditingTypeFor(null)
      setEditingNameFor(null)
      setEditingNameValue("")
    }
  }, [open])

  const loadExercises = () => {
    setExercises(getAllExercisesWithColors())
  }

  const handleDeleteExercise = (exerciseName: string) => {
    const stored = localStorage.getItem("workout-exercises")
    if (stored) {
      const allExercises: GlobalExercise[] = JSON.parse(stored)
      const filtered = allExercises.filter(
        (e) => e.name.toLowerCase() !== exerciseName.toLowerCase()
      )
      localStorage.setItem("workout-exercises", JSON.stringify(filtered))
      loadExercises()
      setShowDeleteConfirm(null)
      toast({
        title: "Exercise deleted",
        description: `"${exerciseName}" removed from your library`,
      })
    }
  }

  const handleUpdateType = (exerciseName: string, type: string | undefined) => {
    const color = type ? getMuscleGroupColor(type) : undefined
    addExercise(exerciseName, color, type)
    loadExercises()
    setEditingTypeFor(null)
    toast({
      title: type ? "Type updated" : "Type cleared",
      description: type 
        ? `${exerciseName} is now tagged as ${type}`
        : `Type removed from ${exerciseName}`,
    })
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
      
      if (onDaysUpdate) {
        const stored = localStorage.getItem("workout-days")
        if (stored) {
          onDaysUpdate(JSON.parse(stored))
        }
      }
      
      toast({
        title: "Exercise renamed",
        description: `"${oldName}" renamed to "${editingNameValue.trim()}"`,
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
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              Exercise Library
            </DialogTitle>
            <DialogDescription>
              Manage your saved exercises, rename them, or set muscle groups
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11"
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    {searchQuery ? "No exercises found" : "No exercises saved yet"}
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    {searchQuery
                      ? "Try a different search term"
                      : "Exercises will appear here as you add them to workouts"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground px-1">
                    {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""}
                  </p>
                  <div className="space-y-2">
                    {filteredExercises.map((exercise) => (
                      <Card key={exercise.name} className="p-3 sm:p-4">
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
                                  className="h-9 flex-1 text-sm"
                                  autoFocus
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9"
                                  onClick={() => handleSaveEditName(exercise.name)}
                                >
                                  <Check className="w-4 h-4 text-green-500" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9"
                                  onClick={handleCancelEditName}
                                >
                                  <X className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex-1 min-w-0">
                                <span className="font-medium truncate text-sm sm:text-base block">
                                  {exercise.name}
                                </span>
                                {exercise.type && (
                                  <span className="text-xs text-muted-foreground">
                                    {exercise.type}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {editingNameFor !== exercise.name && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9"
                                    onClick={() => handleStartEditName(exercise.name)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Rename</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-9 w-9"
                                    onClick={() => setEditingTypeFor(exercise.name)}
                                  >
                                    <Tag className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Set Type</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 text-destructive"
                                    onClick={() => setShowDeleteConfirm(exercise.name)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm !== null} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Delete Exercise?
              </DialogTitle>
              <DialogDescription>
                This will remove "{showDeleteConfirm}" from your exercise library. Exercises already added to workouts will not be affected.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => showDeleteConfirm && handleDeleteExercise(showDeleteConfirm)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Exercise Type Selection Dialog */}
        <Dialog open={editingTypeFor !== null} onOpenChange={(open) => !open && setEditingTypeFor(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Set Muscle Group
              </DialogTitle>
              <DialogDescription>
                Choose a muscle group for {editingTypeFor}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto">
                {MUSCLE_GROUP_TYPES.map((type) => {
                  const currentExercise = editingTypeFor ? exercises.find(e => e.name === editingTypeFor) : null
                  const isSelected = currentExercise?.type === type.name
                  return (
                    <button
                      key={type.name}
                      onClick={() => {
                        if (editingTypeFor) {
                          handleUpdateType(editingTypeFor, type.name)
                        }
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent hover:border-accent"
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="font-medium">{type.name}</span>
                      {isSelected && (
                        <Check className="w-5 h-5 ml-auto text-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
              {editingTypeFor && exercises.find(e => e.name === editingTypeFor)?.type && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (editingTypeFor) {
                      handleUpdateType(editingTypeFor, undefined)
                    }
                  }}
                >
                  Clear Type
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </Dialog>
    </TooltipProvider>
  )
}
