import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { formatNumber } from "@/lib/utils"

interface ProjectTaxDialogProps {
  isOpen: boolean
  onClose: () => void
  project: any
  onSuccess?: () => void
}

export function ProjectTaxDialog({
  isOpen,
  onClose,
  project,
  onSuccess,
}: ProjectTaxDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [taxPercentage, setTaxPercentage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/project-tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project._id,
          taxPercentage: Number(taxPercentage),
        }),
      })

      if (!response.ok) throw new Error()

      toast({
        title: "موفق",
        description: "مالیات پروژه با موفقیت ثبت شد",
      })
      onSuccess?.()
      onClose()
    } catch {
      toast({
        title: "خطا",
        description: "خطا در ثبت مالیات پروژه",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعیین درصد مالیات پروژه {project?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">درصد مالیات</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={taxPercentage}
              onChange={(e) => setTaxPercentage(e.target.value)}
              placeholder="مثال: 10"
              required
            />
          </div>
          {project?.totalIncome > 0 && (
            <div className="text-sm">
              <p>درآمد کل پروژه: {formatNumber(project.totalIncome)} تومان</p>
              <p className="mt-1">
                مبلغ مالیات:{" "}
                {formatNumber((project.totalIncome * Number(taxPercentage)) / 100)}{" "}
                تومان
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={loading}>
              ثبت
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}