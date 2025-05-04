"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash } from "lucide-react"
import { ItemDetailsDialog } from "@/components/dialogs/item-details-dialog"

interface ProjectSection {
  _id: string
  projectId: string
  sectionName: string
}

interface SectionItem {
  _id: string
  sectionId: string
  itemName: string
}

interface ItemsListDialogProps {
  section: ProjectSection
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ItemsListDialog({ section, open, onOpenChange }: ItemsListDialogProps) {
  const [items, setItems] = useState<SectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItemName, setNewItemName] = useState("")
  const [selectedItem, setSelectedItem] = useState<SectionItem | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchItems()
    }
  }, [open, section._id])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const endpoint = getEndpointForSection(section.sectionName)
      const response = await fetch(`/api/${endpoint}?sectionId=${section._id}`)
      const data = await response.json()
      setItems(data)
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در دریافت آیتم‌ها",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getEndpointForSection = (sectionName: string) => {
    switch (sectionName) {
      case "خرید":
        return "purchase-details"
      case "همکاری":
        return "collaboration-details"
      case "فروش":
        return "sale-details"
      default:
        return ""
    }
  }

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast({
        title: "خطا",
        description: "نام آیتم نمی‌تواند خالی باشد",
        variant: "destructive",
      })
      return
    }

    try {
      const endpoint = getEndpointForSection(section.sectionName)
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionId: section._id,
          itemName: newItemName,
        }),
      })

      if (!response.ok) {
        throw new Error("خطا در ایجاد آیتم")
      }

      const newItem = await response.json()
      setItems([...items, newItem])
      setNewItemName("")

      toast({
        title: "موفق",
        description: "آیتم با موفقیت ایجاد شد",
      })
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ایجاد آیتم",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const endpoint = getEndpointForSection(section.sectionName)
      const response = await fetch(`/api/${endpoint}/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("خطا در حذف آیتم")
      }

      setItems(items.filter((item) => item._id !== itemId))
      toast({
        title: "موفق",
        description: "آیتم با موفقیت حذف شد",
      })
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در حذف آیتم",
        variant: "destructive",
      })
    }
  }

  const handleItemClick = (item: SectionItem) => {
    setSelectedItem(item)
    setIsDetailsDialogOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>لیست آیتم‌های {section.sectionName}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center space-x-2 space-x-reverse mb-4">
          <Input placeholder="نام آیتم جدید" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
          <Button onClick={handleAddItem}>
            <Plus className="ml-2 h-4 w-4" />
            افزودن
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">هیچ آیتمی وجود ندارد</div>
              ) : (
                items.map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-3 border rounded-md">
                    <span className="cursor-pointer flex-grow" onClick={() => handleItemClick(item)}>
                      {item.itemName}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item._id)}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>

      {selectedItem && (
        <ItemDetailsDialog
          section={section}
          item={selectedItem}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        />
      )}
    </Dialog>
  )
}
