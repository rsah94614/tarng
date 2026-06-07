import { WaveList } from "@/components/communities/WaveList";
import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Explore Waves",
  description: "Discover communities on tarng.",
};

export default function WavesPage() {
  return (
    <div className="space-y-6 pt-4 px-4 md:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Explore Waves</h1>
          <p className="text-muted-foreground">Find communities that match your interests.</p>
        </div>
        <Link
          href="/waves/create"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Create Wave</span>
        </Link>
      </div>
      
      <WaveList />
    </div>
  );
}
