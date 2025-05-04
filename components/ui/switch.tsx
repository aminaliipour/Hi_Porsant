"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

// اندازه‌های مختلف
const sizeClasses = {
  small: {
    root: "h-4 w-8",
    // جابجایی thumb به سمت چپ (rtl)
    thumb: "h-3 w-3 data-[state=checked]:-translate-x-4 data-[state=unchecked]:-translate-x-1",
  },
  medium: {
    root: "h-6 w-12",
    thumb: "h-4 w-4 data-[state=checked]:-translate-x-7 data-[state=unchecked]:-translate-x-1",
  },
  large: {
    root: "h-8 w-16",
    thumb: "h-6 w-6 data-[state=checked]:-translate-x-9 data-[state=unchecked]:-translate-x-1",
  },
}

type SwitchSize = "small" | "medium" | "large"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: SwitchSize
  checkedIcon?: React.ReactNode
  uncheckedIcon?: React.ReactNode
  label?: string
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(
  (
    {
      className,
      size = "medium",
      checkedIcon,
      uncheckedIcon,
      label,
      ...props
    },
    ref
  ) => (
    // راست‌چین کردن کل سوییچ و قرار دادن label سمت چپ
    <label className="inline-flex flex-row-reverse items-center gap-2 cursor-pointer">
      {label && <span className="select-none">{label}</span>}
      <SwitchPrimitives.Root
        className={cn(
          "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
          sizeClasses[size].root,
          className
        )}
        {...props}
        ref={ref}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block rounded-full bg-background shadow transition-transform duration-200 border border-gray-300 flex items-center justify-center",
            sizeClasses[size].thumb
          )}
        >
          {/* آیکون‌ها */}
          <span className="w-full h-full flex items-center justify-center">
            {props.checked
              ? checkedIcon
              : uncheckedIcon}
          </span>
        </SwitchPrimitives.Thumb>
      </SwitchPrimitives.Root>
    </label>
  )
)
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
