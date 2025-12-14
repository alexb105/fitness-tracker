import type { WorkoutDay, PersonalBest } from "@/app/page"

export interface GlobalExercise {
  name: string
  createdAt: string
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

export function addExercise(name: string) {
  if (typeof window === "undefined") return
  const stored = localStorage.getItem(EXERCISES_STORAGE_KEY)
  const exercises: GlobalExercise[] = stored ? JSON.parse(stored) : []
  
  // Check if exercise already exists (case-insensitive)
  const exists = exercises.some(
    (e) => e.name.toLowerCase() === name.toLowerCase()
  )
  
  if (!exists) {
    exercises.push({
      name: name.trim(),
      createdAt: new Date().toISOString(),
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

