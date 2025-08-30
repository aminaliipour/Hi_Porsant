import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { EmployeeSalary, TeamMember } from "@/lib/models"
import mongoose from "mongoose"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const archiveId = searchParams.get("archiveId")

    let query: any = {}
    if (archiveId) query.archiveId = new mongoose.Types.ObjectId(archiveId)

    const salaries = await EmployeeSalary.find(query)
      .sort({ date: -1 })
      .exec()

    // جداگانه اطلاعات اعضای تیم را دریافت می‌کنیم
    const teamMembers = await TeamMember.find({}).exec()
    
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
