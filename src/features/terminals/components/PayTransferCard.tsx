import blackSendIcon from '@/assets/pay-card/black-send-icon.png'
import bottomGraySnake from '@/assets/pay-card/bottom-gray-snake.png'
import orangeSendIcon from '@/assets/pay-card/orange-send-icon.png'
import logo from '@/assets/pay-card/sink2.png'
import topGraySnake from '@/assets/pay-card/top-gray-snake.png'
import transferIdeaIcon from '@/assets/pay-card/transfer-idea-icon.png'
import yellowSnake from '@/assets/pay-card/yellow-snake.png'
import { Skeleton } from '@/components/ui/Skeleton'
import { PAY_CARD_PRINT_ID } from '../constants'
import { AppStoreGlyph, GooglePlayGlyph } from './StoreGlyphs'

/**
 * The printed "Pay with transfer" card, copied from sink-inventory's PaymentTerminal.
 *
 * Laid out against the 595px-wide reference design, which is also the pixel width of the three
 * decorative curves, so they sit at w-full and land where the design puts them at any card width.
 * Horizontal insets are percentages for the same reason; only type and vertical rhythm step down
 * below the sm breakpoint.
 */

/** Sparkle at the top left: the one mark not supplied as an asset. */
const StarBurst = ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" fill="#292D32" className={className} aria-hidden>
  <path d="M12 0c.62 6.24 5.76 11.38 12 12-6.24.62-11.38 5.76-12 12-.62-6.24-5.76-11.38-12-12C6.24 11.38 11.38 6.24 12 0Z"/>
</svg>

const Decor = ({ src, className }: { src: string; className: string }) => <img src={src} alt="" aria-hidden className={`pointer-events-none absolute ${className}`}/>

/** One row of the grey panel: BANK NAME / ACCOUNT NUMBER / ACCOUNT NAME. */
function DetailRow({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return <div className="text-center">
    <p className="text-[10px] font-semibold uppercase tracking-[0.02em] text-[#4B4B4B] sm:text-[12.5px]">{label}</p>
    {loading
      ? <Skeleton className="mx-auto mt-2 h-6 w-40 bg-[#E0E0E0]"/>
      : <p className="mt-1.5 break-words text-[17px] font-bold uppercase leading-tight tracking-tight text-[#2B2B2B] sm:mt-2 sm:text-[23px]">{value || '—'}</p>}
  </div>
}

const RowDivider = () => <div className="my-4 h-px bg-[#E0E0E0] sm:my-[22px]"/>

type PayTransferCardProps = { bankName: string; accountNumber: string; accountName: string; loading: boolean }

export function PayTransferCard({ bankName, accountNumber, accountName, loading }: PayTransferCardProps) {
  return <div id={PAY_CARD_PRINT_ID} className="relative mx-auto w-full max-w-[595px] overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-white [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
    {/* Decorative curves: full bleed, behind the content. */}
    <Decor src={topGraySnake} className="left-0 top-0 h-auto w-full"/>
    <Decor src={bottomGraySnake} className="bottom-0 left-0 h-auto w-full"/>
    <Decor src={yellowSnake} className="bottom-0 left-0 h-auto w-full"/>

    {/* Marks near the top, offset in px so a long account name growing the card can't drag them down. */}
    <StarBurst className="pointer-events-none absolute left-[22.5%] top-[53px] w-[18px] rotate-[12deg] sm:top-[93px] sm:w-[24px]"/>
    <Decor src={transferIdeaIcon} className="left-[85.7%] top-[93px] h-auto w-[26px] sm:top-[164px] sm:w-[34px]"/>

    <div className="relative px-[14.5%] pb-[50px] pt-[62px] sm:pb-[89px] sm:pt-[110px]">
      {/* The logo asset carries ~28% transparent padding top and bottom; pulled back out. */}
      <img src={logo} alt="Sync360" className="mx-auto -my-[19px] h-auto w-[142px] sm:-my-[34px] sm:w-[250px]"/>

      {/* A hair wider than the panel below, so it reaches back over the inset rather than wrapping. */}
      <h2 className="-mx-[30px] mt-[18px] whitespace-nowrap text-center text-[25px] font-extrabold uppercase leading-none tracking-tight text-[#329661] sm:-mx-[42px] sm:mt-[28px] sm:text-[44px]">Pay with transfer</h2>

      <div className="relative mt-[14px] rounded-[10px] bg-[#F2F2F2] px-[18px] py-[16px] sm:mt-[24px] sm:px-[30px] sm:py-[26px]">
        <Decor src={blackSendIcon} className="-left-[30px] bottom-[43px] h-auto w-[19px] sm:-left-[53px] sm:bottom-[76px] sm:w-[24px]"/>
        <Decor src={orangeSendIcon} className="-bottom-[36px] -right-[8px] h-auto w-[24px] sm:-bottom-[64px] sm:-right-[14px] sm:w-[30px]"/>
        <DetailRow label="Bank Name:" value={bankName} loading={loading}/>
        <RowDivider/>
        <DetailRow label="Account Number:" value={accountNumber} loading={loading}/>
        <RowDivider/>
        <DetailRow label="Account Name:" value={accountName} loading={loading}/>
      </div>

      <p className="mt-[50px] text-center text-[11px] font-medium text-[#4A4A4A] sm:mt-[89px] sm:text-[13px]">Payment with the Sync360 App is a Breeze!</p>
      <div className="mx-auto mt-[10px] h-px w-[280px] max-w-full bg-[#E6E6E6] sm:mt-[14px]"/>

      <div className="mt-[10px] flex items-center justify-center gap-[10px] sm:mt-[14px] sm:gap-[12px]">
        <div className="flex items-center gap-2 rounded-[6px] bg-black px-[10px] py-[6px] sm:px-[12px] sm:py-[7px]">
          <GooglePlayGlyph className="h-[18px] w-[18px] shrink-0 sm:h-[21px] sm:w-[21px]"/>
          <div className="text-left"><div className="text-[6px] uppercase leading-none tracking-wide text-white sm:text-[7px]">Get it on</div><div className="text-[12px] font-semibold leading-tight text-white sm:text-[14px]">Google Play</div></div>
        </div>
        <div className="flex items-center gap-2 rounded-[6px] bg-black px-[10px] py-[6px] sm:px-[12px] sm:py-[7px]">
          <AppStoreGlyph className="h-[18px] w-[18px] shrink-0 sm:h-[21px] sm:w-[21px]"/>
          <div className="text-left"><div className="text-[6px] leading-none text-white sm:text-[7px]">Download on the</div><div className="text-[12px] font-semibold leading-tight text-white sm:text-[14px]">App Store</div></div>
        </div>
      </div>
    </div>
  </div>
}
