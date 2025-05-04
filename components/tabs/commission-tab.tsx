"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProjectCommissionDialog } from "@/components/dialogs/project-commission-dialog"
import { UserCommissionDialog } from "@/components/dialogs/user-commission-dialog"

interface Project {
  _id: string
  name: string
}

interface TeamMember {
  _id: string
  fullName: string
  position: string
}

export default function CommissionTab() {
  const [projects, setProjects] = useState<Project[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // دریافت پروژه‌ها
      const projectsResponse = await fetch("/api/projects")
      const projectsData = await projectsResponse.json()
      setProjects(projectsData)

      // دریافت اعضای تیم
      const membersResponse = await fetch("/api/team-members")
      const membersData = await membersResponse.json()
      setMembers(membersData)
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project)
    setIsProjectDialogOpen(true)
  }

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member)
    setIsUserDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* بخش پورسانت پروژه‌ها */}
      <Card>
        <CardHeader>
          <CardTitle>پورسانت پروژه‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="flex justify-between items-center p-3 border rounded-md cursor-pointer hover:bg-accent"
                  onClick={() => handleProjectClick(project)}
                >
                  <span>{project.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* بخش پورسانت کاربران */}
      <Card>
        <CardHeader>
          <CardTitle>پورسانت کاربران</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex justify-between items-center p-3 border rounded-md cursor-pointer hover:bg-accent"
                  onClick={() => handleMemberClick(member)}
                >
                  <span>{member.fullName}</span>
                  <span className="text-sm text-muted-foreground">{member.position}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedProject && (
        <ProjectCommissionDialog
          project={selectedProject}
          open={isProjectDialogOpen}
          onOpenChange={setIsProjectDialogOpen}
        />
      )}

      {selectedMember && (
        <UserCommissionDialog member={selectedMember} open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen} />
      )}
    </div>
  )
}
