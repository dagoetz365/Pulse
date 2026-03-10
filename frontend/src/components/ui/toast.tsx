import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "./use-toast";

function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-in slide-in-from-bottom-2 bg-background",
            t.variant === "destructive" && "border-destructive/50 bg-destructive text-destructive-foreground"
          )}
        >
          <div className="flex-1 min-w-0">
            {t.title && (
              <p className={cn("text-sm font-semibold", t.variant === "destructive" ? "text-destructive-foreground" : "text-foreground")}>
                {t.title}
              </p>
            )}
            {t.description && (
              <p className={cn("text-sm mt-0.5", t.variant === "destructive" ? "text-destructive-foreground/90" : "text-muted-foreground")}>
                {t.description}
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className={cn(
              "shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity",
              t.variant === "destructive" ? "text-destructive-foreground" : "text-foreground"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export { Toaster };
