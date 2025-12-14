import type { WorkoutSession, Exercise } from "@/app/page"

export interface SessionTemplate {
  id: string
  name: string
  exercises: Omit<Exercise, "pbs">[] // Exercises without PBs
  createdAt: string
}

const TEMPLATES_STORAGE_KEY = "workout-session-templates"

export function getAllTemplates(): SessionTemplate[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  return []
}

export function saveTemplate(session: WorkoutSession): { saved: boolean; isUpdate: boolean } {
  if (typeof window === "undefined") return { saved: false, isUpdate: false }
  
  const templates = getAllTemplates()
  
  // Check if template with same name already exists
  const existingIndex = templates.findIndex(
    (t) => t.name.toLowerCase() === session.name.toLowerCase()
  )
  
  // Create template without PBs
  const template: SessionTemplate = {
    id: existingIndex >= 0 ? templates[existingIndex].id : crypto.randomUUID(),
    name: session.name,
    exercises: session.exercises.map((ex) => ({
      id: crypto.randomUUID(), // New ID for template
      name: ex.name,
    })),
    createdAt: existingIndex >= 0 ? templates[existingIndex].createdAt : new Date().toISOString(),
  }
  
  if (existingIndex >= 0) {
    // Update existing template
    templates[existingIndex] = template
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
    return { saved: true, isUpdate: true }
  } else {
    // Create new template
    templates.push(template)
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
    return { saved: true, isUpdate: false }
  }
}

export function templateExists(sessionName: string): boolean {
  if (typeof window === "undefined") return false
  const templates = getAllTemplates()
  return templates.some((t) => t.name.toLowerCase() === sessionName.toLowerCase())
}

export function getTemplateIdByName(sessionName: string): string | null {
  if (typeof window === "undefined") return null
  const templates = getAllTemplates()
  const template = templates.find((t) => t.name.toLowerCase() === sessionName.toLowerCase())
  return template?.id || null
}

export function unsaveTemplate(sessionName: string): boolean {
  if (typeof window === "undefined") return false
  const templateId = getTemplateIdByName(sessionName)
  if (templateId) {
    deleteTemplate(templateId)
    return true
  }
  return false
}

export function deleteTemplate(templateId: string): void {
  if (typeof window === "undefined") return
  
  const templates = getAllTemplates()
  const filtered = templates.filter((t) => t.id !== templateId)
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(filtered))
}

export function loadTemplate(template: SessionTemplate): WorkoutSession {
  // Convert template to a new session with fresh IDs and empty PBs
  return {
    id: crypto.randomUUID(),
    name: template.name,
    exercises: template.exercises.map((ex) => ({
      id: crypto.randomUUID(),
      name: ex.name,
      pbs: [],
    })),
  }
}

