/**
 * Top header bar component.
 *
 * Shows a hamburger menu button on mobile (toggles the sidebar) and an
 * optional page title. Renders as a slim 56px-tall bar with a bottom border.
 */

import { Menu } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-4 shrink-0">
      <button
        className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>
      {title && (
        <h1 className="font-display text-lg font-semibold text-foreground">{title}</h1>
      )}
    </header>
  );
}
