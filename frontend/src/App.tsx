/**
 * Root application component.
 *
 * Sets up the global provider hierarchy:
 * 1. **QueryClientProvider** — TanStack Query with 30s stale time and 1 retry.
 * 2. **ErrorBoundary** — Catches unhandled React errors app-wide.
 * 3. **BrowserRouter** — Client-side routing via React Router.
 * 4. **AppShell** — Layout wrapper (sidebar + header) that wraps all routes.
 *
 * All page components are **lazy-loaded** with `React.lazy()` for automatic
 * code splitting, showing a skeleton `PageLoader` during chunk downloads.
 * A global `<Toaster />` renders toast notifications outside the route tree.
 */

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Toaster } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

/* ---------- Lazy-loaded route pages (code splitting) ---------- */
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const PatientsPage = lazy(() =>
  import("@/pages/PatientsPage").then((m) => ({ default: m.PatientsPage }))
);
const PatientDetailPage = lazy(() =>
  import("@/pages/PatientDetailPage").then((m) => ({ default: m.PatientDetailPage }))
);
const PatientCreatePage = lazy(() =>
  import("@/pages/PatientCreatePage").then((m) => ({ default: m.PatientCreatePage }))
);
const PatientEditPage = lazy(() =>
  import("@/pages/PatientEditPage").then((m) => ({ default: m.PatientEditPage }))
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl mt-4" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              path="/"
              element={
                <Suspense fallback={<PageLoader />}>
                  <DashboardPage />
                </Suspense>
              }
            />
            <Route
              path="/patients"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PatientsPage />
                </Suspense>
              }
            />
            <Route
              path="/patients/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PatientCreatePage />
                </Suspense>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PatientDetailPage />
                </Suspense>
              }
            />
            <Route
              path="/patients/:id/edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PatientEditPage />
                </Suspense>
              }
            />
            <Route
              path="/settings"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SettingsPage />
                </Suspense>
              }
            />
            <Route
              path="*"
              element={
                <Suspense fallback={<PageLoader />}>
                  <NotFoundPage />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
      </ErrorBoundary>
      <Toaster />
    </QueryClientProvider>
  );
}
