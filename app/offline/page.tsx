export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md w-full">
        {/* Brand mark */}
        <div className="mb-8">
          <span className="font-display text-4xl font-bold text-foreground select-none">
            Peer
            <span className="opacity-70">Help</span>
            <span className="text-neon-green ml-0.5">//</span>
            <span className="text-neon-green opacity-40">/</span>
          </span>
        </div>

        <div className="rounded-2xl border border-overlay/[0.07] bg-forest px-8 py-10">
          <div className="text-5xl mb-4">📡</div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">
            You&apos;re offline
          </h1>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            PeerHelp couldn&apos;t reach the server. Check your connection and
            try again.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-neon-green text-void font-semibold text-sm px-6 py-2.5 hover:opacity-90 transition-opacity"
          >
            Retry
          </a>
        </div>
      </div>
    </div>
  );
}
