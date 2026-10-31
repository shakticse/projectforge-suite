import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Flag,
  Package,
  ShieldAlert,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProjectHealth = "On track" | "At risk" | "Delayed";
type MilestoneStatus = "Completed" | "In progress" | "Upcoming" | "Delayed";

interface ReportLine {
  id: string;
  name: string;
  reference: string;
  status: string;
  quantity: number;
  amount: number;
  date: string;
}

interface Milestone {
  name: string;
  date: string;
  status: MilestoneStatus;
  detail: string;
}

interface ProjectReportData {
  id: string;
  name: string;
  code: string;
  location: string;
  client: string;
  manager: string;
  health: ProjectHealth;
  status: string;
  progress: number;
  startDate: string;
  targetDate: string;
  daysRemaining: number;
  contractValue: number;
  approvedBudget: number;
  committedCost: number;
  actualCost: number;
  forecastCost: number;
  contingency: number;
  workforce: number;
  openIssues: number;
  criticalRisks: number;
  lastUpdated: string;
  milestones: Milestone[];
  bomLines: ReportLine[];
  purchaseOrders: ReportLine[];
  gatePasses: ReportLine[];
  risks: Array<{ title: string; severity: "High" | "Medium" | "Low"; owner: string; action: string }>;
  costBreakdown: Array<{ name: string; amount: number; color: string }>;
}

