"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ItemsListDialog } from "@/components/dialogs/items-list-dialog"
import { SectionDetailsDialog } from "@/components/dialogs/section-details-dialog"

interface Project {
  _id: string
  name: string
}

interface ProjectSection {
  _id: string
  projectId: string
  sectionName: string
}

interface ProjectSectionsDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectSectionsDialog({ project, open, onOpenChange }: ProjectSectionsDialogProps) {
  const [sections, setSections] = useState<ProjectSection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState<ProjectSection | null>(null)
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchSections()
    }
  }, [open, project._id])

  const fetchSections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/project-sections?projectId=${project._id}`)
      const data = await response.json()
      setSections(data)
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در دریافت بخش‌های پروژه",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewItems = (section: ProjectSection) => {
    setSelectedSection(section)
    setIsItemsDialogOpen(true)
  }

  const handleViewDetails = (section: ProjectSection) => {
    setSelectedSection(section)
    setIsDetailsDialogOpen(true)
  }

  const sectionsWithItems = ["خرید", "همکاری", "فروش"]
  const sectionsWithoutItems = ["طراحی", "پیمانکاری", "مشاوره"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>بخش‌های پروژه: {project.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="with-items" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="with-items">بخش‌های دارای آیتم</TabsTrigger>
              <TabsTrigger value="without-items">بخش‌های بدون آیتم</TabsTrigger>
            </TabsList>

            <TabsContent value="with-items" className="space-y-4">
              {sections
                .filter((section) => sectionsWithItems.includes(section.sectionName))
                .map((section) => (
                  <div key={section._id} className="border rounded-md p-4">
                    <div>
                      <h3 className="text-lg font-medium mb-4">{section.sectionName}</h3>
                      <Button onClick={() => handleViewItems(section)} className="w-full">مشاهده آیتم‌ها</Button>
                    </div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="without-items" className="space-y-4">
              {sections
                .filter((section) => sectionsWithoutItems.includes(section.sectionName))
                .map((section) => (
                  <div key={section._id} className="border rounded-md p-4">
                    <div>
                      <h3 className="text-lg font-medium mb-4">{section.sectionName}</h3>
                      <Button onClick={() => handleViewDetails(section)} className="w-full">مشاهده جزئیات</Button>
                    </div>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        )}

        {selectedSection && (
          <>
            <ItemsListDialog
              open={isItemsDialogOpen}
              onOpenChange={setIsItemsDialogOpen}
              section={selectedSection}
            />
            <SectionDetailsDialog
              open={isDetailsDialogOpen}
              onOpenChange={setIsDetailsDialogOpen}
              section={selectedSection}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
