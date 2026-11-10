import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon, type IconName } from './Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#09261C] text-white hover:bg-[#123D2E] shadow-[0_5px_14px_rgba(9,38,28,.16)]',
  secondary: 'bg-[#529661] text-white hover:bg-[#438352]',
  ghost: 'text-[#50635B] hover:text-[#09261C] hover:bg-[#EEF5F0]',
  outline: 'border border-[#DCE7E0] bg-white text-[#09261C] hover:border-[#529661]',
}

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children?: ReactNode
  variant?: ButtonVariant
  icon?: IconName
  /** Shows a spinner in place of the icon and disables the button. */
  loading?: boolean
}

export function Button({ children, variant = 'primary', icon, loading = false, disabled, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cn('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-45', variants[variant], className)} {...props}>
    {loading
      ? <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"/>
      : icon && <Icon name={icon} size={18}/>} {children}
  </button>
}
