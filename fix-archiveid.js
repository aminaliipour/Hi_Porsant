// اسکریپت اصلاح archiveId بخش‌های پروژه بر اساس پروژه والد
const mongoose = require('mongoose')

async function main() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hiporsant'
  await mongoose.connect(MONGO_URI)

  const Project = require('./lib/models/project.model').Project
  const ProjectSection = require('./lib/models/project-section.model').ProjectSection

  // پیدا کردن همه بخش‌هایی که archiveId ندارند
  const sections = await ProjectSection.find({ $or: [{ archiveId: { $exists: false } }, { archiveId: null }] })
  let updated = 0
  for (const section of sections) {
    const project = await Project.findById(section.projectId)
    if (project && project.archiveId) {
      section.archiveId = project.archiveId
      await section.save()
      updated++
    } else {
      console.warn(`ProjectSection ${section._id} parent project has no archiveId!`)
    }
  }
  console.log(`${updated} ProjectSection updated.`)
  await mongoose.disconnect()
  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
