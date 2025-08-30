"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/number-input"
import { Trash2, Plus } from "lucide-react"

interface Deduction {
  title: string
  amount: number
}

interface DeductionsDialogProps {
  deductions: Deduction[]
  onDeductionsChange: (deductions: Deduction[]) => void
  children: React.ReactNode
}

export function DeductionsDialog({ deductions, onDeductionsChange, children }: DeductionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localDeductions, setLocalDeductions] = useState<Deduction[]>(deductions)

  const addNewDeduction = () => {
    console.log("Adding new deduction")
    const newDeduction = { title: "", amount: 0 }
    setLocalDeductions([...localDeductions, newDeduction])
  }

  const removeDeduction = (index: number) => {
    console.log("Removing deduction at index:", index)
    const newDeductions = localDeductions.filter((_, i) => i !== index)
    setLocalDeductions(newDeductions)
  }

  const updateDeductionTitle = (index: number, title: string) => {
    console.log("Updating deduction title:", title)
    const newDeductions = [...localDeductions]
    if (newDeductions[index]) {
      newDeductions[index].title = title
      setLocalDeductions(newDeductions)
    }
  }

  const updateDeductionAmount = (index: number, amount: number) => {
    console.log("Updating deduction amount:", amount)
    const newDeductions = [...localDeductions]
    if (newDeductions[index]) {
      newDeductions[index].amount = amount
      setLocalDeductions(newDeductions)
    }
  }

  const handleSave = () => {
    console.log("Saving deductions:", localDeductions)
    onDeductionsChange(localDeductions)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setLocalDeductions(deductions)
    setIsOpen(false)
  }

  const totalDeductions = localDeductions.reduce((sum, deduction) => sum + deduction.amount, 0)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>مدیریت کسورات</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button onClick={addNewDeduction} className="flex items-center gap-2">
              <Plus size={16} />
              افزودن کسر
            </Button>
            <div className="text-sm text-gray-600">
              مجموع: {totalDeductions.toLocaleString()} تومان
            </div>
          </div>

          {localDeductions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              هیچ کسری وجود ندارد
            </div>
          ) : (
            <div className="space-y-3">
              {localDeductions.map((deduction, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Input
                      placeholder="عنوان کسر"
                      value={deduction.title}
                      onChange={(e) => updateDeductionTitle(index, e.target.value)}
                      className="mb-2"
                    />
                    <NumberInput
                      value={deduction.amount}
                      onChange={(value) => updateDeductionAmount(index, value)}
                      placeholder="مبلغ"
                      className="w-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDeduction(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              انصراف
            </Button>
            <Button onClick={handleSave}>
              ذخیره
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
