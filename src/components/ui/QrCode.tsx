import type { CSSProperties } from 'react'
import QRCodeImport from 'react-qr-code'

/**
 * react-qr-code is CommonJS without an __esModule flag, so depending on the bundler the
 * default import is either the component or its exports object. Resolve it once here.
 */
const QRCodeComponent = (QRCodeImport as unknown as { default?: typeof QRCodeImport }).default ?? QRCodeImport

type QrCodeProps = { value: string; size?: number; fgColor?: string; bgColor?: string; viewBox?: string; style?: CSSProperties; title?: string }

/** SVG QR code (react-qr-code, as sink-inventory uses). */
export function QrCodeImage(props: QrCodeProps) {
  return <QRCodeComponent {...props}/>
}
