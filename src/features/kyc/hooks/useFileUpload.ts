import { useRef, useState, type DragEvent } from 'react'

/** Providers reject anything larger, so catch it here rather than on submit. */
const MAX_BYTES = 5 * 1024 * 1024

export const readableSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

/** One document slot (sink's FileUploadField): click or drop, 5 MB limit, remove. */
export function useFileUpload(onChange: (file: File | null) => void, error?: string) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [sizeError, setSizeError] = useState<string | null>(null)

  const accept = (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_BYTES) {
      setSizeError(`${file.name} is ${readableSize(file.size)} — the limit is 5 MB.`)
      return
    }
    setSizeError(null)
    onChange(file)
  }

  return {
    inputRef,
    dragging,
    message: sizeError ?? error,
    pick: () => inputRef.current?.click(),
    onInput: (files: FileList | null) => accept(files?.[0] ?? undefined),
    dropHandlers: {
      onDragOver: (event: DragEvent) => { event.preventDefault(); setDragging(true) },
      onDragLeave: () => setDragging(false),
      onDrop: (event: DragEvent) => { event.preventDefault(); setDragging(false); accept(event.dataTransfer.files?.[0]) },
    },
    remove: () => {
      onChange(null)
      setSizeError(null)
      if (inputRef.current) inputRef.current.value = ''
    },
  }
}
