export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-page)' }}>

      {/* Background glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(111,192,180,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold font-heading gradient-text">AralTayo</span>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>AI-powered study for Filipino students</p>
        </div>

        {/* Card */}
        <div className="gradient-border p-8" style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
