import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, Truck, ArrowRight, ArrowLeft, Package, User, ArrowUpDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { gatePassSchema } from "@/lib/validations";

interface GatePass {
  id: string;
  type: 'Inward' | 'Outward';
  vehicleNumber: string;
  driverName: string;
  purpose: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
  }>;
  status: 'Active' | 'Completed' | 'Cancelled';
  createdDate: string;
  completedDate?: string;
}

interface BOMItem {
  id: string;
  name: string;
  totalQuantity: number;
  pendingQuantity: number;
  deliveredQuantity: number;
  allocatedQuantity?: number;
}

const mockBOMItems: BOMItem[] = [
  { id: "1", name: "Steel Rebar", totalQuantity: 200, pendingQuantity: 100, deliveredQuantity: 100 },
  { id: "2", name: "Cement Bags", totalQuantity: 300, pendingQuantity: 150, deliveredQuantity: 150 },
  { id: "3", name: "Power Tools", totalQuantity: 20, pendingQuantity: 5, deliveredQuantity: 15 },
];

const mockProjects = [
  { id: "proj-1", name: "Office Building Construction" },
  { id: "proj-2", name: "Residential Complex Phase 1" },
  { id: "proj-3", name: "Infrastructure Development" },
];

const mockBOMs = [
  { id: "bom-1", name: "BOM-001 - Foundation Materials", projectId: "proj-1" },
  { id: "bom-2", name: "BOM-002 - Structural Steel", projectId: "proj-1" },
  { id: "bom-3", name: "BOM-003 - Electrical Components", projectId: "proj-2" },
  { id: "bom-4", name: "BOM-004 - Plumbing Materials", projectId: "proj-2" },
];

const mockLocations = [
  { id: "site-1", name: "Site A - Main Construction Site", type: "Site" },
  { id: "site-2", name: "Site B - Secondary Site", type: "Site" },
  { id: "store-1", name: "Store A - Main Warehouse", type: "Store" },
  { id: "store-2", name: "Store B - Regional Warehouse", type: "Store" },
];

const mockVehicles = ["ABC-1234", "XYZ-5678", "DEF-9012", "GHI-3456", "JKL-7890"];

const mockGatePasses: GatePass[] = [
  {
    id: "GP-001",
    type: "Inward",
    vehicleNumber: "ABC-1234",
    driverName: "John Driver",
    purpose: "Material Delivery",
    items: [
      { itemId: "item-1", itemName: "Steel Rebar", quantity: 100 },
      { itemId: "item-2", itemName: "Cement Bags", quantity: 50 }
    ],
    status: "Completed",
    createdDate: "2024-01-15",
    completedDate: "2024-01-15"
  },
  {
    id: "GP-002",
    type: "Outward",
    vehicleNumber: "XYZ-5678",
    driverName: "Sarah Transport",
    purpose: "Equipment Return",
    items: [
      { itemId: "item-3", itemName: "Power Tools", quantity: 5 }
    ],
    status: "Active",
    createdDate: "2024-01-20"
  }
];

