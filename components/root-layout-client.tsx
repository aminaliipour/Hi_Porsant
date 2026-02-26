"use client"

import { PageTransitionLoader } from "./page-transition-loader"
import { ReactNode } from "react"

export function RootLayoutClient({ children }: { children: ReactNode }) {
  return (
    <>
      <PageTransitionLoader />
      {children}
    </>
  )
}
