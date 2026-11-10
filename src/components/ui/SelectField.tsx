import { useMemo, type Ref } from 'react'
import { Select, type SelectProps } from './Select'

type SelectFieldProps = Omit<SelectProps, 'options' | 'ref'> & {
  /** Plain string options, where value and label match. */
  options: readonly string[]
  ref?: Ref<HTMLInputElement>
}

/** Select with plain string options. Same look and behaviour as every dropdown in the app. */
export function SelectField({ options, ...props }: SelectFieldProps) {
  const pairs = useMemo(() => options.map(option => ({ value: option, label: option })), [options])
  return <Select options={pairs} {...props}/>
}
