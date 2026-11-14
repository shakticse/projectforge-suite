import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Filter, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { materialReceiptNoteService, type MaterialReceiptNote, type ReceiptPurchaseOrder } from "@/services/materialReceiptNoteService";
import { vendorService, type Vendor } from "@/services/vendorService";

type SortField = "mrnNumber" | "projectName" | "vendorName" | "receiptDate" | "status";
type SortOrder = "asc" | "desc";

const itemsPerPage = 10;

const getApiErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data;
    if (typeof data === "string") return data;
    if (typeof data === "object" && data !== null && "message" in data) return String(data.message);
    if (typeof data === "object" && data !== null && "title" in data) return String(data.title);
  }
  return error instanceof Error ? error.message : "Unable to complete the request.";
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const today = () => {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

export default function MRNList() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [receipts, setReceipts] = useState<MaterialReceiptNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("receiptDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [purchaseOrders, setPurchaseOrders] = useState<ReceiptPurchaseOrder[]>([]);
  const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(false);
  const [purchaseOrderError, setPurchaseOrderError] = useState("");
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState("");
  const [receivedQuantities, setReceivedQuantities] = useState<Record<number, string>>({});
  const [receiptDate, setReceiptDate] = useState(today);
  const [remarks, setRemarks] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<MaterialReceiptNote | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const selectedPurchaseOrder = useMemo(
    () => purchaseOrders.find((order) => String(order.id) === selectedPurchaseOrderId) ?? null,
    [purchaseOrders, selectedPurchaseOrderId],
  );

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setReceipts(await materialReceiptNoteService.getAll());
    } catch (error) {
      console.error("Failed to load material receipt notes", error);
      setLoadError(getApiErrorMessage(error));
      toast({ title: "Unable to load material receipt notes", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadReceipts();
  }, [loadReceipts]);

  useEffect(() => {
    let active = true;
    const loadVendors = async () => {
      setLoadingVendors(true);
      try {
        const result = await vendorService.getAll();
        if (active) setVendors(result);
      } catch (error) {
        console.error("Failed to load vendors for material receipt notes", error);
        if (active) {
          toast({
            title: "Unable to load vendors",
            description: getApiErrorMessage(error),
            variant: "destructive",
          });
        }
      } finally {
        if (active) setLoadingVendors(false);
      }
    };
    void loadVendors();
    return () => {
      active = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!selectedVendorId) {
      setPurchaseOrders([]);
      setSelectedPurchaseOrderId("");
      setPurchaseOrderError("");
      return;
    }

    let active = true;
    const loadOrders = async () => {
      setLoadingPurchaseOrders(true);
      setPurchaseOrderError("");
      setPurchaseOrders([]);
      setSelectedPurchaseOrderId("");
      setReceivedQuantities({});
      try {
        const result = await materialReceiptNoteService.getPurchaseOrdersByVendor(Number(selectedVendorId));
        if (active) setPurchaseOrders(result);
      } catch (error) {
        console.error("Failed to load vendor purchase orders", error);
        if (active) setPurchaseOrderError(getApiErrorMessage(error));
      } finally {
        if (active) setLoadingPurchaseOrders(false);
      }
    };
    void loadOrders();
    return () => {
      active = false;
    };
  }, [selectedVendorId]);

  const filteredReceipts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return receipts
      .filter((receipt) => {
        const matchesSearch = !search || [
          receipt.mrnNumber,
          receipt.purchaseOrderNumber,
          receipt.vendorName,
          receipt.projectName ?? "",
          receipt.storeName,
        ].some((value) => value.toLowerCase().includes(search));
        const matchesStatus = statusFilter === "all" || receipt.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
      })
      .sort((first, second) => {
        const firstValue = first[sortField] ?? "";
        const secondValue = second[sortField] ?? "";
        const comparison = sortField === "receiptDate"
          ? new Date(String(firstValue)).getTime() - new Date(String(secondValue)).getTime()
          : String(firstValue).localeCompare(String(secondValue));
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [receipts, searchTerm, statusFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const pageReceipts = filteredReceipts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(totalPages, 1)));
  }, [totalPages]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((order) => order === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const resetCreateForm = () => {
    setSelectedVendorId("");
    setPurchaseOrders([]);
    setSelectedPurchaseOrderId("");
    setReceivedQuantities({});
    setReceiptDate(today());
    setRemarks("");
    setShowCreateForm(false);
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPurchaseOrder) {
      toast({ title: "Select a purchase order", variant: "destructive" });
      return;
    }

    const items = selectedPurchaseOrder.items
      .map((item) => ({
        purchaseOrderItemId: item.purchaseOrderItemId,
        receivedQty: Number(receivedQuantities[item.purchaseOrderItemId] || 0),
        remainingQty: item.remainingQty,
      }))
      .filter((item) => item.receivedQty > 0);

    if (items.length === 0) {
      toast({ title: "Enter a received quantity for at least one item", variant: "destructive" });
      return;
    }
    const overReceived = items.find((item) => item.receivedQty > item.remainingQty);
    if (overReceived) {
      toast({ title: "Received quantity exceeds the remaining order quantity", variant: "destructive" });
      return;
    }
    if (!receiptDate) {
      toast({ title: "Select a receipt date", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await materialReceiptNoteService.create({
        purchaseOrderId: selectedPurchaseOrder.id,
        receiptDate,
        remarks: remarks.trim() || undefined,
        items: items.map(({ purchaseOrderItemId, receivedQty }) => ({ purchaseOrderItemId, receivedQty })),
      });
      toast({ title: "Material receipt note created", description: "Inventory has been updated." });
      resetCreateForm();
      await loadReceipts();
    } catch (error) {
      console.error("Failed to create material receipt note", error);
      toast({
        title: "Unable to create material receipt note",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sortButton = (label: string, field: SortField) => (
    <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => handleSort(field)}>
      {label}
      {sortField !== field ? (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
      ) : sortOrder === "asc" ? (
        <ArrowUp className="ml-1 h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="ml-1 h-3.5 w-3.5" />
      )}
    </Button>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MRN List / Challan</h1>
          <p className="text-muted-foreground">Receive purchase-order items and update site inventory.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateForm((shown) => !shown)}>
          <Plus className="h-4 w-4" />
          {showCreateForm ? "Close" : "New MRN"}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Material Receipt Note</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="mrn-vendor">Vendor</label>
                  <Select
                    value={selectedVendorId}
                    onValueChange={setSelectedVendorId}
                    disabled={loadingVendors || saving}
                  >
                    <SelectTrigger id="mrn-vendor">
                      <SelectValue placeholder={loadingVendors ? "Loading vendors..." : "Select vendor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={String(vendor.id)}>{vendor.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="mrn-purchase-order">Purchase Order</label>
                  <Select
                    value={selectedPurchaseOrderId}
                    onValueChange={(value) => {
                      setSelectedPurchaseOrderId(value);
                      setReceivedQuantities({});
                    }}
                    disabled={!selectedVendorId || loadingPurchaseOrders || saving}
                  >
                    <SelectTrigger id="mrn-purchase-order">
                      <SelectValue placeholder={
                        loadingPurchaseOrders ? "Loading purchase orders..." :
                          selectedVendorId ? "Select purchase order" : "Select a vendor first"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrders.map((order) => (
                        <SelectItem key={order.id} value={String(order.id)}>
                          {order.purchaseOrderNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {purchaseOrderError && <p className="text-sm text-destructive">{purchaseOrderError}</p>}
                  {!loadingPurchaseOrders && selectedVendorId && !purchaseOrderError && purchaseOrders.length === 0 && (
                    <p className="text-sm text-muted-foreground">No purchase orders are available for this vendor.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="mrn-receipt-date">Receipt Date</label>
                  <Input
                    id="mrn-receipt-date"
                    type="date"
                    value={receiptDate}
                    onChange={(event) => setReceiptDate(event.target.value)}
                    disabled={saving}
                    required
                  />
                </div>
              </div>

              {selectedPurchaseOrder && (
                <section className="space-y-3">
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                    <h3 className="font-semibold">Purchase Order Items</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedPurchaseOrder.projectName || selectedPurchaseOrder.storeName}
                      {" · Inventory store: "}{selectedPurchaseOrder.storeName}
                    </p>
                  </div>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Requested Qty</TableHead>
                          <TableHead>Previously Received</TableHead>
                          <TableHead>Remaining Qty</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="w-40">Received Now</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPurchaseOrder.items.map((item) => {
                          const quantity = Number(receivedQuantities[item.purchaseOrderItemId] || 0);
                          const exceedsRemaining = quantity > item.remainingQty;
                          return (
                            <TableRow key={item.purchaseOrderItemId}>
                              <TableCell className="font-medium">{item.itemName}</TableCell>
                              <TableCell>{item.requestedQty}</TableCell>
                              <TableCell>{item.receivedQty}</TableCell>
                              <TableCell>{item.remainingQty}</TableCell>
                              <TableCell>{item.unit || "-"}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.remainingQty}
                                  step="0.001"
                                  value={receivedQuantities[item.purchaseOrderItemId] ?? ""}
                                  onChange={(event) => setReceivedQuantities((current) => ({
                                    ...current,
                                    [item.purchaseOrderItemId]: event.target.value,
                                  }))}
                                  className={exceedsRemaining ? "border-destructive" : ""}
                                  aria-label={`Received quantity for ${item.itemName}`}
                                  disabled={saving || item.remainingQty <= 0}
                                />
                                {exceedsRemaining && (
                                  <span className="text-xs text-destructive">Maximum {item.remainingQty}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="mrn-remarks">Remarks</label>
                <Textarea
                  id="mrn-remarks"
                  placeholder="Optional receipt remarks"
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={resetCreateForm} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving || !selectedPurchaseOrder}>
                  {saving ? "Saving..." : "Create MRN"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search MRNs, vendors, or purchase orders..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Material Receipt Notes</CardTitle></CardHeader>
        <CardContent>
          {loadError && <p className="mb-4 text-sm text-destructive">{loadError}</p>}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{sortButton("MRN ID", "mrnNumber")}</TableHead>
                  <TableHead>{sortButton("Project", "projectName")}</TableHead>
                  <TableHead>{sortButton("Vendor", "vendorName")}</TableHead>
                  <TableHead>Purchase Order</TableHead>
                  <TableHead>Inventory Store</TableHead>
                  <TableHead>{sortButton("Receipt Date", "receiptDate")}</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>{sortButton("Status", "status")}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">Loading MRNs...</TableCell></TableRow>
                ) : pageReceipts.length > 0 ? (
                  pageReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">{receipt.mrnNumber}</TableCell>
                      <TableCell>{receipt.projectName || "-"}</TableCell>
                      <TableCell>{receipt.vendorName}</TableCell>
                      <TableCell>{receipt.purchaseOrderNumber}</TableCell>
                      <TableCell>{receipt.storeName}</TableCell>
                      <TableCell>{formatDate(receipt.receiptDate)}</TableCell>
                      <TableCell>{receipt.items.length}</TableCell>
                      <TableCell>
                        <Badge variant={receipt.status.toLowerCase() === "completed" ? "default" : "secondary"}>
                          {receipt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" aria-label={`View ${receipt.mrnNumber}`} onClick={() => {
                          setSelectedReceipt(receipt);
                          setViewOpen(true);
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No material receipt notes found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 py-4">
              <span className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredReceipts.length)} of {filteredReceipts.length}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Material Receipt Note Details</DialogTitle></DialogHeader>
          {selectedReceipt && (
            <div className="space-y-5">
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">MRN</dt><dd className="font-medium">{selectedReceipt.mrnNumber}</dd></div>
                <div><dt className="text-muted-foreground">Purchase Order</dt><dd>{selectedReceipt.purchaseOrderNumber}</dd></div>
                <div><dt className="text-muted-foreground">Vendor</dt><dd>{selectedReceipt.vendorName}</dd></div>
                <div><dt className="text-muted-foreground">Project</dt><dd>{selectedReceipt.projectName || "-"}</dd></div>
                <div><dt className="text-muted-foreground">Inventory Store</dt><dd>{selectedReceipt.storeName}</dd></div>
                <div><dt className="text-muted-foreground">Receipt Date</dt><dd>{formatDate(selectedReceipt.receiptDate)}</dd></div>
                <div><dt className="text-muted-foreground">Status</dt><dd>{selectedReceipt.status}</dd></div>
                <div><dt className="text-muted-foreground">Remarks</dt><dd>{selectedReceipt.remarks || "-"}</dd></div>
              </dl>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Received Qty</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReceipt.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.receivedQty}</TableCell>
                        <TableCell>{item.unit || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
