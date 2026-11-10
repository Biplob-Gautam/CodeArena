
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../components/Button";
import Input from "../../components/Input";
import Logo from "../../components/Logo";
import authService from "../../services/authService";
import authStore from "../../store/authStore";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loginId = email.trim();
      const credentials = loginId.includes("@")
        ? { email: loginId, password }
        : { username: loginId, password };
      const data = await authService.login(credentials, { rememberMe });
      authStore.login(data.user, data.token, rememberMe);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to log in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b14] px-4 py-10">

      {/* Background Effects */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#101827]/90 p-7 shadow-2xl shadow-black/30 sm:p-9">

          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-2xl text-blue-400">
              &lt;/&gt;
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white">
              Welcome Back!
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Login to continue your coding journey.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email or username */}
            <Input
              label="Email or username"
              name="loginId"
              type="text"
              placeholder="you@example.com or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3.5 pr-20 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between gap-3 text-xs">

              <label className="flex cursor-pointer items-center gap-2 text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 accent-blue-500"
                />
                Remember me
              </label>

            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400"
              >
                {error}
              </div>
            )}

            {/* Login Button */}
            <Button type="submit" className="mt-2" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login to CodeArena"}
              {!isSubmitting && <span>→</span>}
            </Button>

          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500">
              OR
            </span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              Create Account
            </Link>
          </p>

        </div>

        {/* Footer */}
        <p className="mt-7 text-center text-xs text-slate-600">
          © 2026 CodeArena. All rights reserved.
        </p>

      </div>
    </div>
  );
}

export default Login;
