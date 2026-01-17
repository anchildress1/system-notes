import { getProjects } from '@/lib/api';

export default async function Home() {
  const projects = await getProjects();

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-foreground">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-background/90 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent-teal flex items-center justify-center">
            {/* Logo Placeholder */}
            <div className="w-6 h-6 border-2 border-white/20 rounded-full" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight">ANTHONY CHILDRESS</h1>
            <span className="text-xs text-white/50 font-mono">anchildress1</span>
          </div>
        </div>
        <nav className="flex gap-6 text-sm font-medium text-white/70">
          <a href="#" className="hover:text-primary transition-colors">
            Projects
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            About
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Search
          </a>
        </nav>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 px-8 py-12 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-2xl font-light mb-2">Developer portfolio web app presented as a</h2>
          <p className="text-white/60">Live Example App screen (showcased AI projects)</p>
          <div className="mt-4 text-xs font-mono text-white/40">Fixed Customizable / Phases</div>
        </div>

        {/* Project Grid */}
        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-2 text-center text-white/50 py-12 border border-white/5 rounded-xl bg-surface/50">
              System Offline. No nodes detected. <br />
              <span className="text-xs text-accent-pink">Check API connection.</span>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-surface/50 border border-white/5 rounded-xl p-8 hover:border-primary/50 transition-all duration-300 min-h-[240px] flex flex-col"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <h3 className="text-2xl font-bold mb-2 z-10">{project.title}</h3>
                <p className="text-white/60 text-sm mb-6 line-clamp-3 flex-grow z-10">
                  {project.description}
                </p>
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-accent-pink font-medium z-10 hover:underline"
                  >
                    <div className="w-2 h-2 rounded-full bg-accent-pink" />
                    Open in GitHub
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* AI Chat Widget (Pop-In) */}
      <div className="fixed bottom-8 right-8 w-80 bg-surface/90 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50">
        <div className="bg-gradient-to-r from-primary/20 to-accent-teal/20 p-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-teal animate-pulse" />
            <span className="text-xs font-bold tracking-wide">Pop-In AI Chat</span>
          </div>
          <button className="text-white/50 hover:text-white">
            <div className="w-4 h-0.5 bg-current" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-white/5 rounded p-3 text-sm">
            <div className="text-xs text-white/40 mb-1">anthony.childress1</div>
            <p className="text-white/80">
              <span className="text-accent-pink font-bold">System notes</span>, huh? Sounds dreamy.
              What&apos;s on your mind?
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Text in smj amper hito..."
              className="w-full bg-background/50 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
            />
            <div className="absolute right-2 top-2 text-accent-teal">
              {/* Send Icon placeholder */}
              <div className="w-4 h-4 rounded bg-accent-teal/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Profile */}
      <div className="fixed bottom-8 left-8 flex items-center gap-3 z-40 opacity-50 hover:opacity-100 transition-opacity">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-background" />
          <div className="w-8 h-8 rounded-full bg-white/10 border border-background" />
        </div>
        <div className="text-xs">
          <div className="text-white/40">Seen at...</div>
          <div className="font-mono text-primary">anthony.childress1, conn enaim...</div>
        </div>
      </div>
    </div>
  );
}
