import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Layout, Bell, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import QRCode from "react-qr-code";

const userPreferencesSchema = z.object({
  dashboardLayout: z.enum(["grid", "list", "compact"]),
  theme: z.enum(["light", "dark", "system"]),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  dashboardTiles: z.object({
    projects: z.boolean(),
    inventory: z.boolean(),
    users: z.boolean(),
    workOrders: z.boolean(),
    purchaseOrders: z.boolean(),
    reports: z.boolean(),
    vendors: z.boolean(),
    bom: z.boolean(),
  }),
});

type UserPreferencesFormData = z.infer<typeof userPreferencesSchema>;

export default function UserPreferences() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<UserPreferencesFormData>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      dashboardLayout: "grid",
      theme: "system",
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      dashboardTiles: {
        projects: true,
        inventory: true,
        users: true,
        workOrders: true,
        purchaseOrders: true,
        reports: true,
        vendors: false,
        bom: true,
      },
    },
  });

  const onSubmit = async (data: UserPreferencesFormData) => {
    setIsLoading(true);
    try {
      // TODO: Save user preferences to backend
      console.log("User preferences data:", data);
      
      toast({
        title: "Preferences saved",
        description: "Your dashboard and notification preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const dashboardTilesList = [
    { key: "projects", label: "Projects", description: "View and manage your projects" },
    { key: "inventory", label: "Inventory", description: "Track inventory levels and items" },
    { key: "users", label: "Users", description: "Manage team members and permissions" },
    { key: "workOrders", label: "Work Orders", description: "Monitor work order status" },
    { key: "purchaseOrders", label: "Purchase Orders", description: "Track purchase orders and approvals" },
    { key: "reports", label: "Reports", description: "Access analytics and reports" },
    { key: "vendors", label: "Vendors", description: "Manage vendor relationships" },
    { key: "bom", label: "Bill of Materials", description: "View BOM summaries and status" },
  ];

  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [setupToken, setSetupToken] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [mfaError, setMfaError] = useState<string | null>(null);

  // load current MFA status
  useEffect(() => {
    let mounted = true;
    const loadStatus = async () => {
      try {
        const st = await import('@/services/mfaService');
        const status = await st.mfaService.status(user.email);
        if (mounted) setMfaEnabled(!!status.mfaEnabled);
      } catch (err) {
        console.warn('Failed to load MFA status', err);
      }
    };
    loadStatus();
    return () => { mounted = false; };
  }, []);

  const startSetup = async () => {
    setMfaError(null);
    setIsSettingUp(true);
    try {
      const res = await (await import('@/services/mfaService')).mfaService.setup(user.email);
      setQrCode(res.qrCodeUri);
      setSetupToken(res.manualKey);
    } catch (err: any) {
      setMfaError(err?.response?.data?.message || 'Failed to initiate MFA setup');
    } finally {
      setIsSettingUp(false);
    }
  };

  const verifySetup = async () => {
    setMfaError(null);
    if (!setupToken) return setMfaError('Missing setup session. Please start setup again.');
    if (!/^[0-9]{6}$/.test(setupCode)) return setMfaError('Enter a valid 6-digit code');
    setIsVerifying(true);
    try {
      const res = await (await import('@/services/mfaService')).mfaService.verify(user.email, setupCode);
      if (res.success) {
        setMfaEnabled(true);
        setQrCode(null);
        setSetupToken(null);
        setSetupCode('');
        toast({
          title: "Success",
          description: "MFA enabled successfully",
        });
      } else {
        setMfaError('Failed to verify code');
      }
    } catch (err: any) {
      setMfaError(err?.response?.data?.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const disableMfa = async () => {
    setMfaError(null);
    try {
      const res = await (await import('@/services/mfaService')).mfaService.disable(user.email);
      if (res?.success) {
        setMfaEnabled(false);
        toast({
          title: "Success",
          description: "MFA disabled successfully",
        });
      } else {
        setMfaError('Failed to disable MFA');
      }
    } catch (err: any) {
      setMfaError(err?.response?.data?.message || 'Failed to disable MFA');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6" />
        <h1 className="text-3xl font-bold">User Preferences</h1>
      </div>
      <p className="text-muted-foreground">
        Customize your dashboard, notifications, and personal settings to match your workflow.
      </p>

      {/* MFA Section */}
      <div className="p-4 border rounded-lg space-y-3">
        <h2 className="text-lg font-semibold">Multi-Factor Authentication (MFA)</h2>
        <p className="text-sm text-muted-foreground">Enable time-based one-time passwords (TOTP) using Google Authenticator</p>

        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="theme"
            render={() => (
              <div className="flex items-center gap-3">
                <Switch checked={mfaEnabled} onCheckedChange={async (checked) => {
                  if (checked) {
                    // begin setup
                    await startSetup();
                  } else {
                    // disable immediately
                    await disableMfa();
                  }
                }} />
                <div>
                  <div className="text-sm font-medium">Enable MFA</div>
                  <div className="text-xs text-muted-foreground">When enabled you'll need a 6-digit code from Google Authenticator during login step.</div>
                </div>
              </div>
            )}
          />
        </div>

        {mfaError && <div className="text-sm text-destructive">{mfaError}</div>}

        {/* Setup UI */}
        {qrCode && (
          <Form {...form}>
            <div className="mt-4 space-y-3">
              <div className="text-sm">Set up Google Authenticator:</div>
              <div className="flex items-start gap-4">
                <div>
                  <QRCode value={qrCode} size={180} className="w-48 h-48 border rounded" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">1. Open Google Authenticator</p>
                  <p className="text-sm text-muted-foreground">2. Scan the QR code shown on the left</p>
                  <p className="text-sm text-muted-foreground">3. Enter the 6-digit code generated by the app below to verify</p>

                  <div className="mt-4 max-w-xs">
                    <FormField
                      control={form.control}
                      name="setupcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <Input value={setupCode} onChange={(e) => setSetupCode(e.target.value)} placeholder="6 digit code" maxLength={6} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end mt-3">
                      <Button onClick={verifySetup} disabled={isVerifying}>{isVerifying ? 'Verifying...' : 'Verify'}</Button>
                      <Button variant="outline" className="ml-2" onClick={() => { setQrCode(null); setSetupToken(null); setSetupCode(''); }}>{'Cancel'}</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        )}
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Dashboard Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Dashboard Layout
                </CardTitle>
                <CardDescription>
                  Configure how your dashboard displays information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="dashboardLayout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Layout Style</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select layout style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grid">Grid View</SelectItem>
                            <SelectItem value="list">List View</SelectItem>
                            <SelectItem value="compact">Compact View</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Theme
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="notifications.email"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email Notifications</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notifications.push"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Push Notifications</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Receive browser push notifications
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notifications.sms"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">SMS Notifications</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Receive notifications via SMS
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Tiles Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Tiles</CardTitle>
              <CardDescription>
                Select which tiles you want to see on your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dashboardTilesList.map((tile) => (
                  <FormField
                    key={tile.key}
                    control={form.control}
                    name={`dashboardTiles.${tile.key}` as any}
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">
                            {tile.label}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {tile.description}
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}