import * as React from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your tarng account.",
};

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
      <ResetPasswordForm />
    </React.Suspense>
  );
}
