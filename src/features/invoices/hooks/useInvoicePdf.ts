import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { InvoiceDocumentModel } from '../document'
import { downloadBlob, pdfFileName, renderInvoicePdf } from '../pdf'

type Busy = 'download' | 'share' | null

const canShareFiles = () => {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false
  try {
    return navigator.canShare({ files: [new File([''], 'invoice.pdf', { type: 'application/pdf' })] })
  } catch {
    return false
  }
}

/**
 * Download / Share for one invoice's PDF. The file is built from the off-screen
 * <InvoicePdfSource> (pass `sourceRef` to it) and kept until the invoice changes, so a
 * share can run straight from the tap that asked for it.
 */
export function useInvoicePdf(doc: InvoiceDocumentModel | null) {
  // A callback ref kept in state: the off-screen node the PDF is drawn from.
  const [source, sourceRef] = useState<HTMLDivElement | null>(null)
  const cache = useRef<{ key: string; file: File } | null>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [shareSupported] = useState(canShareFiles)
  const key = doc ? JSON.stringify(doc) : ''

  const build = useCallback(async () => {
    if (!doc || !source) throw new Error('The invoice is not ready yet.')
    if (cache.current?.key === key) return cache.current.file
    const blob = await renderInvoicePdf(source, doc.number)
    const file = new File([blob], pdfFileName(doc.number), { type: 'application/pdf' })
    cache.current = { key, file }
    return file
  }, [doc, key, source])

  /** Builds the PDF ahead of a share so the share sheet opens without delay. */
  const prepare = useCallback(() => { build().catch(() => undefined) }, [build])

  const download = useCallback(async () => {
    setBusy('download')
    try {
      const file = await build()
      downloadBlob(file, file.name)
      return file
    } catch {
      toast.error("Couldn't create the PDF. Try again.")
      return null
    } finally {
      setBusy(null)
    }
  }, [build])

  /** Native share with the PDF attached where the device supports it; otherwise the PDF downloads. */
  const share = useCallback(async (text?: string) => {
    if (!doc) return false
    setBusy('share')
    try {
      const file = await build()
      if (!shareSupported) {
        downloadBlob(file, file.name)
        toast.info('Sharing files is not supported in this browser, so the PDF was downloaded instead.')
        return false
      }
      await navigator.share({ files: [file], title: `Invoice ${doc.number}`, text: text ?? `Invoice ${doc.number} from ${doc.legalName}` })
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return false
      if (error instanceof DOMException && error.name === 'NotAllowedError') toast.info('The PDF is ready. Tap Share again to send it.')
      else toast.error("Couldn't share the PDF. Try downloading it instead.")
      return false
    } finally {
      setBusy(null)
    }
  }, [build, doc, shareSupported])

  return { sourceRef, busy, shareSupported, prepare, download, share }
}

export type InvoicePdfModel = ReturnType<typeof useInvoicePdf>
