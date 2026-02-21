import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AddInventoryModal } from "@/components/inventory/AddInventoryModal";
import EditInventoryModal from "@/components/inventory/EditInventoryModal";
import { itemStoreService } from '@/services/itemStoreService';
import { storeService } from '@/services/storeService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';
import {
  Search,
  Plus,
  Filter,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  MoreVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortField = 'name' | 'sku' | 'category' | 'totalQuantity' | 'unitPrice';
type SortDirection = 'asc' | 'desc';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showStoreBreakdown, setShowStoreBreakdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleEdit = (item: any) => {
    setEditItem(item);
    setShowEditModal(true);
  };

  const handleDelete = async (item: any) => {
    if (!item?.id) return;
    if (!confirm(`Delete ${item.name || item.itemName || item.sku}? This cannot be undone.`)) return;
    setIsProcessing(true);
    try {
      await itemStoreService.delete(item.id, user?.id);
      toast({ title: 'Deleted', description: 'Item removed from store.' });
      refreshStoreItems();
    } catch (err) {
      console.error('Delete failed', err);
      toast({ title: 'Error', description: 'Failed to delete item.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStoreItems = async (storeName?: string) => {
    setLoading(true);
    try {
      const data = await itemStoreService.getAll(storeName);
      const items = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
      setInventoryItems(items || []);
    } catch (err) {
      console.error('Failed to fetch store items', err);
      toast({ title: 'Error', description: 'Failed to load inventory items', variant: 'destructive' });
    } finally {
      setLoading(false);
    } 
  };

  useEffect(() => {
    const s = storeFilter === 'all' ? undefined : storeFilter;
    setCurrentPage(1);
    fetchStoreItems(s);
  }, [storeFilter]);

  // Helper to refresh current view respecting selected store
  const refreshStoreItems = () => {
    const s = storeFilter === 'all' ? undefined : storeFilter;
    fetchStoreItems(s);
  };

  const [storesList, setStoresList] = useState<string[]>([]);

  const fetchStores = async () => {
    try {
      const data = await storeService.getAllStores();
      const list = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
      const names = (list || []).map((s: any) => s.store_name ?? s.StoreName ?? s.name ?? s.storeName ?? s);
      setStoresList(names.filter(Boolean));
    } catch (err) {
      console.error('Failed to fetch stores', err);
      toast({ title: 'Error', description: 'Failed to load stores', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Consolidate inventory items by ItemName/SKU (tolerant to API field naming)
  const consolidatedItems = inventoryItems.reduce((acc, item) => {
    const name = item.ItemName ?? item.itemName ?? item.name ?? '';
    const sku = (item.SKU ?? item.sku ?? '') || '';
    const key = `${name}-${sku}`;
    if (!acc[key]) {
      acc[key] = {
        id: item.ItemId ?? item.id ?? item.Id,
        name,
        sku,
        category: item.CategoryName ?? item.categoryName ?? '',
        unitPrice: Number(item.ItemPrice ?? item.itemPrice ?? item.unitPrice ?? 0),
        totalQuantity: 0,
        totalValue: 0,
        minStock: Number(item.minStock ?? 0),
        maxStock: Number(item.maxStock ?? 0),
        updatedBy: item.updatedByUser ?? item.updatedBy ?? '',
        updatedDate: item.UpdatedAt ?? item.updatedAt ?? item.updatedDate ?? item.CreatedAt ?? '',
        stores: []
      };
    }

    const qty = Number(item.Qty ?? item.qty ?? item.quantity ?? 0);
    const price = Number(item.ItemPrice ?? item.itemPrice ?? item.unitPrice ?? 0);

    acc[key].totalQuantity += qty;
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
      id: item.Id ?? item.id,
      location: item.StoreName ?? item.storeName ?? '',
      quantity: qty,
      status: item.Status ?? item.status ?? '',
      minStock: Number(item.minStock ?? 0),
      maxStock: Number(item.maxStock ?? 0)
    });

    return acc;
  }, {} as Record<string, any>);

  const consolidatedInventory = Object.values(consolidatedItems) as any[];

  const getConsolidatedStatusBadge = (item: any) => {
    if (item.totalQuantity <= item.minStock * 0.5) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Critical</Badge>;
    } else if (item.totalQuantity <= item.minStock) {
      return <Badge variant="warning" className="gap-1"><TrendingDown className="h-3 w-3" />Low Stock</Badge>;
    } else {
      return <Badge variant="success" className="gap-1"><TrendingUp className="h-3 w-3" />In Stock</Badge>;
    }
  };

  const handleViewStoreBreakdown = (item: any) => {
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

  const categories = [...new Set(consolidatedInventory.map((it: any) => it.category).filter(Boolean))];
  const stores = storesList;
  const statuses = [...new Set(inventoryItems.map((it: any) => it.Status ?? it.status).filter(Boolean))];

  const filteredItems = consolidatedInventory.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (item.name ?? '').toString().toLowerCase().includes(q) ||
                         (item.sku ?? '').toString().toLowerCase().includes(q) ||
                         (item.category ?? '').toString().toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStore = storeFilter === "all" || item.stores.some((store: any) => (store.location ?? '').toString() === storeFilter);
    return matchesSearch && matchesCategory && matchesStore;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    if (sortField === 'totalQuantity' || sortField === 'unitPrice') {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage your inventory levels and stock</p>
        </div>
          <Button size="lg" className="gap-2" onClick={() => setShowAddModal(true)} disabled={loading || isProcessing}>
            { (loading || isProcessing) ? (
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

      {/* Filters and Search */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map((store: any) => {
                    return (
                      <SelectItem key={String(store)} value={String(store)}>{String(store)}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={String(category)} value={String(category)}>{String(category)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Inventory Items ({sortedItems.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="mb-4 py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
              Loading inventory...
            </div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('name')}
                    className="h-auto p-0 font-semibold text-left justify-start"
                  >
                    Item {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('sku')}
                    className="h-auto p-0 font-semibold text-left justify-start"
                  >
                    SKU {getSortIcon('sku')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('category')}
                    className="h-auto p-0 font-semibold text-left justify-start"
                  >
                    Category {getSortIcon('category')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('totalQuantity')}
                    className="h-auto p-0 font-semibold text-left justify-start"
                  >
                    Total Quantity {getSortIcon('totalQuantity')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('unitPrice')}
                    className="h-auto p-0 font-semibold text-left justify-start"
                  >
                    Unit Price {getSortIcon('unitPrice')}
                  </Button>
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.name}</TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{item.totalQuantity}</TableCell>
                  <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                              <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewStoreBreakdown(item)}
                        className="h-8 w-8 p-0"
                        disabled={loading || isProcessing}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={loading || isProcessing}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Store Breakdown - {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store Location</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Updated By</TableHead>
                      <TableHead>Update Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItem?.stores?.map((store: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{store.location}</TableCell>
                        <TableCell className="font-mono">{store.quantity}</TableCell>
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