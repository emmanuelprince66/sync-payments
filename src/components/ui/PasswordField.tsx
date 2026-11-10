import type { ComponentProps } from 'react'
import { useDisclosure } from '@/hooks/useDisclosure'
import { Field } from './Field'
import { Icon } from './Icon'

type PasswordFieldProps = Omit<ComponentProps<typeof Field>, 'type' | 'endAdornment'>

/** Field with a show/hide password eye button. Works with react-hook-form's register like Field. */
export function PasswordField(props: PasswordFieldProps) {
  const { isOpen: visible, toggle } = useDisclosure()
  return <Field
    {...props}
    type={visible ? 'text' : 'password'}
    endAdornment={<button type="button" onClick={toggle} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#7C8D85] transition hover:bg-[#EEF5F0] hover:text-[#09261C]">
      <Icon name={visible ? 'eyeOff' : 'eye'} size={18}/>
    </button>}
  />
}
