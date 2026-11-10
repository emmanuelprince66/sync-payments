import { create } from 'zustand';

export type SampleApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface SampleApproval {
  id: string;
  title: string;
  requester: string;
  amount: number;
  category: string;
  submitted: string;
  approver: string;
  status: SampleApprovalStatus;
  source: string;
}

interface SampleApprovalsState {
  items: SampleApproval[];
  add: (item: SampleApproval) => void;
  updateStatus: (id: string, status: SampleApprovalStatus) => void;
}

/**
 * Session-only approvals raised by sample-data screens (payroll runs, for now).
 * The backend has no approvals endpoint for these, so nothing is persisted.
 */
export const useSampleApprovalsStore = create<SampleApprovalsState>((set) => ({
  items: [],
  add: (item) => set((state) => ({ items: [item, ...state.items] })),
  updateStatus: (id, status) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, status } : item)),
    })),
}));
