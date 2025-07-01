import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-gray-600">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
            <p className="text-gray-600 mt-2">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8">
            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  Welcome to Executa ("Company," "we," "our," or "us"). These Terms of Service ("Terms") govern your use of our AI assistant platform and related services (the "Service") operated by Executa.
                </p>
                <p>
                  By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service. These Terms constitute a legally binding agreement between you and Executa.
                </p>
                <p>
                  If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the authority to bind such entity to these Terms, in which case "you" and "your" will refer to such entity.
                </p>
              </div>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  Executa is a Software-as-a-Service (SaaS) platform that enables users to create, customize, and deploy AI-powered chatbots and virtual assistants. Our Service includes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>AI assistant creation and management tools</li>
                  <li>Document upload and knowledge base training</li>
                  <li>Integration with third-party services (Gmail, Slack, Dropbox, etc.)</li>
                  <li>Chat widget embedding and customization</li>
                  <li>Analytics and conversation monitoring</li>
                  <li>Customer support ticketing system</li>
                  <li>File processing and text extraction services</li>
                </ul>
              </div>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>3.1 Account Creation:</strong> To use our Service, you must create an account by providing accurate, current, and complete information. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
                </p>
                <p>
                  <strong>3.2 Account Security:</strong> You must immediately notify us of any unauthorized use of your account or any other breach of security. We will not be liable for any loss or damage arising from your failure to comply with this section.
                </p>
                <p>
                  <strong>3.3 Account Termination:</strong> We may terminate or suspend your account at any time for violations of these Terms or other policies, without prior notice.
                </p>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>You agree not to use the Service to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violate any applicable laws, regulations, or third-party rights</li>
                  <li>Upload malicious software, viruses, or harmful code</li>
                  <li>Engage in fraudulent, deceptive, or misleading activities</li>
                  <li>Harass, abuse, or harm other users or third parties</li>
                  <li>Generate or distribute spam, unsolicited communications, or illegal content</li>
                  <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Use the Service for any illegal or unauthorized purpose</li>
                  <li>Create AI assistants that generate harmful, offensive, or inappropriate content</li>
                  <li>Reverse engineer, decompile, or attempt to extract our source code</li>
                </ul>
              </div>
            </section>

            {/* Content and Data */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Content and Data</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>5.1 Your Content:</strong> You retain ownership of all content you upload, submit, or create through our Service ("User Content"). By uploading User Content, you grant us a limited, non-exclusive, royalty-free license to use, store, and process your content solely to provide the Service.
                </p>
                <p>
                  <strong>5.2 Content Responsibility:</strong> You are solely responsible for your User Content and warrant that you have all necessary rights to use and share it. You must not upload content that infringes intellectual property rights or violates applicable laws.
                </p>
                <p>
                  <strong>5.3 AI Training:</strong> Your uploaded content is used exclusively to train your specific AI assistants. We do not use your content to improve our general models or train other customers' assistants.
                </p>
                <p>
                  <strong>5.4 Data Security:</strong> We implement industry-standard security measures to protect your data, but you acknowledge that no system is completely secure.
                </p>
              </div>
            </section>

            {/* Subscription and Billing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Subscription and Billing</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>6.1 Subscription Plans:</strong> We offer various subscription plans with different features and usage limits. Current pricing and plan details are available on our website.
                </p>
                <p>
                  <strong>6.2 Payment Terms:</strong> Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law or as expressly stated in these Terms.
                </p>
                <p>
                  <strong>6.3 Auto-Renewal:</strong> Your subscription will automatically renew for successive periods unless you cancel before the renewal date.
                </p>
                <p>
                  <strong>6.4 Price Changes:</strong> We may change subscription prices with 30 days' notice. Price changes will take effect at your next billing cycle.
                </p>
                <p>
                  <strong>6.5 Cancellation:</strong> You may cancel your subscription at any time. Upon cancellation, you will retain access until the end of your current billing period.
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>7.1 Our IP:</strong> The Service, including all software, designs, text, graphics, and other content (excluding User Content), is owned by Executa and protected by intellectual property laws.
                </p>
                <p>
                  <strong>7.2 License to Use:</strong> We grant you a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms.
                </p>
                <p>
                  <strong>7.3 Feedback:</strong> Any feedback, suggestions, or ideas you provide about the Service may be used by us without compensation or attribution.
                </p>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Third-Party Integrations</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  Our Service integrates with third-party services such as Gmail, Slack, Dropbox, OpenAI, and others. Your use of these integrations is subject to the respective third-party terms and conditions. We are not responsible for third-party services or their availability.
                </p>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Warranties</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>9.1 AS-IS Service:</strong> The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied.
                </p>
                <p>
                  <strong>9.2 AI Limitations:</strong> AI-generated content may contain errors, inaccuracies, or inappropriate responses. You are responsible for reviewing and verifying AI outputs before use.
                </p>
                <p>
                  <strong>9.3 Uptime:</strong> While we strive for high availability, we do not guarantee uninterrupted service or any specific uptime percentage.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  To the maximum extent permitted by law, Executa shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising from your use of the Service.
                </p>
                <p>
                  Our total liability to you for any claims arising from these Terms or the Service shall not exceed the amount you paid us in the twelve months preceding the claim.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  You agree to indemnify and hold harmless Executa from any claims, damages, or expenses arising from your use of the Service, your User Content, or your violation of these Terms.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Termination</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>12.1 Termination by You:</strong> You may terminate your account at any time by contacting support or using account settings.
                </p>
                <p>
                  <strong>12.2 Termination by Us:</strong> We may terminate or suspend your access immediately for violations of these Terms or other policies.
                </p>
                <p>
                  <strong>12.3 Effect of Termination:</strong> Upon termination, your right to use the Service ceases immediately. We may delete your data after a reasonable period.
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law and Disputes</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  These Terms are governed by the laws of [Your State/Country]. Any disputes will be resolved through binding arbitration or in the courts of [Your Jurisdiction].
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  We may modify these Terms at any time. We will notify you of material changes via email or Service notification. Continued use of the Service after changes constitutes acceptance of the new Terms.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>If you have questions about these Terms, please contact us:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Email:</strong> info@executasolutions.com</p>
                  <p><strong>Support:</strong> info@executasolutions.com</p>
                  <p><strong>Address:</strong> [Your Company Address]</p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
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