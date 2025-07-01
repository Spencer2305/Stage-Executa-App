import Link from "next/link";

export default function DataProcessingAgreementPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Data Processing Agreement</h1>
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction and Scope</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  This Data Processing Agreement ("DPA") forms part of the Terms of Service between you ("Customer," "Controller," "you") and Executa ("Processor," "we," "us") and governs the processing of personal data in connection with the Executa AI assistant platform services ("Services").
                </p>
                <p>
                  This DPA applies when and to the extent that Executa processes personal data on behalf of the Customer in the course of providing the Services, and such personal data is subject to data protection laws, including but not limited to the European Union General Data Protection Regulation (GDPR), UK GDPR, California Consumer Privacy Act (CCPA), and other applicable privacy laws.
                </p>
              </div>
            </section>

            {/* Definitions */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Definitions</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>For the purposes of this DPA:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>"Controller"</strong> means the entity that determines the purposes and means of processing personal data</li>
                  <li><strong>"Processor"</strong> means the entity that processes personal data on behalf of the Controller</li>
                  <li><strong>"Personal Data"</strong> has the meaning given in applicable data protection laws</li>
                  <li><strong>"Processing"</strong> has the meaning given in applicable data protection laws</li>
                  <li><strong>"Data Subject"</strong> means an identified or identifiable natural person</li>
                  <li><strong>"Sub-processor"</strong> means any processor engaged by Executa to process personal data</li>
                  <li><strong>"Data Protection Laws"</strong> means all applicable laws relating to data protection and privacy</li>
                  <li><strong>"Supervisory Authority"</strong> means the relevant data protection authority</li>
                </ul>
              </div>
            </section>

            {/* Roles and Responsibilities */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Roles and Responsibilities</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Customer as Controller</h3>
              <div className="prose text-gray-700 space-y-4">
                <p>Customer acknowledges that it is the Controller of personal data and agrees to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Ensure it has a lawful basis for processing under applicable data protection laws</li>
                  <li>Provide all necessary notices to data subjects</li>
                  <li>Obtain any required consents from data subjects</li>
                  <li>Ensure the personal data provided to Executa is accurate and up-to-date</li>
                  <li>Not provide special categories of personal data unless explicitly agreed</li>
                  <li>Respond to data subject requests where Customer is the appropriate respondent</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 Executa as Processor</h3>
              <div className="prose text-gray-700 space-y-4">
                <p>Executa acknowledges that it is the Processor of personal data and agrees to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Process personal data only on documented instructions from Customer</li>
                  <li>Implement appropriate technical and organizational measures</li>
                  <li>Ensure confidentiality of personal data</li>
                  <li>Assist Customer in responding to data subject requests</li>
                  <li>Notify Customer of any personal data breaches</li>
                  <li>Delete or return personal data upon termination</li>
                </ul>
              </div>
            </section>

            {/* Processing Details */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Details of Processing</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Subject Matter and Duration</h3>
              <p className="text-gray-700 mb-4">
                The subject matter of processing is the provision of AI assistant platform services. Processing will continue for the duration of the Customer's subscription and applicable retention periods as outlined in our Privacy Policy.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Nature and Purpose of Processing</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Creating and training AI assistants using Customer-provided content</li>
                <li>Processing conversations and interactions with AI assistants</li>
                <li>Providing analytics and insights on assistant performance</li>
                <li>Integrating with third-party services as authorized by Customer</li>
                <li>Providing customer support and technical assistance</li>
                <li>Ensuring security and preventing abuse of the Services</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.3 Categories of Data Subjects</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Customer's employees, contractors, and authorized users</li>
                <li>Customer's end users who interact with AI assistants</li>
                <li>Individuals whose data is contained in Customer-uploaded documents</li>
                <li>Recipients of communications from Customer's AI assistants</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.4 Categories of Personal Data</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Contact information (names, email addresses, phone numbers)</li>
                <li>Professional information (job titles, company details)</li>
                <li>Communication content (messages, conversations, documents)</li>
                <li>Technical data (IP addresses, browser information, usage logs)</li>
                <li>Authentication data (usernames, encrypted passwords)</li>
                <li>Any other personal data uploaded or processed through the Services</li>
              </ul>
            </section>

            {/* Processing Instructions */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Processing Instructions</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>5.1 Initial Instructions:</strong> Customer instructs Executa to process personal data as necessary to provide the Services in accordance with the Terms of Service and this DPA.
                </p>
                <p>
                  <strong>5.2 Additional Instructions:</strong> Customer may provide additional written instructions regarding the processing of personal data. Executa will implement such instructions unless they conflict with data protection laws.
                </p>
                <p>
                  <strong>5.3 Unlawful Instructions:</strong> If Executa believes that an instruction violates applicable data protection laws, it will promptly inform Customer and may refuse to carry out the instruction.
                </p>
              </div>
            </section>

            {/* Security Measures */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Technical and Organizational Measures</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>Executa implements and maintains appropriate technical and organizational measures to protect personal data:</p>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Technical Measures:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encryption of data in transit using TLS 1.3 or higher</li>
                  <li>Encryption of data at rest using AES-256 encryption</li>
                  <li>Multi-factor authentication for administrative access</li>
                  <li>Regular security updates and vulnerability assessments</li>
                  <li>Network security controls and intrusion detection systems</li>
                  <li>Secure backup and disaster recovery procedures</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">Organizational Measures:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Data protection and security training for all personnel</li>
                  <li>Role-based access controls and need-to-know principles</li>
                  <li>Background checks for personnel with access to personal data</li>
                  <li>Confidentiality agreements with all personnel</li>
                  <li>Incident response and breach notification procedures</li>
                  <li>Regular security audits and assessments</li>
                </ul>
              </div>
            </section>

            {/* Sub-processors */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Sub-processors</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>7.1 Authorization:</strong> Customer authorizes Executa to engage sub-processors to assist in providing the Services, subject to the conditions in this section.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">7.2 Current Sub-processors:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Amazon Web Services (AWS):</strong> Cloud hosting and storage services</li>
                    <li><strong>OpenAI:</strong> AI processing and natural language understanding</li>
                    <li><strong>Stripe:</strong> Payment processing services</li>
                    <li><strong>Integration providers:</strong> Gmail, Slack, Dropbox APIs as authorized by Customer</li>
                  </ul>
                </div>

                <p>
                  <strong>7.3 Sub-processor Requirements:</strong> Executa ensures that all sub-processors:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Are bound by data protection obligations equivalent to those in this DPA</li>
                  <li>Implement appropriate technical and organizational measures</li>
                  <li>Provide sufficient guarantees regarding data protection compliance</li>
                  <li>Are subject to regular audits and assessments</li>
                </ul>

                <p>
                  <strong>7.4 Changes to Sub-processors:</strong> Executa will provide 30 days' notice of any new sub-processors. Customer may object to new sub-processors for material reasons related to data protection.
                </p>
              </div>
            </section>

            {/* Data Subject Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Subject Rights</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>8.1 Assistance with Requests:</strong> Executa will assist Customer in responding to data subject requests by providing the necessary information and tools to fulfill such requests within the Services.
                </p>
                <p>
                  <strong>8.2 Direct Requests:</strong> If Executa receives a data subject request directly, it will promptly forward the request to Customer and will not respond to the request except as directed by Customer or required by law.
                </p>
                <p>
                  <strong>8.3 Technical Assistance:</strong> Executa will provide reasonable technical assistance to help Customer respond to data subject requests, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Providing access to personal data through the Services interface</li>
                  <li>Enabling correction or deletion of personal data</li>
                  <li>Facilitating data portability where technically feasible</li>
                  <li>Implementing processing restrictions as requested</li>
                </ul>
              </div>
            </section>

            {/* Personal Data Breaches */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Personal Data Breaches</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>9.1 Notification:</strong> Executa will notify Customer without undue delay (and in any event within 72 hours) upon becoming aware of a personal data breach affecting Customer's personal data.
                </p>
                <p>
                  <strong>9.2 Breach Information:</strong> The notification will include, to the extent possible:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Description of the nature of the breach</li>
                  <li>Categories and approximate number of data subjects affected</li>
                  <li>Categories and approximate number of personal data records affected</li>
                  <li>Likely consequences of the breach</li>
                  <li>Measures taken or proposed to address the breach</li>
                  <li>Contact information for further information</li>
                </ul>
                <p>
                  <strong>9.3 Cooperation:</strong> Executa will cooperate with Customer and provide reasonable assistance in any investigation, mitigation, or notification activities related to the breach.
                </p>
              </div>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>10.1 Transfer Basis:</strong> To the extent that processing involves transfers of personal data outside the EEA, UK, or other regions with data localization requirements, such transfers shall be governed by appropriate safeguards, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Standard Contractual Clauses approved by the European Commission</li>
                  <li>Adequacy decisions by relevant authorities</li>
                  <li>Certification schemes and codes of conduct</li>
                  <li>Binding corporate rules where applicable</li>
                </ul>
                <p>
                  <strong>10.2 Additional Protections:</strong> Executa implements additional technical and organizational measures to ensure the security of international transfers, including encryption and access controls.
                </p>
              </div>
            </section>

            {/* Audits and Compliance */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Audits and Compliance</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>11.1 Records:</strong> Executa maintains records of all processing activities carried out on behalf of Customer as required by applicable data protection laws.
                </p>
                <p>
                  <strong>11.2 Audit Rights:</strong> Customer may audit Executa's compliance with this DPA through:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Review of compliance certifications and audit reports</li>
                  <li>Completion of security questionnaires</li>
                  <li>On-site audits (with reasonable notice and during business hours)</li>
                </ul>
                <p>
                  <strong>11.3 Audit Frequency:</strong> Audits may be conducted no more than once per year unless required by a supervisory authority or in response to a security incident.
                </p>
              </div>
            </section>

            {/* Data Return and Deletion */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Data Return and Deletion</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>12.1 Upon Termination:</strong> Upon termination of the Services or this DPA, Executa will:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Return all personal data to Customer in a commonly used format</li>
                  <li>Delete all personal data from Executa's systems and sub-processors</li>
                  <li>Provide certification of deletion upon Customer's request</li>
                </ul>
                <p>
                  <strong>12.2 Retention Period:</strong> Customer has 30 days after termination to retrieve personal data. After this period, all personal data will be securely deleted.
                </p>
                <p>
                  <strong>12.3 Legal Requirements:</strong> Executa may retain personal data to the extent required by applicable law, but only for as long as required and subject to appropriate safeguards.
                </p>
              </div>
            </section>

            {/* Liability and Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Liability and Indemnification</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  <strong>13.1 Mutual Indemnification:</strong> Each party agrees to indemnify the other against claims arising from its breach of this DPA or applicable data protection laws.
                </p>
                <p>
                  <strong>13.2 Limitation of Liability:</strong> Liability under this DPA is subject to the limitation of liability provisions in the Terms of Service.
                </p>
                <p>
                  <strong>13.3 Cooperation:</strong> The parties agree to cooperate in good faith to defend against any claims related to the processing of personal data under this DPA.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>For questions about this DPA or data processing matters, please contact:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Data Protection Officer:</strong> info@executasolutions.com</p>
                  <p><strong>Legal Department:</strong> info@executasolutions.com</p>
                  <p><strong>Security Team:</strong> info@executasolutions.com</p>
                  <p><strong>General Support:</strong> info@executasolutions.com</p>
                  <p><strong>Address:</strong> [Your Company Address]</p>
                </div>
              </div>
            </section>

            {/* Effective Date and Changes */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Effective Date and Changes</h2>
              <div className="prose text-gray-700 space-y-4">
                <p>
                  This DPA is effective as of the date Customer first uses the Services and will remain in effect until termination of the Services. Executa may update this DPA from time to time to reflect changes in data protection laws or business practices. Material changes will be communicated to Customer with at least 30 days' notice.
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-blue-600">Terms of Service</Link>
              <Link href="/gdpr" className="hover:text-blue-600">GDPR Compliance</Link>
              <Link href="/dashboard" className="hover:text-blue-600">Back to Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 