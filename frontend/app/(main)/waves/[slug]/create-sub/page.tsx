"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { communityService, type Community } from "@/services/communityService";
import { CreateWaveForm } from "@/components/communities/CreateWaveForm";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateSubWavePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [parentWave, setParentWave] = React.useState<Community | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    communityService.getCommunity(slug)
      .then((data) => {
        if (data.depth >= 3) {
          router.push(`/waves/${slug}`); // Can't go deeper
        } else {
          setParentWave(data);
        }
      })
      .catch(() => router.push("/waves"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) {
    return <div className="flex py-12 justify-center"><Spinner /></div>;
  }

  if (!parentWave) return null;

  return (
    <div className="pt-8 px-4 sm:px-6 pb-12">
      <Link href={`/waves/${slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to {parentWave.name}
      </Link>
      <CreateWaveForm parentWave={parentWave} />
    </div>
  );
}
