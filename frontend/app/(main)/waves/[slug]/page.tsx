"use client";

import { useParams } from "next/navigation";
import { WavePageRenderer } from "@/components/communities/WavePageRenderer";

export default function WaveDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <WavePageRenderer slug={slug} />;
}
