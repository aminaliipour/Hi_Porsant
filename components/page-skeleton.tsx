"use client"

import React from 'react'

export function PageSkeleton() {
    return (
        <div className="p-6 space-y-8 animate-pulse">
            {/* Header skeleton */}
            <div className="space-y-2">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
            </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                    </div>
                ))}
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                        <div className="space-y-3">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
