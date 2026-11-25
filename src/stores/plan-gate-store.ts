import { create } from 'zustand'

/**
 * The backend's subscription refusals, as sink-inventory reads them (api/sub/subscription-interceptor):
 * an error whose message / error / code / hint / subscription_status is
 *  "1" → no active subscription, "2" → this plan's limit for the feature is used up, "3" → not on this plan.
 * Left alone they surface as a bare "2"; here they open one dialog (components/ui/PlanGateDialog).
 */
export type PlanGateKind = 'subscription_expired' | 'feature_limit_reached' | 'upgrade_required'

const CODES: Record<string, PlanGateKind> = {
  '1': 'subscription_expired',
  '2': 'feature_limit_reached',
  '3': 'upgrade_required',
  UPGRADE_REQUIRED: 'upgrade_required',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  PLAN_EXPIRED: 'subscription_expired',
  FEATURE_LIMIT_REACHED: 'feature_limit_reached',
  FREE_PLAN_LIMIT: 'feature_limit_reached',
}

export const PLAN_GATE_COPY: Record<PlanGateKind, { title: string; message: string; short: string }> = {
  subscription_expired: {
    title: 'Subscription required',
    message: 'You need an active subscription to do this. Subscribe to a plan to unlock it.',
    short: 'You need an active subscription to do this.',
  },
  feature_limit_reached: {
    title: 'Plan limit reached',
    message: "You've reached the limit for this on your current plan. Upgrade to a higher plan to add more.",
    short: "You've reached your plan's limit for this. Upgrade to add more.",
  },
  upgrade_required: {
    title: 'Upgrade required',
    message: "This isn't included in your current plan. Upgrade to unlock it.",
    short: "This isn't included in your current plan.",
  },
}

/** The refusal in an error body, if it is one. */
export const planGateKind = (data: unknown): PlanGateKind | null => {
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  for (const key of ['message', 'error', 'code', 'hint', 'subscription_status', 'detail']) {
    const value = record[key]
    if ((typeof value === 'string' || typeof value === 'number') && CODES[String(value).trim()]) return CODES[String(value).trim()]
  }
  return null
}

type PlanGateState = { kind: PlanGateKind | null; show: (kind: PlanGateKind) => void; close: () => void }

export const usePlanGateStore = create<PlanGateState>(set => ({
  kind: null,
  show: kind => set({ kind }),
  close: () => set({ kind: null }),
}))
