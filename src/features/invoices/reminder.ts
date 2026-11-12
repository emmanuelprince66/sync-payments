/** The reminder text for WhatsApp and the share sheet (email reminders are sent by the server). */

export type ReminderFacts = { client: string; number: string; amountDue: string; dueDate: string; overdue: boolean; partPaid: boolean; business: string; publicUrl: string }

export const reminderMessage = ({ client, number, amountDue, dueDate, overdue, partPaid, business, publicUrl }: ReminderFacts) => [
  `Hello ${client},`,
  '',
  overdue
    ? `This is a reminder that invoice ${number} was due on ${dueDate} and ${amountDue} is still outstanding.`
    : `This is a friendly reminder that invoice ${number} for ${amountDue} is due on ${dueDate}.`,
  partPaid ? 'Thank you for the part payment you have made so far.' : '',
  publicUrl ? `View and pay the invoice here: ${publicUrl}` : 'The invoice PDF is attached.',
  `Please use ${number} as your payment reference.`,
  '',
  'Thank you,',
  business,
].filter((line, index, all) => line !== '' || all[index - 1] !== '').join('\n')

/** "0803 245 7791" → "2348032457791" (Nigerian numbers), digits only for anything else. */
export const whatsappNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 11) return `234${digits.slice(1)}`
  return digits
}

export const whatsappUrl = (phone: string, text: string) => `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(text)}`

export const mailtoUrl = (email: string, subject: string, body: string) => `mailto:${email.replace(/[^\w.@+-]/g, '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
