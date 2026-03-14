/**
 * Main application layout shell.
 *
 * Provides the top-level page structure: a fixed `Sidebar` on the left,
 * a `Header` bar at the top, and a scrollable `<main>` area that renders
 * the current route via React Router's `<Outlet />`.
 */

import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
