import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { TeamMember } from "@/lib/models/team-member.model"
import User from "@/lib/models/User"
import Session from "@/lib/models/Session"
import { ProjectSection } from "@/lib/models/project-section.model"
import { DesignDetails } from "@/lib/models/design-details.model"
import { ContractingDetails } from "@/lib/models/contracting-details.model"
import { ConsultationDetails } from "@/lib/models/consultation-details.model"
import { CollaborationDetails } from "@/lib/models/collaboration-details.model"
import { PurchaseDetails } from "@/lib/models/purchase-details.model"
import { SaleDetails } from "@/lib/models/sale-details.model"
import { EmployeeSalary } from "@/lib/models/employee-salary.model"
import { UserCommission } from "@/lib/models/user-commission.model"
import mongoose from "mongoose"

async function getUser(req: NextRequest) {
    const token = req.cookies.get("auth_token")?.value
    if (!token) return null
    await dbConnect()
    const session = await Session.findOne({ token }).populate("userId")
    return session?.userId
}

// Support both GET and POST for migration
export async function POST(req: NextRequest) {
    return await runMigration(req)
}

export async function GET(req: NextRequest) {
    return await runMigration(req)
}

async function runMigration(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user || user.role !== "admin") {
            return NextResponse.json({ message: "Forbidden - Admin access required" }, { status: 403 })
        }

        await dbConnect()

        const teamMembers = await TeamMember.find({})
        const migrationResults = {
            totalTeamMembers: teamMembers.length,
            usersCreated: 0,
            usersUpdated: 0,
            errors: [] as string[],
            referencesUpdated: {
                projectSections: 0,
                designDetails: 0,
                contractingDetails: 0,
                consultationDetails: 0,
                collaborationDetails: 0,
                purchaseDetails: 0,
                saleDetails: 0,
                salaries: 0,
                commissions: 0
            }
        }

        const memberIdMap = new Map<string, string>() // Old TeamMember ID -> New User ID

        // 1. Migrate TeamMembers to Users
        for (const member of teamMembers) {
            try {
                let user = await User.findOne({ nationalCode: member.nationalCode })

                if (!user) {
                    // Create new user
                    user = await User.create({
                        name: member.fullName,
                        nationalCode: member.nationalCode,
                        role: "user",
                        jobTitle: member.position,
                        fatherName: member.fatherName,
                        phoneNumber: member.phoneNumber,
                        email: member.email,
                        education: member.education,
                        address: member.address,
                        cardNumber: member.cardNumber,
                        // bankAccount: member.bankAccount // Field not in TeamMember but in User, verify if compatible
                    })
                    migrationResults.usersCreated++
                } else {
                    // Update existing user with missing info
                    let updated = false
                    if (!user.jobTitle) { user.jobTitle = member.position; updated = true; }
                    if (!user.fatherName) { user.fatherName = member.fatherName; updated = true; }
                    if (!user.address) { user.address = member.address; updated = true; }
                    if (!user.cardNumber) { user.cardNumber = member.cardNumber; updated = true; }

                    if (updated) {
                        await user.save()
                        migrationResults.usersUpdated++
                    }
                }

                memberIdMap.set(member._id.toString(), user._id.toString())

            } catch (error: any) {
                migrationResults.errors.push(`Failed to migrate member ${member.fullName}: ${error.message}`)
            }
        }

        // 2. Update References
        for (const [oldId, newId] of memberIdMap.entries()) {
            const oldObjectId = new mongoose.Types.ObjectId(oldId)
            const newObjectId = new mongoose.Types.ObjectId(newId)

            // ProjectSection
            // Update assignedMemberId
            const psUpdate1 = await ProjectSection.updateMany(
                { assignedMemberId: oldObjectId },
                { $set: { assignedMemberId: newObjectId } }
            )
            migrationResults.referencesUpdated.projectSections += psUpdate1.modifiedCount

            // Update assignedMembers map values is harder in bulk, iterate if needed or use specific query
            // Mongoose Map support in updateMany is tricky for values. 
            // We'll iterate all sections that have this member in the map
            // Use aggregation to find docs where any value in assignedMembers is oldObjectId?
            // For Simplicity in this script, we'll fetch sections with map.

            // DesignDetails
            // Details is a Map of objects with assignedMemberId.
            const designs = await DesignDetails.find({})
            for (const doc of designs) {
                let modified = false
                if (doc.details) {
                    for (const key of doc.details.keys()) {
                        const item = doc.details.get(key)
                        if (item?.assignedMemberId?.toString() === oldId) {
                            item.assignedMemberId = newObjectId
                            modified = true
                        }
                    }
                }
                if (modified) {
                    await doc.save()
                    migrationResults.referencesUpdated.designDetails++
                }
            }

            // ContractingDetails
            const contractings = await ContractingDetails.find({})
            for (const doc of contractings) {
                let modified = false
                if (doc.details) {
                    for (const key of doc.details.keys()) {
                        const item = doc.details.get(key)
                        if (item?.assignedMemberId?.toString() === oldId) {
                            item.assignedMemberId = newObjectId
                            modified = true
                        }
                    }
                }
                if (modified) {
                    await doc.save()
                    migrationResults.referencesUpdated.contractingDetails++
                }
            }

            // ConsultationDetails
            const consultations = await ConsultationDetails.find({})
            for (const doc of consultations) {
                let modified = false
                if (doc.details) {
                    for (const key of doc.details.keys()) {
                        const item = doc.details.get(key)
                        if (item?.assignedMemberId?.toString() === oldId) {
                            item.assignedMemberId = newObjectId
                            modified = true
                        }
                    }
                }
                if (modified) {
                    await doc.save()
                    migrationResults.referencesUpdated.consultationDetails++
                }
            }


            // CollaborationDetails
            // assignedMemberId (simple field)
            const colUpdate1 = await CollaborationDetails.updateMany(
                { assignedMemberId: oldObjectId },
                { $set: { assignedMemberId: newObjectId } }
            )
            migrationResults.referencesUpdated.collaborationDetails += colUpdate1.modifiedCount

            // assignedMembers (map)
            const collaborations = await CollaborationDetails.find({})
            for (const doc of collaborations) {
                let modified = false
                if (doc.assignedMembers) {
                    for (const key of doc.assignedMembers.keys()) {
                        if (doc.assignedMembers.get(key)?.toString() === oldId) {
                            doc.assignedMembers.set(key, newObjectId)
                            modified = true
                        }
                    }
                }
                if (modified) {
                    await doc.save()
                    migrationResults.referencesUpdated.collaborationDetails++ // Counting docs modified
                }
            }


            // PurchaseDetails
            // assignedMemberId (simple field)
            const purUpdate1 = await PurchaseDetails.updateMany(
                { assignedMemberId: oldObjectId },
                { $set: { assignedMemberId: newObjectId } }
            )
            migrationResults.referencesUpdated.purchaseDetails += purUpdate1.modifiedCount

            // assignedMembers (map)
            const purchases = await PurchaseDetails.find({})
            for (const doc of purchases) {
                let modified = false
                if (doc.assignedMembers) {
                    for (const key of doc.assignedMembers.keys()) {
                        if (doc.assignedMembers.get(key)?.toString() === oldId) {
                            doc.assignedMembers.set(key, newObjectId)
                            modified = true
                        }
                    }
                }
                if (modified) {
                    await doc.save()
                    migrationResults.referencesUpdated.purchaseDetails++
                }
            }

            // SaleDetails
            // assignedMemberId (simple field)
            const saleUpdate1 = await SaleDetails.updateMany(
                { assignedMemberId: oldObjectId },
                { $set: { assignedMemberId: newObjectId } }
            )
            migrationResults.referencesUpdated.saleDetails += saleUpdate1.modifiedCount

            // assignedMembers (map)
            const sales = await SaleDetails.find({})
            for (const doc of sales) {
                let modified = false
                if (doc.assignedMembers) {
                    for (const key of doc.assignedMembers.keys()) {
                        if (doc.assignedMembers.get(key)?.toString() === oldId) {
                            doc.assignedMembers.set(key, newObjectId)
                            modified = true
                        }
                    }
                }
                if (modified) {
                    await doc.save()
                    migrationResults.referencesUpdated.saleDetails++
                }
            }

            // EmployeeSalary
            const salaryUpdate = await EmployeeSalary.updateMany(
                { employeeId: oldObjectId },
                { $set: { employeeId: newObjectId } }
            )
            migrationResults.referencesUpdated.salaries += salaryUpdate.modifiedCount

            // UserCommission
            const commissionUpdate = await UserCommission.updateMany(
                { userId: oldObjectId },
                { $set: { userId: newObjectId } }
            )
            migrationResults.referencesUpdated.commissions += commissionUpdate.modifiedCount
        }

        // ProjectSection assignedMembers Map update (needs iteration)
        const projectSections = await ProjectSection.find({})
        for (const doc of projectSections) {
            let modified = false
            if (doc.assignedMembers) {
                for (const key of doc.assignedMembers.keys()) {
                    const val = doc.assignedMembers.get(key)
                    if (memberIdMap.has(val?.toString())) {
                        doc.assignedMembers.set(key, new mongoose.Types.ObjectId(memberIdMap.get(val.toString())))
                        modified = true
                    }
                }
            }
            if (modified) {
                await doc.save()
                migrationResults.referencesUpdated.projectSections++ // Increment for map updates
            }
        }

        return NextResponse.json({ message: "Migration completed", results: migrationResults })
    } catch (error: any) {
        console.error("Migration error:", error)
        return NextResponse.json({ message: "Migration failed", error: error.message }, { status: 500 })
    }
}
