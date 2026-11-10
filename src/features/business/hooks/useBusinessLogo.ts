import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useImageUpload } from '@/hooks/useImageUpload'
import { LOGO_ACCEPT, LOGO_MAX_MB } from '../constants'

/**
 * Logo picker state: keeps the File for the multipart upload and a data-URL
 * preview for the UI. Only JPG/PNG/WebP up to 5 MB, as sink-inventory allows.
 */
export function useBusinessLogo() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const pending = useRef<File | null>(null)

  const onPreview = useCallback((dataUrl: string) => {
    setFile(pending.current)
    setPreview(dataUrl)
  }, [])
  const readImage = useImageUpload(onPreview, LOGO_MAX_MB)

  const pick = useCallback((picked: File) => {
    if (!LOGO_ACCEPT.split(',').includes(picked.type)) {
      toast.error('Use a JPG, PNG or WebP image for your logo.')
      return
    }
    pending.current = picked
    void readImage(picked)
  }, [readImage])

  const reset = useCallback(() => {
    pending.current = null
    setFile(null)
    setPreview('')
  }, [])

  return { file, preview, pick, reset, accept: LOGO_ACCEPT, maxMb: LOGO_MAX_MB }
}
