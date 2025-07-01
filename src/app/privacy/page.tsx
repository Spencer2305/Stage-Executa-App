import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-600">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
            <p className="text-gray-600 mt-2">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  Welcome to Executa ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, process, and safeguard your information when you use our AI assistant platform and related services (the "Service").
                </p>
                <p>
                  By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, do not use our Service.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Account Information:</strong> Name, email address, company name, password</li>
                <li><strong>Profile Information:</strong> Avatar, bio, company details, website</li>
                <li><strong>Billing Information:</strong> Payment details processed securely through Stripe</li>
                <li><strong>Content Data:</strong> Documents, files, and text you upload to train AI assistants</li>
                <li><strong>Integration Data:</strong> Data from connected services (Gmail, Slack, Dropbox, etc.)</li>
                <li><strong>Support Communications:</strong> Messages and attachments in support tickets</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Usage Data:</strong> How you interact with our Service, features used, time spent</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                <li><strong>Log Data:</strong> Server logs, error reports, performance metrics</li>
                <li><strong>Analytics Data:</strong> Conversation metrics, response times, user satisfaction ratings</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies, preference cookies, analytics cookies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 Third-Party Data</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Integration Services:</strong> Data from Gmail, Slack, Dropbox, and other connected services</li>
                <li><strong>Payment Processors:</strong> Transaction data from Stripe</li>
                <li><strong>Analytics Providers:</strong> Usage statistics and performance data</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Service Provision:</strong> Create and manage AI assistants, process uploaded content</li>
                <li><strong>AI Training:</strong> Train your custom AI assistants using your uploaded documents</li>
                <li><strong>Communication:</strong> Send service updates, support responses, billing notifications</li>
                <li><strong>Improvement:</strong> Analyze usage patterns to improve our Service</li>
                <li><strong>Security:</strong> Detect fraud, abuse, and security threats</li>
                <li><strong>Compliance:</strong> Meet legal obligations and enforce our terms</li>
                <li><strong>Analytics:</strong> Generate insights about assistant performance and user engagement</li>
                <li><strong>Integration:</strong> Connect with third-party services you authorize</li>
              </ul>
            </section>

            {/* AI and Machine Learning */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. AI and Machine Learning Processing</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>Your Data for Your AI:</strong> Content you upload is used exclusively to train your specific AI assistants. We do not use your data to train our general models or other customers' assistants.
                </p>
                <p>
                  <strong>OpenAI Processing:</strong> We use OpenAI's services to power AI conversations. Your uploaded content may be processed by OpenAI to generate responses, but is not used by OpenAI to train their models.
                </p>
                <p>
                  <strong>Data Isolation:</strong> Each customer's data is isolated and cannot be accessed by other customers or their AI assistants.
                </p>
              </div>
            </section>

            {/* Data Storage and Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Storage and Security</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Encryption:</strong> Data encrypted in transit (TLS) and at rest (AES-256)</li>
                <li><strong>Access Controls:</strong> Multi-factor authentication and role-based access</li>
                <li><strong>Infrastructure:</strong> Hosted on secure AWS infrastructure with SOC 2 compliance</li>
                <li><strong>Data Centers:</strong> Primary storage in US-East-1 (Virginia) region</li>
                <li><strong>Backups:</strong> Regular encrypted backups with 7-day retention</li>
                <li><strong>Monitoring:</strong> 24/7 security monitoring and incident response</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Information Sharing and Disclosure</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>We do not sell, trade, or rent your personal information. We may share information in these limited circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Service Providers:</strong> AWS (hosting), OpenAI (AI processing), Stripe (payments)</li>
                  <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                  <li><strong>Consent:</strong> When you explicitly authorize sharing</li>
                  <li><strong>Integrations:</strong> Data shared with services you connect (Gmail, Slack, etc.)</li>
                </ul>
              </div>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. International Data Transfers</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  Your data is primarily stored and processed in the United States. If you are located outside the US, your data will be transferred to and processed in the US. We ensure appropriate safeguards are in place for international transfers, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Standard Contractual Clauses (SCCs) with service providers</li>
                  <li>Adequacy decisions where applicable</li>
                  <li>Robust security measures regardless of location</li>
                </ul>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights and Choices</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 Access and Control</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Access:</strong> View and download your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Export your data in a structured format</li>
                <li><strong>Restriction:</strong> Limit processing of your data</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.2 GDPR Rights (EU Residents)</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Right to be informed about data processing</li>
                <li>Right of access to your personal data</li>
                <li>Right to rectification of inaccurate data</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Rights related to automated decision making</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.3 CCPA Rights (California Residents)</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Right to know what personal information is collected</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of sale (we do not sell personal information)</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Retention</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Account Data:</strong> Retained while your account is active</li>
                <li><strong>Uploaded Content:</strong> Retained until you delete it or close your account</li>
                <li><strong>Conversation Logs:</strong> Retained for 2 years for service improvement</li>
                <li><strong>Billing Records:</strong> Retained for 7 years for tax and legal purposes</li>
                <li><strong>Support Tickets:</strong> Retained for 3 years for quality assurance</li>
                <li><strong>Analytics Data:</strong> Aggregated data retained indefinitely (anonymized)</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cookies and Tracking Technologies</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Essential Cookies:</strong> Enable core functionality and security</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Analytics Cookies:</strong> Understand how you use our Service</li>
                  <li><strong>Performance Cookies:</strong> Monitor and improve Service performance</li>
                </ul>
                <p>You can control cookies through your browser settings, but disabling essential cookies may affect Service functionality.</p>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Children's Privacy</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  Our Service is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe your child has provided personal information, please contact us to have it removed.
                </p>
              </div>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. For material changes, we will provide additional notice via email or Service notification.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Email:</strong> info@executasolutions.com</p>
                  <p><strong>Support:</strong> info@executasolutions.com</p>
                  <p><strong>Address:</strong> [Your Company Address]</p>
                </div>
                <p>
                  <strong>Data Protection Officer (EU):</strong> If you are in the European Union, you may contact our Data Protection Officer at info@executasolutions.com
                </p>
                <p>
                  For GDPR-related requests, please include "GDPR Request" in your email subject line and specify the type of request you are making.
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <Link href="/terms" className="hover:text-blue-600">Terms of Service</Link>
              <Link href="/gdpr" className="hover:text-blue-600">GDPR Compliance</Link>
              <Link href="/dpa" className="hover:text-blue-600">Data Processing Agreement</Link>
              <Link href="/dashboard" className="hover:text-blue-600">Back to Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 