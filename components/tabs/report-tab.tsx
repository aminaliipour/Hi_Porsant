"use client"

import { useState, useEffect } from 'react'
import ReportSummary from "./report-summary"
import ReportPdfButton from "./report-pdf-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TeamMember {
  _id: string
  fullName: string
  position: string
  fatherName: string
  nationalCode: string
  phoneNumber: string
  email?: string
  education?: string
  address?: string
}

interface EmployeeSalary {
  employeeId: string
  employeeName: string
  baseSalary: number
  commission: number
  additions: Array<{title: string, amount: number}>
  deductions: Array<{title: string, amount: number}>
  taxDeduction: number
  isPorsanti?: boolean
  salary1?: number
  salary2?: number
  salary1Base?: number
  insuranceDeduction?: boolean
  uniqueKey?: string
}

export default function ReportTab() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [employeeSalaries, setEmployeeSalaries] = useState<EmployeeSalary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeArchiveId, setActiveArchiveId] = useState<string | null>(null)
  const [summary, setSummary] = useState<{
    totalCommission: number,
    totalRawIncome: number,
    totalSystemShare: number,
    totalOfficeShare: number,
    netSystemShare: number
  } | null>(null)

  useEffect(() => {
    // دریافت آرشیو فعال
    const getActiveArchive = () => {
      const activeArchive = localStorage.getItem("activeArchive")
      if (activeArchive) {
        const archive = JSON.parse(activeArchive)
        setActiveArchiveId(archive._id)
      }
    }
    
    getActiveArchive()
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // دریافت آرشیو فعال
      const activeArchive = localStorage.getItem("activeArchive")
      let currentArchiveId = null
      if (activeArchive) {
        currentArchiveId = JSON.parse(activeArchive)._id
        console.log("Active archive ID:", currentArchiveId)
        setActiveArchiveId(currentArchiveId)
      } else {
        console.log("No active archive found")
      }
      
      // دریافت تمام اعضای تیم
      console.log("Fetching team members...")
      const teamUrl = currentArchiveId 
        ? `/api/team-members?archiveId=${currentArchiveId}`
        : '/api/team-members'
      const teamResponse = await fetch(teamUrl)
      const teamData = await teamResponse.json()
      console.log("Team data received:", teamData)
      setTeamMembers(teamData)
      
  // دریافت پورسانت‌های کاربران - استفاده از API های جداگانه برای هر کاربر
      console.log("Fetching user commissions individually...")
      const userCommissions: Array<{userId: string, totalCommission: number}> = []
      
      for (const member of teamData) {
        try {
          const commissionUrl = currentArchiveId 
            ? `/api/user-commissions/${member._id}?archiveId=${currentArchiveId}`
            : `/api/user-commissions/${member._id}`
          
          const commissionResponse = await fetch(commissionUrl)
          if (commissionResponse.ok) {
            const commissions = await commissionResponse.json()
            
            // محاسبه مجموع پورسانت فعال
            const totalCommission = commissions
              .filter((c: any) => c.isActive !== false)
              .reduce((sum: number, c: any) => sum + (c.commission || 0), 0)
            
            userCommissions.push({
              userId: member._id,
              totalCommission
            })
            
            console.log(`Commission for ${member.fullName}:`, totalCommission)
          } else {
            userCommissions.push({
              userId: member._id,
              totalCommission: 0
            })
          }
        } catch (error) {
          console.error(`Error fetching commission for ${member.fullName}:`, error)
          userCommissions.push({
            userId: member._id,
            totalCommission: 0
          })
        }
      }
      
      // دریافت اطلاعات پروژه‌ها برای محاسبه درآمد و سهم سیستم و دفتر
      let totalRawIncome = 0;
      let totalSystemShare = 0;
      let totalOfficeShare = 0;
      try {
        const projectIncomeUrl = currentArchiveId
          ? `/api/project-incomes?archiveId=${currentArchiveId}`
          : '/api/project-incomes';
        const projectIncomeRes = await fetch(projectIncomeUrl);
        if (projectIncomeRes.ok) {
          const projectIncomes = await projectIncomeRes.json();
          totalRawIncome = projectIncomes.reduce((sum: number, p: any) => sum + (p.totalRawIncome || 0), 0);
          totalSystemShare = projectIncomes.reduce((sum: number, p: any) => sum + (p.totalSystemShare || 0), 0);
          totalOfficeShare = projectIncomes.reduce((sum: number, p: any) => sum + (p.totalIncome || 0), 0);
        }
      } catch (err) {
        console.error('Error fetching project incomes:', err);
      }

      // دریافت تمام حقوق‌های ثبت شده
      console.log("Fetching all salary records...")
      const salaryUrl = currentArchiveId 
        ? `/api/all-salaries?archiveId=${currentArchiveId}`
        : '/api/all-salaries'
      
      const salaryResponse = await fetch(salaryUrl)
      console.log("Salary response status:", salaryResponse.status)
      
      if (salaryResponse.ok) {
        const allSalaries = await salaryResponse.json()
        console.log("All salaries received:", allSalaries)
        
        // برای هر عضو تیم، بررسی می‌کنیم که آیا حقوق دارد یا نه
        const employeeSalariesWithNames = teamData.map((member: TeamMember, index: number) => {
          // پیدا کردن حقوق این عضو
          const memberSalary = allSalaries.find((salary: any) => 
            salary.employeeId?.toString() === member._id?.toString()
          )
          
          // محاسبه مجموع پورسانت این عضو از تمام پروژه‌ها
          const memberCommission = userCommissions.find((commission) => 
            commission.userId?.toString() === member._id?.toString()
          )
          
          const totalCommission = memberCommission?.totalCommission || 0
          
          console.log(`Commission for ${member.fullName}:`, totalCommission)
          
          return {
            employeeId: member._id,
            employeeName: member.fullName,
            baseSalary: memberSalary?.baseSalary || 0,
            commission: totalCommission, // پورسانت محاسبه شده از پروژه‌ها
            additions: memberSalary?.additions || [],
            deductions: memberSalary?.deductions || [],
            taxDeduction: memberSalary?.taxDeduction || 0,
            isPorsanti: memberSalary?.isPorsanti || false,
            salary1: memberSalary?.salary1 || 0,
            salary2: memberSalary?.salary2 || 0,
            salary1Base: memberSalary?.salary1Base || 133911989, // مبلغ حقوق پایه هر شخص
            insuranceDeduction: memberSalary?.insuranceDeduction ?? true, // وضعیت کسر بیمه
            uniqueKey: `${member._id}-${index}`
          }
        })
        
        // فیلتر کردن کاربرانی که تمام مقادیرشان صفر است
        const filteredEmployeeSalaries = employeeSalariesWithNames.filter(hasNonZeroValues);
        
        console.log("Final salary results (before filter):", employeeSalariesWithNames)
        console.log("Final salary results (after filter):", filteredEmployeeSalaries)
        setEmployeeSalaries(filteredEmployeeSalaries)
        // محاسبه جمع کل پورسانت‌ها و حقوق پایه و بیمه برای خلاصه
  const totalCommission = filteredEmployeeSalaries.reduce((sum: number, s: any) => {
    if (s.isPorsanti) {
      return sum + (s.salary2 || 0);
    }
    return sum + (s.commission || 0);
  }, 0);
  const totalBaseSalary = filteredEmployeeSalaries.reduce((sum: number, s: any) => {
    if (s.isPorsanti) {
      const salary1Base = s.salary1Base || 133911989;
      return sum + salary1Base;
    }
    return sum + (s.baseSalary || 0);
  }, 0);
  const totalEmployeeInsurance = filteredEmployeeSalaries.reduce((sum: number, s: any) => {
    if (!s.insuranceDeduction) return sum;
    if (s.isPorsanti) {
      const salary1Base = s.salary1Base || 133911989;
      return sum + Math.round(salary1Base * 0.07);
    }
    return sum + calculateEmployeeInsurance(s.baseSalary || 0);
  }, 0);
        // سهم خالص سیستم = سهم سیستم - (حقوق پایه + بیمه کارمند)
        const netSystemShare = totalSystemShare - (totalBaseSalary + totalEmployeeInsurance);
        setSummary({
          totalCommission,
          totalRawIncome,
          totalSystemShare,
          totalOfficeShare,
          netSystemShare
        });
      } else {
        console.error("Failed to fetch salary data, showing team members with commission data")
        // اگر حقوق دریافت نشد، فقط اعضای تیم را با پورسانت‌ها نمایش بده
        const teamMembersWithCommission = teamData.map((member: TeamMember, index: number) => {
          // محاسبه مجموع پورسانت این عضو
          const memberCommission = userCommissions.find((commission) => 
            commission.userId?.toString() === member._id?.toString()
          )
          
          const totalCommission = memberCommission?.totalCommission || 0
          
          return {
            employeeId: member._id,
            employeeName: member.fullName,
            baseSalary: 0,
            commission: totalCommission,
            additions: [],
            deductions: [],
            taxDeduction: 0,
            uniqueKey: `${member._id}-${index}`
          }
        })
        
        // فیلتر کردن کاربرانی که تمام مقادیرشان صفر است
        const filteredTeamMembersWithCommission = teamMembersWithCommission.filter(hasNonZeroValues);
        
        setEmployeeSalaries(filteredTeamMembersWithCommission)
        // اگر حقوق دریافت نشد، فقط جمع پورسانت را نمایش بده
  const totalCommission = filteredTeamMembersWithCommission.reduce((sum: number, s: any) => sum + (s.commission || 0), 0);
        setSummary({
          totalCommission,
          totalRawIncome,
          totalSystemShare,
          totalOfficeShare,
          netSystemShare: totalSystemShare // چون حقوق نداریم، همان سهم سیستم
        });
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setEmployeeSalaries([])
    } finally {
      setLoading(false)
    }
  }

  // محاسبه حق بیمه 7% (سهم کارمند)
  const calculateEmployeeInsurance = (baseSalary: number) => {
    return Math.round(baseSalary * 0.07)
  }

  // محاسبه حق بیمه 23% (سهم دفتر)
  const calculateOfficeInsurance = (baseSalary: number) => {
    return Math.round(baseSalary * 0.23)
  }

  // محاسبه کل حق بیمه
  const calculateTotalInsurance = (baseSalary: number) => {
    return calculateEmployeeInsurance(baseSalary) + calculateOfficeInsurance(baseSalary)
  }

  // بررسی اینکه آیا کاربر مقادیر غیرصفر دارد یا نه
  const hasNonZeroValues = (salary: any) => {
    const baseSalary = salary.baseSalary || 0;
    const commission = salary.commission || 0;
    const totalAdditions = salary.additions?.reduce((sum: number, addition: any) => sum + (addition.amount || 0), 0) || 0;
    const totalDeductions = salary.deductions?.reduce((sum: number, deduction: any) => sum + (deduction.amount || 0), 0) || 0;
    
    // اگر هر یک از مقادیر غیرصفر باشد، true برگردان
    return baseSalary > 0 || commission > 0 || totalAdditions > 0 || totalDeductions > 0;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">در حال بارگذاری...</div>
      </div>
    )
  }

  return (
  <div className="space-y-6 max-w-5xl mx-auto px-2 font-iran text-base" id="report-main-container">
      <Card className="shadow-lg">
        <CardHeader className="font-iran">
          <CardTitle className="font-iransans report-title text-2xl font-bold text-right">گزارش حقوق و دستمزد</CardTitle>
          <CardDescription className="font-iran text-right">
            گزارش کامل حقوق پایه، پورسانت و حق بیمه تمامی اعضای تیم
          </CardDescription>
        </CardHeader>
  <CardContent className="font-iran">
          <div id="report-table" className="overflow-x-auto font-iran">
            <Table className="font-iran">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نام کارمند</TableHead>
                  <TableHead className="text-right">حقوق پایه</TableHead>
                  <TableHead className="text-right">حقوق پایه نهایی</TableHead>
                      <TableHead className="text-right">مجموع اضافات</TableHead>
                      <TableHead className="text-right">کسورات نهایی</TableHead>
                  <TableHead className="text-right">پورسانت</TableHead>
                  <TableHead className="text-right">حقوق دوم</TableHead>
                  <TableHead className="text-right">حق بیمه (7%)</TableHead>
                  <TableHead className="text-right">حق بیمه دفتر (23%)</TableHead>
                  <TableHead className="text-right">حق بیمه کل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeSalaries.map((salary, index) => {
                  const baseSalary = salary.baseSalary || 0;
                  const commission = salary.commission || 0;
                  
                  // محاسبه مجموع اضافات
                  const totalAdditions = salary.additions?.reduce((sum, addition) => sum + (addition.amount || 0), 0) || 0;

                  // محاسبه مجموع کسورات
                  const totalDeductions = salary.deductions?.reduce((sum, deduction) => sum + (deduction.amount || 0), 0) || 0;

                  // اگر کاربر پورسانتی است
                  if (salary.isPorsanti) {
                    const salary1 = salary.salary1 || 0;
                    const salary2 = salary.salary2 || 0;
                    const salary1Base = salary.salary1Base || 133911989;
                    const salary1Insurance = salary.insuranceDeduction ? Math.round(salary1Base * 0.07) : 0;
                    const officeSalary1Insurance = salary.insuranceDeduction ? Math.round(salary1Base * 0.23) : 0;
                    const totalSalary1Insurance = salary1Insurance + officeSalary1Insurance;
                    
                    // محاسبه حقوق دوم (پورسانت نهایی) برای پورسانتی (حقوق دوم + اضافات - کسورات)
                    const finalSalary2 = salary2 + totalAdditions - totalDeductions;

                    return (
                      <TableRow key={salary.uniqueKey || `${salary.employeeId}-${index}`} className="bg-blue-50 dark:bg-blue-900/20">
                        <TableCell className="font-medium">
                          {salary.employeeName || "نامشخص"}
                          <span className="text-xs text-blue-600 mr-2">(پورسانتی)</span>
                        </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">حقوق اول: {salary1Base.toLocaleString()} ریال</div>
                                <div className="text-xs text-gray-500 mt-1">(پس از کسر 7%: {salary1.toLocaleString()} ریال)</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-green-600">
                              {salary1.toLocaleString()} ریال
                            </TableCell>
                            <TableCell>
                              {totalAdditions.toLocaleString()} ریال
                            </TableCell>
                            <TableCell>
                              {totalDeductions.toLocaleString()} ریال
                            </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>مجموع پورسانت: {commission.toLocaleString()} ریال</div>
                            {commission < salary1 && (
                              <div className="text-xs text-orange-500 mt-1">
                                کمبود: {(salary1 - commission).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-blue-600">
                          {finalSalary2.toLocaleString()} ریال
                        </TableCell>
                        <TableCell>{salary1Insurance.toLocaleString()} ریال</TableCell>
                        <TableCell>{officeSalary1Insurance.toLocaleString()} ریال</TableCell>
                        <TableCell className="font-semibold">{totalSalary1Insurance.toLocaleString()} ریال</TableCell>
                      </TableRow>
                    );
                  }

                  // حالت عادی (غیر پورسانتی)
                  const employeeInsurance = salary.insuranceDeduction ? calculateEmployeeInsurance(baseSalary) : 0;
                  const officeInsurance = salary.insuranceDeduction ? calculateOfficeInsurance(baseSalary) : 0;
                  const totalInsurance = salary.insuranceDeduction ? calculateTotalInsurance(baseSalary) : 0;

                  // محاسبه حقوق پایه نهایی (حقوق پایه منهای 7% حق بیمه اگر فعال باشد)
                  const finalBaseSalary = baseSalary - (salary.insuranceDeduction ? employeeInsurance : 0);

                  // محاسبه پورسانت نهایی (پورسانت + اضافات - کسورات)
                  const finalCommission = commission + totalAdditions - totalDeductions;

                  return (
                    <TableRow key={salary.uniqueKey || `${salary.employeeId}-${index}`}>
                      <TableCell className="font-medium">{salary.employeeName || "نامشخص"}</TableCell>
                      <TableCell>{baseSalary.toLocaleString()} ریال</TableCell>
                      <TableCell className="font-semibold text-green-600">{finalBaseSalary.toLocaleString()} ریال</TableCell>
                      <TableCell>{totalAdditions.toLocaleString()} ریال</TableCell>
                      <TableCell>{totalDeductions.toLocaleString()} ریال</TableCell>
                      <TableCell>{commission.toLocaleString()} ریال</TableCell>
                      <TableCell className="font-semibold text-blue-600">{finalCommission.toLocaleString()} ریال</TableCell>
                      <TableCell>{employeeInsurance.toLocaleString()} ریال</TableCell>
                      <TableCell>{officeInsurance.toLocaleString()} ریال</TableCell>
                      <TableCell className="font-semibold">{totalInsurance.toLocaleString()} ریال</TableCell>
                    </TableRow>
                  );
                })}
                {/* جمع کل */}
                {employeeSalaries.length > 0 && (
                  <TableRow className="font-bold bg-gray-100 dark:bg-gray-800">
                    <TableCell className="text-right">جمع کل</TableCell>
                    <TableCell>
                      {employeeSalaries.reduce((sum, s) => {
                        if (s.isPorsanti) {
                          const salary1Base = s.salary1Base || 133911989;
                          return sum + salary1Base;
                        }
                        return sum + (s.baseSalary || 0);
                      }, 0).toLocaleString()} ریال
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {employeeSalaries.reduce((sum, s) => {
                        if (s.isPorsanti) {
                          return sum + (s.salary1 || 0);
                        }
                        const baseSalary = s.baseSalary || 0;
                        const employeeInsurance = calculateEmployeeInsurance(baseSalary);
                        return sum + (baseSalary - employeeInsurance);
                      }, 0).toLocaleString()} ریال
                    </TableCell>
                    <TableCell>
                      {employeeSalaries.reduce((sum, s) => {
                        return sum + (s.commission || 0);
                      }, 0).toLocaleString()} ریال
                    </TableCell>
                    <TableCell className="font-semibold text-blue-600">
                      {employeeSalaries.reduce((sum, s) => {
                        const totalAdditions = s.additions?.reduce((addSum, addition) => addSum + (addition.amount || 0), 0) || 0;
                        const totalDeductions = s.deductions?.reduce((dedSum, deduction) => dedSum + (deduction.amount || 0), 0) || 0;
                        
                        if (s.isPorsanti) {
                          const salary2 = s.salary2 || 0;
                          return sum + (salary2 + totalAdditions - totalDeductions);
                        }
                        const commission = s.commission || 0;
                        return sum + (commission + totalAdditions - totalDeductions);
                      }, 0).toLocaleString()} ریال
                    </TableCell>
                    <TableCell>
                      {employeeSalaries.reduce((sum, s) => {
                        const totalAdditions = s.additions?.reduce((addSum, addition) => addSum + (addition.amount || 0), 0) || 0;
                        return sum + totalAdditions;
                      }, 0).toLocaleString()} ریال
                    </TableCell>
                    <TableCell>
                      {employeeSalaries.reduce((sum, s) => {
                        const totalDeductions = s.deductions?.reduce((dedSum, deduction) => dedSum + (deduction.amount || 0), 0) || 0;
                        return sum + totalDeductions;
                      }, 0).toLocaleString()} ریال
                    </TableCell>
                    <TableCell>
                      {employeeSalaries.reduce((sum, s) => {
                        if (!s.insuranceDeduction) return sum;
                        if (s.isPorsanti) {
                          const salary1Base = s.salary1Base || 133911989;
                          return sum + Math.round(salary1Base * 0.07);
                        }
                        return sum + calculateEmployeeInsurance(s.baseSalary || 0);
                      }, 0).toLocaleString()} ریال
                    </TableCell>
                    <TableCell>
                      {employeeSalaries.reduce((sum, s) => {
                        if (!s.insuranceDeduction) return sum;
                        if (s.isPorsanti) {
                          const salary1Base = s.salary1Base || 133911989;
                          return sum + Math.round(salary1Base * 0.23);
                        }
                        return sum + calculateOfficeInsurance(s.baseSalary || 0);
                      }, 0).toLocaleString()} ریال
                    </TableCell>
                    <TableCell className="font-semibold">
                      {employeeSalaries.reduce((sum, s) => {
                        if (!s.insuranceDeduction) return sum;
                        if (s.isPorsanti) {
                          const salary1Base = s.salary1Base || 133911989;
                          return sum + Math.round(salary1Base * 0.30);
                        }
                        return sum + calculateTotalInsurance(s.baseSalary || 0);
                      }, 0).toLocaleString()} ریال
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {employeeSalaries.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              هیچ عضو تیمی یافت نشد
            </div>
          )}
        </CardContent>
      </Card>

      {/* دکمه بروزرسانی فقط در نمایش، نه در PDF */}
      <div className="flex justify-end space-x-2 font-iran no-print">
        <Button onClick={fetchData} variant="outline">
          بروزرسانی داده‌ها
        </Button>
      </div>
      {/* دکمه دانلود PDF */}
      {/* دکمه دانلود PDF فقط در نمایش، نه در PDF */}
      <div className="flex justify-end mt-4 font-iran no-print">
        <ReportPdfButton />
      </div>
      {/* بخش خلاصه */}
      {summary && (
        <ReportSummary
          totalCommission={summary.totalCommission}
          totalRawIncome={summary.totalRawIncome}
          totalSystemShare={summary.totalSystemShare}
          totalOfficeShare={summary.totalOfficeShare}
          netSystemShare={summary.netSystemShare}
        />
      )}
    </div>
  )
}
