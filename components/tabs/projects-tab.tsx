"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Plus, MoreVertical, Trash, Edit, FolderOpen, Archive, Search, Settings } from "lucide-react"
import { ProjectSectionsDialog } from "@/components/dialogs/project-sections-dialog"
import { CustomTaadolDialog } from "@/components/dialogs/custom-taadol-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CustomTaadolPercentages {
  خرید: number
  همکاری: number
  فروش: number
  طراحی: number
  پیمانکاری: number
  مشاوره: number
}

interface SectionWeight {
  sectionName: string
  fieldName: string
  weight: number
}

interface Project {
  _id: string
  name: string
  archiveId?: string | null
  useCustomTaadol?: boolean
  customTaadolPercentages?: CustomTaadolPercentages
  customSectionWeights?: SectionWeight[]
}

export default function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newProjectName, setNewProjectName] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isSectionsDialogOpen, setIsSectionsDialogOpen] = useState(false)
  const [isCustomTaadolDialogOpen, setIsCustomTaadolDialogOpen] = useState(false)
  const [customTaadolProject, setCustomTaadolProject] = useState<Project | null>(null)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [archiveList, setArchiveList] = useState<any[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [archiveTargetProject, setArchiveTargetProject] = useState<Project | null>(null)
  const [selectedArchiveId, setSelectedArchiveId] = useState<string>("")
  const [groupArchiveDialogOpen, setGroupArchiveDialogOpen] = useState(false)
  const [groupSelectedArchiveId, setGroupSelectedArchiveId] = useState("")
  const [groupArchiveLoading, setGroupArchiveLoading] = useState(false)
  const [groupArchiveList, setGroupArchiveList] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // دریافت آرشیو فعال از localStorage
    const stored = localStorage.getItem("activeArchive")
    let archiveId = ""
    if (stored) {
      try {
        archiveId = JSON.parse(stored)._id
      } catch {}
    }
    fetchProjects(archiveId)
  }, [])

  const fetchProjects = async (archiveId?: string) => {
    try {
      setLoading(true)
      let url = "/api/projects"
      if (archiveId) url += `?archiveId=${archiveId}`
      const response = await fetch(url)
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
    // دریافت آرشیو فعال
    const stored = localStorage.getItem("activeArchive")
    let archiveId = ""
    if (stored) {
      try {
        archiveId = JSON.parse(stored)._id
      } catch {}
    }
    if (!archiveId) {
      toast({
        title: "خطا",
        description: "ابتدا یک آرشیو انتخاب کنید",
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
          archiveId,
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

    // دریافت archiveId فعال از localStorage
    let archiveId = ""
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("activeArchive")
      if (stored) {
        try { archiveId = JSON.parse(stored)._id } catch {}
      }
    }

    try {
      for (const section of sectionConfigs) {
        // ساخت بخش با archiveId
        const sectionRes = await fetch("/api/project-sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, sectionName: section.name, archiveId }),
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

  const handleSelectProject = (projectId: string, checked: boolean) => {
    setSelectedProjects((prev) =>
      checked ? [...prev, projectId] : prev.filter((id) => id !== projectId)
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(projects.map((p) => p._id))
    } else {
      setSelectedProjects([])
    }
  }

  const handleDeleteSelected = async () => {
    for (const id of selectedProjects) {
      await handleDeleteProject(id)
    }
    setSelectedProjects([])
  }

  // جستجو و فیلتر پروژه‌ها
  const filteredProjects = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  // گرفتن لیست آرشیوها
  const fetchArchives = async () => {
    setArchiveLoading(true)
    try {
      const res = await fetch("/api/archives")
      const data = await res.json()
      setArchiveList(data)
    } catch {}
    setArchiveLoading(false)
  }

  // باز کردن دیالوگ آرشیو
  const handleOpenArchiveDialog = (project: Project) => {
    setArchiveTargetProject(project)
    setArchiveDialogOpen(true)
    fetchArchives()
  }

  // انتقال پروژه به آرشیو انتخابی
  const handleMoveToArchive = async () => {
    if (!archiveTargetProject || !selectedArchiveId) return
    try {
      const archiveIdToSend = selectedArchiveId === "none" ? null : selectedArchiveId
      const res = await fetch(`/api/projects/${archiveTargetProject._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archiveId: archiveIdToSend })
      })
      if (!res.ok) throw new Error()
      toast({ title: "موفق", description: archiveIdToSend ? "پروژه به آرشیو جدید منتقل شد" : "پروژه از آرشیو خارج شد" })
      setArchiveDialogOpen(false)
      setArchiveTargetProject(null)
      setSelectedArchiveId("")
      // رفرش لیست
      const stored = localStorage.getItem("activeArchive")
      let archiveId = ""
      if (stored) {
        try { archiveId = JSON.parse(stored)._id } catch {}
      }
      fetchProjects(archiveId)
    } catch {
      toast({ title: "خطا", description: "خطا در انتقال پروژه به آرشیو", variant: "destructive" })
    }
  }

  const fetchGroupArchives = async () => {
    setGroupArchiveLoading(true)
    try {
      const res = await fetch("/api/archives")
      const data = await res.json()
      setGroupArchiveList(data)
    } catch {}
    setGroupArchiveLoading(false)
  }

  const handleOpenGroupArchiveDialog = () => {
    setGroupArchiveDialogOpen(true)
    fetchGroupArchives()
  }

  const handleMoveSelectedToArchive = async () => {
    if (!groupSelectedArchiveId || selectedProjects.length === 0) return
    try {
      await Promise.all(selectedProjects.map(id =>
        fetch(`/api/projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archiveId: groupSelectedArchiveId })
        })
      ))
      toast({ title: "موفق", description: "پروژه‌های انتخابی به آرشیو منتقل شدند." })
      setGroupArchiveDialogOpen(false)
      setGroupSelectedArchiveId("")
      setSelectedProjects([])
      // رفرش لیست
      const stored = localStorage.getItem("activeArchive")
      let archiveId = ""
      if (stored) {
        try { archiveId = JSON.parse(stored)._id } catch {}
      }
      fetchProjects(archiveId)
    } catch {
      toast({ title: "خطا", description: "خطا در انتقال گروهی پروژه‌ها", variant: "destructive" })
    }
  }

  // تغییر وضعیت استفاده از سیستم تعادل مخصوص
  const handleToggleCustomTaadol = async (project: Project, checked: boolean) => {
    try {
      const response = await fetch(`/api/projects/${project._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCustomTaadol: checked }),
      })

      if (!response.ok) {
        throw new Error("خطا در تغییر وضعیت")
      }

      // بروزرسانی لیست پروژه‌ها
      const updatedProject = await response.json()
      setProjects(projects.map((p) => (p._id === updatedProject._id ? updatedProject : p)))

      toast({
        title: "موفق",
        description: checked 
          ? "سیستم تعادل مخصوص برای این پروژه فعال شد" 
          : "پروژه به سیستم تعادل اصلی برگشت",
      })
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در تغییر تنظیمات",
        variant: "destructive",
      })
    }
  }

  // باز کردن دیالوگ تنظیمات سیستم تعادل مخصوص
  const handleOpenCustomTaadol = (project: Project) => {
    setCustomTaadolProject(project)
    setIsCustomTaadolDialogOpen(true)
  }

  // بستن دیالوگ و رفرش لیست
  const handleCloseCustomTaadol = () => {
    setIsCustomTaadolDialogOpen(false)
    setCustomTaadolProject(null)
  }

  const handleUpdateCustomTaadol = () => {
    // رفرش لیست پروژه‌ها
    const stored = localStorage.getItem("activeArchive")
    let archiveId = ""
    if (stored) {
      try { archiveId = JSON.parse(stored)._id } catch {}
    }
    fetchProjects(archiveId)
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">پروژه‌ها</h2>
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <div className="relative">
            <Input
              placeholder="جستجو در پروژه‌ها..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-8 w-40 md:w-48 h-9 border-gray-200 dark:border-gray-700 text-sm"
            />
            <Search className="absolute right-2 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <Checkbox
            checked={selectedProjects.length === projects.length && projects.length > 0}
            onCheckedChange={handleSelectAll}
            className="mr-2 scale-90 md:scale-100"
          />
          <span className="text-xs md:text-sm">انتخاب همه</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedProjects.length === 0}
                className="flex items-center h-9 text-xs md:text-sm"
              >
                گزینه‌ها
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDeleteSelected}
                className="text-red-600 dark:text-red-400"
              >
                حذف گروهی
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleOpenGroupArchiveDialog}
                className="text-green-700 dark:text-green-400"
              >
                انتقال گروهی به آرشیو
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={groupArchiveDialogOpen} onOpenChange={setGroupArchiveDialogOpen}>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-center">انتقال گروهی پروژه‌ها به آرشیو</DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1 max-h-[400px] px-2">
                <div className="space-y-2">
                  {groupArchiveLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    groupArchiveList.map((archive) => (
                      <Button
                        key={archive._id}
                        variant={groupSelectedArchiveId === archive._id ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setGroupSelectedArchiveId(archive._id)}
                      >
                        <Archive className="ml-2 h-4 w-4" />
                        {archive.name}
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setGroupArchiveDialogOpen(false)}>
                  لغو
                </Button>
                <Button 
                  onClick={handleMoveSelectedToArchive} 
                  disabled={!groupSelectedArchiveId || groupArchiveLoading} 
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  انتقال
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setSelectedProject(null); setNewProjectName("") }} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 btn-hover flex items-center h-9 px-3 text-xs md:text-sm">
                <Plus className="ml-1 h-4 w-4" />
                <span className="hidden sm:inline">افزودن پروژه</span>
                <span className="sm:hidden">افزودن</span>
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
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredProjects.map((project) => (
            <Card key={project._id} className="overflow-hidden border-gray-200 dark:border-gray-700 card-hover text-sm">
              <CardContent className="p-0">
                <div className="flex justify-between items-center p-3 md:p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2 md:gap-2.5">
                    <Checkbox
                      checked={selectedProjects.includes(project._id)}
                      onCheckedChange={(checked) => handleSelectProject(project._id, !!checked)}
                    />
                    <div className="flex flex-col">
                      <h3 className="text-base md:text-lg font-medium text-gray-800 dark:text-gray-100 truncate max-w-[120px] md:max-w-[160px]">{project.name}</h3>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-8 w-8"
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
                        onClick={() => handleOpenArchiveDialog(project)}
                        className="text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700"
                      >
                        <Archive className="ml-2 h-4 w-4 text-green-600 dark:text-green-400" />
                        اضافه به آرشیو
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
                <div className="p-3 md:p-4 space-y-3">
                  {/* چک باکس سیستم تعادل مخصوص */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={project.useCustomTaadol || false}
                        onCheckedChange={(checked) => handleToggleCustomTaadol(project, !!checked)}
                      />
                      <Label className="text-xs md:text-sm cursor-pointer">سیستم تعادل مخصوص</Label>
                    </div>
                    {project.useCustomTaadol && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenCustomTaadol(project)}
                        className="h-7 w-7"
                        title="تنظیمات سیستم تعادل"
                      >
                        <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/20 btn-hover h-9 text-xs md:text-sm"
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

      {/* دیالوگ تنظیمات سیستم تعادل مخصوص */}
      <CustomTaadolDialog
        project={customTaadolProject}
        open={isCustomTaadolDialogOpen}
        onClose={handleCloseCustomTaadol}
        onUpdate={handleUpdateCustomTaadol}
      />

      {/* دیالوگ انتخاب آرشیو */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-center">انتقال پروژه به آرشیو دیگر</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[400px] px-2">
            <div className="space-y-2">
              {archiveTargetProject && archiveTargetProject["archiveId"] && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setSelectedArchiveId("none")}
                >
                  <Archive className="ml-2 h-4 w-4" />
                  خروج از آرشیو
                </Button>
              )}
              {archiveLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                archiveList.map((archive) => (
                  <Button
                    key={archive._id}
                    variant={selectedArchiveId === archive._id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedArchiveId(archive._id)}
                  >
                    <Archive className="ml-2 h-4 w-4" />
                    {archive.name}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
              لغو
            </Button>
            <Button 
              onClick={handleMoveToArchive} 
              disabled={!selectedArchiveId || archiveLoading} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              انتقال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
