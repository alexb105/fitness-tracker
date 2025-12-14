"use client"

import { ArrowLeft, Trophy, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import type { WorkoutDay, PersonalBest } from "@/app/page"
import { getAllPBsForExercise, getBestPBForExercise } from "@/lib/exercises"

interface ExerciseStatsProps {
  exerciseName: string
  allDays: WorkoutDay[]
  onBack: () => void
}

export default function ExerciseStats({ exerciseName, allDays, onBack }: ExerciseStatsProps) {
  const allTimePBs = getAllPBsForExercise(exerciseName, allDays)
  const allTimeBestPB = getBestPBForExercise(exerciseName, allDays)

  // Group PBs by date
  const pbsByDate = allTimePBs.reduce((acc, pb) => {
    const date = new Date(pb.date).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(pb)
    return acc
  }, {} as Record<string, PersonalBest[]>)

  const sortedDates = Object.keys(pbsByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  // Prepare chart data - sort chronologically for the graph
  const chartData = allTimePBs
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((pb, index) => ({
      session: index + 1,
      date: new Date(pb.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      reps: pb.reps,
      weight: pb.weight,
      total: pb.reps * pb.weight,
    }))

  const chartConfig = {
    reps: {
      label: "Reps",
      color: "hsl(142, 76%, 36%)", // Green
    },
    weight: {
      label: "Weight (kg)",
      color: "hsl(221, 83%, 53%)", // Blue
    },
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto p-6">
        <header className="mb-6">
          <Button variant="ghost" className="mb-4 -ml-2" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{exerciseName}</h1>
          <p className="text-muted-foreground">All-time exercise statistics</p>
        </header>

        {chartData.length > 0 && (
          <Card className="p-4 mb-6">
            <h2 className="font-semibold text-lg mb-4">Progress Over Time</h2>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis
                  yAxisId="reps"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  label={{ value: "Reps", angle: -90, position: "insideLeft" }}
                />
                <YAxis
                  yAxisId="weight"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  label={{ value: "Weight (kg)", angle: 90, position: "insideRight" }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value, payload) => {
                        const data = payload?.[0]?.payload
                        if (data) {
                          const total = data.reps * data.weight
                          return `Session ${data.session} - ${data.date}\nTotal: ${total}kg`
                        }
                        return value
                      }}
                      formatter={(value, name) => {
                        if (name === "weight") {
                          return [`${value}kg`, "Weight"]
                        }
                        return [value, "Reps"]
                      }}
                    />
                  }
                />
                <Legend />
                <Line
                  yAxisId="reps"
                  type="monotone"
                  dataKey="reps"
                  stroke="var(--color-reps)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Reps"
                />
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--color-weight)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Weight (kg)"
                />
              </LineChart>
            </ChartContainer>
          </Card>
        )}

        {allTimePBs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No personal bests recorded yet</p>
            <p className="text-sm text-muted-foreground/70">Start tracking your progress!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">All Personal Bests</h2>
            {sortedDates.map((date) => (
              <Card key={date} className="p-4">
                <h3 className="font-medium text-sm text-muted-foreground mb-3">{date}</h3>
                <div className="space-y-2">
                  {pbsByDate[date].map((pb) => {
                    const total = pb.reps * pb.weight
                    const isBest = allTimeBestPB?.id === pb.id
                    return (
                      <div
                        key={pb.id}
                        className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
                          isBest
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-accent/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {pb.reps} reps × {pb.weight}kg
                          </span>
                          <span className="text-muted-foreground text-xs">
                            ({total}kg total)
                          </span>
                          {isBest && (
                            <Trophy className="w-3.5 h-3.5 text-primary" />
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {new Date(pb.date).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

