"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Dumbbell, ChevronRight, Trash2, Target, Flame, Settings, Download, Upload, List, ChevronLeft, Calendar, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SessionDetail from "@/components/session-detail"
import ManageExercisesDialog from "@/components/manage-exercises-dialog"
import { getTargetSessionsPerWeek, setTargetSessionsPerWeek, calculateStreak } from "@/lib/workout-settings"
import { exportAllData, downloadData, importAllData, readFileAsJSON } from "@/lib/data-export"
import { useToast } from "@/hooks/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface PersonalBest {
  id: string
  reps: number
  weight: number
  date: string
}

export interface Exercise {
  id: string
  name: string
  pbs: PersonalBest[]
  color?: string
  type?: string
}

export interface WorkoutSession {
  id: string
  name: string
  exercises: Exercise[]
}

export interface WorkoutDay {
  id: string
  date: string
  sessions: WorkoutSession[]
}

const STORAGE_KEY = "workout-days"

export default function Home() {
  const [days, setDays] = useState<WorkoutDay[]>([])
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null)
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null)
  const [targetSessions, setTargetSessions] = useState<number>(3)
  const [showTargetDialog, setShowTargetDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showManageExercises, setShowManageExercises] = useState(false)
  const [showClearDataDialog, setShowClearDataDialog] = useState(false)
  const [tempTarget, setTempTarget] = useState<string>("3")
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressScrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load data on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setDays(JSON.parse(stored))
      } catch (e) {
        console.error("Error parsing workout days:", e)
      }
    }
    setTargetSessions(getTargetSessionsPerWeek())
  }, [])

  // Auto-scroll progress to show current week (bottom)
  useEffect(() => {
    if (progressScrollRef.current && days.length > 0) {
      progressScrollRef.current.scrollTop = progressScrollRef.current.scrollHeight
    }
  }, [days.length])

  // Save days helper
  const saveDays = useCallback((newDays: WorkoutDay[]) => {
    setDays(newDays)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDays))
  }, [])

  // Unified function to open a workout for a specific date
  const openWorkoutForDate = useCallback((date: Date) => {
    // Always read fresh from localStorage to avoid stale closure issues
    const stored = localStorage.getItem(STORAGE_KEY)
    let currentDays: WorkoutDay[] = []
    if (stored) {
      try {
        currentDays = JSON.parse(stored)
      } catch (e) {
        console.error("Error parsing stored days:", e)
      }
    }
    
    const dateStr = date.toISOString().split("T")[0]
    let day = currentDays.find((d) => d.date.split("T")[0] === dateStr)
    let needsSave = false

    // Create day if doesn't exist
    if (!day) {
      const dateCopy = new Date(date)
      dateCopy.setHours(0, 0, 0, 0)
      day = {
        id: crypto.randomUUID(),
        date: dateCopy.toISOString(),
        sessions: [],
      }
      currentDays = [...currentDays, day].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      needsSave = true
    }

    // Create session if empty
    if (day.sessions.length === 0) {
      const newSession: WorkoutSession = {
        id: crypto.randomUUID(),
        name: "Workout",
        exercises: [],
      }
      
      day = { ...day, sessions: [newSession] }
      currentDays = currentDays.map((d) => (d.id === day!.id ? day! : d))
      needsSave = true
    }

    // Only save if we actually made changes
    if (needsSave) {
      saveDays(currentDays)
    } else {
      // Just sync state with localStorage without re-saving
      setDays(currentDays)
    }
    
    setSelectedDay(day)
    setSelectedSession(day.sessions[0])
  }, [saveDays])

  const getWeekDays = (weekStart: Date): Date[] => {
    const weekDays: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      weekDays.push(date)
    }
    return weekDays
  }

  const getDayForDate = (date: Date): WorkoutDay | null => {
    const dateStr = date.toISOString().split("T")[0]
    return days.find((d) => d.date.split("T")[0] === dateStr) || null
  }

  const goToPreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(currentWeekStart.getDate() - 7)
    setCurrentWeekStart(newWeekStart)
  }

  const goToNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(currentWeekStart.getDate() + 7)
    setCurrentWeekStart(newWeekStart)
  }

  const goToCurrentWeek = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    setCurrentWeekStart(monday)
  }

  const deleteDay = (id: string) => {
    saveDays(days.filter((d) => d.id !== id))
  }

  const updateSession = (updatedSession: WorkoutSession) => {
    setDays((currentDays) => {
      const dayWithSession = currentDays.find((d) => 
        d.sessions.some((s) => s.id === updatedSession.id)
      )
      
      if (!dayWithSession) {
        console.warn("Could not find day for session:", updatedSession.id)
        return currentDays
      }

      const updatedDay = {
        ...dayWithSession,
        sessions: dayWithSession.sessions.map((s) => 
          s.id === updatedSession.id ? updatedSession : s
        ),
      }

      const newDays = currentDays.map((d) => 
        d.id === updatedDay.id ? updatedDay : d
      )

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDays))
      return newDays
    })

    setSelectedSession((current) => 
      current?.id === updatedSession.id ? updatedSession : current
    )

    setSelectedDay((current) => {
      if (current) {
        const sessionInDay = current.sessions.find((s) => s.id === updatedSession.id)
        if (sessionInDay) {
          return {
            ...current,
            sessions: current.sessions.map((s) => 
              s.id === updatedSession.id ? updatedSession : s
            ),
          }
        }
      }
      return current
    })
  }

  const deleteSession = (sessionId: string) => {
    setDays((currentDays) => {
      const dayWithSession = currentDays.find((d) => 
        d.sessions.some((s) => s.id === sessionId)
      )
      
      if (!dayWithSession) {
        return currentDays
      }

      const remainingSessions = dayWithSession.sessions.filter((s) => s.id !== sessionId)
      
      // If no sessions left, remove the day entirely
      if (remainingSessions.length === 0) {
        const newDays = currentDays.filter((d) => d.id !== dayWithSession.id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDays))
        return newDays
      }

      // Otherwise, update the day with remaining sessions
      const updatedDay = {
        ...dayWithSession,
        sessions: remainingSessions,
      }

      const newDays = currentDays.map((d) => 
        d.id === updatedDay.id ? updatedDay : d
      )

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDays))
      return newDays
    })
  }

  const getTotalExercises = (day: WorkoutDay) => {
    return day.sessions.reduce((total, session) => total + session.exercises.length, 0)
  }

  // Get all weeks data from first workout to current week
  const getAllWeeksData = () => {
    if (days.length === 0) return []
    
    const weeks: { weekLabel: string; workouts: number; metTarget: boolean; isCurrentWeek: boolean }[] = []
    const now = new Date()
    
    // Find the earliest workout date
    const earliestDate = days.reduce((earliest, day) => {
      const dayDate = new Date(day.date)
      return dayDate < earliest ? dayDate : earliest
    }, new Date(days[0].date))
    
    // Get the Monday of the earliest workout week
    const firstWeekStart = new Date(earliestDate)
    const dayOfWeek = firstWeekStart.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    firstWeekStart.setDate(firstWeekStart.getDate() + diff)
    firstWeekStart.setHours(0, 0, 0, 0)
    
    // Get current week's Monday
    const currentWeekStart = new Date(now)
    const currentDayOfWeek = currentWeekStart.getDay()
    const currentDiff = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek
    currentWeekStart.setDate(currentWeekStart.getDate() + currentDiff)
    currentWeekStart.setHours(0, 0, 0, 0)
    
    // Generate all weeks from first workout to current week
    let weekStart = new Date(firstWeekStart)
    while (weekStart <= currentWeekStart) {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      const workoutsInWeek = days.filter((day) => {
        const dayDate = new Date(day.date)
        // Only count workouts that are not in the future
        return dayDate >= weekStart && dayDate <= weekEnd && dayDate <= now
      }).length
      
      const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime()
      
      weeks.push({
        weekLabel: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        workouts: workoutsInWeek,
        metTarget: workoutsInWeek >= targetSessions,
        isCurrentWeek,
      })
      
      // Move to next week
      weekStart = new Date(weekStart)
      weekStart.setDate(weekStart.getDate() + 7)
    }
    
    return weeks
  }

  const allWeeks = getAllWeeksData()
  const now = new Date()
  now.setHours(23, 59, 59, 999) // End of today
  const totalWorkouts = days.filter((day) => {
    const dayDate = new Date(day.date)
    return dayDate <= now
  }).length

  const { currentStreak, longestStreak } = calculateStreak(days, targetSessions)

  const handleSaveTarget = () => {
    const target = parseInt(tempTarget, 10)
    if (target >= 1 && target <= 7) {
      setTargetSessionsPerWeek(target)
      setTargetSessions(target)
      setShowTargetDialog(false)
      toast({
        title: "Target updated",
        description: `Weekly target set to ${target} sessions`,
      })
    }
  }

  const handleExportData = () => {
    const data = exportAllData()
    if (data) {
      downloadData(data)
      const daysCount = Array.isArray(data.days) ? data.days.length : 0
      const exercisesCount = Array.isArray(data.exercises) ? data.exercises.length : 0
      const templatesCount = Array.isArray(data.templates) ? data.templates.length : 0
      toast({
        title: "Backup downloaded",
        description: `Exported ${daysCount} workouts, ${exercisesCount} exercises, ${templatesCount} templates`,
      })
    } else {
      toast({
        title: "Export failed",
        description: "Unable to export data",
        variant: "destructive",
      })
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await readFileAsJSON(file)
      
      if (!confirm("This will replace all your current data. Are you sure you want to continue?")) {
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      const result = importAllData(data, { replace: true })
      
      if (result.success) {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) setDays(JSON.parse(stored))
        setTargetSessions(getTargetSessionsPerWeek())
        setSelectedSession(null)
        setSelectedDay(null)
        
        const daysCount = Array.isArray(data.days) ? data.days.length : 0
        const exercisesCount = Array.isArray(data.exercises) ? data.exercises.length : 0
        const templatesCount = Array.isArray(data.templates) ? data.templates.length : 0
        toast({
          title: "Data restored successfully",
          description: `Imported ${daysCount} workouts, ${exercisesCount} exercises, ${templatesCount} templates`,
        })
      } else {
        toast({
          title: "Import failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Invalid file format",
        variant: "destructive",
      })
    }

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleClearAllData = () => {
    // Clear all localStorage data
    localStorage.removeItem("workout-days")
    localStorage.removeItem("workout-exercises")
    localStorage.removeItem("workout-session-templates")
    localStorage.removeItem("workout-target-sessions-per-week")
    
    // Reset state
    setDays([])
    setTargetSessions(3)
    setSelectedSession(null)
    setSelectedDay(null)
    setShowSettingsDialog(false)
    setShowClearDataDialog(false)
    
    toast({
      title: "All data cleared",
      description: "Your app has been reset to a fresh start",
    })
  }

  // Check if current week is being viewed
  const isCurrentWeek = () => {
    const today = new Date()
    const todayWeekStart = new Date(today)
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    todayWeekStart.setDate(diff)
    todayWeekStart.setHours(0, 0, 0, 0)
    return currentWeekStart.getTime() === todayWeekStart.getTime()
  }

  // Show session detail if selected
  if (selectedSession && selectedDay) {
    return (
      <SessionDetail
        key={`${selectedSession.id}-${selectedSession.exercises.length}`}
        session={selectedSession}
        workoutDate={selectedDay.date}
        onBack={() => {
          setSelectedSession(null)
          setSelectedDay(null)
        }}
        onUpdate={updateSession}
        onDelete={deleteSession}
        allDays={days}
      />
    )
  }

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-lg mx-auto p-4 sm:p-6">
          {/* Header */}
          <header className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                <span className="text-[rgba(200,0,255,1)]">PB</span>
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  Track
                </span>
                <span className="ml-1.5 text-xs sm:text-sm font-bold px-1.5 py-0.5 bg-[rgba(184,24,205,0.31)] text-primary rounded-md border border-primary/30 align-middle">
                  PRO
                </span>
              </h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-9 sm:w-9"
                    onClick={() => setShowSettingsDialog(true)}
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">Track your daily workouts and PBs</p>
          </header>

          {/* Streak Card */}
          {currentStreak > 0 && (
            <Card className="p-4 sm:p-5 mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Flame className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {currentStreak} week{currentStreak !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-muted-foreground">Target: {targetSessions}/week</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Best: {longestStreak} weeks</p>
                </div>
              </div>
            </Card>
          )}

          {/* First Time User Prompt */}
          {days.length === 0 && (
            <Card className="p-6 mb-6 border-dashed border-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Welcome to PBTrackPro!</h3>
                <p className="text-sm text-muted-foreground">
                  Tap any day below to start tracking your workouts
                </p>
              </div>
            </Card>
          )}

          {/* Weekly Progress */}
          {days.length > 0 && (
            <Card className="p-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold">Your Progress</h2>
                  <p className="text-xs text-muted-foreground">
                    {totalWorkouts} workout{totalWorkouts !== 1 ? "s" : ""} • Target: {targetSessions}/week
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setTempTarget(targetSessions.toString())
                        setShowTargetDialog(true)
                      }}
                    >
                      <Target className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Set Weekly Target</TooltipContent>
                </Tooltip>
              </div>
              
              {/* Scrollable weeks visualization */}
              <div ref={progressScrollRef} className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                {allWeeks.map((week, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className={`text-xs w-16 flex-shrink-0 ${week.isCurrentWeek ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {week.isCurrentWeek ? 'This week' : week.weekLabel}
                    </span>
                    <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden relative">
                      {/* Target indicator */}
                      <div 
                        className="absolute top-0 bottom-0 w-px bg-primary/40"
                        style={{ left: `${Math.min((targetSessions / 7) * 100, 100)}%` }}
                      />
                      {/* Progress bar */}
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          week.metTarget 
                            ? 'bg-primary' 
                            : week.workouts > 0 
                              ? 'bg-primary/60' 
                              : ''
                        }`}
                        style={{ 
                          width: week.workouts > 0 ? `${Math.min((week.workouts / 7) * 100, 100)}%` : '0%'
                        }}
                      />
                    </div>
                    <span className={`text-xs w-5 text-right font-medium flex-shrink-0 ${
                      week.metTarget ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {week.workouts}
                    </span>
                    {week.metTarget && (
                      <span className="text-primary text-xs flex-shrink-0">✓</span>
                    )}
                  </div>
                ))}
              </div>
              {allWeeks.length > 6 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Scroll to see all {allWeeks.length} weeks
                </p>
              )}
            </Card>
          )}

          {/* Week View */}
          <Card className="p-5 sm:p-6 mb-6 border-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="mb-5 pb-4 border-b">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-xl sm:text-2xl">Week View</h2>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                {currentWeekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                {" – "}
                {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            
            <div className="space-y-2">
              {getWeekDays(currentWeekStart).map((date, index) => {
                const day = getDayForDate(date)
                const isToday = date.toDateString() === new Date().toDateString()
                const isPast = date < new Date() && !isToday
                const isFuture = date > new Date()
                const hasSession = day && day.sessions.length > 0

                return (
                  <Card
                    key={index}
                    className={`p-4 sm:p-5 cursor-pointer transition-all duration-200 group hover:scale-[1.01] active:scale-[0.99] ${
                      isToday 
                        ? "border-primary border-2 bg-primary/5 shadow-md shadow-primary/10" 
                        : "hover:bg-accent/50 active:bg-accent/70"
                    } ${isPast ? "opacity-75" : ""} ${
                      isFuture && hasSession ? "bg-primary/5 border-primary/20" : ""
                    }`}
                    onClick={() => openWorkoutForDate(date)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-sm sm:text-base">
                            {date.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </h3>
                          {isToday && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium animate-pulse">
                              Today
                            </span>
                          )}
                        </div>
                        {day && day.sessions.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                              {getTotalExercises(day)}
                            </span>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {day.sessions[0].name}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground/60 italic">
                            {isToday ? "Tap to start a workout" : isFuture ? "Plan ahead" : "Rest day"}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {day && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteDay(day.id)
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Workout</TooltipContent>
                          </Tooltip>
                        )}
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Week Navigation */}
            <div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={goToPreviousWeek}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous Week</TooltipContent>
              </Tooltip>
              <Button
                variant={isCurrentWeek() ? "default" : "outline"}
                size="sm"
                className="h-10 px-6 font-semibold rounded-full"
                onClick={goToCurrentWeek}
              >
                Today
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={goToNextWeek}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next Week</TooltipContent>
              </Tooltip>
            </div>
          </Card>

          {/* Target Dialog */}
          <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Weekly Target</DialogTitle>
                <DialogDescription>
                  How many workout sessions do you want to complete each week?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target-sessions">Sessions Per Week</Label>
                  <Input
                    id="target-sessions"
                    type="number"
                    min="1"
                    max="7"
                    value={tempTarget}
                    onChange={(e) => setTempTarget(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button onClick={handleSaveTarget} className="w-full">
                  <Target className="w-4 h-4 mr-2" />
                  Save Target
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Settings Dialog */}
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Exercise Library</Label>
                  <Button 
                    onClick={() => {
                      setShowSettingsDialog(false)
                      setShowManageExercises(true)
                    }} 
                    variant="outline" 
                    className="w-full"
                  >
                    <List className="w-4 h-4 mr-2" />
                    Manage Exercises
                  </Button>
                </div>
                <div className="space-y-3">
                  <Label>Backup & Restore</Label>
                  <div className="space-y-2">
                    <Button onClick={handleExportData} variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Export All Data
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                    <div className="text-xs text-muted-foreground space-y-1 pt-1">
                      <p>Export includes:</p>
                      <ul className="list-disc list-inside pl-1 space-y-0.5">
                        <li>All workouts & personal bests</li>
                        <li>Exercise library & muscle groups</li>
                        <li>Saved templates</li>
                        <li>Weekly target setting</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-destructive">Danger Zone</Label>
                  <Button
                    onClick={() => setShowClearDataDialog(true)}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This will permanently delete all workouts, exercises, templates, and settings. This action cannot be undone.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Clear All Data Confirmation Dialog */}
          <AlertDialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Clear All Data?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your data including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All workout sessions and personal bests</li>
                    <li>Your exercise library</li>
                    <li>All saved templates</li>
                    <li>Your weekly target setting</li>
                  </ul>
                  <strong className="block mt-3">This action cannot be undone.</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAllData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Manage Exercises Dialog */}
          <ManageExercisesDialog
            open={showManageExercises}
            onOpenChange={setShowManageExercises}
            allDays={days}
            onDaysUpdate={saveDays}
          />
        </div>
      </main>
    </TooltipProvider>
  )
}
