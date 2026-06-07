import { EditProfileForm } from "@/components/profile/EditProfileForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Update your tarng profile settings.",
};

export default function SettingsPage() {
  return (
    <div className="pt-8 px-4 md:px-0 pb-12">
      <EditProfileForm />
    </div>
  );
}
