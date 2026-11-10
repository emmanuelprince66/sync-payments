import type { ReactNode } from 'react'

/**
 * The BNPL merchant terms, in full — copied from sink-inventory. The merchant
 * ticks a box saying they have read this, so it has to be the document itself,
 * not a summary.
 */

function Clause({ heading, children }: { heading: string; children: ReactNode }) {
  return <section className="space-y-1.5">
    <h5 className="text-[11px] font-extrabold text-foreground">{heading}</h5>
    <div className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">{children}</div>
  </section>
}

function List({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-1 pl-4">{items.map(item => <li key={item}>{item}</li>)}</ul>
}

export function BnplTerms() {
  return <div className="space-y-3">
    <p className="text-[11px] font-extrabold text-foreground">SYNC360 × AKAWOPAY — MERCHANT BNPL SERVICE TERMS &amp; CONDITIONS</p>

    <Clause heading="1. Purpose of the Agreement">
      <p>These Terms and Conditions govern the participation of a business (&ldquo;Merchant&rdquo;) in the Buy Now, Pay Later (&ldquo;BNPL&rdquo;) service made available through the Sync360 platform in collaboration with Akawopay.</p>
      <p>The BNPL service allows eligible customers of participating Merchants to access financing/payment options provided by Akawopay for the purchase of goods or services.</p>
    </Clause>

    <Clause heading="2. Role of Sync360">
      <p>The Merchant acknowledges and agrees that:</p>
      <List items={[
        'Sync360 provides the technology platform and facilitates the connection between the Merchant, its customers and Akawopay.',
        'Sync360 is not the lender, credit provider, financing institution or party responsible for approving or rejecting a customer\'s BNPL application.',
        'Sync360 does not determine a customer\'s eligibility, creditworthiness, repayment schedule, interest, fees or other credit terms.',
        'Sync360 is not responsible for the customer\'s repayment obligations to Akawopay.',
        'The Merchant\'s participation in the BNPL service does not create a lending, credit or financial relationship between the Merchant and Sync360.',
      ]}/>
    </Clause>

    <Clause heading="3. Role of Akawopay">
      <p>Akawopay is responsible for the BNPL/financing relationship with the customer, including, where applicable:</p>
      <List items={['Customer onboarding and applicable KYC requirements', 'Credit assessment and eligibility', 'Approval or rejection of BNPL applications', 'Determination of applicable financing terms', 'Disbursement/settlement', 'Customer repayment', 'Collections and management of customer defaults', 'Applicable customer financing documentation']}/>
      <p>The Merchant acknowledges that Akawopay may independently approve or decline any BNPL transaction.</p>
    </Clause>

    <Clause heading="4. Merchant Participation">
      <p>By accepting these Terms, the Merchant agrees to:</p>
      <List items={['Offer the BNPL option to eligible customers through the Sync360 platform', 'Provide accurate information about goods and services being purchased', 'Process legitimate transactions only', 'Not create fictitious, inflated or fraudulent transactions', 'Not use BNPL transactions for cash withdrawals or cash equivalents', 'Cooperate with reasonable verification, reconciliation and fraud-prevention procedures']}/>
    </Clause>

    <Clause heading="5. Transaction Fee">
      <p>For each successful BNPL transaction that has been approved and successfully disbursed to the Merchant, a transaction fee of <span className="font-extrabold text-foreground">3% of the transaction value</span> shall apply. The applicable fee shall be deducted in accordance with the agreed settlement process.</p>
      <p>No transaction fee shall be charged for an application that is declined, cancelled or otherwise does not result in successful disbursement, subject to any separately agreed reversal or refund arrangements.</p>
    </Clause>

    <Clause heading="6. Merchant Settlement">
      <p>Following successful approval and disbursement of an eligible BNPL transaction, the Merchant shall receive settlement from Akawopay within 24 hours, subject to applicable banking, compliance, fraud-prevention, technical and regulatory processes.</p>
      <p>The Merchant acknowledges that Sync360 does not independently guarantee the settlement of funds where settlement is the responsibility of Akawopay.</p>
    </Clause>

    <Clause heading="7. Customer Repayment and Credit Risk">
      <p>The Merchant is not responsible for collecting the customer&apos;s BNPL repayments.</p>
      <p>Except where the Merchant has engaged in fraud, misrepresentation, unauthorized transactions or another circumstance expressly making the Merchant liable, customer repayment obligations and customer credit risk shall remain between the customer and Akawopay.</p>
      <p>A customer&apos;s failure to repay Akawopay shall not, by itself, create a repayment obligation for the Merchant.</p>
    </Clause>

    <Clause heading="8. Goods and Services">
      <p>The Merchant remains solely responsible for:</p>
      <List items={['The quality, availability and delivery of its goods or services', 'The accuracy of product/service descriptions and prices', 'Warranties applicable to its products or services', 'Customer complaints relating to the underlying goods or services']}/>
      <p>Sync360 and Akawopay shall not be responsible for defects, non-delivery or poor quality of goods/services supplied by the Merchant.</p>
    </Clause>

    <Clause heading="9. Cancellation and Refunds">
      <p>Where a customer cancels an eligible purchase or the Merchant approves a refund, the Merchant shall follow the applicable refund process communicated by Sync360 and/or Akawopay.</p>
      <p>Any refund involving an outstanding BNPL obligation shall be handled in accordance with Akawopay&apos;s applicable procedures and customer financing terms. The Merchant shall not independently agree to arrangements intended to bypass the BNPL process.</p>
    </Clause>

    <Clause heading="10. Fraud and Prohibited Transactions">
      <p>The Merchant shall not:</p>
      <List items={['Process transactions without a genuine sale', 'Process transactions for itself, its owners or related parties for the purpose of obtaining financing', 'Inflate transaction values', 'Split transactions to circumvent applicable limits', 'Receive cash from customers in place of genuine goods/services', 'Manipulate transaction records', 'Assist customers in circumventing Akawopay\'s eligibility or security controls']}/>
      <p>Any suspected fraudulent or suspicious activity may result in immediate suspension of the Merchant&apos;s access to the BNPL service.</p>
    </Clause>

    <Clause heading="11. Customer Information and Data Protection">
      <p>The Merchant agrees that relevant customer and transaction information may be shared between the Merchant, Sync360 and Akawopay where reasonably necessary to process BNPL transactions, conduct applicable verification and KYC, prevent fraud, complete settlement and reconciliation, provide customer support, and comply with applicable laws and regulatory requirements.</p>
      <p>Each party shall be responsible for handling personal information in accordance with applicable data-protection requirements.</p>
    </Clause>

    <Clause heading="12. Transaction Limits">
      <p>BNPL transaction limits, customer eligibility requirements and other applicable restrictions may be determined or modified by Akawopay based on its policies, risk controls, regulatory requirements and other applicable considerations. Sync360 may communicate such requirements to Merchants through the platform.</p>
    </Clause>

    <Clause heading="13. Suspension">
      <p>Sync360 and/or Akawopay may suspend a Merchant&apos;s access to the BNPL service where there is suspected fraud, a regulatory or compliance concern, breach of these Terms, unusual or suspicious transaction activity, security concerns, or technical or operational risk. Where reasonably practicable, the Merchant shall be notified of the reason for suspension.</p>
    </Clause>

    <Clause heading="14. Limitation of Sync360's Responsibility">
      <p>The Merchant acknowledges that Sync360 acts primarily as a technology and facilitation platform. Accordingly, Sync360 shall not be responsible for:</p>
      <List items={['Akawopay\'s credit decisions', 'Customer repayment or default', 'Akawopay\'s internal credit policies', 'Customer eligibility decisions', 'Delays caused by banking networks or third-party financial infrastructure', 'The Merchant\'s goods or services', 'Customer disputes relating to the underlying purchase']}/>
      <p>Nothing in these Terms excludes liability that cannot lawfully be excluded under applicable law.</p>
    </Clause>

    <Clause heading="15. Compliance">
      <p>The Merchant agrees to comply with all applicable laws, regulations, industry requirements and reasonable operational instructions relating to its participation in the BNPL service.</p>
      <p>The availability of the BNPL service is subject to Akawopay and other relevant parties maintaining any licences, approvals or regulatory permissions required for their respective activities.</p>
    </Clause>

    <Clause heading="16. No Guarantee of Approval">
      <p>The Merchant understands that making BNPL available through Sync360 does not guarantee that every customer will qualify for financing. Approval is determined by Akawopay in accordance with its applicable eligibility and credit-assessment processes.</p>
    </Clause>

    <Clause heading="17. Changes to the Service">
      <p>Sync360 and/or Akawopay may modify, suspend or discontinue aspects of the BNPL service where reasonably necessary due to commercial, technical, regulatory, security or operational requirements. Where material changes affect the Merchant&apos;s obligations or fees, reasonable notice shall be provided where practicable.</p>
    </Clause>

    <Clause heading="18. Termination">
      <p>Either party may terminate the Merchant&apos;s participation in the BNPL service in accordance with the applicable notice requirements. Termination shall not affect transactions already successfully completed or obligations that accrued before termination.</p>
    </Clause>

    <Clause heading="19. Independent Relationship">
      <p>Nothing in these Terms creates a partnership, joint venture, employment relationship, agency relationship or lending relationship between Sync360 and the Merchant. Sync360&apos;s role is limited to providing the technology and facilitating access to the BNPL service provided by Akawopay.</p>
    </Clause>

    <Clause heading="20. Acceptance">
      <p>By activating or using the BNPL service through Sync360, the Merchant confirms that it has read, understood and agreed to these Terms and Conditions.</p>
    </Clause>
  </div>
}
