import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Phone, Mail, MapPin, Droplets, Calendar, Shield, Heart, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/patients/StatusBadge";
import { DeletePatientDialog } from "@/components/patients/DeletePatientDialog";
import { NoteList } from "@/components/notes/NoteList";
import { LabList } from "@/components/labs/LabList";
import { SummaryPanel } from "@/components/summary/SummaryPanel";
import { usePatient } from "@/hooks/usePatient";
import { formatDate } from "@/lib/utils";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading, isError } = usePatient(id!);

  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button variant="ghost" className="mt-4 gap-2" onClick={() => navigate("/patients")}>
          <ArrowLeft className="h-4 w-4" /> Back to patients
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {isLoading ? (
          <Skeleton className="h-7 w-48" />
        ) : (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
              {patient!.first_name[0]}{patient!.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-semibold text-foreground truncate">
                {patient!.full_name}
              </h1>
              <p className="text-xs text-muted-foreground">Age {patient!.age}</p>
            </div>
            <StatusBadge status={patient!.status} />
          </div>
        )}
        {!isLoading && patient && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              asChild
            >
              <a href={`mailto:${patient.email}`} aria-label={`Email ${patient.full_name}`}>
                <Mail className="h-3.5 w-3.5" />
                Email
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate(`/patients/${patient.id}/edit`)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <DeletePatientDialog
              patient={patient}
              trigger={
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5">
                  Delete
                </Button>
              }
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — patient info */}
        <div className="lg:col-span-1 space-y-5">
          {/* Contact info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </>
              ) : (
                <>
                  <InfoRow icon={Mail} label="Email" value={patient!.email} />
                  <InfoRow icon={Phone} label="Phone" value={patient!.phone} />
                  <InfoRow icon={MapPin} label="Address" value={patient!.address} />
                  <InfoRow
                    icon={Calendar}
                    label="Date of Birth"
                    value={formatDate(patient!.date_of_birth)}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Last Visit"
                    value={patient!.last_visit ? formatDate(patient!.last_visit) : "No visits recorded"}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Insurance info — only show if any field populated */}
          {!isLoading && patient && (patient.insurance_provider || patient.insurance_policy_number) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Insurance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={Shield} label="Provider" value={patient.insurance_provider} />
                <InfoRow icon={Shield} label="Policy #" value={patient.insurance_policy_number} />
                <InfoRow icon={Shield} label="Group #" value={patient.insurance_group_number} />
              </CardContent>
            </Card>
          )}

          {/* Medical info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  {patient!.blood_type && (
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-muted-foreground">Blood type</span>
                      <Badge variant="outline" className="ml-auto">{patient!.blood_type}</Badge>
                    </div>
                  )}
                  {patient!.allergies.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Allergies</p>
                      <div className="flex flex-wrap gap-1.5">
                        {patient!.allergies.map((a) => (
                          <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {patient!.conditions.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Conditions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {patient!.conditions.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {patient!.medical_history && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Medical History</p>
                      <p className="text-sm leading-relaxed">{patient!.medical_history}</p>
                    </div>
                  )}
                  {patient!.family_history.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Family History</p>
                      <div className="flex flex-wrap gap-1.5">
                        {patient!.family_history.map((f) => (
                          <Badge key={f} variant="outline" className="text-xs">
                            <Heart className="h-3 w-3 mr-1" />{f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {!patient!.blood_type && patient!.allergies.length === 0 && patient!.conditions.length === 0 && !patient!.medical_history && patient!.family_history.length === 0 && (
                    <p className="text-sm text-muted-foreground">No medical information recorded.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Consent forms — only show if populated */}
          {!isLoading && patient && patient.consent_forms.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Consent Forms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {patient.consent_forms.map((form) => (
                    <Badge key={form} variant="outline" className="text-xs">
                      <FileCheck className="h-3 w-3 mr-1" />{form}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Summary */}
          <Card>
            <CardContent className="pt-5">
              {id && <SummaryPanel patientId={id} />}
            </CardContent>
          </Card>
        </div>

        {/* Right column — notes & labs */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Clinical Notes</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {id && <NoteList patientId={id} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Labs & Results</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {id && <LabList patientId={id} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
