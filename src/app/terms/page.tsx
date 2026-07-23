export default function TermsPage() {
  return (
    <main className="section-divider overflow-x-clip pt-20 pb-16">
      <div className="container-wide">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Terms &amp; Conditions</h1>
            <p className="mt-2 text-sm text-white/50">Last updated: July 2026</p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/30 p-8 space-y-6 text-sm text-white/80 leading-relaxed">
            <Section title="1. Acceptance of Terms">
              By accessing or using Jorsas Tech&#39;s learning platform, you agree to be bound by these Terms and Conditions.
              If you do not agree, please do not use our services.
            </Section>

            <Section title="2. Enrollment and Registration">
              Registration does not guarantee enrollment. All registrations are subject to review and approval by the administration.
              We reserve the right to decline any registration at our discretion. Upon approval, you will receive a setup link to
              complete your account creation.
            </Section>

            <Section title="3. Payments and Fees">
              Course fees are as displayed at the time of registration. Payments are processed via Paystack and are subject to
              their terms. All fees are non-refundable unless otherwise stated in our refund policy. Referral discounts and
              agent-registered students are subject to specific pricing rules.
            </Section>

            <Section title="4. Agent Program Terms">
              Agents must provide accurate information during the application process. Agent commissions are calculated as 10%
              of the full course price for both referral and direct registrations. Commissions become payable upon successful
              student enrollment and payment. We reserve the right to modify commission rates with 30 days&#39; notice.
              Withdrawal requests are processed manually by the administration and paid to the bank account you provide.
            </Section>

            <Section title="5. Account Responsibilities">
              You are responsible for maintaining the confidentiality of your login credentials. You agree to notify us immediately
              of any unauthorized use of your account. We are not liable for any loss or damage arising from your failure to
              protect your account.
            </Section>

            <Section title="6. Code of Conduct">
              Users agree to use the platform respectfully. Harassment, abuse, or disruptive behavior toward instructors, staff,
              or fellow students may result in account suspension or termination without refund.
            </Section>

            <Section title="7. Intellectual Property">
              All course materials, content, and resources provided on the platform are the intellectual property of Jorsas Tech
              or our licensors. You may not reproduce, distribute, or create derivative works without explicit permission.
            </Section>

            <Section title="8. Limitation of Liability">
              Jorsas Tech shall not be liable for any indirect, incidental, special, or consequential damages arising from
              your use of the platform, including loss of data, profits, or business opportunity.
            </Section>

            <Section title="9. Modifications">
              We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated
              effective date. Continued use of the platform after changes constitutes acceptance of the new terms.
            </Section>

            <Section title="10. Governing Law">
              These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved
              through arbitration or in the courts of Nigeria.
            </Section>

            <Section title="11. Contact">
              For questions about these terms, contact us at{" "}
              <a href="mailto:support@jorsastech.com" className="text-red-400 hover:text-red-300 underline">support@jorsastech.com</a>.
            </Section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-white">{title}</h2>
      <p className="text-white/70">{children}</p>
    </div>
  );
}
