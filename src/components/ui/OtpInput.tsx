import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

/** Six-box numeric code input from the design: auto-advance, backspace to previous, paste fills all. */
export function OtpInput({ value, onChange, length = 6 }: { value: string; onChange: (value: string) => void; length?: number }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, index) => value[index] ?? '')

  const setDigit = (index: number, digit: string) => {
    const next = [...digits]
    next[index] = digit
    onChange(next.join('').slice(0, length))
    if (digit && index < length - 1) inputs.current[index + 1]?.focus()
  }

  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus()
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    event.preventDefault()
    onChange(pasted)
    inputs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return <div className="mt-8 flex gap-2 sm:gap-3">
    {digits.map((digit, index) => <input
      key={index}
      ref={element => { inputs.current[index] = element }}
      aria-label={`OTP digit ${index + 1}`}
      inputMode="numeric"
      autoComplete={index === 0 ? 'one-time-code' : 'off'}
      maxLength={1}
      value={digit}
      onChange={event => setDigit(index, event.target.value.replace(/\D/g, '').slice(-1))}
      onKeyDown={onKeyDown(index)}
      onPaste={onPaste}
      className="h-14 min-w-0 flex-1 rounded-xl border border-[#D9E4DD] bg-[#FAFCFA] text-center text-xl font-black text-[#17382C] outline-none focus:border-[#529661] focus:ring-4 focus:ring-[#529661]/10"
    />)}
  </div>
}
