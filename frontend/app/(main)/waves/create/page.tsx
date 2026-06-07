import { CreateWaveForm } from "@/components/communities/CreateWaveForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Wave",
  description: "Start a new community on tarng.",
};

export default function CreateWavePage() {
  return (
    <div className="pt-8 px-4 md:px-0">
      <CreateWaveForm />
    </div>
  );
}
