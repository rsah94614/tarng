"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Settings, Layers, Users, ArrowLeft } from "lucide-react";
import { communityService, type Community } from "@/services/communityService";
import { useAuthStore } from "@/store/useAuthStore";
import { Spinner } from "@/components/ui/Spinner";

export default function WaveSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  
  const [wave, setWave] = React.useState<Community | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    async function loadWave() {
      try {
        const data = await communityService.getCommunity(params.slug);
        setWave(data);
        
        // Check permissions
        if (user) {
          const members = await communityService.getMembers(params.slug);
          const me = members.find((m) => m.user_id === user.id);
          if (me && (me.role === "owner" || me.role === "admin")) {
            setIsAdmin(true);
          } else {
            router.push(`/${params.slug}`); // unauthorized
          }
        }
      } catch (err) {
        console.error("Failed to load wave", err);
        router.push("/feed");
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadWave();
    }
  }, [params.slug, user, router]);

  if (loading || !wave) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );
  }

  if (!isAdmin) {
    return null; // will redirect
  }

  const tabs = [
    { name: "General", href: `/waves/${params.slug}/settings/general`, icon: Settings },
    { name: "Sections", href: `/waves/${params.slug}/settings/sections`, icon: Layers },
    { name: "Members", href: `/waves/${params.slug}/settings/members`, icon: Users },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link 
          href={`/${params.slug}`}
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Wave
        </Link>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          {wave.avatar_url && (
            <img src={wave.avatar_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
          )}
          {wave.name} Settings
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <nav className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 bg-card border rounded-xl shadow-sm overflow-hidden min-h-[500px]">
          {children}
        </div>
      </div>
    </div>
  );
}
