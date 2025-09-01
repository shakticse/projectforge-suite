import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
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

  // Mock inventory data with items across multiple stores
  const inventoryItems = [
    // MAXIMA VERTICAL 2.5 MTR - Available in 3 stores
    {
      id: 1,
      name: "MAXIMA VERTICAL 2.5 MTR",
      sku: "STL-4X8-001",
      category: "Maxima 80 MM",
      quantity: 150,
      minStock: 100,
      maxStock: 500,
      unitPrice: 125.50,
      totalValue: 18825,
      supplier: "MetalCorp Industries",
      location: "Noida",
      status: "In Stock"
    },
    {
      id: 11,
      name: "MAXIMA VERTICAL 2.5 MTR",
      sku: "STL-4X8-001",
      category: "Maxima 80 MM",
      quantity: 75,
      minStock: 50,
      maxStock: 300,
      unitPrice: 125.50,
      totalValue: 9412.50,
      supplier: "MetalCorp Industries",
      location: "Delhi",
      status: "In Stock"
    },
    {
      id: 12,
      name: "MAXIMA VERTICAL 2.5 MTR",
      sku: "STL-4X8-001",
      category: "Maxima 80 MM",
      quantity: 25,
      minStock: 30,
      maxStock: 200,
      unitPrice: 125.50,
      totalValue: 3137.50,
      supplier: "MetalCorp Industries",
      location: "Mumbai",
      status: "Low Stock"
    },
    // LED SPOTLIGHTS - Available in 2 stores
    {
      id: 2,
      name: "LED SPOTLIGHTS",
      sku: "LED-SP-008",
      category: "Lighting",
      quantity: 200,
      minStock: 100,
      maxStock: 500,
      unitPrice: 25.50,
      totalValue: 5100,
      supplier: "LightTech Solutions",
      location: "Bangalore",
      status: "In Stock"
    },
    {
      id: 13,
      name: "LED SPOTLIGHTS",
      sku: "LED-SP-008",
      category: "Lighting",
      quantity: 80,
      minStock: 50,
      maxStock: 300,
      unitPrice: 25.50,
      totalValue: 2040,
      supplier: "LightTech Solutions",
      location: "Chennai",
      status: "In Stock"
    },
    // GLASS STOPPER PVC - Available in 2 stores
    {
      id: 3,
      name: "GLASS STOPPER PVC",
      sku: "SCR-M8-003",
      category: "Hardware", 
      quantity: 2500,
      minStock: 1000,
      maxStock: 5000,
      unitPrice: 0.25,
      totalValue: 625,
      supplier: "FastenTech",
      location: "Kochi",
      status: "In Stock"
    },
    {
      id: 14,
      name: "GLASS STOPPER PVC",
      sku: "SCR-M8-003",
      category: "Hardware", 
      quantity: 1200,
      minStock: 800,
      maxStock: 3000,
      unitPrice: 0.25,
      totalValue: 300,
      supplier: "FastenTech",
      location: "Pune",
      status: "In Stock"
    },
    // OCTONORM VERTICAL 2.5 MTR - Single store
    {  
      id: 4,
      name: "OCTONORM VERTICAL 2.5 MTR",
      sku: "ALU-P2-002", 
      category: "Octonorm",
      quantity: 45,
      minStock: 50,
      maxStock: 200,
      unitPrice: 35.75,
      totalValue: 1608.75,
      supplier: "Aluminum Solutions",
      location: "Kasna",
      status: "Low Stock"
    },
    // STEEL BEAM 5M - Available in 2 stores
    {
      id: 5,
      name: "STEEL BEAM 5M",
      sku: "STL-5M-006",
      category: "Steel Structure",
      quantity: 85,
      minStock: 50,
      maxStock: 200,
      unitPrice: 450.00,
      totalValue: 38250,
      supplier: "SteelWorks Ltd",
      location: "Delhi",
      status: "In Stock"
    },
    {
      id: 15,
      name: "STEEL BEAM 5M",
      sku: "STL-5M-006",
      category: "Steel Structure",
      quantity: 40,
      minStock: 30,
      maxStock: 150,
      unitPrice: 450.00,
      totalValue: 18000,
      supplier: "SteelWorks Ltd",
      location: "Noida",
      status: "In Stock"
    },
    // Single store items
    {
      id: 6,
      name: "GLASS SLIDING LOCK",
      sku: "MOT-5HP-004",
      category: "Hardware",
      quantity: 12,
      minStock: 10,
      maxStock: 30,
      unitPrice: 850.00,
      totalValue: 10200,
      supplier: "ElectroMotors Inc",
      location: "Chennai",
      status: "In Stock"
    },
    {
      id: 7,
      name: "HANGAR 10 MTR ROOF COVER",
      sku: "SAF-HLM-005",
      category: "Hangar 10 Mtr",
      quantity: 3,
      minStock: 25,
      maxStock: 100,
      unitPrice: 25.00,
      totalValue: 75,
      supplier: "SafetyFirst Co",
      location: "Noida",
      status: "Critical"
    },
    {
      id: 8,
      name: "ALUMINUM PANEL 4X8",
      sku: "ALU-4X8-007",
      category: "Panels",
      quantity: 20,
      minStock: 30,
      maxStock: 150,
      unitPrice: 75.00,
      totalValue: 1500,
      supplier: "Panel Systems",
      location: "Mumbai",
      status: "Low Stock"
    },
    {
      id: 9,
      name: "CARPET TILES GREY",
      sku: "CPT-GRY-009",
      category: "Flooring",
      quantity: 500,
      minStock: 200,
      maxStock: 1000,
      unitPrice: 12.00,
      totalValue: 6000,
      supplier: "FloorCraft",
      location: "Pune",
      status: "In Stock"
    },
    {
      id: 10,
      name: "FABRIC PANELS BLUE",
      sku: "FAB-BLU-010",
      category: "Fabric",
      quantity: 15,
      minStock: 20,
      maxStock: 100,
      unitPrice: 65.00,
      totalValue: 975,
      supplier: "TextilePro",
      location: "Kochi",
      status: "Low Stock"
    }
  ];

  // Consolidate inventory items by name/SKU across all stores
  const consolidatedItems = inventoryItems.reduce((acc, item) => {
    const key = `${item.name}-${item.sku}`;
    if (!acc[key]) {
      acc[key] = {
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        unitPrice: item.unitPrice,
        totalQuantity: 0,
        totalValue: 0,
        minStock: 0,
        maxStock: 0,
        stores: []
      };
    }
    acc[key].totalQuantity += item.quantity;
    acc[key].totalValue += item.totalValue;
    acc[key].minStock += item.minStock;
    acc[key].maxStock += item.maxStock;
    acc[key].stores.push({
      location: item.location,
      quantity: item.quantity,
      status: item.status,
      minStock: item.minStock,
      maxStock: item.maxStock
    });
    return acc;
  }, {} as Record<string, any>);

  const consolidatedInventory = Object.values(consolidatedItems);

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

  const getUniqueValues = (field: string) => {
    return [...new Set(inventoryItems.map(item => item[field as keyof typeof item]))];
  };

  const categories = getUniqueValues('category');
  const stores = getUniqueValues('location');
  const statuses = getUniqueValues('status');

  const filteredItems = consolidatedInventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStore = storeFilter === "all" || item.stores.some((store: any) => store.location === storeFilter);
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

  const totalValue = filteredItems.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockItems = filteredItems.filter(item => item.totalQuantity <= item.minStock).length;
  const criticalItems = filteredItems.filter(item => item.totalQuantity <= item.minStock * 0.5).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage your inventory levels and stock</p>
        </div>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Summary Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{inventoryItems.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-warning">{lowStockItems}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-destructive">{criticalItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div> */}

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
                  {stores.map(store => (
                    <SelectItem key={String(store)} value={String(store)}>{String(store)}</SelectItem>
                  ))}
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
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
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
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
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
              <div className="space-y-2">
                {selectedItem?.stores?.map((store: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{store.location}</p>
                      <p className="text-sm text-muted-foreground">
                        Min: {store.minStock} | Max: {store.maxStock}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg">{store.quantity}</span>
                      <Badge 
                        variant={
                          store.quantity <= store.minStock * 0.5 ? "destructive" : 
                          store.quantity <= store.minStock ? "warning" : "success"
                        }
                      >
                        {store.status}
                      </Badge>
                    </div>
                  </div>
                ))}
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
    </div>
  );
};

export default Inventory;