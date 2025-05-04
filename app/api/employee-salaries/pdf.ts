import { NextRequest, NextResponse } from "next/server"
import PdfPrinter from "pdfmake"
import { TDocumentDefinitions, Alignment } from "pdfmake/interfaces"
import path from "path"
import fs from "fs"

interface Assignment {
  projectName: string
  sectionName: string
  itemName?: string
  fieldName: string
  commission: number
}

interface RequestBody {
  employeeId: string
  employeeName: string
  position: string
  baseSalary: number
  additions: number
  deductions: number
  totalCommission: number
  totalPayment: number
  assignments: Assignment[]
  date: string
}

const loadBase64Image = (filepath: string): string | null => {
  try {
    if (fs.existsSync(filepath)) {
      const imageBuffer = fs.readFileSync(filepath)
      return `data:image/png;base64,${imageBuffer.toString('base64')}`
    }
  } catch (error) {
    console.error(`Error loading image from ${filepath}:`, error)
  }
  return null
}

// Add GET endpoint for testing
export async function GET() {
  return new Response(JSON.stringify({ status: "PDF route is working" }), {
    headers: { "Content-Type": "application/json" },
  })
}

export const POST = async (request: NextRequest) => {
  console.log("PDF endpoint hit")
  try {
    const body: RequestBody = await request.json()
    console.log("Request body received:", body)

    // تعریف فونت‌ها
    const fontsPath = path.join(process.cwd(), 'public', 'fonts')
    console.log("Fonts path:", fontsPath)
    const fonts = {
      IRANSans: {
        normal: path.join(fontsPath, 'IRANSansWeb.ttf'),
        bold: path.join(fontsPath, 'IRANSansWeb.ttf'),
      }
    }

    // ایجاد printer با فونت‌های تعریف شده
    const printer = new PdfPrinter(fonts)

    // بارگذاری لوگو
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    const logoData = loadBase64Image(logoPath)

    // تعریف استایل‌های مورد نیاز
    const styles = {
      header: {
        fontSize: 20,
        bold: true,
        alignment: 'right' as Alignment,
        margin: [0, 0, 0, 20] as [number, number, number, number]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        alignment: 'right' as Alignment,
        margin: [0, 10, 0, 5] as [number, number, number, number]
      },
      tableHeader: {
        fontSize: 12,
        bold: true,
        alignment: 'right' as Alignment
      },
      defaultStyle: {
        font: 'IRANSans',
        alignment: 'right' as Alignment,
        fontSize: 10
      }
    }

    // آماده‌سازی محتوای پورسانت‌ها
    const commissionContent = []
    const projectGroups = groupBy(body.assignments, "projectName")
    
    for (const [projectName, assignments] of Object.entries(projectGroups)) {
      commissionContent.push(
        { text: `پروژه: ${projectName}`, style: 'subheader', color: '#2563eb' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'شرح', style: 'tableHeader' },
                { text: 'مبلغ (ریال)', style: 'tableHeader' }
              ],
              ...assignments.map(assignment => [
                {
                  text: assignment.itemName
                    ? `${assignment.sectionName} - ${assignment.itemName} - ${assignment.fieldName}`
                    : `${assignment.sectionName} - ${assignment.fieldName}`,
                  alignment: 'right' as Alignment
                },
                {
                  text: formatMoney(assignment.commission),
                  alignment: 'left' as Alignment
                }
              ])
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb',
          },
          margin: [0, 5, 0, 15] as [number, number, number, number]
        }
      )
    }

    // تعریف ساختار سند
    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        ...styles.defaultStyle,
        alignment: 'right' as Alignment
      },
      content: [
        // لوگو
        ...(logoData ? [{
          image: logoData,
          width: 70,
          alignment: 'left' as Alignment,
          margin: [0, 0, 0, 20] as [number, number, number, number]
        }] : []),
        
        // عنوان
        {
          text: 'فیش حقوق و دستمزد',
          style: 'header'
        },

        // اطلاعات کارمند
        {
          layout: 'noBorders',
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [[
              { text: `نام و نام خانوادگی: ${body.employeeName}`, alignment: 'right' as Alignment },
              { text: `سمت: ${body.position}`, alignment: 'right' as Alignment },
              { text: `تاریخ: ${body.date}`, alignment: 'right' as Alignment }
            ]]
          },
          margin: [0, 0, 0, 20] as [number, number, number, number]
        },

        // حقوق و مزایا
        {
          text: 'حقوق و مزایا',
          style: 'subheader'
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'حقوق پایه (ریال)', style: 'tableHeader' },
                { text: 'اضافات (ریال)', style: 'tableHeader' },
                { text: 'کسورات (ریال)', style: 'tableHeader' }
              ],
              [
                { text: formatMoney(body.baseSalary), alignment: 'left' as Alignment },
                { text: formatMoney(body.additions), alignment: 'left' as Alignment },
                { text: formatMoney(body.deductions), alignment: 'left' as Alignment }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb',
          },
          margin: [0, 5, 0, 20] as [number, number, number, number]
        },

        // بخش پورسانت‌ها
        {
          text: 'جزئیات پورسانت‌ها',
          style: 'subheader'
        },
        ...commissionContent,

        // جمع‌بندی نهایی
        {
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [{
                text: `مجموع پورسانت‌ها: ${formatMoney(body.totalCommission)} ریال`,
                alignment: 'right' as Alignment,
                color: '#2563eb',
                bold: true
              }],
              [{
                text: `مجموع کل پرداختی: ${formatMoney(body.totalPayment)} ریال`,
                alignment: 'right' as Alignment,
                color: '#dc2626',
                bold: true,
                fontSize: 14
              }]
            ]
          },
          margin: [0, 10, 0, 20] as [number, number, number, number]
        },

        // امضاها
        {
          columns: [
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }] },
                { text: 'امضای کارمند', alignment: 'center' as Alignment, margin: [0, 5, 0, 0] }
              ]
            },
            { width: '*', text: '' },
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }] },
                { text: 'امضای مدیر', alignment: 'center' as Alignment, margin: [0, 5, 0, 0] }
              ]
            }
          ],
          margin: [0, 40, 0, 0] as [number, number, number, number]
        }
      ],
      styles
    }

    // ایجاد PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition)
    
    // تبدیل به Buffer و ارسال پاسخ
    return new Promise((resolve, reject) => {
      try {
        const chunks: any[] = []
        pdfDoc.on('data', chunk => chunks.push(chunk))
        pdfDoc.on('end', () => {
          const result = Buffer.concat(chunks)
          resolve(new Response(result, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename=salary_report_${body.employeeName}.pdf`,
            },
          }))
        })
        pdfDoc.end()
      } catch (error) {
        reject(error)
      }
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: "خطا در تولید فایل PDF", details: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

function formatMoney(amount: number): string {
  try {
    return amount.toLocaleString("fa-IR")
  } catch (error) {
    console.error("Error in formatMoney:", error)
    return amount.toLocaleString()
  }
}

function groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
  return array.reduce((result, item) => {
    const group = item[key] as string
    result[group] = [...(result[group] || []), item]
    return result
  }, {} as { [key: string]: T[] })
}
