"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Dumbbell, Calendar, ChevronRight, Trash2, TrendingUp, Target, Flame, Settings, Download, Upload, List, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine } from "recharts"
import SessionDetail from "@/components/session-detail"
import ManageExercisesDialog from "@/components/manage-exercises-dialog"
import { getTargetSessionsPerWeek, setTargetSessionsPerWeek, calculateStreak } from "@/lib/workout-settings"
import { exportAllData, downloadData, importAllData, readFileAsJSON } from "@/lib/data-export"
import { useToast } from "@/hooks/use-toast"

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

export default function Home() {
  const [days, setDays] = useState<WorkoutDay[]>([])
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null)
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null)
  const [targetSessions, setTargetSessions] = useState<number>(3)
  const [showTargetDialog, setShowTargetDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showManageExercises, setShowManageExercises] = useState(false)
  const [tempTarget, setTempTarget] = useState<string>("3")
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    // Get Monday of current week
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const stored = localStorage.getItem("workout-days")
    if (stored) {
      setDays(JSON.parse(stored))
    }
    setTargetSessions(getTargetSessionsPerWeek())
  }, [])

  const saveDays = (newDays: WorkoutDay[]) => {
    setDays(newDays)
    localStorage.setItem("workout-days", JSON.stringify(newDays))
  }

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

  const getOrCreateDay = (date: Date): WorkoutDay => {
    const existing = getDayForDate(date)
    if (existing) {
      return existing
    }
    
    // Create new day (create a new date object to avoid mutation)
    const dateCopy = new Date(date)
    dateCopy.setHours(0, 0, 0, 0)
    const newDay: WorkoutDay = {
      id: crypto.randomUUID(),
      date: dateCopy.toISOString(),
      sessions: [],
    }
    const newDays = [...days, newDay].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    saveDays(newDays)
    return newDay
  }

  const handleDayClick = (date: Date) => {
    const day = getOrCreateDay(date)
    
    // If day has no session, create one
    if (day.sessions.length === 0) {
      const newSession: WorkoutSession = {
        id: crypto.randomUUID(),
        name: "Workout",
        exercises: [],
      }
      const updatedDay = {
        ...day,
        sessions: [newSession],
      }
      const newDays = days.map((d) => (d.id === updatedDay.id ? updatedDay : d))
      saveDays(newDays)
      setSelectedSession(newSession)
      setSelectedDay(updatedDay)
    } else {
      // Go directly to the session
      setSelectedSession(day.sessions[0])
      setSelectedDay(day)
    }
  }

  const addDay = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const day = getOrCreateDay(today)
    
    // If day has no session, create one
    if (day.sessions.length === 0) {
      const newSession: WorkoutSession = {
        id: crypto.randomUUID(),
        name: "Workout",
        exercises: [],
      }
      const updatedDay = {
        ...day,
        sessions: [newSession],
      }
      const newDays = days.map((d) => (d.id === updatedDay.id ? updatedDay : d))
      saveDays(newDays)
      setSelectedSession(newSession)
      setSelectedDay(updatedDay)
    } else {
      setSelectedSession(day.sessions[0])
      setSelectedDay(day)
    }
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

  const updateDay = (updatedDay: WorkoutDay) => {
    const newDays = days.map((d) => (d.id === updatedDay.id ? updatedDay : d))
    saveDays(newDays)
    setSelectedDay(updatedDay)
  }

  const updateSession = (updatedSession: WorkoutSession) => {
    if (!selectedDay) {
      // If selectedDay is not set, find the day that contains this session
      const dayWithSession = days.find((d) => d.sessions.some((s) => s.id === updatedSession.id))
      if (!dayWithSession) return
      const updatedDay = {
        ...dayWithSession,
        sessions: dayWithSession.sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
      }
      const newDays = days.map((d) => (d.id === updatedDay.id ? updatedDay : d))
      saveDays(newDays)
      setSelectedDay(updatedDay)
      setSelectedSession(updatedSession)
    } else {
      const updatedDay = {
        ...selectedDay,
        sessions: selectedDay.sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
      }
      const newDays = days.map((d) => (d.id === updatedDay.id ? updatedDay : d))
      saveDays(newDays)
      setSelectedDay(updatedDay)
      setSelectedSession(updatedSession)
    }
  }

  const getTotalExercises = (day: WorkoutDay) => {
    return day.sessions.reduce((total, session) => total + session.exercises.length, 0)
  }

  // Prepare workout frequency data for the last 12 weeks
  const getWorkoutFrequencyData = () => {
    const weeks: { week: string; workouts: number; metTarget: boolean }[] = []
    const now = new Date()
    
    // Get last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (i * 7) - (now.getDay() || 7) + 1) // Start of week (Monday)
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      // Count workouts in this week
      const workoutsInWeek = days.filter((day) => {
        const dayDate = new Date(day.date)
        return dayDate >= weekStart && dayDate <= weekEnd
      }).length
      
      const weekLabel = weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
      
      weeks.push({
        week: weekLabel,
        workouts: workoutsInWeek,
        metTarget: workoutsInWeek >= targetSessions,
      })
    }
    
    return weeks
  }

  const frequencyData = getWorkoutFrequencyData()
  const totalWorkouts = days.length
  const averagePerWeek = totalWorkouts > 0 
    ? (totalWorkouts / Math.max(1, frequencyData.filter(w => w.workouts > 0).length || 1)).toFixed(1)
    : "0"

  const { currentStreak, longestStreak } = calculateStreak(days, targetSessions)

  const chartConfig = {
    workouts: {
      label: "Workouts",
      color: "hsl(142, 76%, 36%)", // Green
    },
  }

  const handleSaveTarget = () => {
    const target = parseInt(tempTarget, 10)
    if (target >= 1 && target <= 7) {
      setTargetSessionsPerWeek(target)
      setTargetSessions(target)
      setShowTargetDialog(false)
    }
  }

  const handleExportData = () => {
    const data = exportAllData()
    if (data) {
      downloadData(data)
      toast({
        title: "Data exported",
        description: "Your workout data has been downloaded",
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
      
      // Show confirmation dialog
      if (!confirm("This will replace all your current data. Are you sure you want to continue?")) {
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }

      const result = importAllData(data, { replace: true })
      
      if (result.success) {
        // Reload all data from localStorage
        const stored = localStorage.getItem("workout-days")
        if (stored) {
          setDays(JSON.parse(stored))
        }
        setTargetSessions(getTargetSessionsPerWeek())
        
        // Clear selected session/day to refresh UI
        setSelectedSession(null)
        setSelectedDay(null)
        
        toast({
          title: "Data imported successfully",
          description: "All your workout data has been restored",
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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Show session detail if a session is selected
  if (selectedSession) {
    return (
      <SessionDetail
        session={selectedSession}
        onBack={() => {
          setSelectedSession(null)
          setSelectedDay(null)
        }}
        onUpdate={updateSession}
        allDays={days}
      />
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto p-6">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Workout Tracker</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettingsDialog(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-muted-foreground">Track your daily workouts and PBs</p>
        </header>

        {currentStreak > 0 && (
          <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">
                    {currentStreak} week{currentStreak !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Target: {targetSessions}/week</p>
                <p className="text-sm text-muted-foreground">Best: {longestStreak} weeks</p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-2 mb-6">
          <Button onClick={addDay} className="flex-1 h-12 text-base font-medium">
            <Plus className="w-5 h-5 mr-2" />
            Add Today
          </Button>
          <Button
            onClick={() => setShowManageExercises(true)}
            variant="outline"
            className="h-12 px-4"
          >
            <List className="w-5 h-5" />
          </Button>
        </div>

        {days.length > 0 && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lg">Workout Frequency</h2>
                <p className="text-sm text-muted-foreground">
                  {totalWorkouts} total workout{totalWorkouts !== 1 ? "s" : ""} • {averagePerWeek} avg/week • Target: {targetSessions}/week
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setTempTarget(targetSessions.toString())
                    setShowTargetDialog(true)
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={frequencyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  allowDecimals={false}
                  domain={[0, Math.max(targetSessions, ...frequencyData.map(d => d.workouts)) + 1]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => {
                        const metTarget = item.payload?.metTarget
                        return [
                          `${value} workout${value !== 1 ? "s" : ""}${metTarget ? " ✓" : ""}`,
                          metTarget ? "Target Met!" : "Workouts"
                        ]
                      }}
                    />
                  }
                />
                <ReferenceLine
                  y={targetSessions}
                  stroke="hsl(142, 76%, 36%)"
                  strokeDasharray="3 3"
                  label={{ value: "Target", position: "right", fill: "hsl(142, 76%, 36%)" }}
                />
                <Bar
                  dataKey="workouts"
                  fill="var(--color-workouts)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary/20 border border-primary/40"></div>
                <span>Target: {targetSessions}/week</span>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Week View</h2>
              <p className="text-sm text-muted-foreground">
                {currentWeekStart.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}{" "}
                -{" "}
                {new Date(
                  currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentWeek}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {getWeekDays(currentWeekStart).map((date, index) => {
              const day = getDayForDate(date)
              const isToday =
                date.toDateString() === new Date().toDateString()
              const isPast = date < new Date() && !isToday
              const isFuture = date > new Date()
              const hasSession = day && day.sessions.length > 0

              return (
                <Card
                  key={index}
                  className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors group ${
                    isToday ? "border-primary border-2" : ""
                  } ${isPast ? "opacity-75" : ""} ${
                    isFuture && hasSession ? "bg-primary/5 border-primary/20" : ""
                  }`}
                  onClick={() => handleDayClick(date)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {date.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </h3>
                        {isToday && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                        {isFuture && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            Future
                          </span>
                        )}
                      </div>
                      {day && day.sessions.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {day.sessions[0].name}
                          {" · "}
                          {getTotalExercises(day)} exercise{getTotalExercises(day) !== 1 ? "s" : ""}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/70">
                          No workouts planned
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {day && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteDay(day.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </Card>


        <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Weekly Target</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-sessions">Target Sessions Per Week</Label>
                <Input
                  id="target-sessions"
                  type="number"
                  min="1"
                  max="7"
                  value={tempTarget}
                  onChange={(e) => setTempTarget(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Set how many workout sessions you want to complete per week (1-7)
                </p>
              </div>
              <Button onClick={handleSaveTarget} className="w-full">
                <Target className="w-4 h-4 mr-2" />
                Save Target
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Data Management</Label>
                <div className="space-y-2">
                  <Button onClick={handleExportData} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
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
                  <p className="text-xs text-muted-foreground">
                    Import will replace all existing data. Make sure to export first if you want to keep a backup.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <ManageExercisesDialog
          open={showManageExercises}
          onOpenChange={setShowManageExercises}
          allDays={days}
          onDaysUpdate={saveDays}
        />
      </div>
    </main>
  )
}
