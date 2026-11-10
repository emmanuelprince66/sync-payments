import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Classes for the white panel, copied from the design, e.g. "w-full max-w-lg rounded-3xl bg-white p-7". */
  panelClassName: string
  /** Overlay tint/blur/padding. Defaults to the design's most common modal overlay. */
  overlayClassName?: string
  /** "center" for dialogs, "right" for side drawers. */
  placement?: 'center' | 'right' | 'left'
  /** Accessible name. Pass it when the dialog has no <ModalHeader> (which provides one). */
  title?: string
  /** @deprecated Use ModalHeader or `title` — kept for compatibility. */
  labelledBy?: string
}

/**
 * Accessible dialog (Radix: focus trap, Escape, scroll lock, portal) with the
 * design's overlay. Closes on backdrop click. Use <Drawer> for the right-hand panel.
 */
export function Modal({ open, onClose, children, panelClassName, overlayClassName = 'bg-[#09261C]/40 p-4 backdrop-blur-[2px]', placement = 'center', title }: ModalProps) {
  return <Dialog.Root open={open} onOpenChange={next => { if (!next) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className={cn('fixed inset-0 z-50 flex', placement === 'center' ? 'items-center justify-center' : placement === 'left' ? 'justify-start' : 'justify-end', overlayClassName)}>
        <Dialog.Content aria-describedby={undefined} className={cn('outline-none', panelClassName)}>
          {title && <Dialog.Title className="sr-only">{title}</Dialog.Title>}
          {children}
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  </Dialog.Root>
}

/** Right-hand drawer (order details). */
export function Drawer({ panelClassName = 'h-full w-full max-w-[480px] overflow-y-auto bg-white shadow-[-20px_0_60px_rgba(9,38,28,.16)]', overlayClassName = 'bg-[#09261C]/35 backdrop-blur-[2px]', ...props }: Omit<ModalProps, 'placement' | 'panelClassName'> & { panelClassName?: string }) {
  return <Modal {...props} placement="right" panelClassName={panelClassName} overlayClassName={overlayClassName}/>
}

/** Title + description + close button row used at the top of most dialogs in the design. */
export function ModalHeader({ title, description, onClose, closeButton = 'bordered', align = 'center', className }: {
  title: ReactNode
  description?: ReactNode
  onClose?: () => void
  /** "bordered" = h-9 w-9 outlined button; "plain" = bare icon (import modal). */
  closeButton?: 'bordered' | 'plain' | 'none'
  align?: 'center' | 'start'
  className?: string
}) {
  return <div className={cn('flex justify-between', align === 'center' ? 'items-center' : 'items-start', className)}>
    <div>
      <Dialog.Title className="text-lg font-black text-[#17382C]">{title}</Dialog.Title>
      {description && <div className="mt-1 text-xs text-[#819088]">{description}</div>}
    </div>
    {closeButton !== 'none' && onClose && <button type="button" aria-label="Close" onClick={onClose} className={closeButton === 'bordered' ? 'flex h-9 w-9 items-center justify-center rounded-xl border border-[#E0E8E3]' : undefined}><Icon name="close" size={closeButton === 'bordered' ? 17 : 18}/></button>}
  </div>
}

/** Right-aligned action row at the bottom of dialogs. */
export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)}>{children}</div>
}

/** For dialogs whose title isn't in a ModalHeader (e.g. custom header layouts). */
export const ModalTitle = Dialog.Title
