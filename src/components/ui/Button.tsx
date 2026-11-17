import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon, type IconName } from './Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-[#222222] shadow-[0_5px_14px_rgba(30,30,30,.14)]',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-[#E86F00]',
  ghost: 'text-[#555555] hover:text-[#1E1E1E] hover:bg-[#F0F1F2]',
  outline: 'border border-[#D7D8DA] bg-white text-primary hover:border-primary',
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
