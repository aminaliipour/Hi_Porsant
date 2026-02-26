"use client"

import React from 'react'

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-zinc-950/90 dark:to-zinc-900/90 backdrop-blur-sm z-[9999] flex items-center justify-center">
            <div className="flex flex-col items-center gap-8">
                {/* Premium Animated Spinner */}
                <div className="relative w-24 h-24">
                    {/* Background circle */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-gray-200 dark:text-gray-700"
                        />
                    </svg>

                    {/* Animated gradient spinner */}
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#EAB308" />
                                    <stop offset="50%" stopColor="#FBBF24" />
                                    <stop offset="100%" stopColor="#F59E0B" />
                                </linearGradient>
                            </defs>
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="url(#grad)"
                                strokeWidth="2"
                                strokeDasharray="70 280"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>

                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-2xl">🚀</div>
                    </div>
                </div>

                {/* Loading text with animation */}
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        در حال بارگیری
                    </h3>
                    
                    {/* Animated dots */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex justify-center items-center gap-1">
                        <span>لطفاً صبر کنید</span>
                        <span className="inline-flex gap-1">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
                        style={{
                            animation: 'progress 2s ease-in-out infinite'
                        }}
                    />
                    <style>{`
                        @keyframes progress {
                            0% {
                                width: 0%;
                            }
                            50% {
                                width: 100%;
                            }
                            100% {
                                width: 100%;
                            }
                        }
                    `}</style>
                </div>
            </div>
        </div>
    )
}
