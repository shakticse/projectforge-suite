import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import * as yup from "yup";

interface WorkOrderRequestItem {
  id: string;
  materialId: string;
  materialName: string;
  category: string;
  uom: string;
  qty: number;
}

interface WorkOrderRequest {
  id: string;
  requestNumber: string;
  requestedBy: string;
  project: string;
  bom: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed';
  requestDate: string;
  completeByDate: string;
  items: WorkOrderRequestItem[];
  totalItems: number;
}

interface MaterialOption {
  id: string;
  name: string;
  category: string;
  uom: string;
}

const workOrderRequestSchema = yup.object({
  project: yup.string().required("Project is required"),
  bom: yup.string().required("BOM is required"),
  items: yup.array().of(
    yup.object({
      materialId: yup.string().required("Material is required"),
      qty: yup.number().min(1, "Quantity must be at least 1").required("Quantity is required"),
    })
  ).min(1, "At least one item is required"),
});

const mockWorkOrderRequests: WorkOrderRequest[] = [
  {
    id: "1",
    requestNumber: "WOR-2024-001",
    requestedBy: "John Smith",
    project: "G20 Project",
    bom: "BOM-001",
    status: "Pending",
    requestDate: "2024-01-15",
    completeByDate: "2024-01-25",
    items: [
      { id: "1", materialId: "mat-1", materialName: "Steel Rods", category: "Raw Materials", uom: "Tons", qty: 5 },
      { id: "2", materialId: "mat-2", materialName: "Concrete Mix", category: "Construction", uom: "Bags", qty: 100 }
    ],
    totalItems: 2
  },
  {
    id: "2",
    requestNumber: "WOR-2024-002",
    requestedBy: "Sarah Johnson", 
    project: "India Energy Week",
    bom: "BOM-002",
    status: "Approved",
    requestDate: "2024-01-20",
    completeByDate: "2024-01-24",
    items: [
      { id: "3", materialId: "mat-3", materialName: "Electrical Cables", category: "Electrical", uom: "Meters", qty: 500 }
    ],
    totalItems: 1
  }
];

const mockMaterials: MaterialOption[] = [
  { id: "mat-1", name: "Steel Rods", category: "Raw Materials", uom: "Tons" },
  { id: "mat-2", name: "Concrete Mix", category: "Construction", uom: "Bags" },
  { id: "mat-3", name: "Electrical Cables", category: "Electrical", uom: "Meters" },
  { id: "mat-4", name: "BELT TIGHTNER", category: "Mechanical", uom: "Pieces" },
  { id: "mat-5", name: "MDF 17MM 8'X4'", category: "Construction", uom: "Sheets" },
  { id: "mat-6", name: "PAPER BLADE 9MM", category: "Tools", uom: "Pieces" },
  { id: "mat-7", name: "CUTTER WIRE ROPE", category: "Tools", uom: "Meters" },
  { id: "mat-8", name: "CANOPY BEAM 3 MTR", category: "Construction", uom: "Pieces" }
];

const projects = ["G20 Project", "India Energy Week", "Kochi Metro"];
const bomOptions = ["BOM-001", "BOM-002", "BOM-003", "BOM-004"];

