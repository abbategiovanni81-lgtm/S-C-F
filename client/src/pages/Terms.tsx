export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 border border-white/20 backdrop-blur rounded-xl p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-400 mb-8">Last updated: December 2024</p>

          <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using SocialCommandFlow ("Service", "Platform", "we", "us"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of any changes.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
              <p>SocialCommandFlow is a social media management platform that provides AI-powered content creation tools, including but not limited to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>AI-generated scripts, captions, and hashtags</li>
                <li>AI voiceover generation</li>
                <li>AI avatar video creation</li>
                <li>AI image generation</li>
                <li>Social media scheduling and posting</li>
                <li>Social listening and content analysis</li>
                <li>Video editing and merging tools</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Account Registration</h2>
              <p>To use the Service, you must create an account with accurate information. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must be at least 18 years old to use this Service. You agree to notify us immediately of any unauthorized use of your account.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Subscription Tiers & Billing</h2>
              <p>We offer the following subscription tiers:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong className="text-white">Free Tier:</strong> Scripts and images only, requiring your own API keys. No monthly fee. 0 social channels.</li>
                <li><strong className="text-white">Core (£9.99/month):</strong> Unlimited usage with your own API keys. 1 social channel for scheduling.</li>
                <li><strong className="text-white">Premium (£29.99/month):</strong> Includes monthly quotas for AI generations using platform-provided API access. 3 social channels.</li>
                <li><strong className="text-white">Pro (£49.99/month):</strong> Higher quotas and additional features using platform-provided API access. 5 social channels.</li>
                <li><strong className="text-white">Studio (£99.99/month):</strong> <span className="text-yellow-400 font-semibold">Early adopter pricing. Limited time.</span> Enterprise tier with Creator Studio included, Studio Package video generation, Getty Images access, all 9 social channels, and 5 concurrent logins.</li>
              </ul>
              <p className="mt-3"><strong className="text-white">Creator Studio Add-on (£20/month):</strong> Available for Premium and Pro subscribers only (included free in Studio tier). Includes advanced AI tools: voice cloning, talking photos, talking videos, face swap, AI dubbing, image-to-video, caption removal, video style transfer, and virtual try-on. Each feature has monthly usage limits. The add-on can be cancelled at any time.</p>
              <p className="mt-3">Subscriptions are billed monthly in advance. You may cancel at any time, but refunds are not provided for partial months. We reserve the right to change pricing with 30 days notice. Usage quotas reset on the 1st of each month.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. AI-Generated Content Disclaimer</h2>
              <p className="font-semibold text-white">IMPORTANT: Please read this section carefully.</p>
              <p className="mt-2">The Service uses third-party AI providers (including OpenAI, Anthropic/Claude, ElevenLabs, A2E, Fal.ai, and others) to generate content. By using these features, you acknowledge and agree:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong className="text-white">No Guarantee of Accuracy:</strong> AI-generated content may contain errors, inaccuracies, or inappropriate material. You are solely responsible for reviewing and editing all AI-generated content before publishing.</li>
                <li><strong className="text-white">Content Ownership:</strong> You retain ownership of prompts you provide. AI-generated outputs are provided under the terms of the respective AI provider. We make no claim to ownership of your generated content.</li>
                <li><strong className="text-white">No Liability:</strong> We are not liable for any damages, claims, or losses arising from AI-generated content, including but not limited to defamation, copyright infringement, or reputational harm.</li>
                <li><strong className="text-white">Compliance:</strong> You are responsible for ensuring AI-generated content complies with applicable laws, platform terms of service, and does not infringe third-party rights.</li>
                <li><strong className="text-white">AI Limitations:</strong> AI systems may produce unexpected, biased, or inappropriate outputs. You acknowledge these limitations and agree to use the Service at your own risk.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Third-Party API Keys & Services</h2>
              <p>Free tier users must provide their own API keys for AI services. By entering API keys:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>You confirm you have the right to use those keys</li>
                <li>You are responsible for all charges incurred through your API keys</li>
                <li>We store your keys securely but are not liable for unauthorized access</li>
                <li>You agree to the terms of service of each third-party provider</li>
              </ul>
              <p className="mt-3">Premium and Pro users access AI services through our platform API keys. Usage is subject to monthly quotas as specified in your subscription tier.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Acceptable Use Policy</h2>
              <p>You agree NOT to use the Service to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Generate illegal, harmful, threatening, abusive, or harassing content</li>
                <li>Create content that infringes intellectual property rights</li>
                <li>Produce deepfakes or deceptive content without consent</li>
                <li>Generate spam or misleading advertising</li>
                <li>Create content depicting minors in any inappropriate context</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Attempt to reverse engineer, hack, or exploit the platform</li>
                <li>Resell or redistribute access to the Service without authorization</li>
              </ul>
              <p className="mt-3">Violation of this policy may result in immediate account termination without refund.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Intellectual Property</h2>
              <p>The Service, including its design, features, and code, is owned by us and protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without written permission. Your content remains yours, but you grant us a license to process it for Service delivery.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>The Service is provided "AS IS" without warranties of any kind</li>
                <li>We disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose</li>
                <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim</li>
                <li>We are not responsible for third-party service outages, API changes, or discontinuation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Indemnification</h2>
              <p>You agree to indemnify and hold harmless SocialCommandFlow, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Service, your content, or your violation of these Terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Privacy & Data</h2>
              <p>Your use of the Service is also governed by our Privacy Policy. We collect and process data as necessary to provide the Service. By using the Service, you consent to data processing as described in our Privacy Policy. We implement reasonable security measures but cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Termination</h2>
              <p>We may suspend or terminate your account at any time for violation of these Terms or for any other reason at our discretion. Upon termination, your right to use the Service ceases immediately. We may delete your data after termination. You may cancel your account at any time through the Settings page.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">13. Service Availability</h2>
              <p>We strive to maintain high availability but do not guarantee uninterrupted service. We may modify, suspend, or discontinue features at any time. Scheduled maintenance will be announced when possible. We are not liable for any downtime or service interruptions.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">14. Governing Law & Disputes</h2>
              <p>These Terms are governed by the laws of England and Wales. Any disputes shall be resolved in the courts of England and Wales. You agree to attempt informal resolution before initiating legal proceedings.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">15. Contact</h2>
              <p>For questions about these Terms, contact us at: support@socialcommandflow.com</p>
            </section>

            <section className="border-t border-white/20 pt-6 mt-8">
              <p className="text-sm text-gray-400">By using SocialCommandFlow, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
            </section>

          </div>

          <div className="mt-8 text-center">
            <a href="/" className="text-purple-400 hover:text-purple-300 underline">Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  );
}
