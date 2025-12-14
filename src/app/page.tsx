import { getLocalIpAddress } from '@/lib/serverUtils';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const ipAddress = getLocalIpAddress();

  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      <div className="fixed inset-0 -z-10 h-full w-full bg-slate-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-blue-500/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

      <div className="container mx-auto py-12 px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
            AirShare
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Fast, secure local file sharing. No internet required.
            Connect devices to your WiFi and share instantly.
          </p>
        </header>

        <Dashboard ipAddress={ipAddress} />
      </div>
    </main>
  );
}
