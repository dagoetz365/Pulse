import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/toast";
import { DashboardPage } from "@/pages/DashboardPage";
import { PatientsPage } from "@/pages/PatientsPage";
import { PatientDetailPage } from "@/pages/PatientDetailPage";
import { PatientCreatePage } from "@/pages/PatientCreatePage";
import { PatientEditPage } from "@/pages/PatientEditPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

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
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/new" element={<PatientCreatePage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/patients/:id/edit" element={<PatientEditPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
