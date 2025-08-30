import { NextRequest, NextResponse } from 'next/server'
import connectMongoDB from "@/lib/db"
import { UserCommission, TeamMember } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB()
    
    const { searchParams } = new URL(request.url)
    const archiveId = searchParams.get('archiveId')
    
    console.log("Fetching user commissions for archiveId:", archiveId)
    
    // First get all team members
    const teamMembers = await TeamMember.find({}).select('_id fullName')
    console.log("Found team members:", teamMembers.length)
    
    // For each team member, fetch their commission from the individual API
    const result = []
    
    for (const member of teamMembers) {
      try {
        // Make internal API call to get individual commission calculation
        const url = `http://localhost:3001/api/user-commissions/${member._id}${archiveId ? `?archiveId=${archiveId}` : ''}`
        
        const response = await fetch(url)
        if (response.ok) {
          const commissions = await response.json()
          
          // Calculate total commission from active commissions
          const totalCommission = commissions
            .filter((c: any) => c.isActive !== false)
            .reduce((sum: number, c: any) => sum + (c.commission || 0), 0)
          
          result.push({
            userId: {
              _id: member._id,
              fullName: member.fullName
            },
            totalCommission,
            commissions: commissions
          })
          
          console.log(`Commission for ${member.fullName}:`, totalCommission)
        } else {
          // If API call fails, add user with 0 commission
          result.push({
            userId: {
              _id: member._id,
              fullName: member.fullName
            },
            totalCommission: 0,
            commissions: []
          })
        }
      } catch (error) {
        console.error(`Error fetching commission for ${member.fullName}:`, error)
        // Add user with 0 commission if error occurs
        result.push({
          userId: {
            _id: member._id,
            fullName: member.fullName
          },
          totalCommission: 0,
          commissions: []
        })
      }
    }
    
    console.log("Processed commission results count:", result.length)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error fetching user commissions:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت کمیسیون‌های کاربران' },
      { status: 500 }
    )
  }
}
