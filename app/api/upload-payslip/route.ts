import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { TeamMember } from "@/lib/models"
import { Client } from "ssh2"
import path from "path"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employeeId, pdfData, fileName } = body

    if (!employeeId || !pdfData || !fileName) {
      return NextResponse.json(
        { error: "اطلاعات کامل ارسال نشده است" },
        { status: 400 }
      )
    }

    // اتصال به دیتابیس برای دریافت کد ملی
    await dbConnect()
    const employee = await TeamMember.findById(employeeId)
    
    if (!employee) {
      return NextResponse.json(
        { error: "کارمند یافت نشد" },
        { status: 404 }
      )
    }

    if (!employee.nationalCode) {
      return NextResponse.json(
        { error: "کد ملی کارمند موجود نیست" },
        { status: 400 }
      )
    }

    // تنظیمات اتصال SSH به VPS
    const sshConfig = {
      host: '62.60.198.209',
      port: 22,
      username: 'root',
      password: '1muys'
    }

    // تبدیل base64 به buffer
    const pdfBuffer = Buffer.from(pdfData.split(',')[1], 'base64')

    return new Promise((resolve, reject) => {
      const conn = new Client()
      let isResolved = false

      const cleanup = () => {
        if (!isResolved) {
          isResolved = true
          try {
            conn.end()
          } catch (e) {
            console.log('Cleanup error:', e)
          }
        }
      }

      const resolveWithCleanup = (response: any) => {
        if (!isResolved) {
          isResolved = true
          cleanup()
          resolve(response)
        }
      }

      // Timeout بعد از 45 ثانیه
      setTimeout(() => {
        if (!isResolved) {
          console.error('SSH operation timeout after 45 seconds')
          resolveWithCleanup(NextResponse.json(
            { error: "عملیات آپلود timeout شد - لطفاً دوباره تلاش کنید" },
            { status: 500 }
          ))
        }
      }, 45000)

      conn.on('ready', () => {
        console.log('SSH Connection established to VPS')

        // مسیر پوشه اصلی در VPS
        const basePath = '/root/hiarchitectweb/public/files'
        const employeeFolderPath = path.posix.join(basePath, employee.nationalCode)
        const fullFilePath = path.posix.join(employeeFolderPath, fileName)

        console.log('Target directory:', employeeFolderPath)
        console.log('Target file path:', fullFilePath)

        // ایجاد پوشه کد ملی اگر موجود نباشد
        conn.exec(`mkdir -p "${employeeFolderPath}" && echo "Directory created successfully"`, (err: any, stream: any) => {
          if (err) {
            console.error('Error creating directory:', err)
            resolveWithCleanup(NextResponse.json(
              { error: "خطا در ایجاد پوشه روی سرور VPS" },
              { status: 500 }
            ))
            return
          }

          let output = ''
          let errorOutput = ''

          stream.on('data', (data: any) => {
            output += data.toString()
          })

          stream.stderr.on('data', (data: any) => {
            errorOutput += data.toString()
          })

          stream.on('close', (code: number) => {
            console.log('Directory creation completed with code:', code)
            console.log('Output:', output)
            if (errorOutput) console.log('Error output:', errorOutput)

            if (code !== 0) {
              console.error('Directory creation failed with code:', code)
              resolveWithCleanup(NextResponse.json(
                { error: `خطا در ایجاد پوشه روی VPS: ${errorOutput}` },
                { status: 500 }
              ))
              return
            }

            console.log('Starting SFTP connection for file upload...')
            // آپلود فایل PDF با SFTP
            conn.sftp((err: any, sftp: any) => {
              if (err) {
                console.error('SFTP connection error:', err)
                resolveWithCleanup(NextResponse.json(
                  { error: "خطا در اتصال SFTP به VPS" },
                  { status: 500 }
                ))
                return
              }

              console.log('SFTP connected, uploading file to VPS:', fullFilePath)
              
              sftp.writeFile(fullFilePath, pdfBuffer, (err: any) => {
                if (err) {
                  console.error('File write error on VPS:', err)
                  resolveWithCleanup(NextResponse.json(
                    { error: "خطا در نوشتن فایل روی VPS" },
                    { status: 500 }
                  ))
                  return
                }

                console.log('File uploaded successfully to VPS:', fullFilePath)
                resolveWithCleanup(NextResponse.json({
                  success: true,
                  message: "فیش حقوقی با موفقیت به VPS آپلود شد",
                  filePath: fullFilePath,
                  url: `https://hiarchitectweb.com/files/${employee.nationalCode}/${fileName}`,
                  vpsPath: fullFilePath
                }))
              })
            })
          })
        })
      })

      conn.on('error', (err: any) => {
        console.error('SSH connection error to VPS:', err)
        resolveWithCleanup(NextResponse.json(
          { error: `خطا در اتصال به VPS: ${err.message}` },
          { status: 500 }
        ))
      })

      conn.on('close', () => {
        console.log('SSH connection to VPS closed')
      })

      // برقراری اتصال SSH
      try {
        console.log('Connecting to VPS...')
        conn.connect(sshConfig)
      } catch (err: any) {
        console.error('SSH connect error:', err)
        resolveWithCleanup(NextResponse.json(
          { error: "خطا در برقراری اتصال SSH به VPS" },
          { status: 500 }
        ))
      }
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "خطا در آپلود فایل" },
      { status: 500 }
    )
  }
}