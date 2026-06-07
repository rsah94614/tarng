"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/authService";
import { Spinner } from "@/components/ui/Spinner";
import { Eye, EyeOff } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [newPassword, setNewPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");

  if (!token) {
    return (
      <div className="text-center w-full max-w-sm mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
        <p className="text-muted-foreground">The password reset link is invalid or missing.</p>
        <Link href="/forgot-password" className="text-primary hover:underline font-medium">Request a new link</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.resetPassword({ token, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 w-full max-w-sm mx-auto text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Password reset</h1>
          <p className="text-muted-foreground">Your password has been successfully reset. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Set new password</h1>
        <p className="text-muted-foreground">Please enter your new password below</p>
      </div>

      {error && (
        <div className="p-3 text-sm rounded-lg bg-destructive/15 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="newPassword">New Password</label>
          <div className="relative">
            <input
              id="newPassword" type={showPassword ? "text" : "password"} required minLength={8}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background pr-10"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
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
        Reset Password
      </button>
    </form>
  );
}