export default function WorkOrderRequests() {
  const [workOrderRequests, setWorkOrderRequests] = useState<WorkOrderRequest[]>(mockWorkOrderRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("requestDate");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});

  const form = useForm({
    resolver: yupResolver(workOrderRequestSchema),
    defaultValues: {
      project: "",
      bom: "",
      items: [],
    },
  });

  const [formItems, setFormItems] = useState<Array<{
    id: number;
    materialId: string;
    materialName: string;
    category: string;
    uom: string;
    qty: number;
  }>>([]);

  const addNewRow = () => {
    const newId = formItems.length > 0 ? Math.max(...formItems.map(item => item.id)) + 1 : 1;
    setFormItems([...formItems, { 
      id: newId, 
      materialId: "", 
      materialName: "",
      category: "", 
      uom: "", 
      qty: 1
    }]);
  };

  const removeRow = (id: number) => {
    setFormItems(formItems.filter(item => item.id !== id));
  };

  const updateFormItem = (id: number, field: string, value: any) => {
    setFormItems(currentItems => {
      const updatedItems = [...currentItems];
      const itemIndex = updatedItems.findIndex(item => item.id === id);
      
      if (itemIndex === -1) return currentItems;
      
      const updated = { ...updatedItems[itemIndex], [field]: value };
      
      if (field === 'materialId') {
        const selectedMaterial = mockMaterials.find(mat => mat.id === value);
        if (selectedMaterial) {
          updated.materialName = selectedMaterial.name;
          updated.category = selectedMaterial.category;
          updated.uom = selectedMaterial.uom;
        }
        
        // Close the popover
        setOpenPopovers(prev => ({ ...prev, [id]: false }));
      }
      
      updatedItems[itemIndex] = updated;
      return updatedItems;
    });
  };

  const onSubmit = async (data: any) => {
    try {
      const newRequest: WorkOrderRequest = {
        id: (workOrderRequests.length + 1).toString(),
        requestNumber: `WOR-2024-${String(workOrderRequests.length + 1).padStart(3, '0')}`,
        requestedBy: "Current User",
        project: data.project,
        bom: data.bom,
        status: "Pending",
        requestDate: new Date().toISOString().split('T')[0],
        items: formItems.filter(item => item.materialId.trim() !== "").map((item, index) => ({
          id: (index + 1).toString(),
          materialId: item.materialId,
          materialName: item.materialName,
          category: item.category,
          uom: item.uom,
          qty: item.qty
        })),
        totalItems: formItems.filter(item => item.materialId.trim() !== "").length
      };

      setWorkOrderRequests([newRequest, ...workOrderRequests]);
      toast.success("Work order request created successfully!");
      setOpen(false);
      form.reset();
      setFormItems([]);
    } catch (error) {
      toast.error("Failed to create work order request");
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedRequests = workOrderRequests
    .filter(request => {
      const matchesSearch = request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.bom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.items.some(item => 
                            item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchTerm.toLowerCase())
                          );
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesProject = projectFilter === "all" || request.project === projectFilter;
      return matchesSearch && matchesStatus && matchesProject;
    })
    .sort((a, b) => {
      let aValue = a[sortField as keyof WorkOrderRequest];
      let bValue = b[sortField as keyof WorkOrderRequest];
      
      if (sortField === 'requestDate') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredAndSortedRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredAndSortedRequests.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Approved': return 'default';
      case 'In Progress': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Order Requests</h1>
          <p className="text-muted-foreground">Request items for work orders and track approvals</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Work Order Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Work Order Request</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="project"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project} value={project}>{project}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bom"
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
                            {bomOptions.map((bom) => (
                              <SelectItem key={bom} value={bom}>{bom}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Request Items</h3>
                    <div className="flex gap-2">
                      <Button type="button" onClick={addNewRow} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Row
                      </Button>
                    </div>
                  </div>

                  {formItems.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Row #</TableHead>
                            <TableHead>Item</TableHead>
                            {/* <TableHead>Material Name</TableHead> */}
                            <TableHead>Category</TableHead>
                            <TableHead>UOM</TableHead>
                            <TableHead className="w-32">Quantity</TableHead>
                            <TableHead className="w-16">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formItems.map((formItem, index) => (
                            <TableRow key={formItem.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Popover 
                                  open={openPopovers[formItem.id] || false}
                                  onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [formItem.id]: open }))}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openPopovers[formItem.id] || false}
                                      className="w-full justify-between"
                                    >
                                      {formItem.materialId ? 
                                        mockMaterials.find(mat => mat.id === formItem.materialId)?.name || "Select material..." 
                                        : "Select material..."
                                      }
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Search items..." />
                                      <CommandList>
                                        <CommandEmpty>No material found.</CommandEmpty>
                                        <CommandGroup>
                                          {mockMaterials.map((material) => (
                                            <CommandItem
                                              key={material.id}
                                              value={material.name}
                                              onSelect={() => updateFormItem(formItem.id, 'materialId', material.id)}
                                            >
                                              <Check
                                                className={`mr-2 h-4 w-4 ${
                                                  formItem.materialId === material.id ? "opacity-100" : "opacity-0"
                                                }`}
                                              />
                                              <div className="flex flex-col">
                                                <span>{material.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                  {material.category} • {material.uom}
                                                </span>
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                              {/* <TableCell>
                                <Input
                                  value={formItem.materialName}
                                  onChange={(e) => updateFormItem(formItem.id, 'materialName', e.target.value)}
                                  disabled
                                  className="bg-muted"
                                />
                              </TableCell> */}
                              <TableCell>
                                <Input
                                  value={formItem.category}
                                  onChange={(e) => updateFormItem(formItem.id, 'category', e.target.value)}
                                  disabled
                                  className="bg-muted"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={formItem.uom}
                                  onChange={(e) => updateFormItem(formItem.id, 'uom', e.target.value)}
                                  disabled
                                  className="bg-muted"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={formItem.qty}
                                  onChange={(e) => updateFormItem(formItem.id, 'qty', parseInt(e.target.value) || 1)}
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeRow(formItem.id)}
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

                  {formItems.length === 0 && (
                    <div className="border border-dashed rounded-lg p-8 text-center">
                      <div className="h-12 w-12 mx-auto text-muted-foreground mb-4 flex items-center justify-center">
                        <Plus className="h-6 w-6" />
                      </div>
                      <p className="text-muted-foreground">No items added yet</p>
                      <p className="text-sm text-muted-foreground">Click "Add Row" to get started</p>
                    </div>
                  )}

                  {formItems.length > 0 && (
                    <div className="flex justify-end space-x-6 pt-4 border-t bg-muted/50 p-4 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">Total Items: </span>
                        <span>{formItems.filter(item => item.materialId.trim() !== "").length}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Total Quantity: </span>
                        <span>{formItems.reduce((sum, item) => sum + (item.qty || 0), 0)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Request</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>{project}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Order Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort('requestNumber')}
                >
                  Request # <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('requestedBy')}
                >
                  Requested By <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('project')}
                >
                  Project <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('bom')}
                >
                  BOM <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('requestDate')}
                >
                  Request Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('completeByDate')}
                >
                  CompleteBy Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                {/* <TableHead>Total Items</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestNumber}</TableCell>
                  <TableCell>{request.requestedBy}</TableCell>
                  <TableCell>{request.project}</TableCell>
                  <TableCell>{request.bom}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(request.status) as any}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(request.requestDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(request.completeByDate).toLocaleDateString()}
                  </TableCell>
                  {/* <TableCell>{request.totalItems}</TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedRequests.length)} of {filteredAndSortedRequests.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}