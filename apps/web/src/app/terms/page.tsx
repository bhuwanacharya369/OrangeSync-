import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 lg:px-24">
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
          <span className="text-orange-600">OrangeSync</span> Terms of Service
        </h1>
        <div className="prose prose-orange lg:prose-lg text-gray-600">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing OrangeSync, you agree to be bound by these Terms. If you do not agree, you may not use our services.</p>

          <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">2. Appropriate Usage</h2>
          <p>You agree not to use the service for any illegal activities. Screen sharing and 'Watch Together' features must comply with all relevant copyright laws.</p>

          <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">3. Interactivity & PDF</h2>
          <p>Any documents uploaded to the interactive whiteboard or PDF sharing system remain your property but must not contain unlawful material.</p>

          <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">4. Account Security</h2>
          <p>You are responsible for safeguarding your password and unique Sync ID. Any activities under your account are your responsibility.</p>
        </div>
        <div className="mt-12 text-center text-sm font-semibold text-gray-500 hover:text-orange-600 transition-colors">
          <Link href="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
