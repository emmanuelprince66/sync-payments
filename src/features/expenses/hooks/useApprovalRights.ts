import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useApprovalRights as useRightsQuery, useExpensePermissions, useSaveApprovalRights, useTeamMembers, type TeamMember } from '@/api/expenses'
import { useAuthStore } from '@/stores/auth-store'
import { rightsSchema, type RightsValues } from '../schemas'

const ROLE_LABELS: Record<string, string> = { OWNER: 'Owner', 'ADMIN-ATTENDANT': 'Super admin', ATTENDANT: 'Attendant', ACCOUNTANT: 'Accountant', MANAGER: 'Manager', PHARMACIST: 'Pharmacist', 'INVENTORY-MANAGER': 'Inventory manager', 'PRODUCTION-MANAGER': 'Production manager' }
export const roleLabel = (role: string) => ROLE_LABELS[role] ?? (role ? role.replace(/[-_]/g, ' ').toLowerCase() : 'Staff')

const EMPTY: RightsValues = { canLog: false, canInitiate: false, canApprove: false, maxTransfer: '', dailyTransfer: '', dailyCount: '', maxApproval: '' }

type Flag = 'canLog' | 'canInitiate' | 'canApprove'

/**
 * Who on the team may log, request and approve expense payouts, and their caps (sink: StaffExpensePermissions):
 * list business/list_attendants/{business_id}/, then GET/PATCH business/attendant_permissions/{attendant_id}/.
 * The approval cap doesn't stop someone approving: anything above it escalates to the owner.
 * The owner and admins manage this; nobody edits their own rights or the owner's.
 */
export function useApprovalRights(active: boolean) {
  const { isAdmin } = useExpensePermissions()
  const myEmail = useAuthStore(state => state.user?.email?.toLowerCase() ?? '')
  const team = useTeamMembers(active && isAdmin)
  const [member, setMember] = useState<TeamMember | null>(null)
  const rights = useRightsQuery(member?.id ?? '')
  const save = useSaveApprovalRights()

  const form = useForm<RightsValues>({ resolver: zodResolver(rightsSchema), values: rights.data ? { canLog: rights.data.canLog, canInitiate: rights.data.canInitiate, canApprove: rights.data.canApprove, maxTransfer: rights.data.maxTransfer, dailyTransfer: rights.data.dailyTransfer, dailyCount: rights.data.dailyCount, maxApproval: rights.data.maxApproval } : undefined, defaultValues: EMPTY })
  const flags = useWatch({ control: form.control, name: ['canLog', 'canInitiate', 'canApprove'] })

  return {
    isAdmin,
    teamLoading: team.isLoading && !team.data,
    teamError: team.isError,
    retryTeam: () => team.refetch(),
    team: (team.data ?? []).filter(person => person.role !== 'OWNER' && (!myEmail || person.email.toLowerCase() !== myEmail)).map(person => ({ ...person, roleLabel: roleLabel(person.role) })),
    member,
    memberRole: roleLabel(rights.data?.role || member?.role || ''),
    open: (person: TeamMember) => { form.reset(EMPTY); setMember(person) },
    back: () => setMember(null),
    rightsLoading: Boolean(member) && rights.isLoading && !rights.data,
    rightsError: rights.isError,
    form,
    errors: form.formState.errors,
    flags: { canLog: flags[0], canInitiate: flags[1], canApprove: flags[2] },
    setFlag: (name: Flag, value: boolean) => form.setValue(name, value, { shouldDirty: true }),
    submit: form.handleSubmit(values => {
      if (!member) return
      save.mutate({ memberId: member.id, rights: { role: rights.data?.role ?? member.role, ...values } }, {
        onSuccess: () => toast.success(`${member.name}'s permissions updated`),
        onError: failure => toast.error(errorMessage(failure, 'Could not save these permissions')),
      })
    }),
    saving: save.isPending,
  }
}
