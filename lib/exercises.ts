import type { WorkoutDay, PersonalBest } from "@/app/page"

export interface GlobalExercise {
  name: string
  createdAt: string
  color?: string
  type?: string
}

export const MUSCLE_GROUP_TYPES = [
  { name: "Chest", color: "#ef4444" }, // red
  { name: "Back", color: "#3b82f6" }, // blue
  { name: "Shoulders", color: "#8b5cf6" }, // purple
  { name: "Biceps", color: "#22c55e" }, // green
  { name: "Triceps", color: "#f97316" }, // orange
  { name: "Legs", color: "#eab308" }, // yellow
  { name: "Core", color: "#06b6d4" }, // cyan
  { name: "Cardio", color: "#ec4899" }, // pink
  { name: "Other", color: "#64748b" }, // slate
] as const

export function getMuscleGroupColor(type: string): string | undefined {
  const group = MUSCLE_GROUP_TYPES.find((g) => g.name.toLowerCase() === type.toLowerCase())
  return group?.color
}

const EXERCISES_STORAGE_KEY = "workout-exercises"

export function getAllExercises(): string[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(EXERCISES_STORAGE_KEY)
  if (stored) {
    const exercises: GlobalExercise[] = JSON.parse(stored)
    return exercises.map((e) => e.name).sort()
  }
  return []
}

export function getAllExercisesWithColors(): GlobalExercise[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(EXERCISES_STORAGE_KEY)
  if (stored) {
    const exercises: GlobalExercise[] = JSON.parse(stored)
    return exercises.sort((a, b) => a.name.localeCompare(b.name))
  }
  return []
}

export function getExerciseColor(exerciseName: string): string | undefined {
  if (typeof window === "undefined") return undefined
  const stored = localStorage.getItem(EXERCISES_STORAGE_KEY)
  if (stored) {
    const exercises: GlobalExercise[] = JSON.parse(stored)
    const exercise = exercises.find(
      (e) => e.name.toLowerCase() === exerciseName.toLowerCase()
    )
    return exercise?.color
  }
  return undefined
}

export function setExerciseColor(exerciseName: string, color: string | undefined): void {
  if (typeof window === "undefined") return
  const stored = localStorage.getItem(EXERCISES_STORAGE_KEY)
  const exercises: GlobalExercise[] = stored ? JSON.parse(stored) : []
  
  const index = exercises.findIndex(
    (e) => e.name.toLowerCase() === exerciseName.toLowerCase()
  )
  
  if (index >= 0) {
    if (color) {
      exercises[index].color = color
    } else {
      // Remove color property
      delete exercises[index].color
    }
  } else if (color) {
    // Exercise doesn't exist, create it with color
    exercises.push({
      name: exerciseName.trim(),
      createdAt: new Date().toISOString(),
      color,
    })
  }
  
  localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(exercises))
}

export function getExerciseType(exerciseName: string): string | undefined {
  if (typeof window === "undefined") return undefined
  const stored = localStorage.getItem(EXERCISES_STORAGE_KEY)
  if (stored) {
    const exercises: GlobalExercise[] = JSON.parse(stored)
    const exercise = exercises.find(
      (e) => e.name.toLowerCase() === exerciseName.toLowerCase()
    )
    return exercise?.type
  }
  return undefined
}

export function addExercise(name: string, color?: string, type?: string) {
  if (typeof window === "undefined") return
  const stored = localStorage.getItem(EXERCISES_STORAGE_KEY)
  const exercises: GlobalExercise[] = stored ? JSON.parse(stored) : []
  
  // Check if exercise already exists (case-insensitive)
  const existingIndex = exercises.findIndex(
    (e) => e.name.toLowerCase() === name.toLowerCase()
  )
  
  // If type is provided, get color from type if color not provided
  const finalColor = color || (type ? getMuscleGroupColor(type) : undefined)
  
  if (existingIndex >= 0) {
    // Update existing exercise with color and type if provided
    if (finalColor) {
      exercises[existingIndex].color = finalColor
    }
    if (type) {
      exercises[existingIndex].type = type
    }
    localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(exercises))
  } else {
    exercises.push({
      name: name.trim(),
      createdAt: new Date().toISOString(),
      color: finalColor,
      type,
    })
    localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(exercises))
  }
}

export function getAllPBsForExercise(
  exerciseName: string,
  days: WorkoutDay[]
): PersonalBest[] {
  const allPBs: PersonalBest[] = []
  
  days.forEach((day) => {
    day.sessions.forEach((session) => {
      session.exercises.forEach((exercise) => {
        if (exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
          allPBs.push(...exercise.pbs)
        }
      })
    })
  })
  
  // Sort by date (newest first)
  return allPBs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getBestPBForExercise(
  exerciseName: string,
  days: WorkoutDay[]
): PersonalBest | null {
  const allPBs = getAllPBsForExercise(exerciseName, days)
  if (allPBs.length === 0) return null
  
  return allPBs.reduce((best, current) => {
    const currentTotal = current.reps * current.weight
    const bestTotal = best.reps * best.weight
    return currentTotal > bestTotal ? current : best
  })
}

export function renameExercise(oldName: string, newName: string, allDays: WorkoutDay[]): { success: boolean; message: string } {
  if (typeof window === "undefined") {
    return { success: false, message: "Cannot rename in server environment" }
  }

  if (!newName.trim()) {
    return { success: false, message: "Exercise name cannot be empty" }
  }

  const trimmedNewName = newName.trim()

  // Check if new name already exists (case-insensitive)
  const stored = localStorage.getItem(EXERCISES_STORAGE_KEY)
  if (stored) {
    const exercises: GlobalExercise[] = JSON.parse(stored)
    const exists = exercises.some(
      (e) => e.name.toLowerCase() === trimmedNewName.toLowerCase() && 
             e.name.toLowerCase() !== oldName.toLowerCase()
    )
    if (exists) {
      return { success: false, message: "An exercise with this name already exists" }
    }
  }

  try {
    // Update exercise library
    if (stored) {
      const exercises: GlobalExercise[] = JSON.parse(stored)
      const index = exercises.findIndex(
        (e) => e.name.toLowerCase() === oldName.toLowerCase()
      )
      if (index >= 0) {
        exercises[index].name = trimmedNewName
        localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(exercises))
      }
    }

    // Update all workout days and sessions
    const updatedDays = allDays.map((day) => ({
      ...day,
      sessions: day.sessions.map((session) => ({
        ...session,
        exercises: session.exercises.map((exercise) => {
          if (exercise.name.toLowerCase() === oldName.toLowerCase()) {
            return {
              ...exercise,
              name: trimmedNewName,
            }
          }
          return exercise
        }),
      })),
    }))

    // Save updated days
    localStorage.setItem("workout-days", JSON.stringify(updatedDays))

    return { success: true, message: "Exercise renamed successfully" }
  } catch (error) {
    return {
      success: false,
      message: `Rename failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

