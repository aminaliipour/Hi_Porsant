"use client"

import { useState, useEffect, useRef } from "react"

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface ApiCacheOptions {
  ttl?: number // Time to live in seconds, default 300 (5 minutes)
}

interface UseApiCacheReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// In-memory cache store
const cacheStore = new Map<string, CacheEntry<any>>()
// Track pending requests to prevent duplicates
const pendingRequests = new Map<string, Promise<any>>()

export function useApiCache<T>(
  url: string,
  options: ApiCacheOptions = {}
): UseApiCacheReturn<T> {
  const { ttl = 300 } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchData = async () => {
    // Check if data exists in cache and is still valid
    const cachedEntry = cacheStore.get(url)
    if (cachedEntry) {
      const now = Date.now()
      const age = (now - cachedEntry.timestamp) / 1000
      if (age < cachedEntry.ttl) {
        // Cache is still valid
        if (isMountedRef.current) {
          setData(cachedEntry.data)
          setLoading(false)
          setError(null)
        }
        return
      }
    }

    // Check if there's already a pending request for this URL
    if (pendingRequests.has(url)) {
      try {
        const result = await pendingRequests.get(url)
        if (isMountedRef.current) {
          setData(result)
          setLoading(false)
          setError(null)
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to fetch data")
          setLoading(false)
        }
      }
      return
    }

    // Create new request
    const request = (async () => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        const result = await response.json()
        return result
      } finally {
        pendingRequests.delete(url)
      }
    })()

    pendingRequests.set(url, request)

    try {
      const result = await request
      
      // Store in cache
      cacheStore.set(url, {
        data: result,
        timestamp: Date.now(),
        ttl: ttl
      })

      if (isMountedRef.current) {
        setData(result)
        setLoading(false)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
        setLoading(false)
      }
    }
  }

  const refetch = async () => {
    // Clear cache for this URL
    cacheStore.delete(url)
    setLoading(true)
    await fetchData()
  }

  useEffect(() => {
    isMountedRef.current = true
    fetchData()

    return () => {
      isMountedRef.current = false
    }
  }, [url])

  return { data, loading, error, refetch }
}
