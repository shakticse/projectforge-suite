import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Save,
  X,
  ChevronRight,
  ChevronLeft,
  Warehouse,
  Clock,
  ShoppingCart,
  Factory,
  CheckCircle2,
  AlertCircle,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Package,
  Eye,
  ArrowDownToLine,
  ListFilter,
  WandSparkles,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import { bomService } from "@/services/bomService";
import { bomAllocationService, type BomAllocationItem } from "@/services/bomAllocationService";
import { storeService } from "@/services/storeService";
import { projectService } from "@/services/projectService";
import { itemStoreService } from "@/services/itemStoreService";
import { itemService } from "@/services/itemService";
import { formatDateTime } from "@/lib/utils";
import { authService } from "@/services/authService";
import { categoryService } from "@/services/categoryService";
import { NumberSchema } from "yup";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BOMItem {
  id: string;
  itemId?: string | number;
  ItemId?: string | number;
  item_id?: string | number;
  itemName: string;
  specification?: string;
  unit: string;
  qty: number;
  allottedQty: number;
  pendingQuantity: number;
  status: "pending" | "partial" | "complete";
  priority?: "low" | "medium" | "high";
  category?: string;
  categoryName?: string;
  supplier?: string;
}

interface ItemCategory {
  id: string;
  name: string;
}

