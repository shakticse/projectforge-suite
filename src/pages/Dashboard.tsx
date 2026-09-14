import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";

const statusStyles = {
  "On Track": "border-success/20 bg-success/10 text-success",
  "Due Soon": "border-warning/25 bg-warning/10 text-warning",
  Overdue: "border-destructive/20 bg-destructive/10 text-destructive",
  Review: "border-primary/20 bg-primary/10 text-primary",
};

const Dashboard = () => {
  const stats = [
    {
      title: "Active Projects",
      value: "12",
      helper: "Across 6 live sites",
      change: "+2 this month",
      icon: FolderOpen,
      tone: "border-primary/15 bg-primary/10 text-primary",
    },
    {
      title: "Need Attention",
      value: "7",
      helper: "Overdue or blocked",
      change: "3 overdue",
      icon: AlertCircle,
      tone: "border-destructive/20 bg-destructive/10 text-destructive",
    },
    {
      title: "Due This Week",
      value: "5",
      helper: "Milestones approaching",
      change: "2 high priority",
      icon: CalendarClock,
      tone: "border-warning/25 bg-warning/10 text-warning",
    },
    {
      title: "Pending Orders",
      value: "23",
      helper: "POs and requests",
      change: "8 awaiting approval",
      icon: Truck,
      tone: "border-accent/20 bg-accent/10 text-accent",
    },
  ];

  const projectHealth = [
    { label: "On track", value: 7, color: "bg-success" },
    { label: "Due soon", value: 2, color: "bg-warning" },
    { label: "Overdue", value: 3, color: "bg-destructive" },
  ];

  const siteProjects = [
    {
      name: "Manufacturing System Upgrade",
      site: "TATA Power, Unit 2",
      status: "On Track",
      progress: 75,
      dueDate: "Dec 15",
      owner: "Project Manager",
    },
    {
      name: "Inventory Optimization",
      site: "Pune Store",
      status: "Due Soon",
      progress: 48,
      dueDate: "Jan 10",
      owner: "Store Supervisor",
    },
    {
      name: "Quality Control Implementation",
      site: "Ahmedabad Site",
      status: "Review",
      progress: 90,
      dueDate: "Dec 01",
      owner: "Project Supervisor",
    },
    {
      name: "Supplier Integration",
      site: "Mumbai HQ",
      status: "Overdue",
      progress: 45,
      dueDate: "Nov 28",
      owner: "Purchase",
    },
  ];

  const attentionItems = [
    {
      title: "Supplier Integration is overdue",
      detail: "Deadline passed on Nov 28. Confirm revised delivery plan.",
      icon: AlertCircle,
      tone: "border-destructive/20 bg-destructive/10 text-destructive",
    },
    {
      title: "Low stock across 5 material items",
      detail: "Minimum threshold breached for active project inventory.",
      icon: PackageCheck,
      tone: "border-warning/25 bg-warning/10 text-warning",
    },
    {
      title: "8 approvals waiting",
      detail: "Purchase and BOM approvals need manager review.",
      icon: ShieldCheck,
      tone: "border-primary/20 bg-primary/10 text-primary",
    },
  ];

  const workflow = [
    { label: "BOM", value: 18, icon: FileText },
    { label: "Inventory", value: 42, icon: PackageCheck },
    { label: "Users", value: 48, icon: Users },
    { label: "Reports", value: 9, icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-card">
          <CardContent className="p-0">
            <div className="grid gap-0 lg:grid-cols-[1.35fr_0.85fr]">
              <div className="p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-transparent bg-primary text-primary-foreground hover:bg-primary">
                    Project command center
                  </Badge>
                  <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                    7 on track
                  </Badge>
                </div>
                <div className="mt-5 max-w-3xl">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Know which sites are moving, slipping, and waiting on you.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    A focused view of live projects, deadline risk, pending approvals, and material issues across all active sites.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button className="gradient-primary rounded-xl text-primary-foreground shadow-md">
                    Review attention items
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="rounded-xl border-primary/15 bg-primary/5 text-primary hover:bg-primary/10">
                    Open project board
                  </Button>
                </div>
              </div>

              <div className="border-t border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 lg:border-l lg:border-t-0">
                <div className="rounded-2xl border border-primary/15 bg-background/80 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Portfolio Health
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">82%</p>
                    </div>
                    <ShieldCheck className="h-9 w-9 text-primary" />
                  </div>
                  <Progress value={82} className="mt-4 h-2.5 bg-primary/10" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {projectHealth.map((item) => (
                    <div key={item.label} className="rounded-xl border border-border/60 bg-background/70 p-3">
                      <span className={`block h-1.5 w-8 rounded-full ${item.color}`} />
                      <p className="mt-3 text-xl font-semibold tabular-nums">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card/95 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              Needs Attention
              <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive">
                7 open
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attentionItems.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${item.tone}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="rounded-2xl border-border/70 bg-card/90 shadow-sm transition-smooth hover:-translate-y-0.5 hover:shadow-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${stat.tone}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">{stat.helper}</span>
                <span className="font-medium text-foreground">{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <Card className="rounded-2xl border-border/70 bg-card/95 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
            <div>
              <CardTitle className="text-xl">Site Project Status</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Priority projects sorted by deadline risk.</p>
            </div>
            <Button variant="ghost" size="sm" className="rounded-xl text-primary">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {siteProjects.map((project) => (
                <div key={project.name} className="grid gap-4 p-5 transition-smooth hover:bg-primary/5 lg:grid-cols-[1fr_13rem]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-foreground">{project.name}</h3>
                      <Badge
                        variant="outline"
                        className={statusStyles[project.status as keyof typeof statusStyles]}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {project.site}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        Due {project.dueDate}
                      </span>
                      <span>{project.owner}</span>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold tabular-nums text-foreground">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2 bg-primary/10" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-4 py-3 lg:flex-col lg:items-start">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Next step</span>
                    <Button variant="ghost" size="sm" className="rounded-xl px-0 text-primary hover:bg-transparent">
                      Open details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70 bg-card/95 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Workflow Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {workflow.map((item) => (
                <div key={item.label} className="rounded-xl border border-border/60 bg-background/70 p-4">
                  <item.icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-2xl font-semibold tabular-nums">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card/95 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 p-3">
                <span className="text-sm text-muted-foreground">Completed milestones</span>
                <span className="flex items-center gap-1 font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  4
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 p-3">
                <span className="text-sm text-muted-foreground">Pending approvals</span>
                <span className="font-semibold text-foreground">8</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 p-3">
                <span className="text-sm text-muted-foreground">Material alerts</span>
                <span className="font-semibold text-warning">5</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
