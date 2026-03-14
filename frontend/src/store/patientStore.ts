/**
 * Zustand store for patient list filter state.
 *
 * Manages search text, status filter, sort field/order, and current page.
 * Changing search or status resets the page to 1 to avoid showing an
 * empty page after filtering narrows the result set.
 *
 * This store is intentionally **not** persisted — filters reset on page reload.
 */

import { create } from "zustand";

interface PatientFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  // Actions
  setSearch: (search: string) => void;
  setStatus: (status: string) => void;
  setSortBy: (field: string) => void;
  setSortOrder: (order: "asc" | "desc") => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

export const usePatientStore = create<PatientFilters>((set) => ({
  search: "",
  status: "",
  sortBy: "last_name",
  sortOrder: "asc",
  page: 1,
  setSearch: (search) => set({ search, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setPage: (page) => set({ page }),
  resetFilters: () =>
    set({ search: "", status: "", sortBy: "last_name", sortOrder: "asc", page: 1 }),
}));
