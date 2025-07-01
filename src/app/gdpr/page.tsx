import Link from "next/link";

export default function GDPRCompliancePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">GDPR Compliance</h1>
            <p className="text-gray-600">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
            <p className="text-gray-600 mt-2">
              General Data Protection Regulation (GDPR) Compliance Information
            </p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Our Commitment to GDPR</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  Executa is committed to protecting the privacy and personal data of all individuals, particularly those in the European Union. We have implemented comprehensive measures to ensure compliance with the General Data Protection Regulation (GDPR) and respect your fundamental rights regarding personal data processing.
                </p>
                <p>
                  This page explains how we comply with GDPR requirements and your rights as a data subject under this regulation.
                </p>
              </div>
            </section>

            {/* Legal Basis */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Legal Basis for Processing</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>We process personal data based on the following legal grounds under Article 6 of GDPR:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Contractual Necessity (Article 6(1)(b)):</strong> Processing necessary to perform our contract with you (providing AI assistant services)</li>
                  <li><strong>Legitimate Interests (Article 6(1)(f)):</strong> Service improvement, security monitoring, and business operations</li>
                  <li><strong>Consent (Article 6(1)(a)):</strong> Analytics, marketing communications, and optional features</li>
                  <li><strong>Legal Obligation (Article 6(1)(c)):</strong> Compliance with applicable laws and regulations</li>
                  <li><strong>Vital Interests (Article 6(1)(d)):</strong> Protection of life and safety in emergency situations</li>
                </ul>
              </div>
            </section>

            {/* Data Subject Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Your Rights Under GDPR</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Right to Information (Articles 13-14)</h3>
              <p className="text-gray-700 mb-4">
                You have the right to be informed about the collection and use of your personal data. This information is provided in our Privacy Policy and this GDPR compliance page.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Right of Access (Article 15)</h3>
              <p className="text-gray-700 mb-4">
                You can request access to your personal data and receive a copy of the data we hold about you. To exercise this right, contact us at <strong>info@executasolutions.com</strong> with "Data Access Request" in the subject line.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 Right to Rectification (Article 16)</h3>
              <p className="text-gray-700 mb-4">
                You can request correction of inaccurate or incomplete personal data. You can update most information directly in your account settings or contact our support team.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.4 Right to Erasure (Article 17)</h3>
              <p className="text-gray-700 mb-4">
                You can request deletion of your personal data in certain circumstances, including when data is no longer necessary for the original purpose or when you withdraw consent.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.5 Right to Restrict Processing (Article 18)</h3>
              <p className="text-gray-700 mb-4">
                You can request restriction of processing in specific situations, such as when you contest the accuracy of data or object to processing.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.6 Right to Data Portability (Article 20)</h3>
              <p className="text-gray-700 mb-4">
                You can request your personal data in a structured, machine-readable format and have it transmitted to another controller where technically feasible.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.7 Right to Object (Article 21)</h3>
              <p className="text-gray-700 mb-4">
                You can object to processing based on legitimate interests or for direct marketing purposes. You can opt out of marketing communications at any time.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.8 Rights Related to Automated Decision Making (Article 22)</h3>
              <p className="text-gray-700 mb-4">
                You have rights regarding automated decision-making, including profiling. While our AI assistants use automated processing, these do not make decisions that significantly affect you without human oversight.
              </p>
            </section>

            {/* How to Exercise Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How to Exercise Your Rights</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>To exercise any of your GDPR rights, please:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email us at <strong>info@executasolutions.com</strong> with "GDPR Request" in the subject line</li>
                  <li>Include your full name, email address, and specific request type</li>
                  <li>Provide identification to verify your identity</li>
                  <li>Specify the data or processing activities your request relates to</li>
                </ul>
                <p>
                  We will respond to your request within <strong>30 days</strong> (or 60 days for complex requests). There is no fee for most requests, but we may charge a reasonable fee for excessive or repetitive requests.
                </p>
              </div>
            </section>

            {/* Data Processing Activities */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Processing Activities</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Categories of Personal Data</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Identity Data:</strong> Name, username, company name</li>
                <li><strong>Contact Data:</strong> Email address, physical address</li>
                <li><strong>Account Data:</strong> Password, account preferences, settings</li>
                <li><strong>Content Data:</strong> Uploaded documents, chat conversations, AI training data</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
                <li><strong>Usage Data:</strong> Service usage patterns, feature interactions</li>
                <li><strong>Marketing Data:</strong> Communication preferences, marketing consents</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.2 Purposes of Processing</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Providing AI assistant services and platform functionality</li>
                <li>Account management and customer support</li>
                <li>Billing and payment processing</li>
                <li>Service improvement and analytics</li>
                <li>Security monitoring and fraud prevention</li>
                <li>Legal compliance and dispute resolution</li>
                <li>Marketing communications (with consent)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.3 Data Recipients</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Service Providers:</strong> AWS (hosting), OpenAI (AI processing), Stripe (payments)</li>
                <li><strong>Business Partners:</strong> Integration providers (Gmail, Slack, Dropbox)</li>
                <li><strong>Legal Authorities:</strong> When required by law or legal process</li>
                <li><strong>Business Successors:</strong> In case of merger, acquisition, or sale</li>
              </ul>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. International Data Transfers</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  Your data may be transferred to and processed in countries outside the European Economic Area (EEA), including the United States. We ensure adequate protection through:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Standard Contractual Clauses (SCCs):</strong> EU-approved contracts with service providers</li>
                  <li><strong>Adequacy Decisions:</strong> Transfers to countries with adequate protection as decided by the European Commission</li>
                  <li><strong>Certification Schemes:</strong> Providers certified under approved frameworks</li>
                  <li><strong>Binding Corporate Rules:</strong> For transfers within corporate groups</li>
                </ul>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention Periods</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>We retain personal data only as long as necessary for the purposes for which it was collected:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Data:</strong> Until account deletion plus 30 days for security</li>
                  <li><strong>Content Data:</strong> Until you delete it or close your account</li>
                  <li><strong>Billing Data:</strong> 7 years for tax and accounting purposes</li>
                  <li><strong>Support Data:</strong> 3 years for quality assurance and training</li>
                  <li><strong>Analytics Data:</strong> 25 months for usage analytics (anonymized after 12 months)</li>
                  <li><strong>Security Logs:</strong> 12 months for security monitoring</li>
                </ul>
              </div>
            </section>

            {/* Security Measures */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Technical and Organizational Measures</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>We implement appropriate technical and organizational measures to ensure data security:</p>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Technical Measures:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>End-to-end encryption for data in transit (TLS 1.3)</li>
                  <li>Encryption at rest using AES-256</li>
                  <li>Multi-factor authentication for admin access</li>
                  <li>Regular security updates and vulnerability assessments</li>
                  <li>Automated backup and disaster recovery systems</li>
                  <li>Network security and intrusion detection</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">Organizational Measures:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Data protection training for all employees</li>
                  <li>Role-based access controls and need-to-know principles</li>
                  <li>Regular privacy impact assessments</li>
                  <li>Incident response and breach notification procedures</li>
                  <li>Vendor due diligence and contractual protections</li>
                  <li>Regular audits and compliance reviews</li>
                </ul>
              </div>
            </section>

            {/* Data Protection Officer */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Protection Officer</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  Our Data Protection Officer (DPO) oversees our data protection strategy and GDPR compliance. You can contact our DPO for privacy-related questions or concerns:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Data Protection Officer</strong></p>
                  <p><strong>Email:</strong> info@executasolutions.com</p>
                  <p><strong>Address:</strong> [Your Company Address]</p>
                </div>
              </div>
            </section>

            {/* Supervisory Authority */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Right to Lodge a Complaint</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  If you believe we have not handled your personal data in accordance with GDPR, you have the right to lodge a complaint with a supervisory authority, particularly in the EU member state where you reside, work, or where the alleged infringement occurred.
                </p>
                <p>
                  You can find contact details for EU supervisory authorities at: <a href="https://edpb.europa.eu/about-edpb/board/members_en" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://edpb.europa.eu/about-edpb/board/members_en</a>
                </p>
              </div>
            </section>

            {/* Data Breach Notification */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Data Breach Procedures</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Notify the relevant supervisory authority within 72 hours of becoming aware of the breach</li>
                  <li>Inform affected individuals without undue delay if there is a high risk to their rights and freedoms</li>
                  <li>Document the breach, its effects, and remedial actions taken</li>
                  <li>Implement measures to prevent similar breaches in the future</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>For any GDPR-related questions or to exercise your rights, please contact us:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>GDPR Requests:</strong> info@executasolutions.com</p>
                  <p><strong>Data Protection Officer:</strong> info@executasolutions.com</p>
                  <p><strong>General Support:</strong> info@executasolutions.com</p>
                  <p><strong>Address:</strong> [Your Company Address]</p>
                </div>
                <p>
                  Please include "GDPR Request" in your email subject line and specify the type of request you are making. We aim to respond to all requests within 30 days.
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-blue-600">Terms of Service</Link>
              <Link href="/dpa" className="hover:text-blue-600">Data Processing Agreement</Link>
              <Link href="/dashboard" className="hover:text-blue-600">Back to Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 