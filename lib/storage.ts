/**
 * Centralized storage layer for workout data
 * This is the SINGLE SOURCE OF TRUTH for all data operations
 */

import type { WorkoutDay, WorkoutSession, Exercise } from "@/app/page"

const STORAGE_KEY = "workout-days"

// Type guard to validate WorkoutDay structure
function isValidWorkoutDay(day: unknown): day is WorkoutDay {
  if (!day || typeof day !== "object") return false
  const d = day as Record<string, unknown>
  return (
    typeof d.id === "string" &&
    typeof d.date === "string" &&
    Array.isArray(d.sessions)
  )
}

// Type guard to validate WorkoutSession structure
function isValidWorkoutSession(session: unknown): session is WorkoutSession {
  if (!session || typeof session !== "object") return false
  const s = session as Record<string, unknown>
  return (
    typeof s.id === "string" &&
    typeof s.name === "string" &&
    Array.isArray(s.exercises)
  )
}

/**
 * Read all workout days from localStorage
 * Always returns a valid array (empty if no data or invalid)
 */
export function readDays(): WorkoutDay[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.error("[Storage] Invalid data format: expected array")
      return []
    }
    
    // Filter out any invalid entries
    const validDays = parsed.filter(isValidWorkoutDay)
    if (validDays.length !== parsed.length) {
      console.warn("[Storage] Some invalid workout days were filtered out")
      // Auto-repair by saving only valid data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validDays))
    }
    
    return validDays
  } catch (e) {
    console.error("[Storage] Error reading days:", e)
    return []
  }
}

/**
 * Write all workout days to localStorage
 * Returns true if successful
 */
export function writeDays(days: WorkoutDay[]): boolean {
  if (typeof window === "undefined") return false
  
  try {
    // Validate before writing
    const validDays = days.filter(isValidWorkoutDay)
    if (validDays.length !== days.length) {
      console.warn("[Storage] Some invalid days were not saved")
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validDays))
    return true
  } catch (e) {
    console.error("[Storage] Error writing days:", e)
    return false
  }
}

/**
 * Get a specific day by date string (YYYY-MM-DD)
 */
export function getDayByDate(dateStr: string): WorkoutDay | null {
  const days = readDays()
  return days.find((d) => d.date.split("T")[0] === dateStr) || null
}

/**
 * Get a specific day by ID
 */
export function getDayById(dayId: string): WorkoutDay | null {
  const days = readDays()
  return days.find((d) => d.id === dayId) || null
}

/**
 * Find which day contains a specific session
 */
export function findDayBySessionId(sessionId: string): WorkoutDay | null {
  const days = readDays()
  return days.find((d) => d.sessions.some((s) => s.id === sessionId)) || null
}

/**
 * Create or update a day
 * If day with same ID exists, it's replaced
 * If day with same date exists but different ID, the new one replaces it
 */
export function upsertDay(day: WorkoutDay): WorkoutDay[] {
  if (!isValidWorkoutDay(day)) {
    console.error("[Storage] Invalid day structure:", day)
    return readDays()
  }
  
  const days = readDays()
  const dateStr = day.date.split("T")[0]
  
  // Check for existing day by ID or date
  const existingIndexById = days.findIndex((d) => d.id === day.id)
  const existingIndexByDate = days.findIndex((d) => d.date.split("T")[0] === dateStr)
  
  let newDays: WorkoutDay[]
  
  if (existingIndexById >= 0) {
    // Update existing day by ID
    newDays = days.map((d) => (d.id === day.id ? day : d))
  } else if (existingIndexByDate >= 0) {
    // Replace day with same date but different ID
    newDays = days.map((d, i) => (i === existingIndexByDate ? day : d))
  } else {
    // Add new day
    newDays = [...days, day]
  }
  
  // Sort by date descending
  newDays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  writeDays(newDays)
  return newDays
}

/**
 * Delete a day by ID
 */
export function deleteDay(dayId: string): WorkoutDay[] {
  const days = readDays()
  const newDays = days.filter((d) => d.id !== dayId)
  writeDays(newDays)
  return newDays
}

/**
 * Update a session within its day
 * Finds the day containing the session and updates it
 */
