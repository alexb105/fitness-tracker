"use client"

import { useState, useEffect } from "react"
import { Plus, Dumbbell, Calendar, ChevronRight, Trash2, TrendingUp, Target, Flame, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine } from "recharts"
import DayDetailModal from "@/components/day-detail-modal"
import SessionDetail from "@/components/session-detail"
import { getTargetSessionsPerWeek, setTargetSessionsPerWeek, calculateStreak } from "@/lib/workout-settings"

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
  const [isDayModalOpen, setIsDayModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null)
  const [targetSessions, setTargetSessions] = useState<number>(3)
  const [showTargetDialog, setShowTargetDialog] = useState(false)
  const [tempTarget, setTempTarget] = useState<string>("3")

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

  const addDay = () => {
    const today = new Date().toISOString().split("T")[0]
    // Check if today already exists
    const existingToday = days.find((d) => d.date.split("T")[0] === today)
    if (existingToday) {
      setSelectedDay(existingToday)
      setIsDayModalOpen(true)
      return
    }
    const newDay: WorkoutDay = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      sessions: [],
    }
    const newDays = [newDay, ...days]
    saveDays(newDays)
    setSelectedDay(newDay)
    setIsDayModalOpen(true)
  }

  const deleteDay = (id: string) => {
    saveDays(days.filter((d) => d.id !== id))
  }

  const updateDay = (updatedDay: WorkoutDay) => {
    const newDays = days.map((d) => (d.id === updatedDay.id ? updatedDay : d))
    saveDays(newDays)
    setSelectedDay(updatedDay)
  }

  const handleDayCardClick = (day: WorkoutDay) => {
    setSelectedDay(day)
    setIsDayModalOpen(true)
  }

  const handleModalClose = (open: boolean) => {
    setIsDayModalOpen(open)
    if (!open && !selectedSession) {
      // Only clear selectedDay if we're not navigating to a session
      setSelectedDay(null)
    }
  }

  const handleSessionSelect = (session: WorkoutSession) => {
    setSelectedSession(session)
    // Keep selectedDay set so we can update the session later
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
      updateDay(updatedDay)
      setSelectedDay(updatedDay)
    } else {
      const updatedDay = {
        ...selectedDay,
        sessions: selectedDay.sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
      }
      updateDay(updatedDay)
    }
    setSelectedSession(updatedSession)
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Dumbbell className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Workout Tracker</h1>
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

        <Button onClick={addDay} className="w-full mb-6 h-12 text-base font-medium">
          <Plus className="w-5 h-5 mr-2" />
          Add Today
        </Button>

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

        {days.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No workout days yet</p>
            <p className="text-sm text-muted-foreground/70">Start tracking your workouts!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {days.map((day) => (
              <Card
                key={day.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors group"
                onClick={() => handleDayCardClick(day)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {day.sessions.length} session{day.sessions.length !== 1 ? "s" : ""}
                      {" · "}
                      {getTotalExercises(day)} exercise{getTotalExercises(day) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <DayDetailModal
          day={selectedDay}
          open={isDayModalOpen}
          onOpenChange={handleModalClose}
          onUpdate={updateDay}
          onSessionSelect={handleSessionSelect}
        />

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
      </div>
    </main>
  )
}
