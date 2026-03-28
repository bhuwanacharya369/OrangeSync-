import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 lg:px-24">
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
          <span className="text-orange-600">OrangeSync</span> Data Policy
        </h1>
        <div className="prose prose-orange lg:prose-lg text-gray-600">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as your name, email address, password (securely hashed), and profile information.</p>

          <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">2. End-to-End Encryption (E2EE)</h2>
          <p>All video, audio, and synchronous data channels utilized through our WebRTC and LiveKit SFU infrastructure are encrypted in transit. Your media streams are not stored on our servers.</p>

          <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">3. Data Sharing</h2>
          <p>OrangeSync does not sell your personal data. We only share data with third-party vendors explicitly required to operate the service (e.g., Supabase for database, LiveKit for network routing).</p>

          <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">4. Biometric Data</h2>
          <p>If you enable FaceID or Fingerprint authentication on our mobile apps, the biometric templates never leave your device. We use standard OS-level local authentication.</p>

        </div>
        <div className="mt-12 text-center text-sm font-semibold text-gray-500 hover:text-orange-600 transition-colors">
          <Link href="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
