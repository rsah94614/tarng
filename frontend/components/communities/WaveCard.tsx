"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { Community } from "@/services/communityService";
import { cn } from "@/lib/utils";

export interface WaveCardProps {
  wave: Community;
  className?: string;
}

export function WaveCard({ wave, className }: WaveCardProps) {
  return (
    <Link
      href={`/waves/${wave.slug}`}
      className={cn(
        "group flex flex-col justify-between overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/50",
        className
      )}
    >
      <div className="relative h-24 w-full bg-muted">
        {wave.banner_url ? (
          <img src={wave.banner_url} alt="Cover" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="-mt-8 mb-2">
          <Avatar
            src={wave.avatar_url}
            alt={wave.name}
            size="xl"
            className="border-4 border-card bg-card"
          />
        </div>

        <div className="flex items-start justify-between">
          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
            {wave.name}
          </h3>
          {wave.depth > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded border border-primary/20 shrink-0 ml-2">
              L{wave.depth} Sub-Wave
            </span>
          )}
        </div>
        
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground min-h-[40px]">
          {wave.description || "No description provided."}
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{wave.member_count} member{wave.member_count !== 1 && "s"}</span>
        </div>
      </div>
    </Link>
  );
}
