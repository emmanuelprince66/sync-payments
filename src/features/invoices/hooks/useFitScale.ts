import { useLayoutEffect, useRef, useState } from 'react'

/** Scale that fits fixed-width content into its box (never above 1), plus the content's natural height. */
export function useFitScale(contentWidth: number) {
  const boxRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const box = boxRef.current
    const content = contentRef.current
    if (!box || !content) return
    const measure = () => {
      setScale(Math.min(1, box.clientWidth / contentWidth))
      setHeight(content.offsetHeight)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    observer.observe(content)
    return () => observer.disconnect()
  }, [contentWidth])

  return { boxRef, contentRef, scale, height }
}
