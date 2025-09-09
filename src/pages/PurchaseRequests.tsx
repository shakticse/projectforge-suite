import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, Eye, ArrowUpDown, Filter, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { purchaseRequestSchema } from "@/lib/validations";

interface PurchaseRequestItem {
  rowNum: number;
  itemId: string;
  itemName: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  discPercent: number;
  totalPrice: number;
}

interface BOMItem {
  id: string;
  itemName: string;
  requestedQty: number;
  allocatedQty: number;
  pendingQty: number;
  unit: string;
  unitPrice: number;
}

interface PurchaseRequest {
  id: string;
  projectId: string;
  projectName: string;
  vendor: string;
  deliveredTo: string;
  bomId: string;
  bomName: string;
  vendorId: string;
  vendorName: string;
  items: PurchaseRequestItem[];
  totalAmount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed';
  startDate: string;
  endDate: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  completionDate?: string;
  deliveryLocation: string;
  lastUpdated: string;
  updatedBy: string;
  createdBy: string;
  createdDate: string;
}

const mockProjects = [
  { id: "proj-1", name: "Office Building Construction" },
  { id: "proj-2", name: "Residential Complex Phase 1" },
  { id: "proj-3", name: "Shopping Mall Development" },
];

const mockBOMs = [
  { id: "bom-1", name: "Steel Structure BOM", projectId: "proj-1" },
  { id: "bom-2", name: "Electrical Systems BOM", projectId: "proj-1" },
  { id: "bom-3", name: "Foundation BOM", projectId: "proj-2" },
];

const mockBOMItems: Record<string, BOMItem[]> = {
  "bom-1": [
    { id: "item-1", itemName: "Steel Rebar 12mm", requestedQty: 100, allocatedQty: 30, pendingQty: 70, unit: "Kg", unitPrice: 15 },
    { id: "item-2", itemName: "Cement 50kg", requestedQty: 200, allocatedQty: 50, pendingQty: 150, unit: "Bags", unitPrice: 25 },
    { id: "item-5", itemName: "Steel Angle 50x50", requestedQty: 75, allocatedQty: 25, pendingQty: 50, unit: "Mtr", unitPrice: 30 },
  ],
  "bom-2": [
    { id: "item-3", itemName: "Electrical Wire 2.5mm", requestedQty: 500, allocatedQty: 200, pendingQty: 300, unit: "Mtr", unitPrice: 5 },
    { id: "item-4", itemName: "PVC Pipe 4inch", requestedQty: 150, allocatedQty: 50, pendingQty: 100, unit: "Mtr", unitPrice: 12 },
  ],
  "bom-3": [
    { id: "item-1", itemName: "Steel Rebar 12mm", requestedQty: 250, allocatedQty: 100, pendingQty: 150, unit: "Kg", unitPrice: 15 },
    { id: "item-2", itemName: "Cement 50kg", requestedQty: 300, allocatedQty: 100, pendingQty: 200, unit: "Bags", unitPrice: 25 },
  ],
};

const mockItems = [
  { id: "item-1", name: "Steel Rebar 12mm", unitPrice: 15 },
  { id: "item-2", name: "Cement 50kg", unitPrice: 25 },
  { id: "item-3", name: "Electrical Wire 2.5mm", unitPrice: 5 },
  { id: "item-4", name: "PVC Pipe 4inch", unitPrice: 12 },
  { id: "item-5", name: "Steel Angle 50x50", unitPrice: 30 },
];

