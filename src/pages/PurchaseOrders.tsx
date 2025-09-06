import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, Eye, ArrowUpDown, Filter, Trash2, Package, FileText, Check, ChevronsUpDown, Calendar, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import * as yup from "yup";

interface PurchaseOrderItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface BOMItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  availableStock: number;
}

interface PurchaseOrder {
  id: string;
  projectId: string;
  projectName: string;
  bomId: string;
  bomName: string;
  vendorId: string;
  vendorName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Completed';
  orderDate: string;
  deliveryDate: string;
  deliveryLocation: string;
  termsAndConditions: string;
  lastUpdated: string;
  updatedBy: string;
  createdBy: string;
  createdDate: string;
}

const purchaseOrderSchema = yup.object({
  projectId: yup.string().required("Project is required"),
  bomId: yup.string().required("BOM is required"),
  deliveryDate: yup.string().required("Delivery date is required"),
  deliveryLocation: yup.string().required("Delivery location is required"),
  termsAndConditions: yup.string(),
});

const mockProjects = [
  { id: "proj-1", name: "G20 Project" },
  { id: "proj-2", name: "India Energy Week" },
  { id: "proj-3", name: "Kochi Metro" },
];

const mockBOMs = [
  { id: "bom-1", name: "Steel Structure BOM", projectId: "proj-1" },
  { id: "bom-2", name: "Electrical Systems BOM", projectId: "proj-1" },
  { id: "bom-3", name: "Foundation BOM", projectId: "proj-2" },
  { id: "bom-4", name: "Finishing Work BOM", projectId: "proj-3" },
];

const mockBOMItems: Record<string, BOMItem[]> = {
  "bom-1": [
    { id: "item-1", itemName: "Steel Rebar 12mm", quantity: 100, unit: "Kg", unitPrice: 45, availableStock: 150 },
    { id: "item-2", itemName: "Steel Angle 50x50", quantity: 50, unit: "Mtr", unitPrice: 120, availableStock: 75 },
    { id: "item-3", itemName: "Welding Rod", quantity: 25, unit: "Kg", unitPrice: 85, availableStock: 40 },
  ],
  "bom-2": [
    { id: "item-4", itemName: "Electrical Wire 2.5mm", quantity: 500, unit: "Mtr", unitPrice: 12, availableStock: 800 },
    { id: "item-5", itemName: "PVC Pipe 4inch", quantity: 100, unit: "Mtr", unitPrice: 45, availableStock: 150 },
    { id: "item-6", itemName: "Switch Board", quantity: 10, unit: "Nos", unitPrice: 450, availableStock: 25 },
  ],
  "bom-3": [
    { id: "item-1", itemName: "Steel Rebar 12mm", quantity: 200, unit: "Kg", unitPrice: 45, availableStock: 150 },
    { id: "item-7", itemName: "Cement 50kg", quantity: 100, unit: "Bags", unitPrice: 350, availableStock: 200 },
    { id: "item-8", itemName: "Sand", quantity: 50, unit: "CFT", unitPrice: 25, availableStock: 300 },
  ],
  "bom-4": [
    { id: "item-9", itemName: "Paint", quantity: 20, unit: "Ltr", unitPrice: 150, availableStock: 50 },
    { id: "item-10", itemName: "Tiles", quantity: 500, unit: "Sq.Ft", unitPrice: 35, availableStock: 1000 },
  ],
};

const mockVendors = [
  { id: "vendor-1", name: "ABC Suppliers Ltd", contact: "+91 9876543210" },
  { id: "vendor-2", name: "XYZ Materials Inc", contact: "+91 8765432109" },
  { id: "vendor-3", name: "PQR Construction Supplies", contact: "+91 7654321098" },
];

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-2024-001",
    projectId: "proj-1",
    projectName: "G20 Project",
    bomId: "bom-1",
    bomName: "Steel Structure BOM",
    vendorId: "vendor-1",
    vendorName: "ABC Suppliers Ltd",
    items: [
      { id: "item-1", itemName: "Steel Rebar 12mm", description: "High grade steel rebar", quantity: 100, unit: "Kg", unitPrice: 45, totalPrice: 4500 },
      { id: "item-2", itemName: "Steel Angle 50x50", description: "L-shaped steel angle", quantity: 50, unit: "Mtr", unitPrice: 120, totalPrice: 6000 }
    ],
    totalAmount: 10500,
    status: "Approved",
    orderDate: "2024-01-15",
    deliveryDate: "2024-02-15",
    deliveryLocation: "Project Site, Noida",
    termsAndConditions: "30 days payment terms. Quality as per specifications.",
    lastUpdated: "2024-01-16",
    updatedBy: "John Smith",
    createdBy: "Alice Johnson",
    createdDate: "2024-01-15"
  },
  {
    id: "PO-2024-002",
    projectId: "proj-2",
    projectName: "India Energy Week",
    bomId: "bom-3",
    bomName: "Foundation BOM",
    vendorId: "vendor-2",
    vendorName: "XYZ Materials Inc",
    items: [
      { id: "item-7", itemName: "Cement 50kg", description: "Portland cement", quantity: 100, unit: "Bags", unitPrice: 350, totalPrice: 35000 }
    ],
    totalAmount: 35000,
    status: "Pending Approval",
    orderDate: "2024-01-20",
    deliveryDate: "2024-02-20",
    deliveryLocation: "Warehouse, Delhi",
    termsAndConditions: "45 days payment terms. Delivery as per schedule.",
    lastUpdated: "2024-01-21",
    updatedBy: "Mike Wilson",
    createdBy: "Sarah Brown",
    createdDate: "2024-01-20"
  }
];

