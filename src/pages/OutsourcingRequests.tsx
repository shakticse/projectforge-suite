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
} from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { purchaseRequestSimpleFormSchema } from "@/lib/validations";
import { outsourcingRequestService } from "@/services/outsourcingRequestService";
import { itemService } from "@/services/itemService";
import { useToast } from "@/hooks/use-toast";

/** Normalized row for the list table */
export interface OutsourcingRequestRow {
  id: string;
  osNo: string;
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
  itemId: string;
  itemName: string;
  unit?: string;
  quantity: number;
}

/** Line item shown in View dialog (matches API line + status) */
export interface ViewLineItem {
  name: string;
  uom: string;
  qty: number;
  status: string;
}

function mapDetailItemsToViewLines(items: any): ViewLineItem[] {
  const arr = Array.isArray(items) ? items : [];
  return arr.map((it: any, i: number) => ({
    name: it.name ?? `Item ${i + 1}`,
    uom: it.uom ?? "",
    qty: Number(it.qty ?? 0) || 0,
    status: String(it.status ?? "Pending"),
  }));
}

function mapListResponse(data: any): OutsourcingRequestRow[] {
  const raw = Array.isArray(data) ? data : data?.data ?? [];
  return (raw as any[]).map((r) => ({
    id: String(r.id),
    osNo: String(r.osNo ?? r.osNumber ?? r.OSNumber ?? r.id ?? ""),
    name: r.name ?? "",
    createdBy: r.createdByUser ?? r.createdBy ?? "",
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

const itemsPerPage = 100;

export default function OutsourcingRequests() {
  const { toast } = useToast();
  const [rows, setRows] = useState<OutsourcingRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof OutsourcingRequestRow>("createdDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lineItems, setLineItems] = useState<LineRow[]>([]);
  const [itemQuery, setItemQuery] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState<OutsourcingRequestRow | null>(null);
  const [viewLineItems, setViewLineItems] = useState<ViewLineItem[]>([]);
  const [viewDetailLoading, setViewDetailLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<OutsourcingRequestRow | null>(null);
  const [editLineItems, setEditLineItems] = useState<LineRow[]>([]);
  const [editItemQuery, setEditItemQuery] = useState("");
  const [editCatalogOpen, setEditCatalogOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<OutsourcingRequestRow | null>(null);
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
      const res = await outsourcingRequestService.getAll();
      setRows(mapListResponse(res));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || err?.message || "Failed to load outsourcing requests",
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
      setEditLineItems((prev) => prev.filter((l) => l.key !== key));
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

  const handleSort = (column: keyof OutsourcingRequestRow) => {
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
        r.osNo.toLowerCase().includes(q) ||
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
        description: "Add at least one item to the outsourcing request.",
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
      await outsourcingRequestService.create({
        name: data.requestName,
        description: data.description || undefined,
        items: validLines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
        })),
      });
      toast({ title: "Success", description: "Outsourcing request created successfully." });
      form.reset();
      setLineItems([]);
      setShowCreatePanel(false);
      fetchList();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || err?.message || "Failed to create outsourcing request",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  });

  const openView = async (row: OutsourcingRequestRow) => {
    setViewRow(row);
    setViewOpen(true);
    setViewDetailLoading(true);
    setViewLineItems([]);
    try {
      const detail: any = await outsourcingRequestService.getById(row.id);
      const raw = detail?.data ?? detail;
      setViewLineItems(mapDetailItemsToViewLines(raw));
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || err?.message || "Failed to load outsourcing request details",
        variant: "destructive",
      });
      setViewLineItems([]);
    } finally {
      setViewDetailLoading(false);
    }
  };

  const openEdit = async (row: OutsourcingRequestRow) => {
    setEditing(row);
    setEditOpen(true);
    setSavingEdit(false);
    editForm.reset({ requestName: row.name, description: "" });
    setEditLineItems([]);
    setEditItemQuery("");
    try {
      const detail: any = await outsourcingRequestService.getById(row.id);
      const raw = detail?.data ?? detail;
      editForm.reset({
        requestName: raw?.name ?? raw?.requestName ?? row.name,
        description: raw?.description ?? raw?.Description ?? "",
      });
      const items = raw?.items ?? raw?.Items ?? raw?.lines ?? [];
      const arr = Array.isArray(items) ? items : [];
      setEditLineItems(
        arr.map((it: any, i: number) => ({
          key: String(it.itemId ?? it.id ?? i),
          itemId: String(it.itemId ?? it.id ?? i),
          itemName:
            it.itemName ?? it.name ?? it.ItemName ?? `Item ${it.itemId ?? i}`,
          unit: it.unit ?? it.uom,
          quantity: Number(it.quantity ?? it.qty ?? 0) || 0,
        }))
      );
    } catch {
      editForm.reset({ requestName: row.name, description: "" });
      toast({
        title: "Warning",
        description: "Could not load full details; edit name and add items.",
        variant: "destructive",
      });
    }
  };

  const onEditSubmit = editForm.handleSubmit(async (data) => {
    if (!editing) return;
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
    setSavingEdit(true);
    try {
      await outsourcingRequestService.update(editing.id, {
        name: data.requestName,
        description: data.description || undefined,
        items: validLines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
      });
      toast({ title: "Success", description: "Outsourcing request updated." });
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
      await outsourcingRequestService.delete(deleting.id);
      toast({ title: "Deleted", description: "Outsourcing request removed." });
      setDeleteOpen(false);
      setDeleting(null);
      fetchList();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || err?.message || "Failed to delete",
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
          <h1 className="text-3xl font-bold tracking-tight">Outsourcing Request</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage outsourcing requests and line items
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
          Create Outsourcing Request
        </Button>
      </div>

      {/* Inline create form (panel in a Card / div) */}
      {showCreatePanel && (
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">New Outsourcing Request</CardTitle>
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
              placeholder="Search by OS no, name, creator, status..."
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
            <div className="p-12 text-center text-sm text-muted-foreground">Loading outsourcing requests...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50">
                    <TableHead className="h-12">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort("osNo")}
                      >
                        OS No
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
                      <TableCell className="font-medium">{row.osNo}</TableCell>
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
            <h3 className="mb-2 text-lg font-medium">No outsourcing requests</h3>
            <p className="mb-6 text-center text-muted-foreground">
              {searchTerm ? "Try a different search" : "Create your first outsourcing request using the button above"}
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
            <DialogTitle>Outsourcing Request Details</DialogTitle>
          </DialogHeader>
          {viewRow && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-1 rounded-lg border bg-muted/30 p-3">
                <p>
                  <span className="text-muted-foreground">OS No:</span> {viewRow.osNo}
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

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!savingEdit) setEditOpen(open); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Outsourcing Request</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={onEditSubmit} className="space-y-4">
              <FormField
                control={editForm.control}
                name="requestName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Textarea rows={3} {...field} />
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
                <Button type="submit" disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save changes"}
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
            <DialogTitle>Delete outsourcing request?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong>{deleting?.name}</strong> ({deleting?.osNo}).
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