const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: "PO-001",
    projectId: "proj-1",
    projectName: "Office Building Construction",
    vendor: "ABC Supplier",
    deliveredTo: "Noida",
    bomId: "bom-1",
    bomName: "Steel Structure BOM",
    vendorId: "vendor-1",
    vendorName: "ABC Suppliers Ltd",
    items: [
      { rowNum: 1, itemId: "item-1", itemName: "Steel Rebar 12mm", quantity: 100, uom: "Sq.Mtr.", unitPrice: 15, discPercent:12.5, totalPrice: 1500 },
      { rowNum: 2, itemId: "item-2", itemName: "Cement 50kg", quantity: 50,  uom: "Inch.", unitPrice: 30, discPercent:5, totalPrice: 1250 }
    ],
    totalAmount: 2750,
    status: "In Progress",
    startDate: "2024-01-10",
    endDate: "2024-02-15",
    approvalStatus: "Approved",
    completionDate: undefined,
    lastUpdated: "2024-01-15",
    updatedBy: "John Smith",
    createdBy: "Alice Johnson",
    createdDate: "2024-01-10",
    deliveryLocation: "Site",
  },
  {
    id: "PO-002",
    projectId: "proj-2",
    projectName: "Residential Complex Phase 1",
    vendor: "BBC Supplier",
    deliveredTo: "Site",
    bomId: "bom-3",
    bomName: "Foundation BOM",
    vendorId: "vendor-2",
    vendorName: "XYZ Materials Inc",
    items: [
      { rowNum: 1, itemId: "item-3", itemName: "Electrical Wire 2.5mm", quantity: 500,  uom: "Sq.Mtr.", unitPrice: 15, discPercent:12.5, totalPrice: 2500 }
    ],
    totalAmount: 2500,
    status: "Pending",
    startDate: "2024-01-15",
    endDate: "2024-02-20",
    approvalStatus: "Pending",
    completionDate: undefined,
    lastUpdated: "2024-01-16",
    updatedBy: "Mike Wilson",
    createdBy: "Bob Davis",
    createdDate: "2024-01-15",
    deliveryLocation: "Noida",
  },
  {
    id: "PO-003",
    projectId: "proj-1",
    projectName: "Office Building Construction",
    vendor: "BBC Supplier",
    deliveredTo: "Site",
    bomId: "bom-2",
    bomName: "Electrical Systems BOM",
    vendorId: "vendor-1",
    vendorName: "ABC Suppliers Ltd",
    items: [
      { rowNum: 1, itemId: "item-4", itemName: "PVC Pipe 4inch", quantity: 200,  uom: "Sq.Mtr.", unitPrice: 100, discPercent:10, totalPrice: 2400 },
      { rowNum: 2, itemId: "item-5", itemName: "Steel Angle 50x50", quantity: 75,  uom: "Sq.Mtr.", unitPrice: 150, discPercent:5.5, totalPrice: 2250 }
    ],  
    totalAmount: 4650,
    status: "Completed",
    startDate: "2024-01-05",
    endDate: "2024-01-25",
    approvalStatus: "Approved",
    completionDate: "2024-01-25",
    lastUpdated: "2024-01-25",
    updatedBy: "Sarah Brown",
    createdBy: "Tom Wilson",
    createdDate: "2024-01-05",
    deliveryLocation: "Kasna",
  }
];

