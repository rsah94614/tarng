"use client";

import * as React from "react";
import { CalendarDays, MapPin, ExternalLink, Video } from "lucide-react";
import type { Event } from "@/types";
import { postService } from "@/services/postService";

interface EventCardProps {
  postId: number;
  event: Event;
  onRSVP: (updatedPost: any) => void;
}

export function EventCard({ postId, event, onRSVP }: EventCardProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleRSVP = async (e: React.MouseEvent, status: "going" | "maybe" | "not_going") => {
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const updatedPost = await postService.rsvpEvent(postId, status);
      onRSVP(updatedPost);
    } catch (err) {
      console.error("Failed to RSVP", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

  const month = startDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = startDate.getDate();
  
  const timeString = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="mt-3 border border-white/5 rounded-2xl overflow-hidden bg-background/30 backdrop-blur-md">
      <div className="flex items-stretch">
        <div className="bg-primary/10 text-primary p-4 flex flex-col items-center justify-center w-24 shrink-0 border-r border-primary/10">
          <span className="text-sm font-bold tracking-wider">{month}</span>
          <span className="text-3xl font-black">{day}</span>
        </div>
        
        <div className="p-4 flex-1">
          <h3 className="font-bold text-lg leading-tight mb-2">{event.title}</h3>
          
          <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>{startDate.toLocaleDateString()} • {timeString}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.is_online && (
              <div className="flex items-center gap-2 text-blue-500">
                <Video className="h-4 w-4 shrink-0" />
                <span>Online Event</span>
              </div>
            )}
            
            {event.url && (
              <a 
                href={event.url} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2 text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span>Event Link</span>
              </a>
            )}
          </div>
          
          <div className="flex items-center gap-2 border-t pt-3">
            <button
              onClick={(e) => handleRSVP(e, "going")}
              disabled={isUpdating}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${event.user_rsvp === 'going' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
            >
              Going ({event.going_count})
            </button>
            <button
              onClick={(e) => handleRSVP(e, "maybe")}
              disabled={isUpdating}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${event.user_rsvp === 'maybe' ? 'bg-secondary text-secondary-foreground border-secondary-foreground/20 border' : 'bg-background border hover:bg-muted text-foreground'}`}
            >
              Maybe ({event.maybe_count})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
