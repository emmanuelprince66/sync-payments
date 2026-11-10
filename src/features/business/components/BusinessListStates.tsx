import { Button } from '@/components/ui/Button'
import { IconTile } from '@/components/ui/common'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'

/** Matches the business card layout while the list loads. */
export function BusinessListSkeleton() {
  return <SkeletonGroup label="Loading your businesses" className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
    {Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center gap-4 rounded-2xl border border-[#E0E8E3] bg-white p-4 sm:p-5">
      <Skeleton className="h-12 w-12 shrink-0 rounded-xl"/>
      <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-32"/><Skeleton className="h-2.5 w-44 max-w-full"/><Skeleton className="h-4 w-20 rounded-full"/></div>
    </div>)}
  </SkeletonGroup>
}

/** First-time owners: no business yet. */
export function NoBusinesses({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return <div className="rounded-3xl border border-dashed border-[#C9D8CF] bg-white px-6 py-12 text-center">
    <IconTile icon="building" size={24} className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352]"/>
    <div className="mt-4 text-base font-black text-[#17382C]">You don’t have a business yet</div>
    <div className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-[#7D8E85]">
      {canCreate ? 'Create your business to start collecting, paying and getting reconciled.' : 'Ask the business owner to add you to their business, then sign in again.'}
    </div>
    {canCreate && <Button icon="plus" onClick={onCreate} className="mt-6">Create your business</Button>}
  </div>
}

export function BusinessListError({ onRetry }: { onRetry: () => void }) {
  return <div className="rounded-3xl border border-[#F3D9D5] bg-[#FFF8F6] px-6 py-10 text-center">
    <div className="text-sm font-extrabold text-[#9A3B2F]">We couldn’t load your businesses</div>
    <div className="mt-1 text-xs text-[#9A6B63]">Check your connection and try again.</div>
    <Button variant="outline" onClick={onRetry} className="mt-5">Try again</Button>
  </div>
}
