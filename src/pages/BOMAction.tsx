import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Save,
  X,
  ChevronRight,
  ChevronLeft,
  Warehouse,
  Clock,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import { bomService } from "@/services/bomService";
import { storeService } from "@/services/storeService";
import { projectService } from "@/services/projectService";
import { itemStoreService } from "@/services/itemStoreService";
import { itemService } from "@/services/itemService";
import { formatDateTime } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BOMItem {
  id: string;
  itemName: string;
  specification?: string;
  unit: string;
  requiredQuantity: number;
  allocatedQuantity: number;
  pendingQuantity: number;
  status: "pending" | "partial" | "complete";
  priority?: "low" | "medium" | "high";
  category?: string;
  supplier?: string;
}

interface BOM {
  id: string;
  projectName: string;
  description: string;
  bomNumber: string;
  status: "draft" | "approved" | "in-progress" | "completed";
  totalItems: number;
  completedItems: number;
  createdByUser: string;
  createdDate: string;
  updatedDate: string;
  items: BOMItem[];
}

interface Store {
  id: string | number;
  name: string;
  [key: string]: any;
}

interface StoreItem {
  id: string | number;
  itemId?: string | number;
  itemName?: string;
  name?: string;
  availableQuantity?: number;
  quantity?: number;
  [key: string]: any;
}

interface Project {
  id: string | number;
  name: string;
  endDate?: string;
  status?: string;
  [key: string]: any;
}

// Step allocation maps: itemId -> qty
type AllocationMap = Record<string, number>;

