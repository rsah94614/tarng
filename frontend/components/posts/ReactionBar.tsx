"use client";

import * as React from "react";
import { Heart, Lightbulb, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactionSummary, ReactionType } from "@/types";
import { postService } from "@/services/postService";

export interface ReactionBarProps {
  postId: number;
  initialReactions: ReactionSummary;
  className?: string;
}

export function ReactionBar({ postId, initialReactions, className }: ReactionBarProps) {
  const [reactions, setReactions] = React.useState<ReactionSummary>(initialReactions);
  const [loading, setLoading] = React.useState(false);

  const handleReaction = async (type: ReactionType) => {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const previous = { ...reactions };
    const isRemoving = reactions.user_reaction === type;
    const newReactions = { ...reactions };

    if (reactions.user_reaction) {
      newReactions[reactions.user_reaction] = Math.max(0, newReactions[reactions.user_reaction] - 1);
    }

    if (isRemoving) {
      newReactions.user_reaction = null;
    } else {
      newReactions[type] = (newReactions[type] || 0) + 1;
      newReactions.user_reaction = type;
    }

    setReactions(newReactions);

    try {
      const serverReactions = await postService.toggleReaction(postId, type);
      setReactions(serverReactions);
    } catch {
      // Revert on error
      setReactions(previous);
    } finally {
      setLoading(false);
    }
  };

  const reactionButtons = [
    { type: "like" as const, icon: Heart, count: reactions.like, color: "text-rose-500", bg: "bg-rose-500/10" },
    { type: "insightful" as const, icon: Lightbulb, count: reactions.insightful, color: "text-amber-500", bg: "bg-amber-500/10" },
    { type: "helpful" as const, icon: HelpCircle, count: reactions.helpful, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {reactionButtons.map(({ type, icon: Icon, count, color, bg }) => {
        const isActive = reactions.user_reaction === type;
        return (
          <button
            key={type}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleReaction(type);
            }}
            disabled={loading}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isActive ? cn(color, bg) : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className={cn("h-4 w-4", isActive && "fill-current")} />
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
