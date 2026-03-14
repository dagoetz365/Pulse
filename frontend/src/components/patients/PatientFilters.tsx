/**
 * Patient list filter controls — search bar and status dropdown.
 *
 * The search input is debounced (350ms) to avoid firing an API request
 * on every keystroke. The status dropdown filters by active, inactive,
 * critical, or all. Both controls update the `usePatientStore` which
 * drives the `usePatients` query parameters.
 */

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePatientStore } from "@/store/patientStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useEffect, useState } from "react";

export function PatientFilters() {
  const { search, status, setSearch, setStatus } = usePatientStore();
  const [inputValue, setInputValue] = useState(search);
  const debounced = useDebounce(inputValue, 350);

  useEffect(() => {
    setSearch(debounced);
  }, [debounced, setSearch]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search patients…"
          className="pl-9"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
      <Select value={status ?? "all"} onValueChange={(v) => setStatus(v === "all" ? null : v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
