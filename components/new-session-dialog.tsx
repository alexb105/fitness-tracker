"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Bookmark, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { getAllTemplates, loadTemplate, deleteTemplate, type SessionTemplate } from "@/lib/session-templates"
import type { WorkoutSession } from "@/app/page"
import { useToast } from "@/hooks/use-toast"

interface NewSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string) => void
  onLoadTemplate?: (session: WorkoutSession) => void
}

export default function NewSessionDialog({ open, onOpenChange, onAdd, onLoadTemplate }: NewSessionDialogProps) {
  const [name, setName] = useState("")
  const [templates, setTemplates] = useState<SessionTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setTemplates(getAllTemplates())
      setShowTemplates(false)
      setName("")
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(name.trim())
      setName("")
      onOpenChange(false)
    }
  }

  const handleLoadTemplate = (template: SessionTemplate) => {
    const session = loadTemplate(template)
    if (onLoadTemplate) {
      onLoadTemplate(session)
    } else {
      onAdd(session.name)
    }
    onOpenChange(false)
  }

  const handleDeleteTemplate = (e: React.MouseEvent, template: SessionTemplate) => {
    e.stopPropagation()
    deleteTemplate(template.id)
    setTemplates(getAllTemplates())
    toast({
      title: "Template deleted",
      description: `"${template.name}" has been removed`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Workout Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {templates.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Saved Templates</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  {showTemplates ? "Hide" : "Show"} ({templates.length})
                </Button>
              </div>
              {showTemplates && (
                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleLoadTemplate(template)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Bookmark className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{template.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.exercises.length} exercise{template.exercises.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLoadTemplate(template)
                            }}
                          >
                            Load
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => handleDeleteTemplate(e, template)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
              <Label htmlFor="session-name">Or Create New Session</Label>
            <Input
              id="session-name"
              placeholder="e.g., Push Day, Leg Day..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={!name.trim()}>
              <Plus className="w-4 h-4 mr-2" />
            Create Session
          </Button>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
