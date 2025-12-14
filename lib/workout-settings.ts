const TARGET_STORAGE_KEY = "workout-target-sessions-per-week"

export function getTargetSessionsPerWeek(): number {
  if (typeof window === "undefined") return 3
  const stored = localStorage.getItem(TARGET_STORAGE_KEY)
  if (stored) {
    return parseInt(stored, 10) || 3
  }
  return 3 // Default to 3 sessions per week
}

export function setTargetSessionsPerWeek(target: number): void {
  if (typeof window === "undefined") return
  if (target < 1) target = 1
  if (target > 7) target = 7
  localStorage.setItem(TARGET_STORAGE_KEY, target.toString())
}

export function calculateStreak(
  days: Array<{ date: string }>,
  targetPerWeek: number
): { currentStreak: number; longestStreak: number } {
  if (days.length === 0) return { currentStreak: 0, longestStreak: 0 }

  const now = new Date()
  const weeks: Array<{ weekStart: Date; weekEnd: Date; workouts: number }> = []
  
  // Get last 52 weeks (1 year) to calculate streaks
  for (let i = 51; i >= 0; i--) {
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
    
    weeks.push({
      weekStart,
      weekEnd,
      workouts: workoutsInWeek,
    })
  }
  
  // Calculate current streak (from most recent week backwards)
  let currentStreak = 0
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].workouts >= targetPerWeek) {
      currentStreak++
    } else {
      break // Streak broken
    }
  }
  
  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 0
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].workouts >= targetPerWeek) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }
  
  return { currentStreak, longestStreak }
}

