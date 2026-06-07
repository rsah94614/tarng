"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimeAgoProps extends React.HTMLAttributes<HTMLSpanElement> {
  date: string | Date;
}

export function TimeAgo({ date, className, ...props }: TimeAgoProps) {
  const [formatted, setFormatted] = React.useState<string>("");

  React.useEffect(() => {
    const updateTime = () => {
      const parsedDate = typeof date === "string" ? new Date(date) : date;
      const seconds = Math.floor((new Date().getTime() - parsedDate.getTime()) / 1000);

      let interval = seconds / 31536000;
      if (interval > 1) {
        setFormatted(Math.floor(interval) + "y");
        return;
      }
      interval = seconds / 2592000;
      if (interval > 1) {
        setFormatted(Math.floor(interval) + "mo");
        return;
      }
      interval = seconds / 86400;
      if (interval > 1) {
        setFormatted(Math.floor(interval) + "d");
        return;
      }
      interval = seconds / 3600;
      if (interval > 1) {
        setFormatted(Math.floor(interval) + "h");
        return;
      }
      interval = seconds / 60;
      if (interval > 1) {
        setFormatted(Math.floor(interval) + "m");
        return;
      }
      setFormatted("just now");
    };

    updateTime();
    const intervalId = setInterval(updateTime, 60000); // update every minute
    return () => clearInterval(intervalId);
  }, [date]);

  return (
    <span
      className={cn("text-xs text-muted-foreground", className)}
      title={typeof date === "string" ? new Date(date).toLocaleString() : date.toLocaleString()}
      {...props}
    >
      {formatted}
    </span>
  );
}