export function updateSession(
  updatedSession: WorkoutSession,
  fallbackDay?: WorkoutDay | null
): { success: boolean; days: WorkoutDay[]; updatedDay: WorkoutDay | null } {
  if (!isValidWorkoutSession(updatedSession)) {
    console.error("[Storage] Invalid session structure:", updatedSession)
    return { success: false, days: readDays(), updatedDay: null }
  }
  
  let days = readDays()
  let dayWithSession = days.find((d) => 
    d.sessions.some((s) => s.id === updatedSession.id)
  )
  
  // Fallback: if day not found but we have a reference, use it
  if (!dayWithSession && fallbackDay) {
    const sessionInFallback = fallbackDay.sessions.find((s) => s.id === updatedSession.id)
    if (sessionInFallback) {
      // Add the fallback day to our days array
      const existingIndex = days.findIndex((d) => d.id === fallbackDay.id)
      if (existingIndex >= 0) {
        dayWithSession = days[existingIndex]
      } else {
        // Day doesn't exist, add it
        days = [...days, fallbackDay].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        dayWithSession = fallbackDay
      }
    }
  }
  
  if (!dayWithSession) {
    console.warn("[Storage] Could not find day for session:", updatedSession.id)
    return { success: false, days, updatedDay: null }
  }
  
  const updatedDay: WorkoutDay = {
    ...dayWithSession,
    sessions: dayWithSession.sessions.map((s) => 
      s.id === updatedSession.id ? updatedSession : s
    ),
  }
  
  const newDays = days.map((d) => (d.id === updatedDay.id ? updatedDay : d))
  writeDays(newDays)
  
  return { success: true, days: newDays, updatedDay }
}

/**
 * Delete a session from its day
 * If the day has no more sessions, the day is also removed
 */
export function deleteSession(
  sessionId: string,
  fallbackDay?: WorkoutDay | null
): { days: WorkoutDay[]; dayRemoved: boolean } {
  let days = readDays()
  let dayWithSession = days.find((d) => 
    d.sessions.some((s) => s.id === sessionId)
  )
  
  // Fallback logic
  if (!dayWithSession && fallbackDay) {
    const sessionInFallback = fallbackDay.sessions.find((s) => s.id === sessionId)
    if (sessionInFallback) {
      const existingIndex = days.findIndex((d) => d.id === fallbackDay.id)
      if (existingIndex >= 0) {
        dayWithSession = days[existingIndex]
      } else {
        days = [...days, fallbackDay].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        dayWithSession = fallbackDay
      }
    }
  }
  
  if (!dayWithSession) {
    return { days, dayRemoved: false }
  }
  
  const remainingSessions = dayWithSession.sessions.filter((s) => s.id !== sessionId)
  
  let newDays: WorkoutDay[]
  let dayRemoved = false
  
  if (remainingSessions.length === 0) {
    // Remove the entire day
    newDays = days.filter((d) => d.id !== dayWithSession!.id)
    dayRemoved = true
  } else {
    // Update day with remaining sessions
    const updatedDay = { ...dayWithSession, sessions: remainingSessions }
    newDays = days.map((d) => (d.id === updatedDay.id ? updatedDay : d))
  }
  
  writeDays(newDays)
  return { days: newDays, dayRemoved }
}

/**
 * Ensure a day exists for a given date, creating it if needed
 * Also ensures the day has at least one session
 */
export function ensureDayWithSession(date: Date): { 
  days: WorkoutDay[]
  day: WorkoutDay
  session: WorkoutSession
  created: boolean 
} {
  const dateStr = date.toISOString().split("T")[0]
  const days = readDays()
  let existingDay = days.find((d) => d.date.split("T")[0] === dateStr)
  let created = false
  
  if (!existingDay) {
    // Create new day
    const dateCopy = new Date(date)
    dateCopy.setHours(0, 0, 0, 0)
    existingDay = {
      id: crypto.randomUUID(),
      date: dateCopy.toISOString(),
      sessions: [],
    }
    created = true
  }
  
  // Ensure day has at least one session
  if (existingDay.sessions.length === 0) {
    const newSession: WorkoutSession = {
      id: crypto.randomUUID(),
      name: "Workout",
      exercises: [],
    }
    existingDay = { ...existingDay, sessions: [newSession] }
    created = true
  }
  
  // Save if we created anything
  if (created) {
    const newDays = upsertDay(existingDay)
    return { 
      days: newDays, 
      day: existingDay, 
      session: existingDay.sessions[0],
      created 
    }
  }
  
  return { 
    days, 
    day: existingDay, 
    session: existingDay.sessions[0],
    created 
  }
}

/**
 * Clear all workout data
 */
export function clearAllDays(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}
