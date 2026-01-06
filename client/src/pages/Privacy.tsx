export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 border border-white/20 backdrop-blur rounded-xl p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last updated: January 2025</p>

          <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
              <p>SocialCommandFlow ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our social media management platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
              <p>We collect information you provide directly to us:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong className="text-white">Account Information:</strong> Email address, name, and password when you register</li>
                <li><strong className="text-white">Profile Data:</strong> Information you add to your profile</li>
                <li><strong className="text-white">Content:</strong> Brand briefs, generated content, captions, scripts, and media you create or upload</li>
                <li><strong className="text-white">Social Media Accounts:</strong> When you connect social platforms, we store access tokens to post on your behalf</li>
                <li><strong className="text-white">API Keys:</strong> If you provide your own API keys (Free/Core tier), we store them securely</li>
                <li><strong className="text-white">Payment Information:</strong> Processed securely through Stripe; we do not store full card details</li>
                <li><strong className="text-white">Usage Data:</strong> Features used, content generated, and platform interactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Generate AI content based on your brand briefs and prompts</li>
                <li>Post content to your connected social media accounts</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent or unauthorized activities</li>
                <li>Personalize and improve your experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Information Sharing</h2>
              <p>We may share your information in the following situations:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong className="text-white">Third-Party AI Services:</strong> Your prompts and content are sent to AI providers (OpenAI, ElevenLabs, A2E, Fal.ai) to generate content. These providers have their own privacy policies.</li>
                <li><strong className="text-white">Social Media Platforms:</strong> Content you choose to publish is shared with connected platforms (YouTube, TikTok, Instagram, etc.)</li>
                <li><strong className="text-white">Payment Processors:</strong> Stripe processes payments on our behalf</li>
                <li><strong className="text-white">Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
                <li><strong className="text-white">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
              <p className="mt-3">We do not sell your personal information to third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your data, including:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Secure storage of API keys and access tokens</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
              </ul>
              <p className="mt-3">However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
              <p>We retain your information for as long as your account is active or as needed to provide services. You can request deletion of your account and associated data at any time. Some information may be retained for legal, security, or business purposes.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to or restrict processing</li>
                <li>Data portability</li>
                <li>Withdraw consent</li>
              </ul>
              <p className="mt-3">To exercise these rights, contact us at privacy@socialcommandflow.com</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Cookies and Tracking</h2>
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze how our service is used</li>
                <li>Improve our platform</li>
              </ul>
              <p className="mt-3">You can control cookies through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Third-Party Links</h2>
              <p>Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Children's Privacy</h2>
              <p>Our service is not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. International Data Transfers</h2>
              <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the service after changes constitutes acceptance of the updated policy.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">13. Contact Us</h2>
              <p>If you have questions about this Privacy Policy or our data practices, please contact us at:</p>
              <p className="mt-2">Email: privacy@socialcommandflow.com</p>
            </section>

          </div>

          <div className="mt-10 pt-6 border-t border-white/20">
            <a href="/" className="text-purple-400 hover:text-purple-300 transition-colors">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
