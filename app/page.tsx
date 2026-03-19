export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        Welcome to Vibe Starter
      </h1>
      
      <p className="text-[var(--muted)] mb-8">
        Start building your prototype. Edit <code className="bg-[var(--card)] px-2 py-1 rounded">app/page.tsx</code> to get started.
      </p>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-2">Quick Start</h2>
        <ol className="list-decimal list-inside space-y-2 text-[var(--muted)]">
          <li>Edit this page to build your prototype</li>
          <li>Update <code className="bg-[var(--card)] px-1 rounded">CLAUDE.md</code> with context</li>
          <li>Run <code className="bg-[var(--card)] px-1 rounded">npm run deploy</code> to ship it</li>
        </ol>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Deploy to VibeSharing</h2>
        <p className="text-[var(--muted)] mb-4">
          When you&apos;re ready, deploy with one command:
        </p>
        <code className="block bg-black text-green-400 p-4 rounded-lg font-mono">
          npm run deploy
        </code>
      </div>
    </main>
  );
}