export default function PurchaseOrders() {
  const [purchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedBOMItems, setSelectedBOMItems] = useState<BOMItem[]>([]);
  const [poItems, setPOItems] = useState<Array<{
    id: number;
    bomItemId: string;
    quantity: number;
    unitPrice: number;
    description: string;
  }>>([]);
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});
  const [sortField, setSortField] = useState<keyof PurchaseOrder>("orderDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 10;

  const form = useForm({
    resolver: yupResolver(purchaseOrderSchema),
    defaultValues: {
      projectId: "",
      bomId: "",
      deliveryDate: "",
      deliveryLocation: "",
      termsAndConditions: "",
    },
  });

  const selectedProjectId = form.watch("projectId");
  const selectedBomId = form.watch("bomId");

  const availableBOMs = useMemo(() => {
    return mockBOMs.filter(bom => bom.projectId === selectedProjectId);
  }, [selectedProjectId]);

  // Load BOM items when BOM is selected
  useMemo(() => {
    if (selectedBomId && mockBOMItems[selectedBomId]) {
      setSelectedBOMItems(mockBOMItems[selectedBomId]);
      setPOItems([]);
    } else {
      setSelectedBOMItems([]);
      setPOItems([]);
    }
  }, [selectedBomId]);

  const addPOItem = () => {
    const newId = poItems.length > 0 ? Math.max(...poItems.map(item => item.id)) + 1 : 1;
    setPOItems([...poItems, { 
      id: newId, 
      bomItemId: "", 
      quantity: 0, 
      unitPrice: 0,
      description: ""
    }]);
  };

  const removePOItem = (id: number) => {
    setPOItems(poItems.filter(item => item.id !== id));
  };

  const updatePOItem = (id: number, field: string, value: any) => {
    setPOItems(items => {
      const updatedItems = [...items];
      const itemIndex = updatedItems.findIndex(item => item.id === id);
      if (itemIndex === -1) return updatedItems;

      const updated = { ...updatedItems[itemIndex], [field]: value };

      if (field === 'bomItemId') {
        const bomItem = selectedBOMItems.find(item => item.id === value);
        if (bomItem) {
          updated.unitPrice = bomItem.unitPrice;
          updated.quantity = 1;
        }
        setOpenPopovers(prev => ({ ...prev, [id]: false }));
      }

      updatedItems[itemIndex] = updated;
      return updatedItems;
    });
  };

  const onSubmit = async (data: any) => {
    try {
      const orderItems = poItems.map(item => {
        const bomItem = selectedBOMItems.find(bi => bi.id === item.bomItemId);
        return {
          id: item.bomItemId,
          itemName: bomItem?.itemName || "",
          description: item.description,
          quantity: item.quantity,
          unit: bomItem?.unit || "",
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        };
      });

      const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

      const purchaseOrderData = {
        ...data,
        items: orderItems,
        totalAmount,
        orderDate: new Date().toISOString().split('T')[0],
        status: "Draft"
      };

      console.log("Creating Purchase Order:", purchaseOrderData);
      toast.success(`Purchase Order created successfully with ${orderItems.length} items!`);
      setOpen(false);
      form.reset();
      setPOItems([]);
      setSelectedBOMItems([]);
    } catch (error) {
      toast.error("Failed to create Purchase Order");
    }
  };

  const filteredAndSortedPOs = useMemo(() => {
    let filtered = purchaseOrders.filter(po => {
      const matchesSearch = 
        po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || po.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle special cases for sorting
      if (sortField === "totalAmount") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortField === "orderDate" || sortField === "deliveryDate") {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [purchaseOrders, searchTerm, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedPOs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPOs = filteredAndSortedPOs.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof PurchaseOrder) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof PurchaseOrder) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Completed': return 'default';
      case 'Pending Approval': return 'secondary';
      case 'Draft': return 'outline';
      case 'Rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleViewPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setViewOpen(true);
  };

  const totalPOValue = poItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage purchase orders for projects</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Purchase Order</DialogTitle>
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

                  <FormField
                    control={form.control}
                    name="deliveryLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter delivery location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="termsAndConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms and Conditions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter terms and conditions" 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedBomId && selectedBOMItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Purchase Order Items</h3>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          Total Value: ₹{totalPOValue.toLocaleString()}
                        </Badge>
                        <Button type="button" onClick={addPOItem} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    </div>

                    {poItems.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">S.No</TableHead>
                              <TableHead>Item Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="w-24">Quantity</TableHead>
                              <TableHead className="w-24">Unit</TableHead>
                              <TableHead className="w-32">Unit Price</TableHead>
                              <TableHead className="w-32">Total Price</TableHead>
                              <TableHead className="w-16">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {poItems.map((item, index) => {
                              const bomItem = selectedBOMItems.find(bi => bi.id === item.bomItemId);
                              const totalPrice = item.quantity * item.unitPrice;
                              
                              return (
                                <TableRow key={item.id}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>
                                    <Popover
                                      open={openPopovers[item.id] || false}
                                      onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [item.id]: open }))}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          aria-expanded={openPopovers[item.id] || false}
                                          className="w-full justify-between"
                                        >
                                          {item.bomItemId ? bomItem?.itemName : "Select item..."}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-full p-0">
                                        <Command>
                                          <CommandInput placeholder="Search items..." />
                                          <CommandEmpty>No item found.</CommandEmpty>
                                          <CommandList>
                                            <CommandGroup>
                                              {selectedBOMItems.map((bomItem) => (
                                                <CommandItem
                                                  key={bomItem.id}
                                                  value={bomItem.itemName}
                                                  onSelect={() => updatePOItem(item.id, 'bomItemId', bomItem.id)}
                                                >
                                                  <Check
                                                    className={`mr-2 h-4 w-4 ${
                                                      item.bomItemId === bomItem.id ? "opacity-100" : "opacity-0"
                                                    }`}
                                                  />
                                                  <div>
                                                    <div className="font-medium">{bomItem.itemName}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                      Stock: {bomItem.availableStock} {bomItem.unit} | Price: ₹{bomItem.unitPrice}
                                                    </div>
                                                  </div>
                                                </CommandItem>
                                              ))}
                                            </CommandGroup>
                                          </CommandList>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      placeholder="Enter description"
                                      value={item.description}
                                      onChange={(e) => updatePOItem(item.id, 'description', e.target.value)}
                                      className="w-full"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity || ""}
                                      onChange={(e) => updatePOItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                      className="w-full"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {bomItem?.unit || '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.unitPrice || ""}
                                      onChange={(e) => updatePOItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                      className="w-full"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removePOItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={poItems.length === 0}>
                    Create Purchase Order
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Pending Approval">Pending Approval</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Purchase Orders Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort("id")}
                >
                  PO ID
                  {getSortIcon("id")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort("projectName")}
                >
                  Project
                  {getSortIcon("projectName")}
                </Button>
              </TableHead>
              <TableHead>BOM</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort("totalAmount")}
                >
                  Total Amount
                  {getSortIcon("totalAmount")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort("status")}
                >
                  Status
                  {getSortIcon("status")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort("orderDate")}
                >
                  Order Date
                  {getSortIcon("orderDate")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort("deliveryDate")}
                >
                  Delivery Date
                  {getSortIcon("deliveryDate")}
                </Button>
              </TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPOs.length > 0 ? (
              paginatedPOs.map((po) => (
                <TableRow key={po.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{po.id}</TableCell>
                  <TableCell>{po.projectName}</TableCell>
                  <TableCell>{po.bomName}</TableCell>
                  <TableCell className="font-medium">₹{po.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(po.status)}>
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(po.deliveryDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{po.items.length}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewPO(po)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No purchase orders found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results Summary and Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min(startIndex + 1, filteredAndSortedPOs.length)} to {Math.min(startIndex + itemsPerPage, filteredAndSortedPOs.length)} of {filteredAndSortedPOs.length} results
        </div>
        
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* View Purchase Order Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details - {selectedPO?.id}</DialogTitle>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-medium">{selectedPO.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project:</span>
                      <span className="font-medium">{selectedPO.projectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BOM:</span>
                      <span className="font-medium">{selectedPO.bomName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusColor(selectedPO.status)}>
                        {selectedPO.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold">Delivery Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Date:</span>
                      <span>{new Date(selectedPO.orderDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Date:</span>
                      <span>{new Date(selectedPO.deliveryDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{selectedPO.deliveryLocation}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Order Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">₹{item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right">₹{item.totalPrice.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={5} className="font-semibold text-right">Total Amount:</TableCell>
                        <TableCell className="text-right font-bold">₹{selectedPO.totalAmount.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedPO.termsAndConditions && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Terms and Conditions</h3>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                    {selectedPO.termsAndConditions}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}