const WORKFLOW_STEPS = [
  { id: 1, label: "Store Allocation", icon: Warehouse },
  { id: 2, label: "Expiring Projects", icon: Clock },
  { id: 3, label: "Purchase Order", icon: ShoppingCart },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr?: string): number {
  if (!dateStr) return Infinity;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    approved: "bg-blue-100 text-blue-700",
    "in-progress": "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
    pending: "bg-red-100 text-red-700",
    partial: "bg-orange-100 text-orange-700",
    complete: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-red-100 text-red-700"}`}
    >
      {status}
    </span>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="flex items-center w-full mb-8">
      {WORKFLOW_STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isDone = step.id < currentStep;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => onStepClick(step.id)}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                  ${isDone ? "bg-green-500 border-green-500 text-white" : ""}
                  ${isActive ? "bg-primary border-primary text-primary-foreground shadow-md scale-110" : ""}
                  ${!isDone && !isActive ? "bg-muted border-muted-foreground/30 text-muted-foreground group-hover:border-primary/50" : ""}
                `}
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${isActive ? "text-primary" : isDone ? "text-green-600" : "text-muted-foreground"}`}
              >
                {step.label}
              </span>
            </button>

            {idx < WORKFLOW_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-14px] transition-all ${isDone ? "bg-green-400" : "bg-muted-foreground/20"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Summary Panel ────────────────────────────────────────────────────────────

function SummaryPanel({
  bom,
  step1Alloc,
  step2Alloc,
  step3Alloc,
}: {
  bom: BOM;
  step1Alloc: AllocationMap;
  step2Alloc: AllocationMap;
  step3Alloc: AllocationMap;
}) {
  const totals = bom.items.map((item) => {
    const s1 = step1Alloc[item.id] ?? 0;
    const s2 = step2Alloc[item.id] ?? 0;
    const s3 = step3Alloc[item.id] ?? 0;
    const totalAllocated = item.allocatedQuantity + s1 + s2;
    const pending = Math.max(0, item.requiredQuantity - totalAllocated);
    return { item, s1, s2, s3, totalAllocated, pending };
  });

  const fullyAllocated = totals.filter((t) => t.pending === 0).length;
  const progressPct = Math.round((fullyAllocated / bom.items.length) * 100);

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" />
          Allocation Summary
        </CardTitle>
        <p className="text-xs text-muted-foreground">{bom.bomNumber}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Items allocated</span>
            <span className="font-semibold">
              {fullyAllocated}/{bom.items.length}
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{progressPct}% complete</p>
        </div>

        <div className="border-t pt-3 space-y-2">
          {totals.map(({ item, s1, s2, pending }) => (
            <div key={item.id} className="text-xs">
              <p className="font-medium truncate">{item.itemName}</p>
              <div className="grid grid-cols-2 gap-x-2 text-muted-foreground mt-0.5">
                <span>Required: {item.requiredQuantity}</span>
                <span>Pending: <span className={pending > 0 ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>{pending}</span></span>
                {s1 > 0 && <span className="text-blue-600">Store: +{s1}</span>}
                {s2 > 0 && <span className="text-purple-600">Project: +{s2}</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 1: Store Allocation ─────────────────────────────────────────────────

function Step1(props: {
  bom: BOM;
  stores: Store[];
  allocations: AllocationMap;
  onChange: (alloc: AllocationMap) => void;
  onApply: () => void;
  onSkip: () => void;
}) {
  const { bom, stores, allocations, onChange, onApply, onSkip } = props;

  const [selectedStore, setSelectedStore] = useState<string>("");
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchStoreItems = useCallback(async (storeName: string) => {
    setLoadingItems(true);
    try {
      const data = await itemStoreService.getAll(storeName);
      setStoreItems(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      toast.error("Failed to load store inventory");
      setStoreItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const handleStoreChange = (storeId: string) => {
    setSelectedStore(storeId);
    const store = stores.find((s) => String(s.id) === storeId);
    if (store) fetchStoreItems(store.name);
  };

  const getAvailableQty = (item: BOMItem): number => {
    const match = storeItems.find(
      (si) =>
        String(si.itemId ?? si.id) === String(item.id) ||
        (si.itemName ?? si.name ?? "")
          .toLowerCase()
          .includes(item.itemName.toLowerCase())
    );
    return match?.availableQuantity ?? match?.quantity ?? 0;
  };

  const pendingForItem = (item: BOMItem) =>
    Math.max(0, item.pendingQuantity - (allocations[item.id] ?? 0));

  return (
    <div className="space-y-4">
      {/* Store selector */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
        <Warehouse className="h-5 w-5 text-blue-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Select a store to view available stock
          </p>
          <p className="text-xs text-blue-600/80 dark:text-blue-400 mt-0.5">
            Available quantities update per store selection
          </p>
        </div>
        <Select value={selectedStore} onValueChange={handleStoreChange}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Choose store…" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((s) => (
              <SelectItem key={String(s.id)} value={String(s.id)}>
                {s.storeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Item Name</TableHead>
              <TableHead className="text-xs">UOM</TableHead>
              <TableHead className="text-right text-xs">
                {selectedStore ? "Available (Store)" : "Available"}
              </TableHead>
              <TableHead className="text-right text-xs">Required</TableHead>
              <TableHead className="text-right text-xs">Pending</TableHead>
              <TableHead className="text-right text-xs">Allocate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bom.items.map((item) => {
              const available = selectedStore ? getAvailableQty(item) : "—";
              const pending = pendingForItem(item);
              const maxAllocate =
                typeof available === "number"
                  ? Math.min(available, item.pendingQuantity)
                  : item.pendingQuantity;

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-sm">
                    {item.itemName}
                    {item.specification && (
                      <p className="text-xs text-muted-foreground font-normal">
                        {item.specification}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{item.unit}</TableCell>
                  <TableCell className="text-right text-sm">
                    {loadingItems ? (
                      <span className="text-muted-foreground animate-pulse">…</span>
                    ) : (
                      <span
                        className={
                          typeof available === "number" && available === 0
                            ? "text-red-500"
                            : "text-green-600 font-medium"
                        }
                      >
                        {available}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {item.requiredQuantity}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <span className={pending > 0 ? "text-orange-600" : "text-green-600"}>
                      {pending}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      max={maxAllocate}
                      value={allocations[item.id] ?? 0}
                      onChange={(e) =>
                        onChange({
                          ...allocations,
                          [item.id]: Math.min(
                            Number(e.target.value),
                            maxAllocate
                          ),
                        })
                      }
                      className="w-20 text-right text-sm ml-auto"
                      disabled={item.pendingQuantity === 0}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onSkip} className="gap-1">
          <SkipForward className="h-4 w-4" />
          Skip this step
        </Button>
        <Button onClick={onApply} className="gap-2">
          Apply & Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Expiring Projects ────────────────────────────────────────────────

function Step2(props: {
  bom: BOM;
  projects: Project[];
  step1Alloc: AllocationMap;
  allocations: AllocationMap;
  onChange: (alloc: AllocationMap) => void;
  onApply: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const { bom, projects, step1Alloc, allocations, onChange, onApply, onBack, onSkip } =
    props;

  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Filter projects nearing completion (within 30 days) that aren't completed
  const relevantProjects = projects.filter((p) => {
    if (p.status === "completed" || p.status === "Completed") return false;
    const days = daysUntil(p.endDate);
    return days >= 0 && days <= 30;
  });

  const pendingQtyForItem = (item: BOMItem) =>
    Math.max(0, item.pendingQuantity - (step1Alloc[item.id] ?? 0));

  const toggleProject = (id: string) =>
    setExpandedProject((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900">
        <Clock className="h-5 w-5 text-purple-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
            About-to-complete projects
          </p>
          <p className="text-xs text-purple-600/80 dark:text-purple-400 mt-0.5">
            Plan to use materials expected to be returned from finishing projects
          </p>
        </div>
      </div>

      {relevantProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <AlertCircle className="h-8 w-8 opacity-40" />
          <p className="text-sm">No projects close to completion right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {relevantProjects.map((project) => {
            const days = daysUntil(project.endDate);
            const projId = String(project.id);
            const isExpanded = expandedProject === projId;

            return (
              <div
                key={projId}
                className="border rounded-lg overflow-hidden"
              >
                {/* Project header */}
                <button
                  onClick={() => toggleProject(projId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{project.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Expected completion:{" "}
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString()
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${days <= 7
                        ? "bg-red-100 text-red-700"
                        : days <= 14
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {days}d left
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded sub-table */}
                {isExpanded && (
                  <div className="border-t bg-muted/20 p-3">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-transparent">
                          <TableHead className="text-xs h-8">Item</TableHead>
                          <TableHead className="text-right text-xs h-8">Pending in BOM</TableHead>
                          <TableHead className="text-right text-xs h-8">Plan to Take</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bom.items.map((item) => {
                          const pending = pendingQtyForItem(item);
                          const key = `${projId}_${item.id}`;
                          return (
                            <TableRow key={key}>
                              <TableCell className="text-sm py-2">
                                {item.itemName}
                              </TableCell>
                              <TableCell className="text-right text-sm py-2">
                                <span className={pending > 0 ? "text-orange-600" : "text-green-600"}>
                                  {pending}
                                </span>
                              </TableCell>
                              <TableCell className="text-right py-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={pending}
                                  value={allocations[item.id] ?? 0}
                                  onChange={(e) =>
                                    onChange({
                                      ...allocations,
                                      [item.id]: Math.min(
                                        Number(e.target.value),
                                        pending
                                      ),
                                    })
                                  }
                                  className="w-20 text-right text-sm ml-auto"
                                  disabled={pending === 0}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={onSkip} className="gap-1">
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
        </div>
        <Button onClick={onApply} className="gap-2">
          Apply & Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Purchase Order ───────────────────────────────────────────────────

function Step3(props: {
  bom: BOM;
  step1Alloc: AllocationMap;
  step2Alloc: AllocationMap;
  poItems: AllocationMap;
  poSuppliers: Record<string, string>;
  onChangeQty: (alloc: AllocationMap) => void;
  onChangeSupplier: (suppliers: Record<string, string>) => void;
  onCreatePO: () => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  const {
    bom,
    step1Alloc,
    step2Alloc,
    poItems,
    poSuppliers,
    onChangeQty,
    onChangeSupplier,
    onCreatePO,
    onFinish,
    onBack,
  } = props;

  const [showFullyAllocated, setShowFullyAllocated] = useState(false);

  const rows = bom.items.map((item) => {
    const existing = item.allocatedQuantity;
    const s1 = step1Alloc[item.id] ?? 0;
    const s2 = step2Alloc[item.id] ?? 0;
    const pending = Math.max(0, item.requiredQuantity - existing - s1 - s2);
    return { item, pending };
  });

  const pendingRows = rows.filter((r) => r.pending > 0);
  const doneRows = rows.filter((r) => r.pending === 0);
  const displayRows = showFullyAllocated ? rows : pendingRows;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
        <ShoppingCart className="h-5 w-5 text-green-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            Create Purchase Order
          </p>
          <p className="text-xs text-green-600/80 dark:text-green-400 mt-0.5">
            {pendingRows.length > 0
              ? `${pendingRows.length} item(s) still need procurement`
              : "All items are allocated! You can finish without creating a PO."}
          </p>
        </div>
        {doneRows.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullyAllocated((v) => !v)}
            className="text-xs"
          >
            {showFullyAllocated ? "Hide" : "Show"} allocated
          </Button>
        )}
      </div>

      {pendingRows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="font-medium">All items are fully allocated!</p>
          <p className="text-sm text-muted-foreground">
            No purchase order needed.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Item Name</TableHead>
                <TableHead className="text-xs">UOM</TableHead>
                <TableHead className="text-right text-xs">Pending Qty</TableHead>
                <TableHead className="text-right text-xs">PO Qty</TableHead>
                <TableHead className="text-xs">Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map(({ item, pending }) => (
                <TableRow
                  key={item.id}
                  className={pending === 0 ? "opacity-50" : ""}
                >
                  <TableCell className="font-medium text-sm">
                    {item.itemName}
                  </TableCell>
                  <TableCell className="text-sm">{item.unit}</TableCell>
                  <TableCell className="text-right text-sm">
                    <span className={pending > 0 ? "text-orange-600 font-medium" : "text-green-600"}>
                      {pending}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      value={poItems[item.id] ?? pending}
                      onChange={(e) =>
                        onChangeQty({ ...poItems, [item.id]: Number(e.target.value) })
                      }
                      className="w-20 text-right text-sm ml-auto"
                      disabled={pending === 0}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder={item.supplier ?? "Supplier name…"}
                      value={poSuppliers[item.id] ?? item.supplier ?? ""}
                      onChange={(e) =>
                        onChangeSupplier({
                          ...poSuppliers,
                          [item.id]: e.target.value,
                        })
                      }
                      className="text-sm min-w-[140px]"
                      disabled={pending === 0}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onFinish}>
            Finish without PO
          </Button>
          {pendingRows.length > 0 && (
            <Button onClick={onCreatePO} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Create Purchase Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BOMAction() {
  // ── Data State ──
  const [boms, setBOMs] = useState<BOM[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingBOMs, setLoadingBOMs] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // ── Filter State ──
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // ── Workflow State ──
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Alloc, setStep1Alloc] = useState<AllocationMap>({});
  const [step2Alloc, setStep2Alloc] = useState<AllocationMap>({});
  const [poQty, setPoQty] = useState<AllocationMap>({});
  const [poSuppliers, setPoSuppliers] = useState<Record<string, string>>({});

  // ── Load data ──
  useEffect(() => {
    bomService
      .getAll()
      .then((data) => setBOMs(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => toast.error("Failed to load BOMs"))
      .finally(() => setLoadingBOMs(false));

    storeService
      .getAllStores()
      .then((data) => setStores(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => toast.error("Failed to load stores"))
      .finally(() => setLoadingStores(false));

    projectService
      .getAllProjects()
      .then((data) => setProjects(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoadingProjects(false));
  }, []);

  const filteredBOMs = boms.filter((bom) => {
    const matchesSearch =
      (bom.projectName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bom.bomNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || bom.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ── Open workflow ──
  const openWorkflow = (bom: BOM) => {
    bomService
      .GetConsolidatedBomItemsById(bom.id)
      .then((data) => setSelectedBOM(data))
      .catch(() => toast.error("Failed to load BOM details"))
      .finally(() => setLoadingBOMs(false));
    setCurrentStep(1);
    setStep1Alloc({});
    setStep2Alloc({});
    const defaultPO: AllocationMap = {};
    bom.items.forEach((item) => {
      defaultPO[item.id] = item.pendingQuantity;
    });
    setPoQty(defaultPO);
    setPoSuppliers({});
  };

  const closeWorkflow = () => {
    setSelectedBOM(null);
    setCurrentStep(1);
    setStep1Alloc({});
    setStep2Alloc({});
    setPoQty({});
    setPoSuppliers({});
  };

  // ── Step handlers ──
  const applyStep1 = () => setCurrentStep(2);
  const skipStep1 = () => { setStep1Alloc({}); setCurrentStep(2); };

  const applyStep2 = () => {
    // Re-calculate default PO qty based on remaining pending after s1+s2
    if (selectedBOM) {
      const newPO: AllocationMap = {};
      selectedBOM.items.forEach((item) => {
        const s1 = step1Alloc[item.id] ?? 0;
        const s2 = step2Alloc[item.id] ?? 0;
        const remaining = Math.max(0, item.pendingQuantity - s1 - s2);
        newPO[item.id] = remaining;
      });
      setPoQty(newPO);
    }
    setCurrentStep(3);
  };
  const skipStep2 = () => { setStep2Alloc({}); applyStep2(); };

  const handleCreatePO = () => {
    // In production this would call a purchaseOrderService.create()
    toast.success("Purchase order created successfully!");
    closeWorkflow();
  };

  const handleFinishWithoutPO = () => {
    toast.success("Allocation saved successfully!");
    closeWorkflow();
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BOM Allocation</h1>
        <p className="text-muted-foreground mt-1">
          Allocate materials to projects from stores, expiring projects, or procurement
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search BOMs or projects…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* BOM List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">BOMs</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBOMs ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <span className="animate-spin border-2 border-primary border-t-transparent rounded-full h-5 w-5" />
              Loading BOMs…
            </div>
          ) : filteredBOMs.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
              <AlertCircle className="h-8 w-8 opacity-40" />
              <p className="text-sm">No BOMs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BOM No.</TableHead>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Created By</TableHead>
                    <TableHead className="text-center">Created Date</TableHead>
                    <TableHead className="text-center">Updated Date</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBOMs.map((bom) => (
                    <TableRow
                      key={bom.id}
                      className={selectedBOM?.id === bom.id ? "bg-primary/5" : ""}
                    >
                      <TableCell className="font-medium">{bom.id}</TableCell>
                      <TableCell>{bom.projectName}</TableCell>
                      <TableCell>{getStatusBadge(bom.status)}</TableCell>
                      <TableCell className="text-center">{bom.createdByUser}</TableCell>
                      <TableCell className="text-center">{formatDateTime(bom.createdDate)}</TableCell>
                      <TableCell className="text-center">{formatDateTime(bom.updatedDate)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant={selectedBOM?.id === bom.id ? "default" : "outline"}
                          onClick={() => openWorkflow(bom)}
                        >
                          Allocate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Workflow ── */}
      {selectedBOM && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Workflow Panel */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between pb-4">
              <div>
                <CardTitle className="text-lg">
                  Allocation Workflow
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {/* {selectedBOM.projectName} — {selectedBOM.description} */}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 shrink-0"
                onClick={closeWorkflow}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {/* Step Indicator */}
              <StepIndicator
                currentStep={currentStep}
                onStepClick={setCurrentStep}
              />

              {/* Step Content */}
              {currentStep === 1 && (
                <Step1
                  bom={selectedBOM}
                  stores={loadingStores ? [] : stores}
                  allocations={step1Alloc}
                  onChange={setStep1Alloc}
                  onApply={applyStep1}
                  onSkip={skipStep1}
                />
              )}
              {currentStep === 2 && (
                <Step2
                  bom={selectedBOM}
                  projects={loadingProjects ? [] : projects}
                  step1Alloc={step1Alloc}
                  allocations={step2Alloc}
                  onChange={setStep2Alloc}
                  onApply={applyStep2}
                  onBack={() => setCurrentStep(1)}
                  onSkip={skipStep2}
                />
              )}
              {currentStep === 3 && (
                <Step3
                  bom={selectedBOM}
                  step1Alloc={step1Alloc}
                  step2Alloc={step2Alloc}
                  poItems={poQty}
                  poSuppliers={poSuppliers}
                  onChangeQty={setPoQty}
                  onChangeSupplier={setPoSuppliers}
                  onCreatePO={handleCreatePO}
                  onFinish={handleFinishWithoutPO}
                  onBack={() => setCurrentStep(2)}
                />
              )}
            </CardContent>
          </Card>

          {/* Summary Sidebar */}
          <div className="order-first lg:order-last">
            <SummaryPanel
              bom={selectedBOM}
              step1Alloc={step1Alloc}
              step2Alloc={step2Alloc}
              step3Alloc={poQty}
            />
          </div>
        </div>
      )}
    </div>
  );
}