const demoReports: ProjectReportData[] = [
  {
    id: "project-1",
    name: "Riverside Commercial Tower",
    code: "PRJ-2026-014",
    location: "Pune, Maharashtra",
    client: "Northstar Developments",
    manager: "Ananya Rao",
    health: "At risk",
    status: "In progress",
    progress: 68,
    startDate: "2026-01-12",
    targetDate: "2026-12-20",
    daysRemaining: 49,
    contractValue: 84200000,
    approvedBudget: 68400000,
    committedCost: 52300000,
    actualCost: 41800000,
    forecastCost: 71100000,
    contingency: 3600000,
    workforce: 86,
    openIssues: 12,
    criticalRisks: 2,
    lastUpdated: "2026-11-01T09:30:00",
    milestones: [
      { name: "Site mobilization", date: "2026-01-12", status: "Completed", detail: "Site secured and temporary facilities operational" },
      { name: "Foundation & basement", date: "2026-04-30", status: "Completed", detail: "Basement slab poured and inspected" },
      { name: "Structural frame", date: "2026-08-15", status: "Completed", detail: "Main structural frame completed" },
      { name: "MEP rough-in", date: "2026-10-28", status: "Delayed", detail: "Current forecast is 6 days behind baseline" },
      { name: "Interior fit-out", date: "2026-11-24", status: "Upcoming", detail: "Dependent on MEP inspection sign-off" },
      { name: "Practical completion", date: "2026-12-20", status: "Upcoming", detail: "Client handover and close-out" },
    ],
    bomLines: [
      { id: "BOM-101", name: "Structural Steel & Rebar", reference: "Version 4 · 128 line items", status: "Approved", quantity: 128, amount: 16400000, date: "2026-10-25" },
      { id: "BOM-102", name: "Electrical & MEP", reference: "Version 3 · 96 line items", status: "In review", quantity: 96, amount: 11200000, date: "2026-10-30" },
      { id: "BOM-103", name: "Interior Finishes", reference: "Version 2 · 74 line items", status: "Draft", quantity: 74, amount: 8700000, date: "2026-10-31" },
      { id: "BOM-104", name: "Plumbing & Fire Safety", reference: "Version 2 · 52 line items", status: "Approved", quantity: 52, amount: 6400000, date: "2026-10-22" },
    ],
    purchaseOrders: [
      { id: "PO-2048", name: "Structural steel supply", reference: "Apex Steel Works", status: "Partially received", quantity: 72, amount: 8100000, date: "2026-10-18" },
      { id: "PO-2051", name: "Electrical cabling & panels", reference: "VoltEdge Systems", status: "In transit", quantity: 34, amount: 4650000, date: "2026-10-25" },
      { id: "PO-2056", name: "Fire safety equipment", reference: "SafeLine Industries", status: "Pending delivery", quantity: 18, amount: 2780000, date: "2026-10-29" },
      { id: "PO-2060", name: "Interior finish materials", reference: "MetroBuild Supply", status: "Awaiting approval", quantity: 26, amount: 1920000, date: "2026-10-31" },
    ],
    gatePasses: [
      { id: "GP-733", name: "Steel reinforcement batch", reference: "Apex Steel Works · Inward", status: "Received", quantity: 18, amount: 2120000, date: "2026-10-30" },
      { id: "GP-729", name: "Electrical distribution panels", reference: "VoltEdge Systems · Inward", status: "In transit", quantity: 8, amount: 980000, date: "2026-10-31" },
      { id: "GP-724", name: "Damaged cable drums", reference: "Return to vendor", status: "Awaiting dispatch", quantity: 3, amount: 145000, date: "2026-10-31" },
    ],
    risks: [
      { title: "MEP inspection affecting fit-out start", severity: "High", owner: "Project Manager", action: "Add inspection coverage and agree recovery sequence" },
      { title: "Switchgear delivery lead time", severity: "High", owner: "Procurement Lead", action: "Confirm dispatch date and qualify alternate supplier" },
      { title: "Interior finish selections pending client sign-off", severity: "Medium", owner: "Design Lead", action: "Escalate selection package for approval by 04 Nov" },
    ],
    costBreakdown: [
      { name: "Materials & procurement", amount: 27800000, color: "bg-blue-600" },
      { name: "Labor & subcontractors", amount: 21600000, color: "bg-cyan-500" },
      { name: "Plant & logistics", amount: 7300000, color: "bg-violet-500" },
      { name: "Other project costs", amount: 14400000, color: "bg-amber-500" },
    ],
  },
  {
    id: "project-2",
    name: "Westside Hospital Expansion",
    code: "PRJ-2026-009",
    location: "Nashik, Maharashtra",
    client: "Westside Health Group",
    manager: "Rohan Mehta",
    health: "On track",
    status: "In progress",
    progress: 42,
    startDate: "2026-03-02",
    targetDate: "2027-05-15",
    daysRemaining: 195,
    contractValue: 126000000,
    approvedBudget: 103000000,
    committedCost: 35400000,
    actualCost: 29100000,
    forecastCost: 98700000,
    contingency: 5200000,
    workforce: 124,
    openIssues: 6,
    criticalRisks: 0,
    lastUpdated: "2026-11-01T08:45:00",
    milestones: [
      { name: "Site mobilization", date: "2026-03-02", status: "Completed", detail: "Phase one work zone handed over" },
      { name: "Demolition & enabling", date: "2026-06-10", status: "Completed", detail: "Existing wing cleared and services isolated" },
      { name: "New clinical block frame", date: "2026-11-30", status: "In progress", detail: "Structure progressing to level four" },
      { name: "Building envelope", date: "2027-02-10", status: "Upcoming", detail: "Weather-tight milestone" },
      { name: "Commissioning", date: "2027-04-20", status: "Upcoming", detail: "Systems testing and clinical validation" },
      { name: "Practical completion", date: "2027-05-15", status: "Upcoming", detail: "Phased handover to hospital operations" },
    ],
    bomLines: [
      { id: "BOM-081", name: "Civil & Concrete Works", reference: "Version 3 · 110 line items", status: "Approved", quantity: 110, amount: 22900000, date: "2026-10-20" },
      { id: "BOM-082", name: "Medical Gas Systems", reference: "Version 2 · 68 line items", status: "Approved", quantity: 68, amount: 13700000, date: "2026-10-27" },
      { id: "BOM-083", name: "HVAC & Electrical", reference: "Version 2 · 92 line items", status: "In review", quantity: 92, amount: 18400000, date: "2026-10-31" },
    ],
    purchaseOrders: [
      { id: "PO-1982", name: "Ready-mix concrete", reference: "PrimeMix Concrete", status: "Partially received", quantity: 45, amount: 5280000, date: "2026-10-23" },
      { id: "PO-1987", name: "Medical gas pipeline", reference: "ClinTech Engineering", status: "In production", quantity: 22, amount: 3970000, date: "2026-10-28" },
      { id: "PO-1991", name: "HVAC plant", reference: "AirFlow Projects", status: "Approved", quantity: 14, amount: 6150000, date: "2026-10-30" },
    ],
    gatePasses: [
      { id: "GP-684", name: "Concrete pump equipment", reference: "PrimeMix Concrete · Inward", status: "Received", quantity: 4, amount: 780000, date: "2026-10-30" },
      { id: "GP-679", name: "Temporary support frames", reference: "Return to rental vendor", status: "Dispatched", quantity: 12, amount: 165000, date: "2026-10-31" },
    ],
    risks: [
      { title: "Live hospital access coordination", severity: "Medium", owner: "Site Manager", action: "Maintain weekly access and infection-control review" },
      { title: "Medical gas specialist approval", severity: "Low", owner: "MEP Lead", action: "Close documentation review before fabrication release" },
    ],
    costBreakdown: [
      { name: "Materials & procurement", amount: 44700000, color: "bg-blue-600" },
      { name: "Labor & subcontractors", amount: 35400000, color: "bg-cyan-500" },
      { name: "Plant & logistics", amount: 8600000, color: "bg-violet-500" },
      { name: "Other project costs", amount: 10000000, color: "bg-amber-500" },
    ],
  },
  {
    id: "project-3",
    name: "Eastport Logistics Hub",
    code: "PRJ-2025-027",
    location: "Chennai, Tamil Nadu",
    client: "Eastport Logistics",
    manager: "Priya Nair",
    health: "Delayed",
    status: "Recovery plan",
    progress: 87,
    startDate: "2025-11-18",
    targetDate: "2026-10-15",
    daysRemaining: -17,
    contractValue: 97800000,
    approvedBudget: 79600000,
    committedCost: 76500000,
    actualCost: 72100000,
    forecastCost: 83200000,
    contingency: 4100000,
    workforce: 49,
    openIssues: 19,
    criticalRisks: 4,
    lastUpdated: "2026-11-01T07:50:00",
    milestones: [
      { name: "Site mobilization", date: "2025-11-18", status: "Completed", detail: "Mobilization completed" },
      { name: "Warehouse structure", date: "2026-05-22", status: "Completed", detail: "Primary structure handed to services team" },
      { name: "Power connection", date: "2026-09-10", status: "Delayed", detail: "Utility connection delayed by authority inspection" },
      { name: "Fire systems certification", date: "2026-10-25", status: "Delayed", detail: "Reinspection required after corrective work" },
      { name: "Operational readiness", date: "2026-11-18", status: "In progress", detail: "Recovery schedule under client review" },
      { name: "Final handover", date: "2026-11-30", status: "Upcoming", detail: "Target date under recovery plan" },
    ],
    bomLines: [
      { id: "BOM-062", name: "Warehouse Structure", reference: "Version 5 · 136 line items", status: "Approved", quantity: 136, amount: 28700000, date: "2026-09-18" },
      { id: "BOM-063", name: "Fire & Safety Systems", reference: "Version 4 · 82 line items", status: "Rework required", quantity: 82, amount: 14600000, date: "2026-10-28" },
      { id: "BOM-064", name: "Power & Lighting", reference: "Version 3 · 91 line items", status: "Approved", quantity: 91, amount: 12300000, date: "2026-10-12" },
    ],
    purchaseOrders: [
      { id: "PO-1731", name: "Fire alarm panels", reference: "SignalSafe Controls", status: "On hold", quantity: 16, amount: 3980000, date: "2026-10-22" },
      { id: "PO-1738", name: "Replacement sprinkler heads", reference: "HydroGuard Systems", status: "Urgent delivery", quantity: 48, amount: 1260000, date: "2026-10-30" },
      { id: "PO-1740", name: "Power cable & switchgear", reference: "Southern Electrical", status: "Partially received", quantity: 28, amount: 4150000, date: "2026-10-25" },
    ],
    gatePasses: [
      { id: "GP-602", name: "Non-conforming alarm units", reference: "Return to vendor · Outward", status: "Dispatched", quantity: 6, amount: 410000, date: "2026-10-28" },
      { id: "GP-598", name: "Replacement sprinkler lot", reference: "HydroGuard Systems · Inward", status: "Expected today", quantity: 22, amount: 580000, date: "2026-11-01" },
    ],
    risks: [
      { title: "Power connection approval overdue", severity: "High", owner: "Project Manager", action: "Daily authority escalation; client sponsor engaged" },
      { title: "Fire system reinspection could move handover", severity: "High", owner: "QA/QC Lead", action: "Complete witnessed test and submit revised evidence" },
      { title: "Supplier recovery plan not confirmed", severity: "High", owner: "Procurement Lead", action: "Secure written recovery commitment or alternate source" },
    ],
    costBreakdown: [
      { name: "Materials & procurement", amount: 41200000, color: "bg-blue-600" },
      { name: "Labor & subcontractors", amount: 26600000, color: "bg-cyan-500" },
      { name: "Plant & logistics", amount: 8800000, color: "bg-violet-500" },
      { name: "Other project costs", amount: 6600000, color: "bg-amber-500" },
    ],
  },
];

