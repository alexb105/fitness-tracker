"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Exercise } from "@/app/page"

interface NewPBDialogProps {
  exercise: Exercise | null
  onClose: () => void
  onAdd: (exerciseId: string, reps: number, weight: number) => void
}

export default function NewPBDialog({ exercise, onClose, onAdd }: NewPBDialogProps) {
  const [reps, setReps] = useState("")
  const [weight, setWeight] = useState("")

  useEffect(() => {
    if (exercise) {
      setReps("")
      setWeight("")
    }
  }, [exercise])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (exercise && reps && weight) {
      onAdd(exercise.id, Number.parseInt(reps), Number.parseFloat(weight))
    }
  }

  return (
    <Dialog open={!!exercise} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add PB for {exercise?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                type="number"
                placeholder="8"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                min="1"
                autoFocus
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
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={!reps || !weight}>
            Save PB
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
