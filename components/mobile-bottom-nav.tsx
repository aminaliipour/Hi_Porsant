"use client"
import { Button } from "@/components/ui/button"
import { Home, Users2, Percent, Settings2, Wallet, Scale, FileBarChart2 } from "lucide-react"

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (v: string) => void;
}

const tabs: { value: string; label: string; icon: any }[] = [
  { value: "projects", label: "پروژه", icon: Home },
  { value: "commission", label: "پورسانت", icon: Percent },
  { value: "system", label: "سیستم", icon: Settings2 },
  { value: "salary", label: "حقوق", icon: Wallet },
  { value: "taadol", label: "تعادل", icon: Scale },
  { value: "report", label: "گزارش", icon: FileBarChart2 },
]

export function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t shadow-lg">
      <div className="grid grid-cols-6 *:flex *:items-center *:justify-center">
        {tabs.map(t => {
          const Icon = t.icon
          const active = activeTab === t.value
          return (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`flex flex-col gap-0.5 py-2 text-[10px] font-medium transition-colors ${active ? "text-yellow-600 dark:text-yellow-400" : "text-gray-500 dark:text-gray-400"}`}
            >
              <Icon className={`h-4 w-4 mx-auto ${active ? "scale-110" : "opacity-80"}`} />
              <span className="leading-none">{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
