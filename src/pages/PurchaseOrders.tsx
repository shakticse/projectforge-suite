import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpDown, ChevronDown, ChevronUp, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { purchaseOrderService, type PurchaseOrderRecord } from "@/services/purchaseOrderService";
import { createPurchaseOrderPdf } from "@/lib/purchaseOrderPdf";

type SortField = "id" | "projectName" | "vendorName" | "totalAmount" | "status" | "orderDate" | "dueDate";

const itemsPerPage = 10;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

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
    if (typeof data === "object" && data !== null && "message" in data) {
      return String(data.message);
    }
    if (typeof data === "object" && data !== null && "title" in data) {
      return String(data.title);
    }
  }
  return error instanceof Error ? error.message : "Unable to complete the request.";
};

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case "approved":
    case "completed":
      return "default";
    case "rejected":
      return "destructive";
    case "draft":
      return "outline";
    default:
      return "secondary";
  }
};

const getSortValue = (purchaseOrder: PurchaseOrderRecord, field: SortField): string | number => {
  switch (field) {
    case "id":
      return purchaseOrder.id;
    case "projectName":
      return purchaseOrder.projectName ?? "";
    case "vendorName":
      return purchaseOrder.vendorName ?? "";
    case "totalAmount":
      return purchaseOrder.totalAmount;
    case "status":
      return purchaseOrder.status;
    case "orderDate":
      return purchaseOrder.orderDate ? new Date(purchaseOrder.orderDate).getTime() : 0;
    case "dueDate":
      return purchaseOrder.dueDate ? new Date(purchaseOrder.dueDate).getTime() : 0;
  }
};

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderRecord | null>(null);
  const [sortField, setSortField] = useState<SortField>("orderDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const loadPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const records = await purchaseOrderService.getAll();
      setPurchaseOrders(records);
    } catch (error) {
      console.error("Failed to load purchase orders", error);
      setLoadError(getApiErrorMessage(error));
      toast.error("Unable to load purchase orders.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  const filteredAndSortedPOs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return purchaseOrders
      .filter((purchaseOrder) => {
        const searchMatches =
          !search ||
          [
            String(purchaseOrder.id),
            purchaseOrder.name,
            purchaseOrder.projectName,
            purchaseOrder.vendorName,
            purchaseOrder.bomName,
          ].some((value) => value?.toLowerCase().includes(search));
        const statusMatches =
          statusFilter === "all" || purchaseOrder.status.toLowerCase() === statusFilter.toLowerCase();
        return searchMatches && statusMatches;
      })
      .sort((first, second) => {
        const firstValue = getSortValue(first, sortField);
        const secondValue = getSortValue(second, sortField);
        const comparison =
          typeof firstValue === "number" && typeof secondValue === "number"
            ? firstValue - secondValue
            : String(firstValue).localeCompare(String(secondValue));
        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [purchaseOrders, searchTerm, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedPOs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPOs = filteredAndSortedPOs.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(totalPages, 1)));
  }, [totalPages]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortButton = (label: string, field: SortField) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium text-white hover:bg-white/10 hover:text-white"
      onClick={() => handleSort(field)}
    >
      {label}
      {sortField !== field ? (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
      ) : sortDirection === "asc" ? (
        <ChevronUp className="ml-1 h-3.5 w-3.5" />
      ) : (
        <ChevronDown className="ml-1 h-3.5 w-3.5" />
      )}
    </Button>
  );

  const downloadPdf = (purchaseOrder: PurchaseOrderRecord) => {
    try {
      const pdf = createPurchaseOrderPdf(purchaseOrder);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `PO-${purchaseOrder.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate purchase order PDF", error);
      toast.error("Unable to download the purchase order PDF.");
    }
  };

  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
    if (totalPages <= 5) return index + 1;
    if (currentPage <= 3) return index + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + index;
    return currentPage - 2 + index;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
        <p className="text-muted-foreground">Review and download purchase orders.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {[...new Set(purchaseOrders.map((purchaseOrder) => purchaseOrder.status))].map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => void loadPurchaseOrders()} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{sortButton("PO ID", "id")}</TableHead>
              <TableHead>{sortButton("Project", "projectName")}</TableHead>
              <TableHead>BOM</TableHead>
              <TableHead>{sortButton("Vendor", "vendorName")}</TableHead>
              <TableHead>{sortButton("Total Amount", "totalAmount")}</TableHead>
              <TableHead>{sortButton("Status", "status")}</TableHead>
              <TableHead>{sortButton("Order Date", "orderDate")}</TableHead>
              <TableHead>{sortButton("Due Date", "dueDate")}</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">Loading purchase orders...</TableCell></TableRow>
            ) : loadError ? (
              <TableRow><TableCell colSpan={10} className="py-8 text-center text-destructive">{loadError}</TableCell></TableRow>
            ) : paginatedPOs.length ? (
              paginatedPOs.map((purchaseOrder) => (
                <TableRow key={purchaseOrder.id}>
                  <TableCell className="font-medium">{purchaseOrder.name || `PO-${purchaseOrder.id}`}</TableCell>
                  <TableCell>{purchaseOrder.projectName || "-"}</TableCell>
                  <TableCell>{purchaseOrder.bomName || "-"}</TableCell>
                  <TableCell>{purchaseOrder.vendorName || "-"}</TableCell>
                  <TableCell className="font-medium">INR {purchaseOrder.totalAmount.toLocaleString()}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(purchaseOrder.status)}>{purchaseOrder.status}</Badge></TableCell>
                  <TableCell>{formatDate(purchaseOrder.orderDate)}</TableCell>
                  <TableCell>{formatDate(purchaseOrder.dueDate)}</TableCell>
                  <TableCell className="text-center"><Badge variant="outline">{purchaseOrder.itemCount}</Badge></TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`View purchase order ${purchaseOrder.id}`}
                        title="View items"
                        onClick={() => setSelectedPO(purchaseOrder)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Download purchase order ${purchaseOrder.id} PDF`}
                        title="Download PDF"
                        onClick={() => downloadPdf(purchaseOrder)}
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                  No purchase orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedPOs.length ? startIndex + 1 : 0} to{" "}
          {Math.min(startIndex + itemsPerPage, filteredAndSortedPOs.length)} of {filteredAndSortedPOs.length} results
        </div>
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {pageNumbers.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <Dialog open={selectedPO !== null} onOpenChange={(open) => { if (!open) setSelectedPO(null); }}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Purchase Order Details - {selectedPO?.name || (selectedPO ? `PO-${selectedPO.id}` : "")}
            </DialogTitle>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <section className="space-y-2 rounded-lg border p-4">
                  <h3 className="font-semibold">Order Details</h3>
                  <p><span className="text-muted-foreground">Project:</span> {selectedPO.projectName || "-"}</p>
                  <p><span className="text-muted-foreground">BOM:</span> {selectedPO.bomName || "-"}</p>
                  <p><span className="text-muted-foreground">Purchase Request:</span> PR-{selectedPO.purchaseRequestId}</p>
                  <p><span className="text-muted-foreground">Status:</span> {selectedPO.status}</p>
                  <p><span className="text-muted-foreground">Order date:</span> {formatDate(selectedPO.orderDate)}</p>
                  <p><span className="text-muted-foreground">Due date:</span> {formatDate(selectedPO.dueDate)}</p>
                  <p><span className="text-muted-foreground">Delivery location:</span> {selectedPO.deliveryAddress || "-"}</p>
                </section>
                <section className="space-y-2 rounded-lg border p-4">
                  <h3 className="font-semibold">Vendor Details</h3>
                  <p className="font-medium">{selectedPO.vendorName || "-"}</p>
                  <p>{selectedPO.vendorContactPerson || "-"}</p>
                  <p>{selectedPO.vendorAddress || "-"}</p>
                  <p>{[selectedPO.vendorCity, selectedPO.vendorState, selectedPO.vendorZip].filter(Boolean).join(", ") || "-"}</p>
                  <p>{selectedPO.vendorPhone || "-"}</p>
                  <p>{selectedPO.vendorEmail || "-"}</p>
                  <p><span className="text-muted-foreground">GST:</span> {selectedPO.vendorGstNumber || "-"}</p>
                </section>
              </div>

              <section className="space-y-2">
                <h3 className="font-semibold">Items ({selectedPO.itemCount})</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Vendor Price</TableHead>
                        <TableHead className="text-right">Total Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell>{item.unit || "-"}</TableCell>
                          <TableCell className="text-right">INR {item.vendorPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right">INR {item.totalPrice.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-semibold">Total ({selectedPO.itemCount} items)</TableCell>
                        <TableCell className="text-right font-bold">INR {selectedPO.totalAmount.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">Terms and Conditions</h3>
                <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">
                  {selectedPO.termsAndConditions?.trim() || "No terms and conditions were recorded for this purchase order."}
                </p>
              </section>
              <div className="flex justify-end">
                <Button type="button" onClick={() => downloadPdf(selectedPO)}>
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
