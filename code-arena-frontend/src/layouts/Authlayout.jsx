
function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b14] px-4 py-10">

      {/* Background Effects */}
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="text-3xl font-bold text-blue-400">
              &lt;/&gt;
            </span>

            <span className="text-2xl font-bold text-white">
              CodeArena
            </span>
          </div>

          <p className="text-sm text-slate-400">
            Compete. Code. Conquer.
          </p>
        </div>

        {/* Page Content */}
        <div className="rounded-2xl border border-slate-800 bg-[#101827] p-6 shadow-2xl shadow-black/20 sm:p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          © 2026 CodeArena. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default AuthLayout;
