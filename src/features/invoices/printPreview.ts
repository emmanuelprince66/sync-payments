/** Opens the invoice preview alone in a print window, carrying the app's styles over. */
export const printPreview = (node: HTMLElement | null, title: string) => {
  if (!node) return false
  const win = window.open('', '_blank')
  if (!win) return false
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(tag => tag.outerHTML).join('')
  win.document.write(`<!doctype html><html><head><base href="${window.location.origin}/">${styles}</head><body style="background:#fff">${node.outerHTML}</body></html>`)
  win.document.close()
  win.document.title = title
  win.focus()
  win.setTimeout(() => win.print(), 300)
  return true
}
