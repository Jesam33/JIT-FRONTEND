export default function PrivacyPage() {
  return (
    <main className="section-divider overflow-x-clip pt-20 pb-16">
      <div className="container-wide">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Privacy Policy</h1>
            <p className="mt-2 text-sm text-white/50">Last updated: July 2026</p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/30 p-8 space-y-6 text-sm text-white/80 leading-relaxed">
            <Section title="1. Information We Collect">
              We collect personal information you provide when using our platform, including your name, email address, phone number,
              home address, qualification details, and payment information. We also collect information about your course registrations,
              enrollment activity, and learning progress.
            </Section>

            <Section title="2. How We Use Your Information">
              Your information is used to process registrations, manage enrollments, facilitate payments, communicate important updates,
              provide customer support, and improve our educational services. Information specific to Admission Marketers is used to track referrals,
              calculate commissions, and process withdrawal requests.
            </Section>

            <Section title="3. Admission-Marketer Program Data">
              If you are an Admission Marketer, we collect additional information including bank account details for payout processing,
              referral codes, commission records, and withdrawal history. This data is shared with our administrative team
              solely for managing the Admission-Marketer program.
            </Section>

            <Section title="4. Payment Processing">
              Payments are processed through Paystack, a third-party payment processor. We do not store your full payment card details.
              Paystack&#39;s privacy policy governs how they handle your payment data.
            </Section>

            <Section title="5. Data Sharing">
              We do not sell your personal information. Your data may be shared with trusted third parties who assist in operating
              our platform (payment processors, email services, cloud hosting), provided they agree to keep your information confidential.
            </Section>

            <Section title="6. Data Retention">
              We retain your personal information for as long as your account is active or as needed to provide you with services.
              You may request deletion of your data by contacting us, subject to our legal obligations to retain certain records.
            </Section>

            <Section title="7. Your Rights">
              You have the right to access, update, or delete your personal information. You may also request a copy of the data
              we hold about you. To exercise these rights, please contact our support team.
            </Section>

            <Section title="8. Security">
              We implement reasonable security measures to protect your personal information from unauthorized access, alteration,
              disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
            </Section>

            <Section title="9. Contact Us">
              If you have any questions about this Privacy Policy, please contact us at{" "}
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
