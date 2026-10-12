import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  Package,
  X,
  ShoppingCart,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { purchaseRequestSimpleFormSchema } from "@/lib/validations";
import { purchaseRequestService } from "@/services/purchaseRequestService";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { itemService } from "@/services/itemService";
import { useToast } from "@/hooks/use-toast";

/** Normalized row for the list table */
export interface PurchaseRequestRow {
  id: string;
  prNo: string;
  name: string;
  createdBy: string;
  createdDate: string;
  status: string;
}

/** Catalog item from inventory API */
interface CatalogItem {
  id: string;
  name: string;
  unit?: string;
}

/** Line in create/edit form */
interface LineRow {
  key: string;
  requestItemId?: number;
  itemId: string;
  itemName: string;
  unit?: string;
  quantity: number;
}

interface PurchaseOrderLine {
  key: string;
  requestItemId: number;
  itemId: number;
  itemName: string;
  unit?: string;
  price: number;
  requestedQty: number;
  allocatedQty: number;
}

/** Line item shown in View dialog (matches API line + status) */
export interface ViewLineItem {
  name: string;
  uom: string;
  qty: number;
  status: string;
}

type ApiDetailItem = Record<string, unknown>;

function isRecord(value: unknown): value is ApiDetailItem {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getDetailItems(raw: unknown): ApiDetailItem[] {
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (!isRecord(raw)) return [];
  const items = raw.items ?? raw.Items ?? raw.lines;
  return Array.isArray(items) ? items.filter(isRecord) : [];
}

function getDetailValue(item: ApiDetailItem, ...keys: string[]): unknown {
  return keys.map((key) => item[key]).find((value) => value != null);
}

function mapDetailItemsToViewLines(raw: unknown): ViewLineItem[] {
  const arr = getDetailItems(raw);
  return arr.map((item, i) => ({
    name: String(getDetailValue(item, "name", "itemName", "Name", "ItemName") ?? `Item ${i + 1}`),
    uom: String(getDetailValue(item, "uom", "Uom", "UOM", "unit") ?? ""),
    qty: Number(getDetailValue(item, "qty", "Qty", "quantity") ?? 0) || 0,
    status: String(getDetailValue(item, "status", "Status") ?? "Pending"),
  }));
}

function mapListResponse(data: any): PurchaseRequestRow[] {
  const raw = Array.isArray(data) ? data : data?.data ?? [];
  return (raw as any[]).map((r, idx) => ({
    id: String(r.id),
    prNo: String(r.id ?? ""),
    name: r.name ?? "",
    createdBy: r.createdByUser ?? "",
    createdDate: r.createdDate ?? "",
    status: r.status ?? "Pending",
  }));
}

function mapCatalogItem(raw: any): CatalogItem | null {
  const id = raw?.id ?? raw?.itemId ?? raw?.ItemId;
  if (id == null) return null;
  const name =
    raw.name ?? raw.itemName ?? raw.Name ?? raw.ItemName ?? String(id);
  return {
    id: String(id),
    name,
    unit: raw.unit ?? raw.uom ?? raw.Unit ?? raw.UOM,
  };
}

const itemsPerPage = 10;

export default function PurchaseRequests() {
  const { toast } = useToast();
  const [rows, setRows] = useState<PurchaseRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof PurchaseRequestRow>("createdDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lineItems, setLineItems] = useState<LineRow[]>([]);
  const [itemQuery, setItemQuery] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState<PurchaseRequestRow | null>(null);
  const [viewLineItems, setViewLineItems] = useState<ViewLineItem[]>([]);
  const [viewDetailLoading, setViewDetailLoading] = useState(false);

  const [purchaseOrderOpen, setPurchaseOrderOpen] = useState(false);
  const [purchaseOrderRequest, setPurchaseOrderRequest] = useState<PurchaseRequestRow | null>(null);
  const [purchaseOrderLines, setPurchaseOrderLines] = useState<PurchaseOrderLine[]>([]);
  const [purchaseOrderLoading, setPurchaseOrderLoading] = useState(false);
  const [purchaseOrderSaving, setPurchaseOrderSaving] = useState(false);
  const [purchaseOrderLoadError, setPurchaseOrderLoadError] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseRequestRow | null>(null);
  const [editLineItems, setEditLineItems] = useState<LineRow[]>([]);
  const [deletedEditLineIds, setDeletedEditLineIds] = useState<number[]>([]);
  const [editItemQuery, setEditItemQuery] = useState("");
  const [editCatalogOpen, setEditCatalogOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editDetailLoading, setEditDetailLoading] = useState(false);
  const [editDetailError, setEditDetailError] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<PurchaseRequestRow | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);

  const createSearchRef = useRef<HTMLDivElement>(null);
  const editSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (createSearchRef.current && !createSearchRef.current.contains(t)) setCatalogOpen(false);
      if (editSearchRef.current && !editSearchRef.current.contains(t)) setEditCatalogOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const form = useForm({
    resolver: yupResolver(purchaseRequestSimpleFormSchema),
    defaultValues: { requestName: "", description: "" },
  });

  const editForm = useForm({
    resolver: yupResolver(purchaseRequestSimpleFormSchema),
    defaultValues: { requestName: "", description: "" },
  });

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseRequestService.getAll();
      setRows(mapListResponse(res));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || err?.message || "Failed to load purchase requests",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const res = await itemService.getAllItems();
      const list = Array.isArray(res) ? res : res?.data ?? [];
      const mapped = (list as any[])
        .map(mapCatalogItem)
        .filter(Boolean) as CatalogItem[];
      setCatalog(mapped);
    } catch {
      toast({
        title: "Warning",
        description: "Could not load items for search. You can still manage other fields.",
        variant: "destructive",
      });
      setCatalog([]);
    } finally {
      setLoadingCatalog(false);
    }
  }, [toast]);

  useEffect(() => {
    if (showCreatePanel || editOpen) {
      loadCatalog();
    }
  }, [showCreatePanel, editOpen, loadCatalog]);

  const filteredCatalog = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    if (!q) return catalog.slice(0, 50);
    return catalog
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 50);
  }, [catalog, itemQuery]);

  const filteredEditCatalog = useMemo(() => {
    const q = editItemQuery.trim().toLowerCase();
    if (!q) return catalog.slice(0, 50);
    return catalog
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 50);
  }, [catalog, editItemQuery]);

  const addLineItem = (item: CatalogItem, target: "create" | "edit") => {
    const add = (prev: LineRow[]) => {
      if (prev.some((l) => l.itemId === item.id)) return prev;
      return [
        ...prev,
        {
          key: `${item.id}-${Date.now()}`,
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          quantity: 0,
        },
      ];
    };
    if (target === "create") {
      setLineItems(add);
      setItemQuery("");
      setCatalogOpen(false);
    } else {
      setEditLineItems(add);
      setEditItemQuery("");
      setEditCatalogOpen(false);
    }
  };

  const removeLine = (key: string, target: "create" | "edit") => {
    if (target === "create") {
      setLineItems((prev) => prev.filter((l) => l.key !== key));
    } else {
      const removed = editLineItems.find((line) => line.key === key);
      setEditLineItems((prev) => prev.filter((line) => line.key !== key));
      if (removed?.requestItemId != null) {
        setDeletedEditLineIds((deleted) =>
          deleted.includes(removed.requestItemId!) ? deleted : [...deleted, removed.requestItemId!]
        );
      }
    }
  };

  const updateQty = (key: string, qty: number, target: "create" | "edit") => {
    const clamp = Math.max(0, Number.isFinite(qty) ? qty : 0);
    if (target === "create") {
      setLineItems((prev) =>
        prev.map((l) => (l.key === key ? { ...l, quantity: clamp } : l))
      );
    } else {
      setEditLineItems((prev) =>
        prev.map((l) => (l.key === key ? { ...l, quantity: clamp } : l))
      );
    }
  };

  const handleSort = (column: keyof PurchaseRequestRow) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return rows.filter(
      (r) =>
        r.prNo.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.createdBy.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    );
  }, [rows, searchTerm]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      let av: any = a[sortColumn];
      let bv: any = b[sortColumn];
      if (sortColumn === "createdDate") {
        av = new Date(av).getTime() || 0;
        bv = new Date(bv).getTime() || 0;
      } else {
        av = String(av ?? "").toLowerCase();
        bv = String(bv ?? "").toLowerCase();
      }
      if (av < bv) return sortDirection === "asc" ? -1 : 1;
      if (av > bv) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredRows, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedRows.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = sortedRows.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const onCreateSubmit = form.handleSubmit(async (data) => {
    const validLines = lineItems.filter((l) => l.quantity > 0);
    if (lineItems.length === 0) {
      toast({
        title: "Validation",
        description: "Add at least one item to the purchase request.",
        variant: "destructive",
      });
      return;
    }
    if (validLines.length === 0) {
      toast({
        title: "Validation",
        description: "Set quantity greater than 0 for at least one item.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await purchaseRequestService.create({
        name: data.requestName,
        description: data.description || undefined,
        items: validLines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
        })),
      });
      toast({ title: "Success", description: "Purchase request created successfully." });
      form.reset();
      setLineItems([]);
      setShowCreatePanel(false);
      fetchList();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || err?.message || "Failed to create purchase request",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  });

  const openView = async (row: PurchaseRequestRow) => {
    setViewRow(row);
    setViewOpen(true);
    setViewDetailLoading(true);
    setViewLineItems([]);
    try {
      const detail: any = await purchaseRequestService.getById(row.id);
      const raw = detail?.data ?? detail;
      setViewLineItems(mapDetailItemsToViewLines(raw));
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || err?.message || "Failed to load purchase request details",
        variant: "destructive",
      });
      setViewLineItems([]);
    } finally {
      setViewDetailLoading(false);
    }
  };

  const openPurchaseOrder = async (row: PurchaseRequestRow) => {
    setPurchaseOrderRequest(row);
    setPurchaseOrderOpen(true);
    setPurchaseOrderLoading(true);
    setPurchaseOrderLoadError(false);
    setPurchaseOrderLines([]);
    try {
      const detail: any = await purchaseRequestService.getById(row.id);
      const items = getDetailItems(detail?.data ?? detail);
      const lines = items.map((item, index) => {
        const requestItemId = Number(getDetailValue(item, "requestItemId", "RequestItemId"));
        const itemId = Number(getDetailValue(item, "itemId", "ItemId"));
        const requestedQty = Number(getDetailValue(item, "qty", "Qty", "quantity"));
        const rawPrice = Number(getDetailValue(item, "price", "Price") ?? 0);
        const unit = getDetailValue(item, "uom", "Uom", "UOM", "unit");
        return {
          key: String(requestItemId),
          requestItemId,
          itemId,
          itemName: String(getDetailValue(item, "name", "itemName", "Name", "ItemName") ?? `Item ${index + 1}`),
          unit: typeof unit === "string" ? unit : undefined,
          price: Number.isFinite(rawPrice) ? rawPrice : 0,
          requestedQty,
          allocatedQty: requestedQty,
        };
      });
      if (
        lines.some(
          (line) =>
            !Number.isSafeInteger(line.requestItemId) ||
            line.requestItemId <= 0 ||
            !Number.isSafeInteger(line.itemId) ||
            line.itemId <= 0 ||
            !Number.isSafeInteger(line.requestedQty) ||
            line.requestedQty < 0
        )
      ) {
        throw new Error("Purchase request details are missing valid line IDs or quantities.");
      }
      setPurchaseOrderLines(lines);
    } catch (err: any) {
      setPurchaseOrderLoadError(true);
      toast({
        title: "Error",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load purchase request items for order creation.",
        variant: "destructive",
      });
    } finally {
      setPurchaseOrderLoading(false);
    }
  };

  const updatePurchaseOrderQty = (key: string, value: string) => {
    setPurchaseOrderLines((lines) =>
      lines.map((line) => {
        if (line.key !== key) return line;
        const quantity = Number.parseInt(value, 10);
        return {
          ...line,
          allocatedQty: Math.min(
            line.requestedQty,
            Math.max(0, Number.isFinite(quantity) ? quantity : 0)
          ),
        };
      })
    );
  };

  const purchaseOrderGrossTotal = purchaseOrderLines.reduce(
    (total, line) => total + line.price * line.allocatedQty,
    0
  );

  const submitPurchaseOrder = async () => {
    if (!purchaseOrderRequest || purchaseOrderLoading || purchaseOrderLoadError) return;
    const items = purchaseOrderLines
      .filter((line) => line.allocatedQty >= 1)
      .map((line) => ({
        requestItemId: line.requestItemId,
        itemId: line.itemId,
        allottedQty: line.allocatedQty,
      }));

    if (items.length === 0) {
      toast({
        title: "Validation",
        description: "Allocate at least 1 unit to one item to create a purchase order.",
        variant: "destructive",
      });
      return;
    }

    setPurchaseOrderSaving(true);
    try {
      await purchaseOrderService.create({
        purchaseRequestId: Number(purchaseOrderRequest.id),
        name: `PO-${purchaseOrderRequest.prNo}`,
        items,
      });
      toast({ title: "Success", description: "Purchase order created successfully." });
      setPurchaseOrderOpen(false);
      setPurchaseOrderRequest(null);
      setPurchaseOrderLines([]);
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || err?.message || "Failed to create purchase order.",
        variant: "destructive",
      });
    } finally {
      setPurchaseOrderSaving(false);
    }
  };

  const openEdit = async (row: PurchaseRequestRow) => {
    setEditing(row);
    setEditOpen(true);
    setSavingEdit(false);
    setEditDetailLoading(true);
    setEditDetailError(false);
    editForm.reset({ requestName: row.name, description: "" });
    setEditLineItems([]);
    setDeletedEditLineIds([]);
    setEditItemQuery("");
    try {
      const detail: any = await purchaseRequestService.getById(row.id);
      const raw = detail?.data ?? detail;
      editForm.reset({
        requestName: raw?.name ?? raw?.requestName ?? row.name,
        description: raw?.description ?? raw?.Description ?? "",
      });
      const arr = getDetailItems(raw);
      setEditLineItems(
        arr.map((item, i) => {
          const requestItemId = getDetailValue(item, "requestItemId", "RequestItemId");
          const itemId = getDetailValue(item, "itemId", "ItemId", "id", "Id");
          const unit = getDetailValue(item, "unit", "uom", "Uom", "UOM");
          return {
            key: String(requestItemId ?? `existing-${itemId ?? i}`),
            requestItemId:
              requestItemId == null ? undefined : Number(requestItemId),
            itemId: String(itemId ?? ""),
            itemName: String(
              getDetailValue(item, "itemName", "name", "ItemName", "Name") ?? `Item ${i + 1}`
            ),
            unit: typeof unit === "string" ? unit : undefined,
            quantity: Number(getDetailValue(item, "quantity", "qty", "Qty") ?? 0) || 0,
          };
        })
      );
      if (
        arr.some((item) => {
          const itemId = getDetailValue(item, "itemId", "ItemId", "id", "Id");
          const requestItemId = getDetailValue(item, "requestItemId", "RequestItemId");
          return (
            itemId == null ||
            String(itemId).trim() === "" ||
            requestItemId == null ||
            !Number.isSafeInteger(Number(requestItemId)) ||
            Number(requestItemId) <= 0
          );
        })
      ) {
        throw new Error("The purchase request details did not include line item identifiers.");
      }
    } catch (err: unknown) {
      editForm.reset({ requestName: row.name, description: "" });
      setEditLineItems([]);
      setEditDetailError(true);
      toast({
        title: "Error",
        description:
          (isRecord(err) &&
          isRecord(err.response) &&
          isRecord(err.response.data) &&
          typeof err.response.data.message === "string"
            ? err.response.data.message
            : err instanceof Error
              ? err.message
              : undefined) ||
          "Could not load purchase request items. Please close and try again.",
        variant: "destructive",
      });
    } finally {
      setEditDetailLoading(false);
    }
  };

  const onEditSubmit = editForm.handleSubmit(async (data) => {
    if (!editing) return;
    if (editDetailLoading || editDetailError) {
      toast({
        title: "Error",
        description: "Purchase request items could not be loaded. Close and reopen the editor before saving.",
        variant: "destructive",
      });
      return;
    }
    const validLines = editLineItems.filter((l) => l.quantity > 0);
    if (editLineItems.length === 0) {
      toast({
        title: "Validation",
        description: "Add at least one item.",
        variant: "destructive",
      });
      return;
    }
    if (validLines.length === 0) {
      toast({
        title: "Validation",
        description: "Set quantity greater than 0 for at least one item.",
        variant: "destructive",
      });
      return;
    }
    if (validLines.some((line) => !Number.isSafeInteger(Number(line.itemId)) || Number(line.itemId) <= 0)) {
      toast({
        title: "Validation",
        description: "One or more items have an invalid identifier. Reload the request and try again.",
        variant: "destructive",
      });
      return;
    }
    setSavingEdit(true);
    try {
      await purchaseRequestService.update(editing.id, {
        name: data.requestName,
        description: data.description || undefined,
        items: validLines.map((line) => ({
          requestItemId: line.requestItemId,
          itemId: Number(line.itemId),
          quantity: line.quantity,
        })),
        deletedRequestItemIds: deletedEditLineIds,
      });
      toast({ title: "Success", description: "Purchase request updated." });
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || err?.message || "Failed to update",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  });

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingInProgress(true);
    try {
      await purchaseRequestService.delete(deleting.id);
      toast({ title: "Deleted", description: "Purchase request removed." });
      setDeleteOpen(false);
      setDeleting(null);
      fetchList();
    } catch (err: any) {
      const responseData = err?.response?.data;
      const responseMessage =
        typeof responseData === "string"
          ? responseData.trim()
          : typeof responseData?.message === "string"
            ? responseData.message.trim()
            : "";
      const containsExceptionDetails =
        /exception|stack trace|innerexception|(?:^|\n)\s*at\s+[\w.$+<>]+\(/i.test(responseMessage);
      toast({
        title: "Error",
        description:
          responseMessage && !containsExceptionDetails
            ? responseMessage
            : "Failed to delete purchase request.",
        variant: "destructive",
      });
    } finally {
      setDeletingInProgress(false);
    }
  };

  const getStatusVariant = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("complete") || s.includes("approved")) return "default";
    if (s.includes("reject")) return "destructive";
    if (s.includes("progress")) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Request</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage purchase requests and line items
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2 shrink-0"
          onClick={() => {
            setShowCreatePanel((v) => !v);
            if (!showCreatePanel) {
              form.reset();
              setLineItems([]);
              setItemQuery("");
            }
          }}
        >
          <Plus className="h-4 w-4" />
          Create Purchase Request
        </Button>
      </div>

      {/* Inline create form (panel in a Card / div) */}
      {showCreatePanel && (
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">New Purchase Request</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCreatePanel(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={onCreateSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="requestName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Q1 Materials" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Optional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Add items</FormLabel>
                  <div ref={createSearchRef} className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search items by name..."
                      value={itemQuery}
                      onChange={(e) => {
                        setItemQuery(e.target.value);
                        setCatalogOpen(true);
                      }}
                      onFocus={() => setCatalogOpen(true)}
                      autoComplete="off"
                    />
                    {catalogOpen && (itemQuery || filteredCatalog.length > 0) && (
                      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                        {loadingCatalog ? (
                          <div className="p-3 text-sm text-muted-foreground">Loading items...</div>
                        ) : filteredCatalog.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">No matching items</div>
                        ) : (
                          filteredCatalog.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
                              onClick={() => addLineItem(item, "create")}
                            >
                              <span className="font-medium">{item.name}</span>
                              {item.unit && (
                                <span className="text-xs text-muted-foreground">UOM: {item.unit}</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select an item to add it to the table. Quantity starts at 0; set amounts before submit.
                  </p>
                </div>

                {lineItems.length > 0 && (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="w-24">UOM</TableHead>
                          <TableHead className="w-32 text-right">Quantity</TableHead>
                          <TableHead className="w-16 text-center"> </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((line) => (
                          <TableRow key={line.key}>
                            <TableCell className="font-medium">{line.itemName}</TableCell>
                            <TableCell className="text-muted-foreground">{line.unit ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min={0}
                                className="ml-auto w-24 text-right"
                                value={line.quantity}
                                onChange={(e) =>
                                  updateQty(line.key, parseFloat(e.target.value) || 0, "create")
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => removeLine(line.key, "create")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreatePanel(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Submit"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by PR no, name, creator, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Loading purchase requests...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50">
                    <TableHead className="h-12">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort("prNo")}
                      >
                        PR No
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="h-12">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort("name")}
                      >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="h-12">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort("createdBy")}
                      >
                        Created By
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="h-12">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort("createdDate")}
                      >
                        Created Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="h-12">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort("status")}
                      >
                        Status
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="h-12 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id} className="border-b border-border/50 hover:bg-muted/50">
                      <TableCell className="font-medium">{row.prNo}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.createdBy}</TableCell>
                      <TableCell>
                        {row.createdDate
                          ? new Date(row.createdDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openView(row)}
                            aria-label="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(row)}
                            aria-label="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openPurchaseOrder(row)}
                            aria-label="Generate purchase order"
                            title="Generate purchase order"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setDeleting(row);
                              setDeleteOpen(true);
                            }}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedRows.length)} of{" "}
                {sortedRows.length}
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={
                        currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && sortedRows.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No purchase requests</h3>
            <p className="mb-6 text-center text-muted-foreground">
              {searchTerm ? "Try a different search" : "Create your first purchase request using the button above"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* View */}
      <Dialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) {
            setViewRow(null);
            setViewLineItems([]);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Request Details</DialogTitle>
          </DialogHeader>
          {viewRow && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-1 rounded-lg border bg-muted/30 p-3">
                <p>
                  <span className="text-muted-foreground">PR No:</span> {viewRow.prNo}
                </p>
                <p>
                  <span className="text-muted-foreground">Name:</span> {viewRow.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Created By:</span> {viewRow.createdBy}
                </p>
                <p>
                  <span className="text-muted-foreground">Created:</span>{" "}
                  {viewRow.createdDate ? new Date(viewRow.createdDate).toLocaleString() : "—"}
                </p>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={getStatusVariant(viewRow.status)}>{viewRow.status}</Badge>
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-foreground">Items</h4>
                {viewDetailLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <span className="animate-spin border-2 border-primary border-t-transparent rounded-full h-8 w-8" />
                    <span className="ml-3">Loading items…</span>
                  </div>
                ) : viewLineItems.length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground">No line items for this request.</p>
                ) : (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item name</TableHead>
                          <TableHead className="text-right w-28">Qty</TableHead>
                          <TableHead className="text-right w-28">Uom</TableHead>
                          <TableHead className="w-36">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewLineItems.map((line, idx) => (
                          <TableRow key={`${line.name}-${idx}`}>
                            <TableCell className="font-medium">{line.name}</TableCell>
                            <TableCell className="text-right tabular-nums">{line.qty}</TableCell>
                            <TableCell className="text-right tabular-nums">{line.uom}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(line.status)}>{line.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate purchase order */}
      <Dialog
        open={purchaseOrderOpen}
        onOpenChange={(open) => {
          if (!purchaseOrderSaving) {
            setPurchaseOrderOpen(open);
            if (!open) {
              setPurchaseOrderRequest(null);
              setPurchaseOrderLines([]);
              setPurchaseOrderLoadError(false);
            }
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Purchase Order</DialogTitle>
          </DialogHeader>
          {purchaseOrderRequest && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p><span className="text-muted-foreground">Purchase Request:</span> {purchaseOrderRequest.prNo}</p>
                <p><span className="text-muted-foreground">Name:</span> {purchaseOrderRequest.name}</p>
              </div>
              {purchaseOrderLoading ? (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                  <span className="animate-spin border-2 border-primary border-t-transparent rounded-full h-6 w-6" />
                  <span className="ml-3">Loading requested items…</span>
                </div>
              ) : purchaseOrderLoadError ? (
                <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  Request items could not be loaded. Close this dialog and try again.
                </p>
              ) : purchaseOrderLines.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No items are available for this purchase request.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>UOM</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Requested Qty</TableHead>
                        <TableHead className="w-40 text-right">Allocate Qty</TableHead>
                        <TableHead className="text-right">Total Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrderLines.map((line) => (
                        <TableRow key={line.key}>
                          <TableCell className="font-medium">{line.itemName}</TableCell>
                          <TableCell>{line.unit ?? "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{line.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right tabular-nums">{line.requestedQty}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={0}
                              max={line.requestedQty}
                              step={1}
                              className="ml-auto w-28 text-right"
                              value={line.allocatedQty}
                              disabled={purchaseOrderSaving}
                              onChange={(event) => updatePurchaseOrderQty(line.key, event.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {(line.price * line.allocatedQty).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end gap-8 border-t bg-muted/30 px-4 py-3 text-sm font-semibold">
                    <span>Gross Total</span>
                    <span className="min-w-24 text-right tabular-nums">
                      {purchaseOrderGrossTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPurchaseOrderOpen(false)}
                  disabled={purchaseOrderSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={submitPurchaseOrder}
                  disabled={purchaseOrderSaving || purchaseOrderLoading || purchaseOrderLoadError}
                >
                  {purchaseOrderSaving ? "Creating..." : "Create Purchase Order"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!savingEdit) setEditOpen(open); }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Purchase Request</DialogTitle>
          </DialogHeader>
          {editDetailLoading && (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <span className="animate-spin border-2 border-primary border-t-transparent rounded-full h-5 w-5" />
              <span className="ml-3">Loading request items…</span>
            </div>
          )}
          {editDetailError && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              Request items could not be loaded. Close this dialog and try again; changes cannot be saved.
            </p>
          )}
          <Form {...editForm}>
            <form onSubmit={onEditSubmit} className="space-y-4" aria-busy={editDetailLoading}>
              <FormField
                control={editForm.control}
                name="requestName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Name *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={editDetailLoading || editDetailError || savingEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} disabled={editDetailLoading || editDetailError || savingEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Add items</FormLabel>
                <div ref={editSearchRef} className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search items..."
                    value={editItemQuery}
                    disabled={editDetailLoading || editDetailError || savingEdit}
                    onChange={(e) => {
                      setEditItemQuery(e.target.value);
                      setEditCatalogOpen(true);
                    }}
                    onFocus={() => setEditCatalogOpen(true)}
                  />
                  {editCatalogOpen && (editItemQuery || filteredEditCatalog.length > 0) && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
                      {filteredEditCatalog.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => addLineItem(item, "edit")}
                        >
                          <span className="font-medium">{item.name}</span>
                          {item.unit && (
                            <span className="text-xs text-muted-foreground">UOM: {item.unit}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {editLineItems.length > 0 && (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>UOM</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editLineItems.map((line) => (
                        <TableRow key={line.key}>
                          <TableCell>{line.itemName}</TableCell>
                          <TableCell>{line.unit ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={0}
                              className="ml-auto w-24"
                              value={line.quantity}
                              disabled={editDetailLoading || editDetailError || savingEdit}
                              onChange={(e) =>
                                updateQty(line.key, parseFloat(e.target.value) || 0, "edit")
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={editDetailLoading || editDetailError || savingEdit}
                              onClick={() => removeLine(line.key, "edit")}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingEdit || editDetailLoading || editDetailError}>
                  {savingEdit ? "Saving..." : editDetailLoading ? "Loading..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete purchase request?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong>{deleting?.name}</strong> ({deleting?.prNo}).
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deletingInProgress}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deletingInProgress}>
              {deletingInProgress ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
