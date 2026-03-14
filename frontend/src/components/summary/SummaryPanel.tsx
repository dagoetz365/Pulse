/**
 * On-demand AI clinical summary panel.
 *
 * Displays a "Generate" button that triggers `useSummary.refetch()` to
 * call the backend's Gemini-powered summary endpoint. Shows four states:
 * 1. **Idle**: Prompt text explaining the feature.
 * 2. **Loading**: Skeleton lines while the summary is being generated.
 * 3. **Success**: The summary text in a highlighted card with generation timestamp.
 * 4. **Error**: Error message with a destructive-styled alert box.
 *
 * Summaries are cached for 10 minutes. The button text changes to
 * "Regenerate" once a summary exists.
 */

import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSummary } from "@/hooks/useSummary";

interface SummaryPanelProps {
  patientId: string;
}

export function SummaryPanel({ patientId }: SummaryPanelProps) {
  const { data, isLoading, isFetching, isError, error, refetch } = useSummary(patientId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Clinical Summary
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          {data ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {(isLoading || isFetching) && (
        <div className="space-y-2 pt-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      )}

      {isError && !isFetching && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            {(error as Error)?.message ?? "Failed to generate summary. Please try again."}
          </p>
        </div>
      )}

      {data && !isFetching && (
        <div className="rounded-lg bg-primary/5 border border-primary/15 p-4">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {data.summary}
          </p>
          {data.generated_at && (
            <p className="mt-3 text-xs text-muted-foreground">
              Generated {new Date(data.generated_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {!data && !isLoading && !isFetching && !isError && (
        <p className="text-sm text-muted-foreground">
          Click <span className="font-medium">Generate</span> to create an AI-powered summary of
          this patient's clinical history.
        </p>
      )}
    </div>
  );
}
