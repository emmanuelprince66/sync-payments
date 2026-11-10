import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

/** Copies text and exposes a `copied` flag that resets after `resetMs`. */
export function useClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), resetMs)
    } catch {
      toast.error('Could not copy. Please copy it manually.')
    }
  }, [resetMs])

  return { copied, copy }
}