export default function GatePass() {
  const [gatePasses] = useState<GatePass[]>(mockGatePasses);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemNameFilter, setItemNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState<string>("createdDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [open, setOpen] = useState(false);
  const [bomItems, setBomItems] = useState<BOMItem[]>(mockBOMItems.map(item => ({ ...item, allocatedQuantity: 0 })));
  const [selectedProject, setSelectedProject] = useState<string>("");

  const form = useForm({
    resolver: yupResolver(gatePassSchema),
    defaultValues: {
      type: "Inward",
      projectId: "",
      bomId: "",
      source: "",
      destination: "",
      vehicleNumber: "",
      driverName: "",
      purpose: "",
      items: [],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      console.log("Creating gate pass:", data);
      toast.success("Gate pass created successfully!");
      setOpen(false);
      form.reset();
      setSelectedProject("");
    } catch (error) {
      toast.error("Failed to create gate pass");
    }
  };

  const filteredBOMs = mockBOMs.filter(bom => bom.projectId === selectedProject);

  const filteredGatePasses = gatePasses
    .filter(gp => {
      const matchesSearch = gp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gp.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gp.driverName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || gp.status === statusFilter;
      const matchesType = typeFilter === "All" || gp.type === typeFilter;
      const matchesItemName = itemNameFilter === "" || 
        gp.items.some(item => item.itemName.toLowerCase().includes(itemNameFilter.toLowerCase()));
      
      return matchesSearch && matchesStatus && matchesType && matchesItemName;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "vehicleNumber":
          aValue = a.vehicleNumber;
          bValue = b.vehicleNumber;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.createdDate;
          bValue = b.createdDate;
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });

  const totalPages = Math.ceil(filteredGatePasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGatePasses = filteredGatePasses.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const updateBOMItemAllocation = (itemId: string, quantity: number) => {
    setBomItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, allocatedQuantity: Math.min(quantity, item.pendingQuantity) }
          : item
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Active': return 'secondary';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'Inward' ? ArrowRight : ArrowLeft;
  };

  const getTypeColor = (type: string) => {
    return type === 'Inward' ? 'text-green-600' : 'text-blue-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gate Pass</h1>
          <p className="text-muted-foreground">Manage inward and outward movement of goods</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Gate Pass
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Gate Pass</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Inward">Inward</SelectItem>
                            <SelectItem value="Outward">Outward</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedProject(value);
                          form.setValue("bomId", "");
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockProjects.map((project) => (
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedProject}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select BOM" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredBOMs.map((bom) => (
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
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockLocations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
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
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockLocations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
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
                    name="vehicleNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Number</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockVehicles.map((vehicle) => (
                              <SelectItem key={vehicle} value={vehicle}>
                                {vehicle}
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
                    name="driverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Driver" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose</FormLabel>
                        <FormControl>
                          <Input placeholder="Material delivery, equipment return, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Allocate Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        {/* <TableHead className="text-right">Total Qty</TableHead> */}
                        <TableHead className="text-right">Pending Qty</TableHead>
                        {/* <TableHead className="text-right">Delivered Qty</TableHead> */}
                        <TableHead className="text-right">Allocate Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bomItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          {/* <TableCell className="text-right">{item.totalQuantity}</TableCell> */}
                          <TableCell className="text-right">{item.pendingQuantity}</TableCell>
                          {/* <TableCell className="text-right">{item.deliveredQuantity}</TableCell> */}
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={0}
                              max={item.pendingQuantity}
                              value={item.allocatedQuantity || 0}
                              onChange={(e) => updateBOMItemAllocation(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 text-right"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Gate Pass</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search gate passes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by item name..."
            value={itemNameFilter}
            onChange={(e) => setItemNameFilter(e.target.value)}
            className="w-48"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="Inward">Inward</SelectItem>
            <SelectItem value="Outward">Outward</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("id")}>
                <div className="flex items-center gap-2">
                  Gate Pass ID
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("vehicleNumber")}>
                <div className="flex items-center gap-2">
                  Vehicle Number
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Driver Name</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                <div className="flex items-center gap-2">
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("createdDate")}>
                <div className="flex items-center gap-2">
                  Created Date
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGatePasses.map((gatePass) => {
              const TypeIcon = getTypeIcon(gatePass.type);
              return (
                <TableRow key={gatePass.id}>
                  <TableCell className="font-medium">{gatePass.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TypeIcon className={`h-4 w-4 ${getTypeColor(gatePass.type)}`} />
                      <Badge variant="outline" className={getTypeColor(gatePass.type)}>
                        {gatePass.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{gatePass.vehicleNumber}</TableCell>
                  <TableCell>{gatePass.driverName}</TableCell>
                  <TableCell className="max-w-xs truncate">{gatePass.purpose}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {gatePass.items.length} items
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(gatePass.status) as any}>
                      {gatePass.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(gatePass.createdDate).toLocaleDateString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
    </div>
  );
}