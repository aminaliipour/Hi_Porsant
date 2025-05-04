"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Plus, MoreVertical, Trash, Edit, FolderOpen } from "lucide-react"
import { ProjectSectionsDialog } from "@/components/dialogs/project-sections-dialog"

interface Project {
  _id: string
  name: string
}

export default function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newProjectName, setNewProjectName] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isSectionsDialogOpen, setIsSectionsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در دریافت لیست پروژه‌ها",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "خطا",
        description: "نام پروژه نمی‌تواند خالی باشد",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newProjectName,
        }),
      })

      if (!response.ok) {
        throw new Error("خطا در ایجاد پروژه")
      }

      const newProject = await response.json()
      setProjects([...projects, newProject])
      setNewProjectName("")
      setIsAddDialogOpen(false)

      toast({
        title: "موفق",
        description: "پروژه با موفقیت ایجاد شد",
      })

      // ایجاد بخش‌های پیش‌فرض
      await createDefaultSections(newProject._id)
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ایجاد پروژه",
        variant: "destructive",
      })
    }
  }

  const createDefaultSections = async (projectId: string) => {
    // تعریف ساختار هر بخش و فیلدهایش
    const sectionConfigs = [
      { name: "خرید", endpoint: "purchase-details", fields: ["متراژ", "استعلام قیمت", "هماهنگی با نصاب", "بودجه", "سفارش", "تحویل باربری", "گرفتن فاکتور نهایی"] },
      { name: "همکاری", endpoint: "collaboration-details", fields: ["بازدید", "ابعاد و اندازه", "براورد مالی", "برآورد زمانی", "توافق نهایی"] },
      { name: "فروش", endpoint: "sale-details", fields: ["مشتری", "محصول", "تعداد", "قیمت", "تاریخ فروش"] },
      { name: "طراحی", endpoint: "design-details", fields: ["نقشه اجرایی فاز ۱", "نقشه اجرایی فاز ۲", "آلبوم عکس و نقشه"] },
      { name: "پیمانکاری", endpoint: "contracting-details", fields: ["فاصله زمانی", "سختی کار", "تحویل نهایی کار و آلبوم", "ارجاع توسط"] },
      { name: "مشاوره", endpoint: "consultation-details", fields: ["بازدید", "پر کردن چک لیست", "مشاوره"] },
    ];

    try {
      for (const section of sectionConfigs) {
        // ساخت بخش
        const sectionRes = await fetch("/api/project-sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, sectionName: section.name }),
        });
        const sectionData = await sectionRes.json();
        // ساخت جزئیات پیش‌فرض با همه فیلدها فعال
        if (sectionData._id && section.endpoint) {
          const details: Record<string, { isActive: boolean; assignedMemberId: null }> = {};
          section.fields.forEach(field => {
            details[field] = { isActive: true, assignedMemberId: null };
          });
          await fetch(`/api/${section.endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sectionId: sectionData._id, details }),
          });
        }
      }
    } catch (error) {
      console.error("خطا در ایجاد بخش‌ها و جزئیات پیش‌فرض:", error);
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("خطا در حذف پروژه")
      }

      setProjects(projects.filter((project) => project._id !== projectId))
      toast({
        title: "موفق",
        description: "پروژه با موفقیت حذف شد",
      })
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در حذف پروژه",
        variant: "destructive",
      })
    }
  }

  const handleEditProject = async (project: Project) => {
    setSelectedProject(project)
    setNewProjectName(project.name)
    setIsAddDialogOpen(true)
  }

  const handleUpdateProject = async () => {
    if (!selectedProject || !newProjectName.trim()) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${selectedProject._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newProjectName }),
      })

      if (!response.ok) {
        throw new Error("خطا در بروزرسانی پروژه")
      }

      const updatedProject = await response.json()
      setProjects(projects.map((p) => (p._id === updatedProject._id ? updatedProject : p)))
      setNewProjectName("")
      setSelectedProject(null)
      setIsAddDialogOpen(false)

      toast({
        title: "موفق",
        description: "پروژه با موفقیت بروزرسانی شد",
      })
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی پروژه",
        variant: "destructive",
      })
    }
  }

  const handleOpenSections = (project: Project) => {
    setSelectedProject(project)
    setIsSectionsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">پروژه‌ها</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedProject(null)
                setNewProjectName("")
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 btn-hover"
            >
              <Plus className="ml-2 h-4 w-4" />
              افزودن پروژه
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-800 border-yellow-200 dark:border-yellow-900/30">
            <DialogHeader>
              <DialogTitle className="text-gray-800 dark:text-gray-100">
                {selectedProject ? "ویرایش پروژه" : "افزودن پروژه جدید"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">نام پروژه</label>
                <Input
                  placeholder="نام پروژه"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="border-gray-200 dark:border-gray-700 focus:border-yellow-500 dark:focus:border-yellow-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="border-gray-200 dark:border-gray-700"
              >
                انصراف
              </Button>
              <Button
                onClick={selectedProject ? handleUpdateProject : handleAddProject}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
              >
                {selectedProject ? "بروزرسانی" : "افزودن"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project._id} className="overflow-hidden border-gray-200 dark:border-gray-700 card-hover">
              <CardContent className="p-0">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">{project.name}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                      <DropdownMenuItem
                        onClick={() => handleOpenSections(project)}
                        className="text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700"
                      >
                        <FolderOpen className="ml-2 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        مشاهده بخش‌ها
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditProject(project)}
                        className="text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700"
                      >
                        <Edit className="ml-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
                        onClick={() => handleDeleteProject(project._id)}
                      >
                        <Trash className="ml-2 h-4 w-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="p-4">
                  <Button
                    variant="outline"
                    className="w-full border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/20 btn-hover"
                    onClick={() => handleOpenSections(project)}
                  >
                    مشاهده بخش‌ها
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProject && (
        <ProjectSectionsDialog
          project={selectedProject as Project}
          open={isSectionsDialogOpen}
          onOpenChange={setIsSectionsDialogOpen}
        />
      )}
    </div>
  )
}
