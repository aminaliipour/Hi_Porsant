import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { EmployeeSalary, TeamMember } from "@/lib/models"
import mongoose from "mongoose"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await dbConnect()
    const url = new URL(request.url)
    const archiveId = url.searchParams.get("archiveId")

    let query: any = {}
    if (archiveId) query.archiveId = new mongoose.Types.ObjectId(archiveId)

    let salaries = await EmployeeSalary.find(query)
      .sort({ date: -1 })
      .exec()

    // جداگانه اطلاعات اعضای تیم را دریافت می‌کنیم
    // برای آرشیو: اعضای تخصصی + shared members (بدون archiveId)
    let teamMembersQuery: any = {}
    if (archiveId) {
      teamMembersQuery = {
        $or: [
          { archiveId: archiveId },
          { archiveId: { $exists: false } }
        ]
      }
    } else {
      teamMembersQuery = { archiveId: { $exists: false } }
    }
    
    const teamMembers = await TeamMember.find(teamMembersQuery).exec()
    
    // ترکیب اطلاعات
    const salariesWithNames = salaries.map(salary => {
      const teamMember = teamMembers.find(member => 
        member._id.toString() === salary.employeeId.toString()
      )
      
      return {
        ...salary.toObject(),
        employeeName: teamMember?.fullName || salary.employeeName || "نامشخص",
        teamMemberData: teamMember ? teamMember.toObject() : null
      }
    })

    return NextResponse.json(salariesWithNames)
  } catch (error) {
    console.error("Error fetching all salaries:", error)
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات حقوق" },
      { status: 500 }
    )
  }
}
