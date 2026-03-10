import { useNavigate } from "react-router-dom";
import { Users, UserCheck, AlertTriangle, UserX, TrendingUp, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/patients/StatusBadge";
import { usePatients } from "@/hooks/usePatients";
import { formatDate } from "@/lib/utils";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
}) {
  return (
    <Card>
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

  const { data: allData, isLoading } = usePatients({ page: 1, page_size: 100 });
  const { data: activeData } = usePatients({ page: 1, page_size: 1, status: "active" });
  const { data: criticalData } = usePatients({ page: 1, page_size: 5, status: "critical" });
  const { data: inactiveData } = usePatients({ page: 1, page_size: 1, status: "inactive" });

  const totalPatients = allData?.total ?? 0;
  const activeCount = activeData?.total ?? 0;
  const criticalCount = criticalData?.total ?? 0;
  const inactiveCount = inactiveData?.total ?? 0;

  return (
    <div className="p-6 space-y-8">
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={totalPatients}
          icon={Users}
          color="bg-primary/10 text-primary"
          isLoading={isLoading}
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={UserCheck}
          color="bg-emerald-100 text-emerald-700"
          isLoading={isLoading}
        />
        <StatCard
          title="Critical"
          value={criticalCount}
          icon={AlertTriangle}
          color="bg-red-100 text-red-700"
          isLoading={isLoading}
        />
        <StatCard
          title="Inactive"
          value={inactiveCount}
          icon={UserX}
          color="bg-amber-100 text-amber-700"
          isLoading={isLoading}
        />
      </div>

      {/* Critical patients */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Critical Patients
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => navigate("/patients?status=critical")}
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
                  className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{patient.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {patient.last_visit ? `Last visit: ${formatDate(patient.last_visit)}` : "No visits recorded"}
                    </p>
                  </div>
                  <StatusBadge status={patient.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              No critical patients — all clear!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent patients */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Patients</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => navigate("/patients")}
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
                  <Skeleton className="h-8 w-8 rounded-full" />
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
              {(allData?.items ?? []).slice(0, 5).map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                    {patient.first_name[0]}{patient.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{patient.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
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
