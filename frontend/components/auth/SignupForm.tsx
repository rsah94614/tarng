"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";
import { Spinner } from "@/components/ui/Spinner";
import { Eye, EyeOff } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Register
      const tokens = await authService.register(formData);
      setTokens(tokens.access_token, tokens.refresh_token);
      // 2. Fetch profile
      const user = await authService.getMe();
      setUser(user);
      router.push("/feed");
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground">Enter your details to join tarng</p>
      </div>

      {error && (
        <div className="p-3 text-sm rounded-lg bg-destructive/15 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
          <input
            id="email" name="email" type="email" required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            value={formData.email} onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="username">Username</label>
          <input
            id="username" name="username" type="text" required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            value={formData.username} onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="displayName">Display Name</label>
          <input
            id="displayName" name="displayName" type="text" required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            value={formData.displayName} onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password" name="password" type={showPassword ? "text" : "password"} required minLength={8}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background pr-10"
              value={formData.password} onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit" disabled={loading}
        className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-95 h-10 w-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? <Spinner size="sm" className="mr-2" /> : null}
        Sign Up
      </button>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}
