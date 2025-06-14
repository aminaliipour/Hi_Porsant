import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { Project, ProjectSection } from "@/lib/models"

// DELETE /api/projects/cleanup-extra
export async function DELETE() {
  try {
    await dbConnect()
    const allProjects = await Project.find({})
    let deletedCount = 0
    for (const p of allProjects) {
      const sectionCount = await ProjectSection.countDocuments({ projectId: p._id })
      if (sectionCount === 0) {
        await Project.deleteOne({ _id: p._id })
        deletedCount++
      }
    }
    return NextResponse.json({ success: true, deletedCount })
  } catch (error) {
    console.error("CLEANUP ERROR", error)
    return NextResponse.json({ error: "خطا در پاک‌سازی پروژه‌های خالی", details: String(error) }, { status: 500 })
  }
}
