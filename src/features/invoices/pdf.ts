/**
 * Turns the A4 invoice document into a real PDF in the browser, the way sink-inventory
 * exports receipts: html2canvas-pro rasterises the node, jsPDF lays it on A4 pages.
 * Long invoices split onto more pages between line rows (`data-pdf-block`), never through one.
 */

const SCALE = 3
const PAGE_MARGIN_PX = 48

const waitForImages = (node: HTMLElement) => Promise.all(Array.from(node.querySelectorAll('img')).map(img => new Promise<void>(resolve => {
  if (img.complete) return resolve()
  img.onload = () => resolve()
  img.onerror = () => resolve()
})))

/** Page cuts in CSS px: as close to a full page as possible, at the top of a block. */
const pageCuts = (node: HTMLElement, pageHeight: number) => {
  const top = node.getBoundingClientRect().top
  const blocks = Array.from(node.querySelectorAll<HTMLElement>('[data-pdf-block]')).map(block => block.getBoundingClientRect().top - top).sort((a, b) => a - b)
  const total = node.scrollHeight
  const cuts: [number, number][] = []
  let start = 0
  while (start < total - 1) {
    const room = cuts.length ? pageHeight - PAGE_MARGIN_PX : pageHeight
    // A few px of slack: the A4 page is 1122.5 px and the document's min-height rounds to 1123.
    if (total - start <= room + 4) { cuts.push([start, Math.min(total, start + room)]); break }
    const candidates = blocks.filter(at => at > start + room * 0.3 && at <= start + room)
    const end = candidates.length ? candidates[candidates.length - 1] : start + room
    cuts.push([start, end])
    start = end
  }
  return cuts
}

export async function renderInvoicePdf(node: HTMLElement, title: string) {
  await document.fonts?.ready
  await waitForImages(node)
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')])

  const width = node.offsetWidth
  const canvas = await html2canvas(node, { scale: SCALE, backgroundColor: '#ffffff', useCORS: true, logging: false, imageTimeout: 15000, windowWidth: width })

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true })
  pdf.setProperties({ title, creator: 'Sync360 Payments' })
  const pageWidthPt = pdf.internal.pageSize.getWidth()
  const ptPerPx = pageWidthPt / width
  const pageHeightPx = pdf.internal.pageSize.getHeight() / ptPerPx

  const cuts = pageCuts(node, pageHeightPx)
  cuts.forEach(([from, to], index) => {
    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = Math.max(1, Math.round((to - from) * SCALE))
    const context = slice.getContext('2d')
    if (!context) return
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, slice.width, slice.height)
    context.drawImage(canvas, 0, Math.round(from * SCALE), canvas.width, slice.height, 0, 0, slice.width, slice.height)
    if (index > 0) pdf.addPage('a4', 'portrait')
    const offset = index > 0 ? PAGE_MARGIN_PX * ptPerPx : 0
    pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, offset, pageWidthPt, (to - from) * ptPerPx, undefined, 'FAST')
  })

  if (cuts.length > 1) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(107, 122, 113)
    for (let page = 1; page <= cuts.length; page += 1) {
      pdf.setPage(page)
      pdf.text(`${title} · Page ${page} of ${cuts.length}`, pageWidthPt / 2, pdf.internal.pageSize.getHeight() - 16, { align: 'center' })
    }
  }

  return pdf.output('blob')
}

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** "INV-0001" → "INV-0001.pdf", safe for any file system. */
export const pdfFileName = (number: string) => `${number.replace(/[^\w.-]+/g, '-') || 'invoice'}.pdf`