const currency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const healthStyles: Record<ProjectHealth, string> = {
  "On track": "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "At risk": "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Delayed: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

const milestoneStyles: Record<MilestoneStatus, string> = {
  Completed: "border-emerald-500 bg-emerald-500 text-white",
  "In progress": "border-blue-600 bg-blue-600 text-white ring-4 ring-blue-600/15",
  Upcoming: "border-muted-foreground/30 bg-background text-muted-foreground",
  Delayed: "border-red-500 bg-red-500 text-white",
};

const healthLabel = (health: ProjectHealth) => health;

const OverviewMetric = ({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Package;
  tone: string;
}) => (
  <Card className="relative overflow-hidden">
    <CardContent className="flex items-start justify-between p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <div className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div>
    </CardContent>
  </Card>
);

const ReportLinesTable = ({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: ReportLine[];
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Lines / Qty</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.id}</TableCell>
                <TableCell>
                  <div>{row.name}</div>
                  <div className="text-xs text-muted-foreground">{row.reference}</div>
                </TableCell>
                <TableCell><Badge variant="outline">{row.status}</Badge></TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
                <TableCell className="text-right font-medium">{currency(row.amount)}</TableCell>
                <TableCell>{formatDate(row.date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

const ProjectReport = () => {
  const [selectedProjectId, setSelectedProjectId] = useState(demoReports[0].id);
  const project = demoReports.find((report) => report.id === selectedProjectId) ?? demoReports[0];
  const projectedMargin = project.contractValue - project.forecastCost;
  const budgetVariance = project.approvedBudget - project.forecastCost;
  const marginPercent = (projectedMargin / project.contractValue) * 100;
  const forecastPercent = Math.min((project.forecastCost / project.approvedBudget) * 100, 100);
  const commitmentPercent = Math.min((project.committedCost / project.approvedBudget) * 100, 100);
  const updatedTime = new Date(project.lastUpdated).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="gradient-primary px-6 py-6 text-white md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/25 bg-white/10 text-white hover:bg-white/10">
                  MANAGEMENT SNAPSHOT
                </Badge>
                <Badge variant="outline" className={`border ${healthStyles[project.health]}`}>
                  {project.health === "On track" ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <AlertTriangle className="mr-1 h-3.5 w-3.5" />}
                  {healthLabel(project.health)}
                </Badge>
                <span className="rounded-full border border-white/25 px-2.5 py-1 text-xs text-white/85">
                  UI prototype · illustrative data
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white/75">{project.code} · {project.location}</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{project.name}</h1>
                <p className="mt-2 text-sm text-white/80">
                  Client: {project.client} <span className="mx-2">·</span> Project manager: {project.manager}
                </p>
              </div>
            </div>
            <div className="w-full rounded-xl border border-white/20 bg-black/10 p-4 lg:w-[330px]">
              <label htmlFor="project-report-select" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/75">
                Select a project
              </label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger id="project-report-select" className="border-white/25 bg-white text-foreground">
                  <SelectValue placeholder="Choose project" />
                </SelectTrigger>
                <SelectContent>
                  {demoReports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>{report.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-white/70">As of 01 Nov 2026 · Refreshed at {updatedTime}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-0 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="flex items-center gap-4 p-5 md:px-7">
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Overall completion</span>
                <span className="font-bold">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="mt-3 h-2.5 bg-primary/10" />
              <p className="mt-2 text-xs text-muted-foreground">{project.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-5 md:px-7">
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-300"><CalendarDays className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Target completion</p>
              <p className="mt-1 font-semibold">{formatDate(project.targetDate)}</p>
              <p className={`mt-1 text-xs ${project.daysRemaining < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                {project.daysRemaining < 0 ? `${Math.abs(project.daysRemaining)} days past target` : `${project.daysRemaining} days remaining`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-5 md:px-7">
            <div className={`rounded-xl p-3 ${budgetVariance < 0 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}`}>
              {budgetVariance < 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Forecast budget variance</p>
              <p className={`mt-1 font-semibold ${budgetVariance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                {budgetVariance < 0 ? "+" : ""}{currency(Math.abs(budgetVariance))}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{budgetVariance < 0 ? "Forecast over approved budget" : "Forecast under approved budget"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetric
          label="Contract value"
          value={currency(project.contractValue)}
          detail="Approved project revenue"
          icon={CircleDollarSign}
          tone="bg-blue-500/10 text-blue-600 dark:text-blue-300"
        />
        <OverviewMetric
          label="Actual cost to date"
          value={currency(project.actualCost)}
          detail={`${Math.round((project.actualCost / project.approvedBudget) * 100)}% of approved budget spent`}
          icon={Wallet}
          tone="bg-violet-500/10 text-violet-600 dark:text-violet-300"
        />
        <OverviewMetric
          label="Forecast at completion"
          value={currency(project.forecastCost)}
          detail={`Approved budget ${currency(project.approvedBudget)}`}
          icon={ArrowUpRight}
          tone={budgetVariance < 0 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}
        />
        <OverviewMetric
          label="Forecast project margin"
          value={currency(projectedMargin)}
          detail={`${marginPercent.toFixed(1)}% of contract value`}
          icon={CircleDollarSign}
          tone={projectedMargin < 0 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="flex items-center gap-3 p-4">
            <Package className="h-5 w-5 text-blue-600" />
            <div><p className="text-xl font-bold">{project.bomLines.length}</p><p className="text-xs text-muted-foreground">BOMs tracked</p></div>
            <span className="ml-auto text-xs text-muted-foreground">{project.bomLines.filter((line) => line.status === "Approved").length} approved</span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="flex items-center gap-3 p-4">
            <ShoppingCart className="h-5 w-5 text-violet-600" />
            <div><p className="text-xl font-bold">{project.purchaseOrders.length}</p><p className="text-xs text-muted-foreground">Purchase orders</p></div>
            <span className="ml-auto text-xs text-muted-foreground">{currency(project.purchaseOrders.reduce((sum, item) => sum + item.amount, 0))}</span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="flex items-center gap-3 p-4">
            <Truck className="h-5 w-5 text-cyan-600" />
            <div><p className="text-xl font-bold">{project.gatePasses.length}</p><p className="text-xs text-muted-foreground">Gate passes</p></div>
            <span className="ml-auto text-xs text-muted-foreground">{project.gatePasses.filter((pass) => pass.status === "Received").length} received</span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <div><p className="text-xl font-bold">{project.openIssues}</p><p className="text-xs text-muted-foreground">Open issues</p></div>
            <span className="ml-auto text-xs text-red-600">{project.criticalRisks} critical risks</span>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex min-w-max">
            <TabsTrigger value="overview">Management Overview</TabsTrigger>
            <TabsTrigger value="bom">BOM</TabsTrigger>
            <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="gate-passes">Gate Passes</TabsTrigger>
            <TabsTrigger value="timeline">Project Timeline</TabsTrigger>
            <TabsTrigger value="financials">Cost & Profitability</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Executive snapshot</CardTitle>
                <CardDescription>Progress, commercial outlook, and management attention in one view.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span>Project delivery</span><strong>{project.progress}%</strong></div>
                  <Progress value={project.progress} className="h-2.5" />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span>Budget consumed (actual)</span><strong>{Math.round((project.actualCost / project.approvedBudget) * 100)}%</strong></div>
                  <Progress value={(project.actualCost / project.approvedBudget) * 100} className="h-2.5 [&>div]:bg-violet-500" />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span>Cost committed</span><strong>{Math.round(commitmentPercent)}%</strong></div>
                  <Progress value={commitmentPercent} className="h-2.5 [&>div]:bg-cyan-500" />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span>Forecast cost vs approved budget</span><strong>{Math.round((project.forecastCost / project.approvedBudget) * 100)}%</strong></div>
                  <Progress value={forecastPercent} className={`h-2.5 ${budgetVariance < 0 ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"}`} />
                </div>
                <div className="grid gap-3 border-t pt-4 sm:grid-cols-3">
                  <div><p className="text-xs text-muted-foreground">Committed</p><p className="mt-1 font-semibold">{currency(project.committedCost)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Contingency remaining</p><p className="mt-1 font-semibold">{currency(project.contingency)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Site workforce</p><p className="mt-1 font-semibold">{project.workforce} people</p></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg"><Flag className="h-4 w-4 text-amber-500" /> Decisions & risks</CardTitle>
                <CardDescription>Items that may affect delivery, cost, or handover.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.risks.slice(0, 3).map((risk) => (
                  <div key={risk.title} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{risk.title}</p>
                      <Badge variant={risk.severity === "High" ? "destructive" : "outline"}>{risk.severity}</Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{risk.action}</p>
                    <p className="mt-2 text-xs font-medium text-muted-foreground">Owner: {risk.owner}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Next milestones</CardTitle>
                <CardDescription>Upcoming and delayed commitments on the critical path.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.milestones.filter((milestone) => milestone.status !== "Completed").slice(0, 3).map((milestone) => (
                  <div key={milestone.name} className="flex items-start gap-3">
                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 ${milestoneStyles[milestone.status]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="text-sm font-medium">{milestone.name}</p>
                        <Badge variant={milestone.status === "Delayed" ? "destructive" : "outline"}>{milestone.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(milestone.date)} · {milestone.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Commercial outlook</CardTitle>
                <CardDescription>Forecast cost and expected margin against contract value.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <span className="text-sm text-muted-foreground">Forecast cost at completion</span>
                  <strong>{currency(project.forecastCost)}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <span className="text-sm text-muted-foreground">Contract value</span>
                  <strong>{currency(project.contractValue)}</strong>
                </div>
                <div className={`flex items-center justify-between rounded-lg p-3 ${projectedMargin < 0 ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
                  <span className="text-sm font-medium">Forecast margin / (loss)</span>
                  <strong className={projectedMargin < 0 ? "text-red-600" : "text-emerald-600"}>{currency(projectedMargin)} · {marginPercent.toFixed(1)}%</strong>
                </div>
                <p className="text-xs text-muted-foreground">Management estimate only. Values shown are illustrative in this UI prototype.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bom">
          <ReportLinesTable title="Bills of Materials" description="BOM versions, approval status, line count, and estimated value." rows={project.bomLines} />
        </TabsContent>

        <TabsContent value="purchase-orders">
          <ReportLinesTable title="Purchase Orders" description="Vendor commitments, fulfillment status, quantities, and order value." rows={project.purchaseOrders} />
        </TabsContent>

        <TabsContent value="gate-passes">
          <ReportLinesTable title="Gate Passes & Material Movement" description="Inbound and outbound material movement linked to the project." rows={project.gatePasses} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Milestone timeline</CardTitle>
              <CardDescription>Baseline schedule status and milestone-level context.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative ml-2 space-y-0 border-l-2 border-muted pl-7">
                {project.milestones.map((milestone, index) => (
                  <div key={milestone.name} className="relative pb-7 last:pb-0">
                    <span className={`absolute -left-[35px] top-1 h-4 w-4 rounded-full border-2 ${milestoneStyles[milestone.status]}`} />
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{milestone.name}</h3>
                          <Badge variant={milestone.status === "Delayed" ? "destructive" : milestone.status === "Completed" ? "default" : "outline"}>
                            {milestone.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{milestone.detail}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {milestone.status === "Completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Clock3 className="h-4 w-4" />}
                        {formatDate(milestone.date)}
                      </div>
                    </div>
                    {index < project.milestones.length - 1 && <div className="mt-4 border-b border-dashed" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">Schedule confidence</p>
                <p className="mt-1 text-sm text-muted-foreground">Compare baseline and forecast dates when the project schedule is connected.</p>
              </div>
              <div className="flex gap-5 text-sm">
                <div><p className="text-xs text-muted-foreground">Planned start</p><p className="mt-1 font-medium">{formatDate(project.startDate)}</p></div>
                <div><p className="text-xs text-muted-foreground">Target finish</p><p className="mt-1 font-medium">{formatDate(project.targetDate)}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project cost position</CardTitle>
                <CardDescription>Budget, committed cost, actual spend, and forecast at completion.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { label: "Approved budget", value: project.approvedBudget, color: "bg-slate-400" },
                  { label: "Committed cost", value: project.committedCost, color: "bg-blue-600" },
                  { label: "Actual cost to date", value: project.actualCost, color: "bg-violet-500" },
                  { label: "Forecast at completion", value: project.forecastCost, color: budgetVariance < 0 ? "bg-red-500" : "bg-emerald-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{currency(item.value)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min((item.value / project.approvedBudget) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">Contingency remaining</span>
                  <span className="font-semibold">{currency(project.contingency)}</span>
                </div>
                <div className={`rounded-lg p-3 text-sm ${budgetVariance < 0 ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
                  {budgetVariance < 0
                    ? `Forecast is ${currency(Math.abs(budgetVariance))} above approved budget.`
                    : `Forecast is ${currency(budgetVariance)} within approved budget.`}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost breakdown</CardTitle>
                <CardDescription>Illustrative forecast composition by cost category.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.costBreakdown.map((cost) => {
                  const share = (cost.amount / project.forecastCost) * 100;
                  return (
                    <div key={cost.name} className="space-y-1.5">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-sm ${cost.color}`} />{cost.name}</span>
                        <span className="font-medium">{currency(cost.amount)} <span className="text-xs text-muted-foreground">({share.toFixed(0)}%)</span></span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className={`h-2 rounded-full ${cost.color}`} style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between border-t pt-4 font-semibold">
                  <span>Forecast total</span><span>{currency(project.costBreakdown.reduce((sum, cost) => sum + cost.amount, 0))}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profitability forecast</CardTitle>
              <CardDescription>Contract value less forecast cost at completion.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">Contract value</p><p className="mt-2 text-xl font-bold">{currency(project.contractValue)}</p></div>
                <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">Forecast total cost</p><p className="mt-2 text-xl font-bold">{currency(project.forecastCost)}</p></div>
                <div className={`rounded-xl border p-4 ${projectedMargin < 0 ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
                  <p className="text-sm text-muted-foreground">Estimated {projectedMargin < 0 ? "loss" : "profit"} · margin</p>
                  <p className={`mt-2 text-xl font-bold ${projectedMargin < 0 ? "text-red-600" : "text-emerald-600"}`}>{currency(Math.abs(projectedMargin))} · {Math.abs(marginPercent).toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                Profitability is a forecast indicator, not a financial statement. Actual revenue recognition, approved changes, taxes, and pending claims should be reconciled before management decisions.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectReport;
