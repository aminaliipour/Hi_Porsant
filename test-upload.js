// تست API آپلود فیش حقوقی
// این فایل فقط برای تست محلی است

const testUpload = async () => {
  try {
    const response = await fetch('/api/upload-payslip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: 'test-id-123',
        pdfData: 'data:application/pdf;base64,JVBERi0xLjMKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL0xlbmd0aCA1MDYKL0ZpbHRlciAvRmxhdGVEZWNvZGUKPj4Kc3RyZWFtCg==',
        fileName: 'test-payslip.pdf'
      })
    })
    
    const result = await response.json()
    console.log('Upload result:', result)
    
  } catch (error) {
    console.error('Upload error:', error)
  }
}

// برای تست در browser console
// testUpload()

export { testUpload }