import { useNavigate } from "react-router-dom";
import { Users, UserCheck, AlertTriangle, UserX, Plus, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/patients/StatusBadge";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { usePatients } from "@/hooks/usePatients";
import { usePatientStore } from "@/store/patientStore";
import { formatDate } from "@/lib/utils";

function statusColor(status: string) {
  switch (status) {
    case "critical":
      return "bg-red-50 text-red-600";
    case "inactive":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-emerald-50 text-emerald-600";
  }
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  isLoading,
  onClick,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`shadow-sm transition-all ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="mt-1 text-3xl font-display font-semibold text-foreground">{value}</p>
            )}
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { setStatus, resetFilters } = usePatientStore();

  const { data: allData, isLoading } = usePatients({ page: 1, page_size: 100 });
  const { data: activeData } = usePatients({ page: 1, page_size: 1, status: "active" });
  const { data: criticalData } = usePatients({ page: 1, page_size: 5, status: "critical" });
  const { data: inactiveData } = usePatients({ page: 1, page_size: 1, status: "inactive" });

  const totalPatients = allData?.total ?? 0;
  const activeCount = activeData?.total ?? 0;
  const criticalCount = criticalData?.total ?? 0;
  const inactiveCount = inactiveData?.total ?? 0;

  function navigateToPatients(statusFilter?: string) {
    if (statusFilter) {
      setStatus(statusFilter);
    } else {
      resetFilters();
    }
    navigate("/patients");
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your patient population
          </p>
        </div>
        <Button onClick={() => navigate("/patients/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          New Patient
        </Button>
      </div>

      {/* Stats row — each card is clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={totalPatients}
          icon={Users}
          color="bg-primary/10 text-primary"
          isLoading={isLoading}
          onClick={() => navigateToPatients()}
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={UserCheck}
          color="bg-emerald-50 text-emerald-600"
          isLoading={isLoading}
          onClick={() => navigateToPatients("active")}
        />
        <StatCard
          title="Critical"
          value={criticalCount}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
          isLoading={isLoading}
          onClick={() => navigateToPatients("critical")}
        />
        <StatCard
          title="Inactive"
          value={inactiveCount}
          icon={UserX}
          color="bg-amber-50 text-amber-600"
          isLoading={isLoading}
          onClick={() => navigateToPatients("inactive")}
        />
      </div>

      {/* Middle row: chart + critical patients side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status distribution chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Patient Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-6">
                <Skeleton className="w-[140px] h-[140px] rounded-full" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ) : (
              <StatusChart
                active={activeCount}
                critical={criticalCount}
                inactive={inactiveCount}
                onSegmentClick={(status) => navigateToPatients(status)}
              />
            )}
          </CardContent>
        </Card>

        {/* Critical patients */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Critical Patients
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => navigateToPatients("critical")}
              >
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : criticalData?.items && criticalData.items.length > 0 ? (
              <div className="divide-y divide-border">
                {criticalData.items.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 text-xs font-semibold shrink-0">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{patient.full_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {patient.conditions?.slice(0, 2).join(", ") || "No conditions"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={patient.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No critical patients</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent patients — full width */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Patients</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => navigateToPatients()}
            >
              View all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(allData?.items ?? []).slice(0, 8).map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold shrink-0 ${statusColor(patient.status)}`}>
                    {patient.first_name[0]}{patient.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{patient.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
                  </div>
                  <div className="hidden sm:block text-xs text-muted-foreground">
                    {patient.last_visit ? formatDate(patient.last_visit) : "—"}
                  </div>
                  <StatusBadge status={patient.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
