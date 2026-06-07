import * as React from "react";
import { cn } from "@/lib/utils";

export interface MarkdownRendererProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
}

export function MarkdownRenderer({ content, className, ...props }: MarkdownRendererProps) {
  // Simple renderer for V1: splits by double newline into paragraphs
  // Handles basic links and mentions
  const renderContent = (text: string) => {
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, i) => {
      // Very basic mention and URL parsing for V1
      const words = paragraph.split(/(\s+)/);
      const renderedWords = words.map((word, j) => {
        if (word.startsWith('@') && word.length > 1) {
          return <span key={j} className="text-primary font-medium hover:underline cursor-pointer">{word}</span>;
        }
        if (word.match(/^https?:\/\//)) {
          return <a key={j} href={word} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{word}</a>;
        }
        return word;
      });

      return (
        <p key={i} className="mb-4 last:mb-0 whitespace-pre-wrap">
          {renderedWords}
        </p>
      );
    });
  };

  return (
    <div className={cn("text-base leading-relaxed break-words", className)} {...props}>
      {renderContent(content)}
    </div>
  );
}
