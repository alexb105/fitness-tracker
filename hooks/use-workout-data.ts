"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { WorkoutDay, WorkoutSession } from "@/app/page"
import * as Storage from "@/lib/storage"

interface UseWorkoutDataReturn {
  // Data
  days: WorkoutDay[]
  selectedDay: WorkoutDay | null
  selectedSession: WorkoutSession | null
  
  // Actions
  openWorkoutForDate: (date: Date) => void
  closeWorkout: () => void
  updateSession: (session: WorkoutSession) => void
  deleteSession: (sessionId: string) => void
  deleteDay: (dayId: string) => void
  refreshData: () => void
  setDays: (days: WorkoutDay[]) => void
}

/**
 * Custom hook for managing workout data
 * Uses localStorage as the single source of truth
 * Prevents race conditions and data loss
 */
export function useWorkoutData(): UseWorkoutDataReturn {
  const [days, setDaysState] = useState<WorkoutDay[]>([])
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null)
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null)
  
  // Ref to track the current selected day/session for use in callbacks
  // This avoids stale closure issues
  const selectedDayRef = useRef<WorkoutDay | null>(null)
  const selectedSessionRef = useRef<WorkoutSession | null>(null)
  
  // Track if we've done initial load
  const hasInitializedRef = useRef(false)
  
  // Keep refs in sync with state
  useEffect(() => {
    selectedDayRef.current = selectedDay
  }, [selectedDay])
  
  useEffect(() => {
    selectedSessionRef.current = selectedSession
  }, [selectedSession])
  
  // Sync state with localStorage (used for initial load and when returning from background)
  const syncFromStorage = useCallback(() => {
    const data = Storage.readDays()
    setDaysState(data)
    
    // Update selected day/session if they still exist
    if (selectedDayRef.current) {
      const updatedDay = data.find((d) => d.id === selectedDayRef.current!.id)
      if (updatedDay) {
        setSelectedDay(updatedDay)
        if (selectedSessionRef.current) {
          const updatedSession = updatedDay.sessions.find(
            (s) => s.id === selectedSessionRef.current!.id
          )
          if (updatedSession) {
            setSelectedSession(updatedSession)
          }
          // Don't clear session if not found - user might be in the middle of editing
        }
      }
      // Don't clear day/session if not found - prevents data loss on background return
    }
  }, [])
  
  // Load initial data from localStorage
  useEffect(() => {
    if (!hasInitializedRef.current) {
      syncFromStorage()
      hasInitializedRef.current = true
    }
  }, [syncFromStorage])
  
  // Handle visibility change - sync when app returns from background
  // This prevents data loss when the app is minimized and restored on mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // App became visible again - sync state with localStorage
        // This ensures we have the latest data without losing current state
        syncFromStorage()
      }
    }
    
    // Also handle page show event for iOS Safari bfcache
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache - resync
        syncFromStorage()
      }
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("pageshow", handlePageShow)
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("pageshow", handlePageShow)
    }
  }, [syncFromStorage])
  
  /**
   * Refresh data from localStorage
   * Use this after external changes (import, etc.)
   * This version clears selection if data no longer exists (for explicit refresh calls)
   */
  const refreshData = useCallback(() => {
    const data = Storage.readDays()
    setDaysState(data)
    
    // Update selected day/session if they still exist
    if (selectedDayRef.current) {
      const updatedDay = data.find((d) => d.id === selectedDayRef.current!.id)
      if (updatedDay) {
        setSelectedDay(updatedDay)
        if (selectedSessionRef.current) {
          const updatedSession = updatedDay.sessions.find(
            (s) => s.id === selectedSessionRef.current!.id
          )
          setSelectedSession(updatedSession || null)
        }
      } else {
        // Day no longer exists - clear selection (explicit refresh)
        setSelectedDay(null)
        setSelectedSession(null)
      }
    }
  }, [])
  
  /**
   * Directly set days (used for import functionality)
   */
  const setDays = useCallback((newDays: WorkoutDay[]) => {
    Storage.writeDays(newDays)
    setDaysState(newDays)
  }, [])
  
  /**
   * Open a workout for a specific date
   * Creates the day and session if they don't exist
   */
  const openWorkoutForDate = useCallback((date: Date) => {
    const result = Storage.ensureDayWithSession(date)
    
    setDaysState(result.days)
    setSelectedDay(result.day)
    setSelectedSession(result.session)
  }, [])
  
  /**
   * Close the current workout view
   */
  const closeWorkout = useCallback(() => {
    setSelectedSession(null)
    setSelectedDay(null)
  }, [])
  
  /**
   * Update a session
   * Automatically finds the day and saves to localStorage
   */
  const updateSession = useCallback((updatedSession: WorkoutSession) => {
    const result = Storage.updateSession(updatedSession, selectedDayRef.current)
    
    if (result.success) {
      setDaysState(result.days)
      
      // Update selected session if it's the one being updated
      if (selectedSessionRef.current?.id === updatedSession.id) {
        setSelectedSession(updatedSession)
      }
      
      // Update selected day if it contains this session
      if (result.updatedDay && selectedDayRef.current?.id === result.updatedDay.id) {
        setSelectedDay(result.updatedDay)
      }
    } else {
      console.error("[useWorkoutData] Failed to update session")
    }
  }, [])
  
  /**
   * Delete a session
   * Removes the day if it has no more sessions
   */
  const deleteSession = useCallback((sessionId: string) => {
    const result = Storage.deleteSession(sessionId, selectedDayRef.current)
    
    setDaysState(result.days)
    
    // Clear selection if the deleted session was selected
    if (selectedSessionRef.current?.id === sessionId) {
      setSelectedSession(null)
      if (result.dayRemoved) {
        setSelectedDay(null)
      }
    }
  }, [])
  
  /**
   * Delete an entire day
   */
  const deleteDay = useCallback((dayId: string) => {
    const newDays = Storage.deleteDay(dayId)
    setDaysState(newDays)
    
    // Clear selection if the deleted day was selected
    if (selectedDayRef.current?.id === dayId) {
      setSelectedDay(null)
      setSelectedSession(null)
    }
  }, [])
  
  return {
    days,
    selectedDay,
    selectedSession,
    openWorkoutForDate,
    closeWorkout,
    updateSession,
    deleteSession,
    deleteDay,
    refreshData,
    setDays,
  }
}

