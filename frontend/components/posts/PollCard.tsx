"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Poll, PollOption } from "@/types";
import { postService } from "@/services/postService";

interface PollCardProps {
  postId: number;
  poll: Poll;
  onVote: (updatedPost: any) => void;
}

export function PollCard({ postId, poll, onVote }: PollCardProps) {
  const [isVoting, setIsVoting] = React.useState(false);

  const handleVote = async (e: React.MouseEvent, optionId: number) => {
    e.stopPropagation();
    if (isVoting) return;
    setIsVoting(true);
    try {
      const updatedPost = await postService.votePoll(postId, optionId);
      onVote(updatedPost);
    } catch (err) {
      console.error("Failed to vote", err);
    } finally {
      setIsVoting(false);
    }
  };

  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;
  const showResults = poll.has_voted || isExpired;

  return (
    <div className="mt-3 border border-white/5 rounded-2xl p-4 bg-background/30 backdrop-blur-md space-y-3">
      {poll.options.map((option) => {
        const percent = poll.total_votes > 0 ? Math.round((option.votes_count / poll.total_votes) * 100) : 0;
        
        if (showResults) {
          return (
            <div key={option.id} className="relative overflow-hidden rounded-xl border border-white/10 bg-background/50 group">
              <div 
                className={cn("absolute inset-0 opacity-20 transition-all duration-500 ease-out", option.has_voted ? "bg-primary" : "bg-muted-foreground")}
                style={{ width: `${percent}%` }}
              />
              <div className="relative p-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-2 font-medium">
                  {option.text}
                  {option.has_voted && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <div className="text-sm font-semibold">{percent}%</div>
              </div>
            </div>
          );
        }

        return (
          <button
            key={option.id}
            onClick={(e) => handleVote(e, option.id)}
            disabled={isVoting}
            className="w-full p-3 text-left border border-white/10 rounded-xl hover:border-primary hover:bg-primary/10 transition-colors font-medium bg-background/50 backdrop-blur-sm"
          >
            {option.text}
          </button>
        );
      })}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
        <span>{poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}</span>
        {isExpired && <span>Expired</span>}
      </div>
    </div>
  );
}
