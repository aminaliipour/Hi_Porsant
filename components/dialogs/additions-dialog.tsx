"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/number-input"
import { Trash2, Plus } from "lucide-react"

interface Addition {
  title: string
  amount: number
}

interface AdditionsDialogProps {
  additions: Addition[]
  onAdditionsChange: (additions: Addition[]) => void
  children: React.ReactNode
}

export function AdditionsDialog({ additions, onAdditionsChange, children }: AdditionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localAdditions, setLocalAdditions] = useState<Addition[]>(additions)

  const addNewAddition = () => {
    console.log("Adding new addition")
    const newAddition = { title: "", amount: 0 }
    setLocalAdditions([...localAdditions, newAddition])
  }

  const removeAddition = (index: number) => {
    console.log("Removing addition at index:", index)
    const newAdditions = localAdditions.filter((_, i) => i !== index)
    setLocalAdditions(newAdditions)
  }

  const updateAdditionTitle = (index: number, title: string) => {
    console.log("Updating addition title:", title)
    const newAdditions = [...localAdditions]
    if (newAdditions[index]) {
      newAdditions[index].title = title
      setLocalAdditions(newAdditions)
    }
  }

  const updateAdditionAmount = (index: number, amount: number) => {
    console.log("Updating addition amount:", amount)
    const newAdditions = [...localAdditions]
    if (newAdditions[index]) {
      newAdditions[index].amount = amount
      setLocalAdditions(newAdditions)
    }
  }

  const handleSave = () => {
    console.log("Saving additions:", localAdditions)
    onAdditionsChange(localAdditions)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setLocalAdditions(additions)
    setIsOpen(false)
  }

  const totalAdditions = localAdditions.reduce((sum, addition) => sum + addition.amount, 0)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>مدیریت اضافات</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button onClick={addNewAddition} className="flex items-center gap-2">
              <Plus size={16} />
              افزودن اضافه
            </Button>
            <div className="text-sm text-gray-600">
              مجموع: {totalAdditions.toLocaleString()} تومان
            </div>
          </div>

          {localAdditions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              هیچ اضافه‌ای وجود ندارد
            </div>
          ) : (
            <div className="space-y-3">
              {localAdditions.map((addition, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Input
                      placeholder="عنوان اضافه"
                      value={addition.title}
                      onChange={(e) => updateAdditionTitle(index, e.target.value)}
                      className="mb-2"
                    />
                    <NumberInput
                      value={addition.amount}
                      onChange={(value) => updateAdditionAmount(index, value)}
                      placeholder="مبلغ"
                      className="w-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeAddition(index)}
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
