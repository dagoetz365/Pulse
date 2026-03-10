import type { ReactNode } from "react";
import {
  User,
  Bell,
  Monitor,
  Mail,
  MessageSquare,
  Smartphone,
  AlertTriangle,
  LayoutGrid,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { useSettingsStore } from "@/store/settingsStore";

function SettingRow({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function SettingsPage() {
  const {
    displayName,
    email,
    role,
    emailNotifications,
    smsNotifications,
    pushNotifications,
    criticalAlerts,
    compactMode,
    setEmailNotifications,
    setSmsNotifications,
    setPushNotifications,
    setCriticalAlerts,
    setCompactMode,
  } = useSettingsStore();

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences"
      />

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {displayName}
                </p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Choose how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow
              icon={<Mail className="h-4 w-4" />}
              label="Email notifications"
              description="Receive patient updates via email"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
            <Separator />
            <SettingRow
              icon={<MessageSquare className="h-4 w-4" />}
              label="SMS notifications"
              description="Get text messages for urgent updates"
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
            <Separator />
            <SettingRow
              icon={<Smartphone className="h-4 w-4" />}
              label="Push notifications"
              description="Browser push notifications"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
            <Separator />
            <SettingRow
              icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
              label="Critical patient alerts"
              description="Always notify for critical status changes"
              checked={criticalAlerts}
              onCheckedChange={setCriticalAlerts}
            />
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how Cura looks</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingRow
              icon={<LayoutGrid className="h-4 w-4" />}
              label="Compact mode"
              description="Reduce spacing for denser information display"
              checked={compactMode}
              onCheckedChange={setCompactMode}
            />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
