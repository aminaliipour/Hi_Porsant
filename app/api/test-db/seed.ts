import dbConnect from "@/lib/db";
import { CollaborationDetails } from "@/lib/models/collaboration-details.model";

async function seedDatabase() {
  await dbConnect();

  const sampleData = [
    {
      sectionId: "645a1b2c3d4e5f6789012345",
      itemName: "Sample Item 1",
      details: {
        field1: { value: 1000, isActive: true },
        field2: { value: 2000, isActive: true },
      },
      assignedMemberId: "645a1b2c3d4e5f6789012346",
      assignedMembers: {
        member1: "645a1b2c3d4e5f6789012346",
      },
    },
    {
      sectionId: "645a1b2c3d4e5f6789012347",
      itemName: "Sample Item 2",
      details: {
        field1: { value: 1500, isActive: true },
        field2: { value: 2500, isActive: true },
      },
      assignedMemberId: "645a1b2c3d4e5f6789012348",
      assignedMembers: {
        member1: "645a1b2c3d4e5f6789012348",
      },
    },
  ];

  try {
    await CollaborationDetails.insertMany(sampleData);
    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seedDatabase();