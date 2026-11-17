import { Icon } from '@/components/ui/Icon'
import { Logo } from '@/components/ui/Logo'
import { BusinessCard, CreateBusinessTile } from './components/BusinessCard'
import { BusinessListError, BusinessListSkeleton, NoBusinesses } from './components/BusinessListStates'
import { CreateBusinessModal } from './components/CreateBusinessModal'
import { useSelectBusinessPage } from './hooks/useSelectBusinessPage'

/** /select-business: shown after every login, and from "Switch business" in the sidebar. */
export default function SelectBusinessPage() {
  const page = useSelectBusinessPage()

  return <div className="min-h-screen overflow-x-hidden bg-[#F6F7F8]">
    <header className="sticky top-0 z-20 border-b border-[#E7E8EA] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-4xl items-center justify-between px-5">
        <Logo/>
        <div className="flex items-center gap-2">
          {page.canGoBack && <button type="button" onClick={page.goBack} className="hidden items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold text-[#AD5300] hover:bg-[#F0F1F2] sm:flex"><span className="rotate-180"><Icon name="arrow" size={15}/></span>Back to dashboard</button>}
          <button type="button" onClick={page.logOut} className="flex items-center gap-2 rounded-xl border border-[#E7E8EA] bg-white px-3 py-2 text-xs font-extrabold text-[#6D7176] hover:border-[#E6B9B3] hover:text-[#C72D34]"><Icon name="logout" size={16}/>Log out</button>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-4xl px-5 py-10 md:py-14">
      <div className="relative mb-8 overflow-hidden rounded-[24px] hero-gradient px-6 py-7 text-white md:px-9 md:py-9">
        <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full border-[40px] border-[#FF7F00]/20"/>
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#FFD3A7]"><span className="h-1.5 w-1.5 rounded-full bg-[#FF7F00]"/>Choose a business</div>
          <h1 className="mt-3 text-2xl font-black tracking-[-.6px] md:text-[28px]">{page.firstname ? `Welcome, ${page.firstname}` : 'Welcome back'}</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-white/65">Pick the business you want to manage. You can switch any time from the sidebar.</p>
        </div>
      </div>

      {page.isLoading && <BusinessListSkeleton/>}
      {page.isError && <BusinessListError onRetry={page.retry}/>}
      {page.isEmpty && <NoBusinesses canCreate={page.canCreate} onCreate={page.createModal.open}/>}
      {!page.isLoading && !page.isError && !page.isEmpty && <>
        <div className="mb-3 flex items-end justify-between">
          <div><div className="text-sm font-extrabold text-[#1E1E1E]">Your businesses</div><div className="mt-0.5 text-[11px] text-[#6D7176]">{page.cards.length} {page.cards.length === 1 ? 'business' : 'businesses'}</div></div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          {page.cards.map(card => <BusinessCard key={card.business.id} card={card} onSelect={() => page.select(card.business)}/>)}
          {page.canCreate && <CreateBusinessTile onClick={page.createModal.open}/>}
        </div>
      </>}
      {page.canGoBack && <button type="button" onClick={page.goBack} className="mt-6 flex w-full items-center justify-center gap-1 text-xs font-extrabold text-[#AD5300] sm:hidden"><span className="rotate-180"><Icon name="arrow" size={15}/></span>Back to dashboard</button>}
    </main>

    <CreateBusinessModal open={page.createModal.isOpen} onClose={page.createModal.close} onCreated={page.onCreated}/>
  </div>
}
