import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'

function CardShell({ rows }: { rows: number }) {
  return <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
    <div className="flex items-start gap-3"><Skeleton className="h-9 w-9 rounded-xl"/><div className="space-y-2"><Skeleton className="h-3.5 w-32"/><Skeleton className="h-2.5 w-56 max-w-full"/></div></div>
    <div className="mt-5 space-y-3">{Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-11 w-full rounded-xl"/>)}</div>
  </div>
}

/** Mirrors the storefront page layout while the store profile loads. */
export function StorefrontSkeleton() {
  return <SkeletonGroup label="Loading storefront settings" className="flex flex-col gap-5">
    <CardShell rows={2}/>
    <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3"><Skeleton className="h-9 w-9 rounded-xl"/><div className="space-y-2"><Skeleton className="h-3.5 w-24"/><Skeleton className="h-2.5 w-64 max-w-full"/></div></div>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4"><Skeleton className="h-20 w-full rounded-xl"/><div className="grid grid-cols-3 gap-3"><Skeleton className="aspect-[16/9] rounded-xl"/><Skeleton className="aspect-[16/9] rounded-xl"/><Skeleton className="aspect-[16/9] rounded-xl"/></div></div>
        <Skeleton className="mx-auto h-72 w-full max-w-[260px] rounded-[26px]"/>
      </div>
    </div>
    <CardShell rows={4}/>
  </SkeletonGroup>
}
