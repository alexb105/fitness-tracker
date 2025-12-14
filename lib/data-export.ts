/**
 * Complete user data export structure.
 * This includes ALL user data for full device-to-device transfer:
 * 
 * - days: All workout days with complete nested data:
 *   - Sessions (with names)
 *   - Exercises (with names, colors, types, and IDs)
 *   - Personal Bests (reps, weight, dates)
 * 
 * - exercises: Global exercise library:
 *   - Exercise names
 *   - Exercise colors
 *   - Exercise types (muscle groups)
 *   - Creation dates
 * 
 * - templates: Saved session templates:
 *   - Template names
 *   - Exercise lists
 *   - Creation dates
 * 
 * - target: Weekly workout target setting
 */
export interface ExportedData {
  version: string
  exportDate: string
  days: unknown // WorkoutDay[] - includes sessions, exercises, and PBs
  exercises: unknown // GlobalExercise[] - includes names, colors, and types
  templates: unknown // SessionTemplate[] - includes session templates
  target: number // Weekly workout target
}

const STORAGE_KEYS = {
  days: "workout-days",
  exercises: "workout-exercises",
  templates: "workout-session-templates",
  target: "workout-target-sessions-per-week",
}

export function exportAllData(): ExportedData | null {
  if (typeof window === "undefined") return null

  const data: ExportedData = {
    version: "1.0",
    exportDate: new Date().toISOString(),
    days: null,
    exercises: null,
    templates: null,
    target: 3,
  }

  try {
    // Export days (includes all sessions, exercises, and PBs)
    const daysData = localStorage.getItem(STORAGE_KEYS.days)
    if (daysData) {
      const parsed = JSON.parse(daysData)
      // Validate it's an array
      if (Array.isArray(parsed)) {
        data.days = parsed
      }
    }

    // Export exercises (includes names, colors, and types)
    const exercisesData = localStorage.getItem(STORAGE_KEYS.exercises)
    if (exercisesData) {
      const parsed = JSON.parse(exercisesData)
      // Validate it's an array
      if (Array.isArray(parsed)) {
        data.exercises = parsed
      }
    }

    // Export templates (includes session templates)
    const templatesData = localStorage.getItem(STORAGE_KEYS.templates)
    if (templatesData) {
      const parsed = JSON.parse(templatesData)
      // Validate it's an array
      if (Array.isArray(parsed)) {
        data.templates = parsed
      }
    }

    // Export target
    const targetData = localStorage.getItem(STORAGE_KEYS.target)
    if (targetData) {
      const parsed = parseInt(targetData, 10)
      if (!isNaN(parsed) && parsed > 0) {
        data.target = parsed
      }
    }

    return data
  } catch (error) {
    console.error("Error exporting data:", error)
    return null
  }
}

export function downloadData(data: ExportedData): void {
  if (typeof window === "undefined") return

  // Create a comprehensive backup file with all user data
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `workout-tracker-backup-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function importAllData(
  data: ExportedData,
  options: { replace: boolean } = { replace: false }
): { success: boolean; message: string } {
  if (typeof window === "undefined") {
    return { success: false, message: "Cannot import in server environment" }
  }

  try {
    // Validate data structure
    if (!data || typeof data !== "object") {
      return { success: false, message: "Invalid data format" }
    }

    // Validate version (for future compatibility)
    if (data.version && data.version !== "1.0") {
      console.warn(`Importing data from version ${data.version}, current version is 1.0`)
    }

    if (options.replace) {
      // Replace all data - clear existing first
      if (data.days !== null && data.days !== undefined) {
        if (Array.isArray(data.days)) {
          localStorage.setItem(STORAGE_KEYS.days, JSON.stringify(data.days))
        } else {
          return { success: false, message: "Invalid days data format" }
        }
      } else {
        // Clear days if not in import
        localStorage.removeItem(STORAGE_KEYS.days)
      }

      if (data.exercises !== null && data.exercises !== undefined) {
        if (Array.isArray(data.exercises)) {
          localStorage.setItem(STORAGE_KEYS.exercises, JSON.stringify(data.exercises))
        } else {
          return { success: false, message: "Invalid exercises data format" }
        }
      } else {
        localStorage.removeItem(STORAGE_KEYS.exercises)
      }

      if (data.templates !== null && data.templates !== undefined) {
        if (Array.isArray(data.templates)) {
          localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(data.templates))
        } else {
          return { success: false, message: "Invalid templates data format" }
        }
      } else {
        localStorage.removeItem(STORAGE_KEYS.templates)
      }

      if (data.target !== undefined && data.target !== null) {
        if (typeof data.target === "number" && data.target > 0) {
          localStorage.setItem(STORAGE_KEYS.target, data.target.toString())
        }
      } else {
        localStorage.removeItem(STORAGE_KEYS.target)
      }
    } else {
      // Merge data (append new items, keep existing)
      if (data.days && Array.isArray(data.days)) {
        const existingDays = localStorage.getItem(STORAGE_KEYS.days)
        const existing = existingDays ? JSON.parse(existingDays) : []
        const merged = [...data.days, ...existing]
        // Remove duplicates by id
        const unique = merged.filter(
          (day: { id: string }, index: number, self: { id: string }[]) =>
            index === self.findIndex((d) => d.id === day.id)
        )
        localStorage.setItem(STORAGE_KEYS.days, JSON.stringify(unique))
      }

      if (data.exercises && Array.isArray(data.exercises)) {
        const existingExercises = localStorage.getItem(STORAGE_KEYS.exercises)
        const existing = existingExercises ? JSON.parse(existingExercises) : []
        const merged = [...data.exercises, ...existing]
        // Remove duplicates by name (case-insensitive)
        const unique = merged.filter(
          (ex: { name: string }, index: number, self: { name: string }[]) =>
            index ===
            self.findIndex(
              (e) => e.name.toLowerCase() === ex.name.toLowerCase()
            )
        )
        localStorage.setItem(STORAGE_KEYS.exercises, JSON.stringify(unique))
      }

      if (data.templates && Array.isArray(data.templates)) {
        const existingTemplates = localStorage.getItem(STORAGE_KEYS.templates)
        const existing = existingTemplates ? JSON.parse(existingTemplates) : []
        const merged = [...data.templates, ...existing]
        // Remove duplicates by name (case-insensitive)
        const unique = merged.filter(
          (t: { name: string }, index: number, self: { name: string }[]) =>
            index ===
            self.findIndex(
              (template) => template.name.toLowerCase() === t.name.toLowerCase()
            )
        )
        localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(unique))
      }

      if (data.target !== undefined) {
        localStorage.setItem(STORAGE_KEYS.target, data.target.toString())
      }
    }

    return { success: true, message: "Data imported successfully" }
  } catch (error) {
    return {
      success: false,
      message: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export function readFileAsJSON(file: File): Promise<ExportedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content) as ExportedData
        resolve(data)
      } catch (error) {
        reject(new Error("Invalid JSON file"))
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

