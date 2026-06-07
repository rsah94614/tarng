"use client";

import * as React from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { Spinner } from "@/components/ui/Spinner";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch {
      setError("Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 w-full max-w-sm mx-auto text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="text-muted-foreground">We&apos;ve sent a password reset link to {email}.</p>
        </div>
        <Link href="/login" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full font-medium transition-colors">
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Forgot password</h1>
        <p className="text-muted-foreground">Enter your email and we&apos;ll send you a reset link</p>
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
            id="email" type="email" required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit" disabled={loading}
        className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full font-medium transition-colors"
      >
        {loading ? <Spinner size="sm" className="mr-2" /> : null}
        Send Reset Link
      </button>

      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}