export default function PurchaseRequests() {
  const [purchaseRequests] = useState<PurchaseRequest[]>(mockPurchaseRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseRequest | null>(null);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [purchaseOrderQtys, setPurchaseOrderQtys] = useState<Record<string, number>>({});
  const itemsPerPage = 10;

  const form = useForm({
    resolver: yupResolver(purchaseRequestSchema),
    defaultValues: {
      projectId: "",
      bomId: "",
      vendorId: "",
      items: [{ itemId: "", quantity: 1 }],
      deliveryDate: new Date().toISOString().split('T')[0],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const selectedProjectId = form.watch("projectId");
  const selectedBomId = form.watch("bomId");
  const watchedItems = form.watch("items");

  const availableBOMs = useMemo(() => {
    return mockBOMs.filter(bom => bom.projectId === selectedProjectId);
  }, [selectedProjectId]);

  // Load BOM items when BOM is selected
  useMemo(() => {
    if (selectedBomId && mockBOMItems[selectedBomId]) {
      const items = mockBOMItems[selectedBomId];
      setBomItems(items);
      // Initialize purchase order quantities to 0
      const initialQtys: Record<string, number> = {};
      items.forEach(item => {
        initialQtys[item.id] = 0;
      });
      setPurchaseOrderQtys(initialQtys);
    } else {
      setBomItems([]);
      setPurchaseOrderQtys({});
    }
  }, [selectedBomId]);

  const totalItemCount = bomItems.length;
  const totalPurchaseOrderQty = Object.values(purchaseOrderQtys).reduce((sum, qty) => sum + (qty || 0), 0);
  const validItemsCount = Object.values(purchaseOrderQtys).filter(qty => qty > 0).length;

  const filteredAndSortedPOs = useMemo(() => {
    let filtered = purchaseRequests.filter(po => {
      const matchesSearch = 
        po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || po.status === statusFilter;
      const matchesApproval = approvalFilter === "all" || po.approvalStatus === approvalFilter;
      
      return matchesSearch && matchesStatus && matchesApproval;
    });

    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue = a[sortColumn as keyof PurchaseRequest];
        let bValue = b[sortColumn as keyof PurchaseRequest];
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [purchaseRequests, searchTerm, statusFilter, approvalFilter, sortColumn, sortDirection]);

  const paginatedPOs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedPOs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedPOs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedPOs.length / itemsPerPage);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handlePurchaseOrderQtyChange = (itemId: string, qty: number) => {
    setPurchaseOrderQtys(prev => ({
      ...prev,
      [itemId]: qty
    }));
  };

  const onSubmit = async (data: any) => {
    try {
      // Get items with valid purchase order quantities
      const itemsForPO = bomItems.filter(item => purchaseOrderQtys[item.id] > 0)
        .map(item => ({
          itemId: item.id,
          itemName: item.itemName,
          quantity: purchaseOrderQtys[item.id],
          unitPrice: item.unitPrice
        }));

      const purchaseRequestData = {
        ...data,
        items: itemsForPO,
        totalItems: itemsForPO.length,
        totalQuantity: totalPurchaseOrderQty
      };

      console.log("Creating purchase Request:", purchaseRequestData);
      toast.success(`Purchase Request created successfully for ${itemsForPO.length} items!`);
      setOpen(false);
      form.reset();
      setBomItems([]);
      setPurchaseOrderQtys({});
    } catch (error) {
      toast.error("Failed to create purchase Request");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Approved': return 'default';
      case 'In Progress': return 'secondary';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getApprovalColor = (approval: string) => {
    switch (approval) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Request</h1>
          <p className="text-muted-foreground">Create Purchase Request</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Purchase Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Purchase Request</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockProjects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BOM</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select BOM" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableBOMs.map(bom => (
                              <SelectItem key={bom.id} value={bom.id}>
                                {bom.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vendorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vendor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vendor-1">ABC Suppliers Ltd</SelectItem>
                            <SelectItem value="vendor-2">XYZ Materials Inc</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedBomId && bomItems.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">BOM Items</h3>
                      <Badge variant="outline">
                        {validItemsCount} of {totalItemCount} items selected
                      </Badge>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead className="w-24">Requested Qty</TableHead>
                            <TableHead className="w-24">Allocated Qty</TableHead>
                            <TableHead className="w-24">Pending Qty</TableHead>
                            <TableHead className="w-24">Unit</TableHead>
                            <TableHead className="w-32">Purchase Order Qty</TableHead>
                            <TableHead className="w-24">Unit Price</TableHead>
                            <TableHead className="w-24">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bomItems.map((item) => {
                            const poQty = purchaseOrderQtys[item.id] || 0;
                            const total = poQty * item.unitPrice;
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                <TableCell>{item.requestedQty}</TableCell>
                                <TableCell>{item.allocatedQty}</TableCell>
                                <TableCell>
                                  <Badge variant={item.pendingQty > 0 ? "destructive" : "default"}>
                                    {item.pendingQty}
                                  </Badge>
                                </TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={item.pendingQty}
                                    value={poQty}
                                    onChange={(e) => handlePurchaseOrderQtyChange(item.id, parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-full"
                                  />
                                </TableCell>
                                <TableCell>${item.unitPrice}</TableCell>
                                <TableCell className="font-medium">
                                  ${total.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <div className="space-x-6">
                        <span className="text-sm font-medium">
                          Total Items: <span className="text-primary">{totalItemCount}</span>
                        </span>
                        <span className="text-sm font-medium">
                          Items for PO: <span className="text-primary">{validItemsCount}</span>
                        </span>
                        <span className="text-sm font-medium">
                          Total PO Quantity: <span className="text-primary">{totalPurchaseOrderQty}</span>
                        </span>
                        <span className="text-sm font-medium">
                          Total Value: <span className="text-primary">
                            ${bomItems.reduce((sum, item) => sum + ((purchaseOrderQtys[item.id] || 0) * item.unitPrice), 0).toFixed(2)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : selectedBomId ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items found in the selected BOM</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Please select a BOM to view items</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={validItemsCount === 0}
                  >
                    Create Purchase Request ({validItemsCount} items)
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={approvalFilter} onValueChange={setApprovalFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Approval" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Approval</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center space-x-1">
                  <span>PO ID</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('projectName')}
              >
                <div className="flex items-center space-x-1">
                  <span>Project Name</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('vendor')}
              >
                <div className="flex items-center space-x-1">
                  <span>Vendor Name</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('deliveredTo')}
              >
                <div className="flex items-center space-x-1">
                  <span>Delivered To</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              {/* <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('startDate')}
              >
                <div className="flex items-center space-x-1">
                  <span>Start Date</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead> */}
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('endDate')}
              >
                <div className="flex items-center space-x-1">
                  <span>Deliver By</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              {/* <TableHead>Approval Status</TableHead> */}
              {/* <TableHead>Completion Date</TableHead> */}
              <TableHead>Status</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('lastUpdated')}
              >
                <div className="flex items-center space-x-1">
                  <span>Last Updated</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPOs.map((po) => (
              <TableRow key={po.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{po.id}</TableCell>
                <TableCell>{po.projectName}</TableCell>
                <TableCell>{po.vendor}</TableCell>
                <TableCell>{po.deliveredTo}</TableCell>
                {/* <TableCell>{new Date(po.startDate).toLocaleDateString()}</TableCell> */}
                <TableCell>{new Date(po.endDate).toLocaleDateString()}</TableCell>
                {/* <TableCell>
                  <Badge variant={getApprovalColor(po.approvalStatus) as any}>
                    {po.approvalStatus}
                  </Badge>
                </TableCell> */}
                {/* <TableCell>
                  {po.completionDate ? new Date(po.completionDate).toLocaleDateString() : "-"}
                </TableCell> */}
                <TableCell>
                  <Badge variant={getStatusColor(po.status) as any}>
                    {po.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(po.lastUpdated).toLocaleDateString()}</TableCell>
                <TableCell>{po.updatedBy}</TableCell>
                <TableCell>{po.createdBy}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPO(po);
                      setViewOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Request Details - {selectedPO?.id}</DialogTitle>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Basic Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>PO ID:</strong> {selectedPO.id}</p>
                    <p><strong>Project:</strong> {selectedPO.projectName}</p>
                    <p><strong>BOM:</strong> {selectedPO.bomName}</p>
                    <p><strong>Vendor:</strong> {selectedPO.vendorName}</p>
                    <p><strong>Total Amount:</strong> ${selectedPO.totalAmount}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Dates & Status</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>PO Creation Date:</strong> {new Date(selectedPO.startDate).toLocaleDateString()}</p>
                    <p><strong>Delivery Location:</strong> {selectedPO.deliveryLocation}</p>
                    <p><strong>Expected Delivery Date:</strong> {selectedPO.completionDate ? new Date(selectedPO.completionDate).toLocaleDateString() : "Not completed"}</p>
                    <p><strong>Status:</strong> <Badge variant={getStatusColor(selectedPO.status) as any}>{selectedPO.status}</Badge></p>
                    <p><strong>Approval:</strong> <Badge variant={getApprovalColor(selectedPO.approvalStatus) as any}>{selectedPO.approvalStatus}</Badge></p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row #</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Disc %</TableHead>
                      <TableHead>Total Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPO.items.map((item) => (
                      <TableRow key={item.rowNum}>
                        <TableCell>{item.rowNum}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.uom}</TableCell>
                        <TableCell>{item.unitPrice}</TableCell>
                        <TableCell>{item.discPercent}</TableCell>
                        <TableCell>{item.totalPrice}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Created By:</strong> {selectedPO.createdBy}</p>
                  <p><strong>Created Date:</strong> {new Date(selectedPO.createdDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p><strong>Updated By:</strong> {selectedPO.updatedBy}</p>
                  <p><strong>Last Updated:</strong> {new Date(selectedPO.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}