import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AddInventoryModal } from "@/components/inventory/AddInventoryModal";
import EditInventoryModal from "@/components/inventory/EditInventoryModal";
import { itemStoreService } from '@/services/itemStoreService';
import { storeService } from '@/services/storeService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/exportUtils';
import { formatDateTime } from '@/lib/utils';
import {
  Search,
  Plus,
  Filter,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Eye,
  Download,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
type SortField = 'name' | 'sku' | 'category' | 'totalQuantity' | 'allocatedQty' | 'availableQuantity' | 'dispatchedQty' | 'onOrderQty' | 'unitPrice';
type SortDirection = 'asc' | 'desc';

type InventoryApiValue = string | number | boolean | null | undefined;

interface InventoryApiRow {
  [key: string]: InventoryApiValue;
  Id?: string | number | null;
  id?: string | number | null;
  ItemId?: string | number | null;
  ItemName?: InventoryApiValue;
  itemName?: InventoryApiValue;
  name?: InventoryApiValue;
  SKU?: InventoryApiValue;
  sku?: InventoryApiValue;
  CategoryName?: InventoryApiValue;
  categoryName?: InventoryApiValue;
  ItemPrice?: InventoryApiValue;
  itemPrice?: InventoryApiValue;
  unitPrice?: InventoryApiValue;
  Qty?: InventoryApiValue;
  qty?: InventoryApiValue;
  quantity?: InventoryApiValue;
  AllocatedQty?: InventoryApiValue;
  allocatedQty?: InventoryApiValue;
  AllocattedQty?: InventoryApiValue;
  allocattedQty?: InventoryApiValue;
  AvailableQty?: InventoryApiValue;
  availableQty?: InventoryApiValue;
  AvailableQuantity?: InventoryApiValue;
  availableQuantity?: InventoryApiValue;
  DispatchedQty?: InventoryApiValue;
  dispatchedQty?: InventoryApiValue;
  ReturnInTransitQty?: InventoryApiValue;
  returnInTransitQty?: InventoryApiValue;
  OnOrderQty?: InventoryApiValue;
  onOrderQty?: InventoryApiValue;
  StoreId?: InventoryApiValue;
  storeId?: InventoryApiValue;
  StoreName?: InventoryApiValue;
  storeName?: InventoryApiValue;
  minStock?: InventoryApiValue;
  maxStock?: InventoryApiValue;
  updatedByUser?: InventoryApiValue;
  updatedBy?: InventoryApiValue;
  UpdatedBy?: InventoryApiValue;
  UpdatedAt?: InventoryApiValue;
  updatedAt?: InventoryApiValue;
  updatedDate?: InventoryApiValue;
  CreatedAt?: InventoryApiValue;
  Status?: InventoryApiValue;
  status?: InventoryApiValue;
}

interface InventoryStoreBreakdown {
  id: number;
  storeId: number;
  location: string;
  quantity: number;
  allocatedQty: number;
  availableQty: number;
  dispatchedQty: number;
  returnInTransitQty: number;
  onOrderQty: number;
  status: string;
  minStock: number;
  maxStock: number;
}

interface ConsolidatedInventoryItem {
  id: number | string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  totalQuantity: number;
  allocatedQty: number;
  availableQuantity: number;
  dispatchedQty: number;
  returnInTransitQty: number;
  onOrderQty: number;
  totalValue: number;
  minStock: number;
  maxStock: number;
  updatedBy: string;
  updatedDate: string | number;
  stores: InventoryStoreBreakdown[];
}

const isInventoryApiRow = (value: unknown): value is InventoryApiRow =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedItem, setSelectedItem] = useState<ConsolidatedInventoryItem | null>(null);
  const [showStoreBreakdown, setShowStoreBreakdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<ConsolidatedInventoryItem | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleEdit = (item: ConsolidatedInventoryItem) => {
    setEditItem(item);
    setShowEditModal(true);
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConsolidatedInventoryItem | null>(null);




  const [inventoryItems, setInventoryItems] = useState<InventoryApiRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStoreItems = useCallback(async (storeName?: string) => {
    setLoading(true);
    try {
      const data = await itemStoreService.getAll(storeName);
      const items = Array.isArray(data)
        ? data
        : typeof data === 'object' && data !== null
          ? ('data' in data && Array.isArray(data.data)
            ? data.data
            : 'items' in data && Array.isArray(data.items)
              ? data.items
              : [])
          : [];
      setInventoryItems(items.filter(isInventoryApiRow));
    } catch (err) {
      console.error('Failed to fetch store items', err);
      toast({ title: 'Error', description: 'Failed to load inventory items', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const s = storeFilter === 'all' ? undefined : storeFilter;
    setCurrentPage(1);
    fetchStoreItems(s);
  }, [storeFilter, fetchStoreItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  // Helper to refresh current view respecting selected store
  const refreshStoreItems = () => {
    const s = storeFilter === 'all' ? undefined : storeFilter;
    fetchStoreItems(s);
  };

  const [storesList, setStoresList] = useState<string[]>([]);

  const fetchStores = useCallback(async () => {
    try {
      const data = await storeService.getAllStores();
      const list = Array.isArray(data)
        ? data
        : typeof data === 'object' && data !== null
          ? ('data' in data && Array.isArray(data.data)
            ? data.data
            : 'items' in data && Array.isArray(data.items)
              ? data.items
              : [])
          : [];
      const names = list.map((store) => {
        if (typeof store !== 'object' || store === null) return '';
        const row = store as Record<string, unknown>;
        return String(row.store_name ?? row.StoreName ?? row.name ?? row.storeName ?? '');
      });
      setStoresList(names.filter(Boolean));
    } catch (err) {
      console.error('Failed to fetch stores', err);
      toast({ title: 'Error', description: 'Failed to load stores', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Consolidate inventory items by ItemName/SKU (tolerant to API field naming)
  const consolidatedItems = inventoryItems.reduce<Record<string, ConsolidatedInventoryItem>>((acc, item) => {
    const name = String(item.ItemName ?? item.itemName ?? item.name ?? '');
    const sku = String(item.SKU ?? item.sku ?? '');
    const key = `${name}-${sku}`;
    if (!acc[key]) {
      acc[key] = {
        id: item.Id ?? item.id ?? '',
        name,
        sku,
        category: String(item.CategoryName ?? item.categoryName ?? ''),
        unitPrice: Number(item.ItemPrice ?? item.itemPrice ?? item.unitPrice ?? 0),
        totalQuantity: 0,
        allocatedQty: 0,
        availableQuantity: 0,
        dispatchedQty: 0,
        returnInTransitQty: 0,
        onOrderQty: 0,
        totalValue: 0,
        minStock: Number(item.minStock ?? 0),
        maxStock: Number(item.maxStock ?? 0),
        updatedBy: String(item.updatedByUser ?? item.updatedBy ?? ''),
        updatedDate: String(item.UpdatedAt ?? item.updatedAt ?? item.updatedDate ?? item.CreatedAt ?? ''),
        stores: []
      };
    }

    const qty = Number(item.Qty ?? item.qty ?? item.quantity ?? 0);
    const price = Number(item.ItemPrice ?? item.itemPrice ?? item.unitPrice ?? 0);
    const allocated = Number(
      item.allocatedQty ??
        item.allocattedQty ??
        item.AllocatedQty ??
        item.AllocattedQty ??
        0
    );
    const availableQty = Number(
      item.availableQty ??
        item.AvailableQty ??
        item.availableQuantity ??
        item.AvailableQuantity ??
        0
    );
    const dispatchedQty = Number(item.dispatchedQty ?? item.DispatchedQty ?? 0);
    const returnInTransitQty = Number(item.returnInTransitQty ?? item.ReturnInTransitQty ?? 0);
    const onOrderQty = Number(item.onOrderQty ?? item.OnOrderQty ?? 0);

    acc[key].totalQuantity += qty;
    acc[key].allocatedQty += allocated;
    acc[key].availableQuantity += availableQty;
    acc[key].dispatchedQty += dispatchedQty;
    acc[key].returnInTransitQty += returnInTransitQty;
    acc[key].onOrderQty += onOrderQty;
    acc[key].totalValue += qty * price;
    acc[key].minStock += Number(item.minStock ?? 0);
    acc[key].maxStock += Number(item.maxStock ?? 0);

    // Use the most recent update info
    const itemUpdated = new Date(item.UpdatedAt ?? item.updatedAt ?? item.updatedDate ?? item.CreatedAt ?? 0);
    const accUpdated = new Date(acc[key].updatedDate ?? 0);
    if (itemUpdated > accUpdated) {
      acc[key].updatedBy = item.UpdatedBy ?? item.updatedBy ?? acc[key].updatedBy;
      acc[key].updatedDate = item.UpdatedAt ?? item.updatedAt ?? item.updatedDate ?? acc[key].updatedDate;
    }

    acc[key].stores.push({
      id: Number(item.Id ?? item.id ?? 0),
      storeId: Number(item.StoreId ?? item.storeId ?? 0),
      location: String(item.StoreName ?? item.storeName ?? ''),
      quantity: qty,
      allocatedQty: allocated,
      availableQty,
      dispatchedQty,
      returnInTransitQty,
      onOrderQty,
      status: String(item.Status ?? item.status ?? ''),
      minStock: Number(item.minStock ?? 0),
      maxStock: Number(item.maxStock ?? 0)
    });

    return acc;
  }, {});

  const consolidatedInventory = Object.values(consolidatedItems);

  const getConsolidatedStatusBadge = (item: ConsolidatedInventoryItem) => {
    if (item.totalQuantity <= item.minStock * 0.5) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Critical</Badge>;
    } else if (item.totalQuantity <= item.minStock) {
      return <Badge variant="warning" className="gap-1"><TrendingDown className="h-3 w-3" />Low Stock</Badge>;
    } else {
      return <Badge variant="success" className="gap-1"><TrendingUp className="h-3 w-3" />In Stock</Badge>;
    }
  };

  const handleViewStoreBreakdown = (item: ConsolidatedInventoryItem) => {
    setSelectedItem(item);
    setShowStoreBreakdown(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const categories = [...new Set(consolidatedInventory.map((item) => item.category).filter(Boolean))];
  const stores = storesList;

  const filteredItems = consolidatedInventory.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (item.name ?? '').toString().toLowerCase().includes(q) ||
      (item.sku ?? '').toString().toLowerCase().includes(q) ||
      (item.category ?? '').toString().toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStore = storeFilter === "all" || item.stores.some((store) => store.location === storeFilter);
    return matchesSearch && matchesCategory && matchesStore;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue: string | number = a[sortField];
    let bValue: string | number = b[sortField];
    if (
      sortField === 'totalQuantity' ||
      sortField === 'allocatedQty' ||
      sortField === 'availableQuantity' ||
      sortField === 'dispatchedQty' ||
      sortField === 'onOrderQty' ||
      sortField === 'unitPrice'
    ) {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  const totalValue = filteredItems.reduce((sum, item) => sum + (item.totalValue ?? 0), 0);
  const lowStockItems = filteredItems.filter(item => (item.totalQuantity ?? 0) <= (item.minStock ?? 0)).length;
  const criticalItems = filteredItems.filter(item => (item.totalQuantity ?? 0) <= (item.minStock ?? 0) * 0.5).length;

  const handleExport = () => {
    exportToExcel(consolidatedInventory, 'inventory_export', [
      { header: 'Item Name', key: 'name' },
      { header: 'SKU', key: 'sku' },
      { header: 'Category', key: 'category' },
      { header: 'Total Quantity', key: 'totalQuantity' },
      { header: 'Allocated Qty', key: 'allocatedQty' },
      { header: 'Available Qty', key: 'availableQuantity' },
      { header: 'Dispatched Qty', key: 'dispatchedQty' },
      { header: 'On Order Qty', key: 'onOrderQty' },
      { header: 'Unit Price', key: 'unitPrice' },
      { header: 'Total Value', key: 'totalValue' },
      { header: 'Min Stock Level', key: 'minStock' },
      {
        header: 'Status', key: (item) => {
          if (item.totalQuantity <= item.minStock * 0.5) return 'Critical';
          if (item.totalQuantity <= item.minStock) return 'Low Stock';
          return 'In Stock';
        }
      },
      { header: 'Last Updated By', key: 'updatedBy' },
      { header: 'Last Updated At', key: (item) => item.updatedDate ? formatDateTime(item.updatedDate) : '' }
    ]);
  };

  const openDeleteDialog = (item: ConsolidatedInventoryItem) => {
    setDeleteTarget(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsProcessing(true);
    try {
      await itemStoreService.delete(deleteTarget.id, user?.id);
      toast({ title: 'Deleted', description: 'Item removed from store.' });
      refreshStoreItems();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed', err);
      toast({ title: 'Error', description: 'Failed to delete item.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
        <div className="w-full min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage your inventory levels and stock</p>
        </div>
        <Button size="lg" className="gap-2 w-full sm:w-auto" onClick={() => setShowAddModal(true)} disabled={loading || isProcessing}>
          {(loading || isProcessing) ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
              Updating...
            </span>
          ) : (
            <span className="inline-flex items-center">
              <Plus className="h-4 w-4" />
              <span className="ml-2">Add Item</span>
            </span>
          )}          </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete item?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name || deleteTarget?.itemName || deleteTarget?.sku} will be permanently removed from store inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isProcessing}>
              {isProcessing ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inventory Table */}
      <Card className="glass-card w-full min-w-0 overflow-hidden flex flex-col">
        <CardHeader className="space-y-1.5 p-6 flex flex-row items-center justify-between gap-4 border-b border-border bg-muted/40 px-5 py-4">
          <CardTitle className="truncate">Inventory Items ({sortedItems.length} items)</CardTitle>
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search inventory items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 pl-9" />
            </div>
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by store" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map((store) => <SelectItem key={store} value={store}>{store}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => <SelectItem key={String(category)} value={String(category)}>{String(category)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:pt-0 w-full min-w-0">
          {loading ? (
            <div className="mb-4 py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
              Loading inventory...
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-none sm:rounded-md border border-x-0 sm:border-x">
              <Table className="w-full border-separate border-spacing-0" style={{ minWidth: '1160px' }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px] min-w-[180px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('name')}
                          className="h-auto p-0 font-semibold text-left justify-start"
                        >
                          Item {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[120px] min-w-[120px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('sku')}
                          className="h-auto p-0 font-semibold text-left justify-start"
                        >
                          SKU {getSortIcon('sku')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[130px] min-w-[130px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('category')}
                          className="h-auto p-0 font-semibold text-left justify-start"
                        >
                          Category {getSortIcon('category')}
                        </Button>
                      </TableHead>
                      {/* <TableHead className="w-[100px] min-w-[100px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('totalQuantity')}
                          className="h-auto p-0 font-semibold text-left justify-start whitespace-nowrap"
                        >
                          Qty {getSortIcon('totalQuantity')}
                        </Button>
                      </TableHead> */}
                      <TableHead className="w-[120px] min-w-[120px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('availableQuantity')}
                          className="h-auto p-0 font-semibold text-left justify-start whitespace-nowrap"
                        >
                          Available {getSortIcon('availableQuantity')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[100px] min-w-[100px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('allocatedQty')}
                          className="h-auto p-0 font-semibold text-left justify-start whitespace-nowrap"
                        >
                          Allocated {getSortIcon('allocatedQty')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[120px] min-w-[120px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('dispatchedQty')}
                          className="h-auto p-0 font-semibold text-left justify-start whitespace-nowrap"
                        >
                          Dispatched {getSortIcon('dispatchedQty')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[120px] min-w-[120px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('onOrderQty')}
                          className="h-auto p-0 font-semibold text-left justify-start whitespace-nowrap"
                        >
                          On Order {getSortIcon('onOrderQty')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[100px] min-w-[100px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('unitPrice')}
                          className="h-auto p-0 font-semibold text-left justify-start whitespace-nowrap"
                        >
                          Price {getSortIcon('unitPrice')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[80px] min-w-[80px] sticky right-0 bg-transparent z-10 shadow-[-10px_0_15px_-5px_hsl(var(--muted))] border-l">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm truncate max-w-[180px]" title={item.name}>{item.name}</TableCell>
                        <TableCell className="font-mono text-sm truncate max-w-[120px]" title={item.sku}>{item.sku}</TableCell>
                        <TableCell className="max-w-[130px]">
                          <Badge variant="outline" className="text-xs truncate max-w-full">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.availableQuantity ?? 0}</TableCell>
                        {/* <TableCell className="font-mono text-sm">{item.totalQuantity}</TableCell> */}
                        <TableCell className="font-mono text-sm">{item.allocatedQty ?? 0}</TableCell>
                        <TableCell className="font-mono text-sm">{item.dispatchedQty ?? 0}</TableCell>
                        <TableCell className="font-mono text-sm">{item.onOrderQty ?? 0}</TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">₹{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="sticky right-0 bg-background z-10 shadow-[-10px_0_15px_-5px_hsl(var(--muted))] border-l">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewStoreBreakdown(item)}
                              className="h-8 w-8 p-0"
                              disabled={loading || isProcessing}
                              aria-label="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {storeFilter !== "all" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEdit(item)}
                                disabled={loading || isProcessing}
                                aria-label="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {storeFilter !== "all" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
                                onClick={() => openDeleteDialog(item)}
                                disabled={loading || isProcessing}
                                aria-label="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
          )}
          <div className="h-4 sm:h-0"></div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {sortedItems.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, sortedItems.length)} of {sortedItems.length}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="inventory-page-size" className="text-sm text-muted-foreground">Rows per page</label>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger id="inventory-page-size" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4 sm:mt-6 w-full min-w-0 overflow-hidden">
          <PaginationContent className="flex-wrap justify-center sm:justify-start gap-y-2 max-w-full">
            <PaginationItem>
              <PaginationLink
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(1);
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              >
                First
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(prev => Math.max(prev - 1, 1));
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {(() => {
              const pagesPerWindow = 10;
              const startWindow = Math.floor((currentPage - 1) / pagesPerWindow) * pagesPerWindow + 1;
              const endWindow = Math.min(startWindow + pagesPerWindow - 1, totalPages);
              const pages = Array.from({ length: endWindow - startWindow + 1 }, (_, i) => startWindow + i);

              return (
                <>
                  {startWindow > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(Math.max(1, startWindow - pagesPerWindow));
                        }}
                        className="cursor-pointer"
                      >
                        ...
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  {pages.map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {endWindow < totalPages && (
                    <PaginationItem>
                      <PaginationLink
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(Math.min(endWindow + pagesPerWindow, totalPages));
                        }}
                        className="cursor-pointer"
                      >
                        ...
                      </PaginationLink>
                    </PaginationItem>
                  )}
                </>
              );
            })()}
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(prev => Math.min(prev + 1, totalPages));
                }}
                className={currentPage === totalPages || totalPages <= 10 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(totalPages);
                }}
                className={currentPage === totalPages || totalPages <= 10 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              >
                Last
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Store Breakdown Dialog */}
      <Dialog open={showStoreBreakdown} onOpenChange={setShowStoreBreakdown}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-[90vw] md:w-full overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Store Breakdown - {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">SKU</p>
                <p className="font-mono">{selectedItem?.sku}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p>{selectedItem?.category}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Stock by Store</h3>
              <div className="border rounded-lg overflow-hidden overflow-x-auto w-full">
                <Table className="min-w-[1050px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store Location</TableHead>
                      <TableHead>On Hand</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Dispatched</TableHead>
                      <TableHead>Return in Transit</TableHead>
                      <TableHead>On Order</TableHead>
                      <TableHead>Updated By</TableHead>
                      <TableHead>Update Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItem?.stores?.map((store, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{store.location}</TableCell>
                        <TableCell className="font-mono">{store.quantity}</TableCell>
                        <TableCell className="font-mono">{store.availableQty}</TableCell>
                        <TableCell className="font-mono">{store.allocatedQty}</TableCell>
                        <TableCell className="font-mono">{store.dispatchedQty}</TableCell>
                        <TableCell className="font-mono">{store.returnInTransitQty}</TableCell>
                        <TableCell className="font-mono">{store.onOrderQty}</TableCell>
                        <TableCell>{selectedItem?.updatedBy}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(selectedItem?.updatedDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Quantity:</span>
                <span className="text-lg font-mono">{selectedItem?.totalQuantity}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
                <p>Allocated: <span className="font-mono">{selectedItem?.allocatedQty}</span></p>
                <p>Available: <span className="font-mono">{selectedItem?.availableQuantity}</span></p>
                <p>Dispatched: <span className="font-mono">{selectedItem?.dispatchedQty}</span></p>
                <p>Return in transit: <span className="font-mono">{selectedItem?.returnInTransitQty}</span></p>
                <p>On order: <span className="font-mono">{selectedItem?.onOrderQty}</span></p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Inventory Modal */}
      <AddInventoryModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSaved={refreshStoreItems}
        onStart={() => setIsProcessing(true)}
        onFinish={() => setIsProcessing(false)}
      />

      {/* Edit Inventory Modal */}
      <EditInventoryModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        item={editItem}
        onStart={() => setIsProcessing(true)}
        onFinish={() => setIsProcessing(false)}
        onSaved={() => {
          refreshStoreItems();
          toast({ title: 'Saved', description: 'Item changes saved.' });
          setShowEditModal(false);
        }}
      />
    </div>
  );
};

export default Inventory;