import { Icon } from '@/components/ui/Icon'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'
import { useAuthVisualSlides } from '../hooks/useAuthVisualSlides'

/** Animated brand panel on the left of every auth screen (desktop only). */
export function AuthVisual() {
  const { slides, slide, current, goTo } = useAuthVisualSlides()
  return <section className="auth-gradient relative hidden min-h-screen overflow-hidden p-10 text-white lg:flex lg:flex-col">
    <div className="relative z-10"><Logo inverse/></div>
    <div className="pointer-events-none absolute -right-32 -top-32 h-[430px] w-[430px] rounded-full border-[75px] border-white/[.05]"/>
    <div className="pointer-events-none absolute -bottom-40 -left-28 h-[460px] w-[460px] rounded-full bg-[#80C989]/10 blur-2xl"/>
    <div className="relative z-10 my-auto mx-auto w-full max-w-xl">
      <div className="mb-9">
        <div className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#BDE9B8]">Money smarter with Sync360 Payments</div>
        <div className="mt-4 max-w-lg text-[38px] font-black leading-[1.08] tracking-[-1.5px]">Collect, approve and pay out from one account.</div>
      </div>
      <div className="relative h-[290px] overflow-hidden rounded-[30px] border border-white/10 bg-white/[.08] p-7 backdrop-blur-md">
        <div className="absolute inset-x-8 top-[118px] h-[2px] bg-white/15"><div className="auth-route-line h-full w-1/2 bg-[#A5D86A]"/></div>
        <div className="auth-truck absolute left-8 top-[92px] flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A5D86A] text-[#17422A] shadow-[0_12px_30px_rgba(0,0,0,.18)]"><Icon name="wallet" size={23} stroke={2.2}/></div>
        <div className="absolute right-8 top-[94px] flex h-11 w-11 items-center justify-center rounded-full border-4 border-white/15 bg-white text-[#286B43]"><Icon name="bank" size={19}/></div>
        <div className="absolute inset-x-7 bottom-7 flex items-end justify-between gap-6">
          <div className="max-w-[370px]" key={slide} aria-live="polite">
            <div className="auth-slide-in inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#CBEAC8]"><Icon name={current.icon} size={13}/>{current.label}</div>
            <div className="auth-slide-in mt-3 text-lg font-black">{current.title}</div>
            <div className="auth-slide-in mt-1 text-[11px] leading-5 text-white/55">{current.text}</div>
          </div>
          <div className="mb-1 flex gap-1.5">{slides.map((item, index) => <button type="button" key={item.label} aria-label={`Show slide ${index + 1}`} aria-current={index === slide} onClick={() => goTo(index)} className={cn('h-1.5 rounded-full transition-all', index === slide ? 'w-6 bg-[#A5D86A]' : 'w-1.5 bg-white/25')}/>)}</div>
        </div>
      </div>
      <div className="mt-7 flex items-center gap-6 text-[10px] font-bold text-white/45"><span className="flex items-center gap-2"><Icon name="shield" size={15}/>Secure payments</span><span className="flex items-center gap-2"><Icon name="check" size={15}/>Approval controls</span><span className="flex items-center gap-2"><Icon name="wallet" size={15}/>Fast payouts</span></div>
    </div>
  </section>
}
