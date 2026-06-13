"use client";

import { useParams } from "next/navigation";
import { WavePageRenderer } from "@/components/communities/WavePageRenderer";

export default function WaveSectionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const sectionSlug = params.sectionSlug as string;

  return <WavePageRenderer slug={slug} sectionSlug={sectionSlug} />;
}
