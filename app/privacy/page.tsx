    import React from 'react';

export default function PrivacyPolicy() {
  const lastUpdated = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="max-w-4xl mx-auto p-6 md:p-12 text-foreground bg-background min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8 text-sm">Last Updated: {lastUpdated}</p>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2 text-primary">1. Introduction</h2>
          <p>
            Welcome to our CRM Tool. We are committed to protecting your personal information and your right to privacy. 
            This policy explains how we handle data received from our website, Meta (Facebook/Instagram) Lead Ads, and 99acres.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-primary">2. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Contact Information:</strong> Name, email address, and phone number provided via lead forms.</li>
            <li><strong>Source Data:</strong> Information regarding which platform the lead originated from (e.g., Meta Ads or 99acres).</li>
            <li><strong>Property Preferences:</strong> Specific real estate interests mentioned in inquiry forms.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-primary">3. How We Use Your Information</h2>
          <p>We use the information we collect solely for the purpose of:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Managing and responding to real estate inquiries.</li>
            <li>Providing automated notifications to our CRM users via our dashboard.</li>
            <li>Improving our client's service delivery and lead management.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-primary">4. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data. We do not sell, rent, or share your personal 
            information with third parties for marketing purposes.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-primary">5. Meta & Third-Party Services</h2>
          <p>
            This CRM integrates with Meta APIs and 99acres webhooks. By submitting a form on those platforms, 
            your data is securely transferred to this CRM for the client's internal use only.
          </p>
        </div>

        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            For questions regarding this policy, please contact our CRM administration team.
          </p>
        </div>
      </section>
    </main>
  );
}