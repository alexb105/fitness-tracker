"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, TrendingUp, Zap } from "lucide-react"
import type { Exercise, PersonalBest } from "@/app/page"

interface NewPBDialogProps {
  exercise: Exercise | null
  onClose: () => void
  onAdd: (exerciseId: string, reps: number, weight: number) => void
  allTimeBest?: PersonalBest | null
}

export default function NewPBDialog({ exercise, onClose, onAdd, allTimeBest }: NewPBDialogProps) {
  const [reps, setReps] = useState("")
  const [weight, setWeight] = useState("")
  const repsInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (exercise) {
      setReps("")
      setWeight("")
      // Focus reps input when dialog opens
      setTimeout(() => {
        repsInputRef.current?.focus()
      }, 100)
    }
  }, [exercise])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (exercise && reps && weight) {
      onAdd(exercise.id, Number.parseInt(reps), Number.parseFloat(weight))
    }
  }

  // Calculate if current input would be a new PB
  const currentTotal = reps && weight ? Number.parseInt(reps) * Number.parseFloat(weight) : 0
  const allTimeBestTotal = allTimeBest ? allTimeBest.reps * allTimeBest.weight : 0
  const wouldBeNewPB = currentTotal > 0 && currentTotal > allTimeBestTotal

  // Quick fill buttons based on common increments
  const getQuickFills = () => {
    if (!allTimeBest) return []
    return [
      { label: "+2.5kg", reps: allTimeBest.reps, weight: allTimeBest.weight + 2.5 },
      { label: "+5kg", reps: allTimeBest.reps, weight: allTimeBest.weight + 5 },
      { label: "+1 rep", reps: allTimeBest.reps + 1, weight: allTimeBest.weight },
    ]
  }

  const quickFills = getQuickFills()

  return (
    <Dialog open={!!exercise} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Record PB
          </DialogTitle>
          <DialogDescription>
            {exercise?.name}
          </DialogDescription>
        </DialogHeader>

        {/* Current Best Display */}
        {allTimeBest && (
          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Current Best</p>
              <p className="font-semibold">
                {allTimeBest.reps} reps × {allTimeBest.weight}kg
                <span className="text-muted-foreground font-normal text-sm ml-1">
                  ({allTimeBestTotal}kg)
                </span>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input
                ref={repsInputRef}
                id="reps"
                type="number"
                placeholder="8"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                min="1"
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="30"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min="0"
                step="0.5"
                className="text-lg h-12"
              />
            </div>
          </div>

          {/* Quick Fill Buttons */}
          {allTimeBest && quickFills.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quick progress from best</Label>
              <div className="flex gap-2">
                {quickFills.map((fill, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setReps(fill.reps.toString())
                      setWeight(fill.weight.toString())
                    }}
                  >
                    {fill.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* New PB Indicator */}
          {wouldBeNewPB && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Zap className="w-5 h-5 text-primary animate-pulse" />
              <div className="flex-1">
                <p className="font-semibold text-primary text-sm">New Personal Best!</p>
                <p className="text-xs text-muted-foreground">
                  {currentTotal}kg total (+{(currentTotal - allTimeBestTotal).toFixed(1)}kg)
                </p>
              </div>
            </div>
          )}

          {/* Total Preview */}
          {currentTotal > 0 && !wouldBeNewPB && (
            <div className="text-center text-sm text-muted-foreground">
              Total: {currentTotal}kg
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium" 
            disabled={!reps || !weight}
          >
            {wouldBeNewPB ? (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Save New PB! 🎉
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5 mr-2" />
                Save PB
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