function getCategoryKey(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function matchesSelectedCategories(item: BOMItem, selectedCategories: string[]): boolean {
  if (selectedCategories.length === 0) return true;
  const category = item.categoryName ?? item.category ?? "";
  return selectedCategories.includes(getCategoryKey(category));
}

function ItemCategoryFilter({
  categories,
  selectedCategories,
  onChange,
}: {
  categories: ItemCategory[];
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}) {
  const selectedLabel =
    selectedCategories.length === 0
      ? "All categories"
      : selectedCategories.length === 1
        ? categories.find((category) => getCategoryKey(category.name) === selectedCategories[0])?.name ??
        "1 category selected"
        : `${selectedCategories.length} categories selected`;

  const toggleCategory = (categoryName: string, checked: boolean) => {
    const key = getCategoryKey(categoryName);
    onChange(
      checked
        ? [...selectedCategories, key]
        : selectedCategories.filter((selected) => selected !== key),
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <ListFilter className="h-4 w-4" />
          {selectedLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Filter by category</p>
          {selectedCategories.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onChange([])}
            >
              Clear
            </Button>
          )}
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories available.</p>
        ) : (
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {categories.map((category) => {
              const key = getCategoryKey(category.name);
              return (
                <label key={category.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedCategories.includes(key)}
                    onCheckedChange={(checked) => toggleCategory(category.name, checked === true)}
                  />
                  <span>{category.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
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
  storeName: string;
  name?: string;
  [key: string]: any;
}

interface StoreItem {
  id: string | number;
  itemId?: string | number;
  ItemId?: string | number;
  item_id?: string | number;
  ItemID?: string | number;
  itemName?: string;
  name?: string;
  qty?: number;
  Qty?: number;
  quantity?: number;
  allocatedQty?: number;
  AllocatedQty?: number;
  allocated_qty?: number;
  availableQty?: number;
  AvailableQty?: number;
  availableQuantity?: number;
  AvailableQuantity?: number;
  available_qty?: number;
  available_quantity?: number;
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
  { id: 4, label: "Outsourcing", icon: Factory },
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
  step4Alloc,
}: {
  bom: BOM;
  step1Alloc: AllocationMap;
  step2Alloc: AllocationMap;
  step3Alloc: AllocationMap;
  step4Alloc: AllocationMap;
}) {
  const [showFullyAllocated, setShowFullyAllocated] = useState(false);

  const totals = bom.items.map((item) => {
    const s1 = step1Alloc[item.id] ?? 0;
    const s2 = step2Alloc[item.id] ?? 0;
    const s3 = step3Alloc[item.id] ?? 0;
    const s4 = step4Alloc[item.id] ?? 0;
    const totalAllocated = item.allottedQty + s1 + s2;
    const pending = Math.max(0, item.qty - totalAllocated);
    return { item, s1, s2, s3, s4, totalAllocated, pending };
  });

  const pendingRows = totals.filter((t) => t.pending > 0);
  const doneRows = totals.filter((t) => t.pending === 0);
  const orderedTotals = [...pendingRows, ...doneRows];
  const displayTotals = showFullyAllocated ? orderedTotals : pendingRows;

  const fullyAllocated = doneRows.length;
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
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {pendingRows.length > 0
                ? `${pendingRows.length} with pending qty`
                : "No pending qty"}
            </p>
            {doneRows.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullyAllocated((v) => !v)}
                className="text-xs h-7 px-2 shrink-0"
              >
                {showFullyAllocated ? "Hide" : "Show"} allocated
              </Button>
            )}
          </div>
          {displayTotals.length === 0 && doneRows.length > 0 && (
            <p className="text-xs text-muted-foreground italic">
              All lines are fully allocated for store/project. Use &quot;Show allocated&quot; to list them.
            </p>
          )}
          {displayTotals.map(({ item, s1, s2, s3, s4, pending }) => (
            <div key={item.id} className="text-xs">
              <p className="font-medium truncate">{item.itemName}</p>
              <div className="grid grid-cols-2 gap-x-2 text-muted-foreground mt-0.5">
                <span>Required: {item.qty}</span>
                <span>Pending: <span className={pending > 0 ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>{pending}</span></span>
                {s1 > 0 && <span className="text-blue-600">Store: +{s1}</span>}
                {s2 > 0 && <span className="text-purple-600">Project: +{s2}</span>}
                {s3 > 0 && <span className="text-green-700">PO: +{s3}</span>}
                {s4 > 0 && <span className="text-slate-700">Outsource: +{s4}</span>}
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
  categories: ItemCategory[];
  selectedCategories: string[];
  onSelectedCategoriesChange: (categories: string[]) => void;
  allocations: AllocationMap;
  onChange: (alloc: AllocationMap) => void;
  onApply: (storeId: string, changedItems: BomAllocationItem[]) => void | Promise<void>;
  onSkip: () => void;
}) {
  const {
    bom,
    stores,
    categories,
    selectedCategories,
    onSelectedCategoriesChange,
    allocations,
    onChange,
    onApply,
    onSkip,
  } = props;

  const [selectedStore, setSelectedStore] = useState<string>("");
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [dirtyItems, setDirtyItems] = useState<Set<string>>(new Set());
  const [showFullyAllocated, setShowFullyAllocated] = useState(false);
  const [storePromptOpen, setStorePromptOpen] = useState(false);
  const storeItemsRequestId = useRef(0);

  useEffect(() => {
    // ✅ Reset local display values
    console.log("Resetting local display values for BOM:", bom.id);
    const initial: Record<string, string> = {};
    bom.items.forEach((item) => {
      initial[item.id] = "";
    });
    setLocalValues(initial);
    setDirtyItems(new Set());
    setShowFullyAllocated(false);

    // ✅ Reset parent allocations too
    onChange({});
  }, [bom.id]); // ← fires every time BOM changes

  const fetchStoreItems = useCallback(async (storeId: string) => {
    const requestId = ++storeItemsRequestId.current;
    setLoadingItems(true);
    setStoreItems([]);
    try {
      const data = await itemStoreService.getByStoreId(storeId);
      if (requestId === storeItemsRequestId.current) {
        const rows = Array.isArray(data)
          ? data
          : data && typeof data === "object"
            ? data.data ?? data.Data ?? data.items ?? data.Items ?? []
            : [];
        setStoreItems(Array.isArray(rows) ? rows : []);
      }
    } catch (error) {
      console.error("Failed to load inventory for selected store", error);
      if (requestId === storeItemsRequestId.current) {
        toast.error("Failed to load store inventory");
      }
    } finally {
      if (requestId === storeItemsRequestId.current) setLoadingItems(false);
    }
  }, []);

  const handleStoreChange = (storeId: string) => {
    setSelectedStore(storeId);
    setLocalValues({});
    setDirtyItems(new Set());
    onChange({});
    if (storeId) void fetchStoreItems(storeId);
    else {
      storeItemsRequestId.current += 1;
      setStoreItems([]);
      setLoadingItems(false);
    }
  };

  const getAvailableQty = (item: BOMItem): number => {
    const itemId = item.itemId ?? item.ItemId ?? item.item_id ?? item.id;
    const toNumericId = (value: string | number | undefined) => {
      if (value === undefined || value === null || String(value).trim() === "") return null;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };
    const targetId = toNumericId(itemId);
    const match = storeItems.find((storeItem) => {
      const storeItemId = storeItem.itemId ?? storeItem.ItemId ?? storeItem.item_id ?? storeItem.ItemID;
      const numericStoreItemId = toNumericId(storeItemId);
      return targetId !== null
        ? numericStoreItemId === targetId
        : String(storeItemId ?? "") === String(itemId ?? "");
    });
    if (!match) return 0;
    const available =
      match.availableQty ??
      match.AvailableQty ??
      match.availableQuantity ??
      match.AvailableQuantity ??
      match.available_qty ??
      match.available_quantity;
    if (available !== undefined && available !== null) {
      const quantity = Number(available);
      return Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
    }

    const quantity = Number(match.qty ?? match.Qty ?? match.quantity ?? 0);
    const allocated = Number(match.allocatedQty ?? match.AllocatedQty ?? match.allocated_qty ?? 0);
    return Number.isFinite(quantity) && Number.isFinite(allocated)
      ? Math.max(0, quantity - allocated)
      : 0;
  };

  const pendingForItem = (item: BOMItem) =>
    Math.max(0, item.qty - item.allottedQty - (allocations[item.id] ?? 0));

  const autoAllocateAvailableStock = () => {
    if (!selectedStore || loadingItems) return;
    const nextAllocations: AllocationMap = {};
    const nextLocalValues: Record<string, string> = {};
    const autoAllocatedIds = new Set<string>();

    bom.items.forEach((item) => {
      const remainingRequired = Math.max(0, item.qty - item.allottedQty);
      const quantity = Math.floor(Math.min(getAvailableQty(item), remainingRequired));
      nextLocalValues[item.id] = quantity > 0 ? String(quantity) : "";
      if (quantity > 0) {
        nextAllocations[item.id] = quantity;
        autoAllocatedIds.add(item.id);
      }
    });

    if (autoAllocatedIds.size === 0) {
      toast.info("No available store stock can be allocated to this BOM.");
      return;
    }

    setLocalValues(nextLocalValues);
    setDirtyItems((current) => new Set([...current, ...autoAllocatedIds]));
    onChange(nextAllocations);
    toast.success("Available store quantities filled without exceeding BOM requirements.");
  };

  const rowsWithPending = bom.items.map((item) => ({
    item,
    pending: pendingForItem(item),
  })).filter((row) => matchesSelectedCategories(row.item, selectedCategories));
  const pendingRows = rowsWithPending.filter((r) => r.pending > 0);
  const doneRows = rowsWithPending.filter((r) => r.pending === 0);
  const displayRows = showFullyAllocated ? [...pendingRows, ...doneRows] : pendingRows;

  return (
    <div className="space-y-4">
      {/* Store selector */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
        <Warehouse className="h-5 w-5 text-blue-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Select a store to view available stock.
          </p>
          <p className="text-xs text-blue-600/80 dark:text-blue-400 mt-0.5">
            Available quantities update per store selection.
            {pendingRows.length > 0 && doneRows.length > 0 && !showFullyAllocated
              ? ` Showing ${pendingRows.length} with pending qty.`
              : null}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
        <div className="flex flex-wrap items-center gap-3">
          {doneRows.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullyAllocated((v) => !v)}
              className="text-xs shrink-0"
            >
              {showFullyAllocated ? "Hide" : "Show"} allocated
            </Button>
          )}
          <ItemCategoryFilter
            categories={categories}
            selectedCategories={selectedCategories}
            onChange={onSelectedCategoriesChange}
          />
          <Select value={selectedStore} onValueChange={handleStoreChange}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Choose store…" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((s) => (
                <SelectItem key={String(s.id)} value={String(s.id)}>
                  {s.storeName ?? s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={autoAllocateAvailableStock}
            disabled={!selectedStore || loadingItems || storeItems.length === 0}
            className="gap-2"
          >
            <WandSparkles className="h-4 w-4" />
            Auto-allocate available
          </Button>
        </div>
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
            {displayRows.length === 0 && doneRows.length > 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-muted-foreground py-10"
                >
                  All items are fully allocated for this step. Use &quot;Show allocated&quot; to
                  see them in the table.
                </TableCell>
              </TableRow>
            )}
            {displayRows.length === 0 && rowsWithPending.length === 0 && selectedCategories.length > 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No items match the selected categories.
                </TableCell>
              </TableRow>
            )}
            {displayRows.map(({ item, pending }) => {
              const available = selectedStore ? getAvailableQty(item) : "—";
              const maxAllocate =
                typeof available == "number"
                  ? Math.min(available, pending + (allocations[item.id] ?? 0))
                  : pending;

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
                    {item.qty}
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
                      step={1}
                      // ✅ Read from localValues object
                      value={localValues[item.id] ?? ""}
                      onFocus={() => {
                        if (!selectedStore) setStorePromptOpen(true);
                      }}
                      onChange={(e) => {
                        if (!selectedStore) {
                          setStorePromptOpen(true);
                          return;
                        }
                        // ✅ Update only this item's local value, no parent call
                        setLocalValues((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }));
                      }}
                      onBlur={(e) => {
                        const prevAlloc = allocations[item.id];
                        let val = e.target.value === "" ? undefined : Number(e.target.value);
                        if (val !== undefined) {
                          if (isNaN(val) || val < 0) val = 0;
                          val = Math.floor(val);
                          if (val > maxAllocate) val = maxAllocate;
                        }
                        // ✅ Snap local display to clamped value
                        setLocalValues((prev) => ({
                          ...prev,
                          [item.id]: val != null ? String(val) : "",
                        }));
                        // Track only items the user actually changed
                        if (val !== prevAlloc) {
                          setDirtyItems((prev) => {
                            const next = new Set(prev);
                            next.add(String(item.id));
                            return next;
                          });
                        }
                        // ✅ Commit to parent only on blur
                        onChange({ ...allocations, [item.id]: val });
                      }}
                      className="w-20 text-right text-sm ml-auto"
                      disabled={!selectedStore || loadingItems || maxAllocate === 0}
                    />
                    {/* <Input
                      type="number"
                      min={0}
                      max={maxAllocate}
                      value={
                        // Use empty string for 0 to allow user input
                        allocations[item.id] === undefined || allocations[item.id] === null
                          ? ""
                          : allocations[item.id]
                      }
                      onChange={(e) => {
                        // Allow user to clear the input (empty string)
                        let valRaw = e.target.value;
                        let val = valRaw === "" ? "" : Number(valRaw);

                        if (val === "") {
                          onChange({
                            ...allocations,
                            [item.id]: undefined,
                          });
                        } else {
                          // Fix: allow max value; prevent below min, above max
                          if (Number.isNaN(val)) val = 0;
                          if (Number(val) > maxAllocate) val = maxAllocate;
                          if (Number(val) < 0) val = 0;
                          onChange({
                            ...allocations,
                            [item.id]: Number(val),
                          });
                        }
                      }}
                      className="w-20 text-right text-sm ml-auto"
                      disabled={item.pendingQuantity === 0}
                    /> */}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={storePromptOpen} onOpenChange={setStorePromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select a store first</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a store above before entering an allocation quantity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setStorePromptOpen(false)}>
              Select store
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onSkip} className="gap-1">
          <SkipForward className="h-4 w-4" />
          Skip this step
        </Button>
        <Button
          onClick={() => {
            if (!selectedStore) {
              toast.error("Please select a store first");
              return;
            }

            const changedItems: BomAllocationItem[] = Array.from(dirtyItems)
              .map((id) => {
                const allottedQty = allocations[id];
                if (typeof allottedQty !== "number") return null;
                const itemId: string | number = /^[0-9]+$/.test(id) ? Number(id) : id;
                return { itemId, allottedQty } satisfies BomAllocationItem;
              })
              .filter((x): x is BomAllocationItem => !!x && x.allottedQty > 0);

            onApply(selectedStore, changedItems);
          }}
          className="gap-2"
        >
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
  categories: ItemCategory[];
  selectedCategories: string[];
  onSelectedCategoriesChange: (categories: string[]) => void;
  step1Alloc: AllocationMap;
  allocations: AllocationMap;
  onChange: (alloc: AllocationMap) => void;
  onApply: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const {
    bom,
    projects,
    categories,
    selectedCategories,
    onSelectedCategoriesChange,
    step1Alloc,
    allocations,
    onChange,
    onApply,
    onBack,
    onSkip,
  } = props;

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
  const categoryFilteredItems = bom.items.filter((item) =>
    matchesSelectedCategories(item, selectedCategories)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900">
        <Clock className="h-5 w-5 text-purple-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
            About-to-complete projects
          </p>
          <p className="text-xs text-purple-600/80 dark:text-purple-400 mt-0.5">
            Plan to use materials expected to be returned from finishing projects
          </p>
        </div>
        <ItemCategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onChange={onSelectedCategoriesChange}
        />
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
                        {categoryFilteredItems.length === 0 ? (
                          <TableRow key="empty-filtered-items">
                            <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                              No items match the selected categories.
                            </TableCell>
                          </TableRow>
                        ) : categoryFilteredItems.map((item) => {
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
  categories: ItemCategory[];
  selectedCategories: string[];
  onSelectedCategoriesChange: (categories: string[]) => void;
  step1Alloc: AllocationMap;
  step2Alloc: AllocationMap;
  poItems: AllocationMap;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  onChangeQty: (alloc: AllocationMap) => void;
  onCreatePO: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const {
    bom,
    categories,
    selectedCategories,
    onSelectedCategoriesChange,
    step1Alloc,
    step2Alloc,
    poItems,
    dueDate,
    onDueDateChange,
    onChangeQty,
    onCreatePO,
    onContinue,
    onBack,
  } = props;

  const [showFullyAllocated, setShowFullyAllocated] = useState(false);

  const rows = bom.items.filter((item) =>
    matchesSelectedCategories(item, selectedCategories)
  ).map((item) => {
    const existing = item.allottedQty;
    const s1 = step1Alloc[item.id] ?? 0;
    const s2 = step2Alloc[item.id] ?? 0;
    const pending = Math.max(0, item.qty - existing - s1 - s2);
    return { item, pending };
  });

  const pendingRows = rows.filter((r) => r.pending > 0);
  const doneRows = rows.filter((r) => r.pending === 0);
  const displayRows = showFullyAllocated ? rows : pendingRows;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
        <ShoppingCart className="h-5 w-5 text-green-600 shrink-0" />
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            Create Purchase Request
          </p>
          <p className="text-xs text-green-600/80 dark:text-green-400 mt-0.5">
            {pendingRows.length > 0
              ? `${pendingRows.length} item(s) still need procurement`
              : "All items are allocated! You can finish without creating a PO."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label
            htmlFor="pr-due-date"
            className="text-xs font-medium text-green-900 dark:text-green-100 whitespace-nowrap"
          >
            Due date <span className="text-destructive">*</span>
          </label>
          <Input
            id="pr-due-date"
            type="date"
            required
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="h-8 w-[150px] text-sm bg-background"
          />
        </div>
        <ItemCategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onChange={onSelectedCategoriesChange}
        />
        {doneRows.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullyAllocated((v) => !v)}
            className="text-xs shrink-0"
          >
            {showFullyAllocated ? "Hide" : "Show"} allocated
          </Button>
        )}
      </div>

      {pendingRows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items match the selected categories.</p>
          ) : (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="font-medium">All items are fully allocated!</p>
              <p className="text-sm text-muted-foreground">
                No purchase request needed.
              </p>
            </>
          )}
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
                      max={pending}
                      placeholder="0"
                      value={poItems[item.id] === undefined ? "" : poItems[item.id]}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          const next = { ...poItems };
                          delete next[item.id];
                          onChangeQty(next);
                          return;
                        }
                        const n = parseFloat(val);
                        if (!Number.isNaN(n)) {
                          const clamped = Math.min(Math.max(0, n), pending);
                          onChangeQty({ ...poItems, [item.id]: clamped });
                        }
                      }}
                      className="w-20 text-right text-sm ml-auto"
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
          <Button variant="ghost" onClick={onContinue}>
            Skip Purchase Request
          </Button>
          {pendingRows.length > 0 && (
            <Button onClick={onCreatePO} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Create Purchase Request
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Outsourcing Request ───────────────────────────────────────────────

function Step4(props: {
  bom: BOM;
  categories: ItemCategory[];
  selectedCategories: string[];
  onSelectedCategoriesChange: (categories: string[]) => void;
  step1Alloc: AllocationMap;
  step2Alloc: AllocationMap;
  step3Alloc: AllocationMap;
  outsourceItems: AllocationMap;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  onChangeQty: (alloc: AllocationMap) => void;
  onCreateOutsource: () => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  const {
    bom,
    categories,
    selectedCategories,
    onSelectedCategoriesChange,
    step1Alloc,
    step2Alloc,
    step3Alloc,
    outsourceItems,
    dueDate,
    onDueDateChange,
    onChangeQty,
    onCreateOutsource,
    onFinish,
    onBack,
  } = props;

  const [showFullyAllocated, setShowFullyAllocated] = useState(false);

  const rows = bom.items.filter((item) =>
    matchesSelectedCategories(item, selectedCategories)
  ).map((item) => {
    const existing = item.allottedQty;
    const s1 = step1Alloc[item.id] ?? 0;
    const s2 = step2Alloc[item.id] ?? 0;
    const s3 = step3Alloc[item.id] ?? 0;
    const pending = Math.max(0, item.qty - existing - s1 - s2 - s3);
    return { item, pending };
  });

  const pendingRows = rows.filter((r) => r.pending > 0);
  const doneRows = rows.filter((r) => r.pending === 0);
  const displayRows = showFullyAllocated ? rows : pendingRows;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950/20 rounded-lg border border-slate-200 dark:border-slate-800">
        <Factory className="h-5 w-5 text-slate-700 shrink-0" />
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Create Outsource Request
          </p>
          <p className="text-xs text-slate-600/80 dark:text-slate-400 mt-0.5">
            {pendingRows.length > 0
              ? `${pendingRows.length} item(s) can be outsourced`
              : "All items are allocated! You can finish without creating an outsource request."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label
            htmlFor="os-due-date"
            className="text-xs font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap"
          >
            Due date <span className="text-destructive">*</span>
          </label>
          <Input
            id="os-due-date"
            type="date"
            required
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="h-8 w-[150px] text-sm bg-background"
          />
        </div>
        <ItemCategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onChange={onSelectedCategoriesChange}
        />
        {doneRows.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullyAllocated((v) => !v)}
            className="text-xs shrink-0"
          >
            {showFullyAllocated ? "Hide" : "Show"} allocated
          </Button>
        )}
      </div>

      {pendingRows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items match the selected categories.</p>
          ) : (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="font-medium">All items are fully allocated!</p>
              <p className="text-sm text-muted-foreground">No outsourcing needed.</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Item Name</TableHead>
                <TableHead className="text-xs">UOM</TableHead>
                <TableHead className="text-right text-xs">Pending Qty</TableHead>
                <TableHead className="text-right text-xs">Outsource Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map(({ item, pending }) => (
                <TableRow key={item.id} className={pending === 0 ? "opacity-50" : ""}>
                  <TableCell className="font-medium text-sm">{item.itemName}</TableCell>
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
                      max={pending}
                      placeholder="0"
                      value={
                        outsourceItems[item.id] === undefined
                          ? ""
                          : outsourceItems[item.id]
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          const next = { ...outsourceItems };
                          delete next[item.id];
                          onChangeQty(next);
                          return;
                        }
                        const n = parseFloat(val);
                        if (!Number.isNaN(n)) {
                          const clamped = Math.min(Math.max(0, n), pending);
                          onChangeQty({ ...outsourceItems, [item.id]: clamped });
                        }
                      }}
                      className="w-20 text-right text-sm ml-auto"
                      disabled={pending === 0}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onFinish}>
            Skip Outsource Request
          </Button>
          {pendingRows.length > 0 && (
            <Button onClick={onCreateOutsource} className="gap-2">
              <Factory className="h-4 w-4" />
              Create Outsource Request
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
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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
  const [purchaseRequestDueDate, setPurchaseRequestDueDate] = useState("");
  const [outsourceRequestDueDate, setOutsourceRequestDueDate] = useState("");
  const [outsourceQty, setOutsourceQty] = useState<AllocationMap>({});
  const bomListRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

    categoryService
      .getAllCategories()
      .then((data) => {
        const responseData: unknown = data;
        let categoryList: unknown[] = [];
        if (Array.isArray(responseData)) {
          categoryList = responseData;
        } else if (
          typeof responseData === "object" &&
          responseData !== null &&
          "data" in responseData &&
          Array.isArray(responseData.data)
        ) {
          categoryList = responseData.data;
        }
        setCategories(
          categoryList
            .map((value): ItemCategory | null => {
              if (typeof value !== "object" || value === null || Array.isArray(value)) {
                return null;
              }
              const category = value as Record<string, unknown>;
              const id =
                category.id ??
                category.Id ??
                category.categoryId ??
                category.CategoryId;
              const name =
                category.categoryName ??
                category.CategoryName ??
                category.name ??
                category.Name;
              if (id == null || name == null) return null;
              return { id: String(id), name: String(name).trim() };
            })
            .filter(
              (category): category is ItemCategory =>
                category !== null && category.id.length > 0 && category.name.length > 0,
            ),
        );
      })
      .catch(() => {
        toast.error("Failed to load item categories");
        setCategories([]);
      });
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
    setSelectedCategories([]);
    const defaultPO: AllocationMap = {};
    bom.items.forEach((item) => {
      defaultPO[item.id] = item.pendingQuantity;
    });
    setPoQty(defaultPO);
    setPurchaseRequestDueDate("");
    setOutsourceRequestDueDate("");
  };

  const closeWorkflow = () => {
    setSelectedBOM(null);
    setCurrentStep(1);
    setStep1Alloc({});
    setStep2Alloc({});
    setSelectedCategories([]);
    setPoQty({});
    setPurchaseRequestDueDate("");
    setOutsourceRequestDueDate("");
    setOutsourceQty({});
  };

  // ── Step handlers ──
  const applyStep1 = async (storeId: string | number, changedItems: BomAllocationItem[]) => {
    if (!selectedBOM) return;

    // Requirement: only send items whose qty user updated.
    // If nothing changed, skip the API call but continue workflow.
    if (!changedItems.length) {
      setCurrentStep(2);
      return;
    }

    const currentUser: any = authService.getCurrentUser();
    const allottedByUserId =
      currentUser?.id ??
      currentUser?.userId ??
      currentUser?.UserId ??
      currentUser?.email ??
      "unknown";

    try {
      await bomAllocationService.allocate({
        bomId: selectedBOM.id,
        storeId,
        allottedByUserId,
        items: changedItems,
      });
      toast.success("Store allocation saved");
      setCurrentStep(2);
    } catch (e: unknown) {
      console.error("Step 1 allocation failed", e);
      const response = typeof e === "object" && e !== null && "response" in e
        ? (e as {
          response?: {
            data?: {
              message?: string;
              unavailableItems?: {
                itemId: number;
                requestedQty: number;
                availableQty: number;
              }[];
            };
          };
        }).response?.data
        : undefined;
      const shortages = response?.unavailableItems;
      if (Array.isArray(shortages) && shortages.length > 0) {
        const description = shortages.map((shortage: {
          itemId: number;
          requestedQty: number;
          availableQty: number;
        }) => {
          const item = selectedBOM.items.find(
            (bomItem) => String(bomItem.id) === String(shortage.itemId)
          );
          return `${item?.itemName ?? `Item ${shortage.itemId}`}: requested ${shortage.requestedQty}, available ${shortage.availableQty}`;
        }).join("; ");
        toast.error(response?.message ?? "Insufficient store stock", { description });
      } else {
        toast.error(
          response?.message ?? (e instanceof Error ? e.message : undefined) ??
          "Failed to save store allocation"
        );
      }
    }
  };
  const skipStep1 = () => { setStep1Alloc({}); setCurrentStep(2); };

  const applyStep2 = () => {
    // Do not auto-assign PO quantities; user must enter explicit values.
    setPoQty({});
    setCurrentStep(3);
  };
  const skipStep2 = () => { setStep2Alloc({}); applyStep2(); };

  const handleCreatePO = async () => {
    if (!selectedBOM) return;

    // Step 3: submit only rows explicitly entered by user.
    const changedItems: BomAllocationItem[] = selectedBOM.items
      .map((item) => {
        const s1 = step1Alloc[item.id] ?? 0;
        const s2 = step2Alloc[item.id] ?? 0;
        const pending = Math.max(0, item.qty - item.allottedQty - s1 - s2);

        const raw = poQty[item.id];
        if (raw === undefined) return null;
        const allottedQty = Math.max(0, Number(raw) || 0); // guard against NaN → null in JSON
        if (allottedQty <= 0) return null;
        const capped = Math.min(allottedQty, pending);

        const idStr = String(item.id);
        const itemId: string | number = /^[0-9]+$/.test(idStr) ? Number(idStr) : idStr;
        return { itemId, allottedQty: capped } satisfies BomAllocationItem;
      })
      .filter((x): x is BomAllocationItem => !!x);

    if (!changedItems.length) {
      toast.error("No modified Purchase Request quantities to submit");
      return;
    }

    const trimmedDue = purchaseRequestDueDate.trim();
    if (!trimmedDue) {
      toast.error("Due date is required");
      return;
    }

    const currentUser: any = authService.getCurrentUser();
    const allottedByUserId =
      currentUser?.id ??
      currentUser?.userId ??
      currentUser?.UserId ??
      currentUser?.email ??
      "unknown";

    try {
      await bomAllocationService.createPurchaseOrder({
        bomId: selectedBOM.id,
        allottedByUserId,
        items: changedItems,
        dueDate: trimmedDue,
      });
      toast.success("Purchase Request created successfully!");
      setCurrentStep(4);
    } catch (e: any) {
      console.error("Create Purchase Request failed", e);
      toast.error(e?.message ?? "Failed to create purchase request");
    }
  };

  const handleContinueFromPO = () => setCurrentStep(4);

  const handleCreateOutsource = async () => {
    if (!selectedBOM) return;

    // Step 4: do NOT auto-assign pending into state (inputs start empty). Only submit rows the user explicitly filled.
    const changedItems: BomAllocationItem[] = selectedBOM.items
      .map((item) => {
        const s1 = step1Alloc[item.id] ?? 0;
        const s2 = step2Alloc[item.id] ?? 0;
        const s3 = poQty[item.id] ?? 0;
        const pending = Math.max(0, item.qty - item.allottedQty - s1 - s2 - s3);

        const raw = outsourceQty[item.id];
        if (raw === undefined) return null;
        const allottedQty = Math.max(0, Number(raw) || 0);
        if (allottedQty <= 0) return null;
        const capped = Math.min(allottedQty, pending);

        const idStr = String(item.id);
        const itemId: string | number = /^[0-9]+$/.test(idStr) ? Number(idStr) : idStr;
        return { itemId, allottedQty: capped } satisfies BomAllocationItem;
      })
      .filter((x): x is BomAllocationItem => !!x);

    if (!changedItems.length) {
      toast.error("Enter outsource quantity for at least one item.");
      return;
    }

    const trimmedOsDue = outsourceRequestDueDate.trim();
    if (!trimmedOsDue) {
      toast.error("Due date is required");
      return;
    }

    const currentUser: any = authService.getCurrentUser();
    const allottedByUserId =
      currentUser?.id ??
      currentUser?.userId ??
      currentUser?.UserId ??
      currentUser?.email ??
      "unknown";

    try {
      await bomAllocationService.createOutsourceRequest({
        bomId: selectedBOM.id,
        allottedByUserId,
        items: changedItems,
        dueDate: trimmedOsDue,
      });
      toast.success("Outsource request created successfully!");
      closeWorkflow();
    } catch (e: any) {
      console.error("Create outsource request failed", e);
      toast.error(e?.message ?? "Failed to create outsource request");
    }
  };

  const handleFinishWithoutOutsource = () => {
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

      <div className="flex flex-col gap-6">
        {/* BOM List */}
        <Card ref={bomListRef} className="order-last scroll-mt-6">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border bg-muted/40 px-5 py-4">
            <CardTitle className="text-base">BOM List</CardTitle>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search BOMs or projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 pl-9" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
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
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/bom-consolidate/${bom.id}`)}
                            title="View BOM Consolidate"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
          <div className="order-first scroll-mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    categories={categories}
                    selectedCategories={selectedCategories}
                    onSelectedCategoriesChange={setSelectedCategories}
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
                    categories={categories}
                    selectedCategories={selectedCategories}
                    onSelectedCategoriesChange={setSelectedCategories}
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
                    categories={categories}
                    selectedCategories={selectedCategories}
                    onSelectedCategoriesChange={setSelectedCategories}
                    step1Alloc={step1Alloc}
                    step2Alloc={step2Alloc}
                    poItems={poQty}
                    dueDate={purchaseRequestDueDate}
                    onDueDateChange={setPurchaseRequestDueDate}
                    onChangeQty={setPoQty}
                    onCreatePO={handleCreatePO}
                    onContinue={handleContinueFromPO}
                    onBack={() => setCurrentStep(2)}
                  />
                )}
                {currentStep === 4 && (
                  <Step4
                    bom={selectedBOM}
                    categories={categories}
                    selectedCategories={selectedCategories}
                    onSelectedCategoriesChange={setSelectedCategories}
                    step1Alloc={step1Alloc}
                    step2Alloc={step2Alloc}
                    step3Alloc={poQty}
                    outsourceItems={outsourceQty}
                    dueDate={outsourceRequestDueDate}
                    onDueDateChange={setOutsourceRequestDueDate}
                    onChangeQty={setOutsourceQty}
                    onCreateOutsource={handleCreateOutsource}
                    onFinish={handleFinishWithoutOutsource}
                    onBack={() => setCurrentStep(3)}
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
                step4Alloc={outsourceQty}
              />
            </div>
          </div>
        )}
      </div>

      {selectedBOM && (
        <Button
          type="button"
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full shadow-lg"
          onClick={() => bomListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          title="Go to BOM grid"
          aria-label="Go to BOM grid"
        >
          <ArrowDownToLine className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}