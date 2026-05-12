"use client";

import { Globe, Clock, ExternalLink } from "lucide-react";

interface ResearchBadgeProps {
  sourcesUsed: number;
  researchTimeMs: number;
  sources: { name: string; url: string }[];
}

export function ResearchBadge({ sourcesUsed, researchTimeMs, sources }: ResearchBadgeProps) {
  if (!sourcesUsed) return null;

  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Globe className="h-3.5 w-3.5 text-indigo-600" />
        <span className="text-xs font-semibold text-indigo-700">
          Deep Research: {sourcesUsed} sources ({(researchTimeMs / 1000).toFixed(1)}s)
        </span>
        <Clock className="h-3 w-3 text-indigo-400" />
      </div>
      <div className="space-y-1">
        {sources.slice(0, 3).map((s, i) => (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-1.5 text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline group"
          >
            <ExternalLink className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 opacity-50 group-hover:opacity-100" />
            <span className="line-clamp-1">{s.name}</span>
          </a>
        ))}
        {sourcesUsed > 3 && (
          <span className="text-[10px] text-indigo-400 pl-4">
            +{sourcesUsed - 3} more sources
          </span>
        )}
      </div>
    </div>
  );
}
