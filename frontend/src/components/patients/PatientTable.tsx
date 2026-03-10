import { useNavigate } from "react-router-dom";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./StatusBadge";
import { DeletePatientDialog } from "./DeletePatientDialog";
import { usePatientStore } from "@/store/patientStore";
import { formatDate } from "@/lib/utils";
import type { Patient } from "@/types/patient";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

const columns: Column[] = [
  { key: "last_name", label: "Name", sortable: true },
  { key: "age", label: "Age" },
  { key: "last_visit", label: "Last Visit", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "actions", label: "" },
];

interface PatientTableProps {
  patients: Patient[];
  isLoading: boolean;
}

export function PatientTable({ patients, isLoading }: PatientTableProps) {
  const navigate = useNavigate();
  const { sortBy, sortOrder, setSortBy, setSortOrder } = usePatientStore();

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortBy !== col) return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-40" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-primary" />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-border">
            {columns.map((col) => (
              <TableHead key={col.key} className={col.key === "actions" ? "w-[100px]" : ""}>
                {col.sortable ? (
                  <button
                    className="flex items-center text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <SortIcon col={col.key} />
                  </button>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {col.label}
                  </span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))
            : patients.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <TableCell>
                    <span className="font-medium text-foreground">{patient.full_name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{patient.email}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{patient.age}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {patient.last_visit ? formatDate(patient.last_visit) : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={patient.status} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/patients/${patient.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DeletePatientDialog patient={patient} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
