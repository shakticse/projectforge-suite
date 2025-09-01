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
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown, Edit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { workOrderSchema } from "@/lib/validations";

interface WorkOrder {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  assignedTo: string;
  assigneeName: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Planned' | 'In Progress' | 'Completed' | 'On Hold';
  dueDate: string;
  createdDate: string;
  bomItems?: string[];
}

interface BOMItem {
  id: string;
  bomId: string;
  materialName: string;
  quantity: number;
  status: 'Pending' | 'In Progress' | 'Completed';
}

const mockBOMItems: BOMItem[] = [
  { id: "bom-item-1", bomId: "BOM-001", materialName: "Cement", quantity: 50, status: "Pending" },
  { id: "bom-item-2", bomId: "BOM-001", materialName: "Steel Rebar", quantity: 100, status: "Pending" },
  { id: "bom-item-3", bomId: "BOM-002", materialName: "Concrete Blocks", quantity: 200, status: "Pending" },
  { id: "bom-item-4", bomId: "BOM-002", materialName: "Mortar Mix", quantity: 75, status: "In Progress" },
  { id: "bom-item-5", bomId: "BOM-003", materialName: "Electrical Cables", quantity: 300, status: "Pending" },
  { id: "bom-item-6", bomId: "BOM-003", materialName: "Circuit Breakers", quantity: 25, status: "Pending" },
];

const mockWorkOrders: WorkOrder[] = [
  {
    id: "1",
    projectId: "proj-1",
    projectName: "Office Building Construction",
    title: "Install Electrical Wiring",
    description: "Install main electrical wiring for floors 1-3",
    assignedTo: "user-1",
    assigneeName: "John Smith",
    priority: "High",
    status: "In Progress",
    dueDate: "2024-02-15",
    createdDate: "2024-01-15"
  },
  {
    id: "2",
    projectId: "proj-2",
    projectName: "Residential Complex",
    title: "Plumbing Installation",
    description: "Install water supply and drainage systems",
    assignedTo: "user-2",
    assigneeName: "Sarah Johnson",
    priority: "Medium",
    status: "Planned",
    dueDate: "2024-02-28",
    createdDate: "2024-01-20"
  },
  {
    id: "3",
    projectId: "proj-1",
    projectName: "Office Building Construction",
    title: "HVAC System Setup",
    description: "Install heating, ventilation, and air conditioning systems",
    assignedTo: "user-3",
    assigneeName: "Mike Wilson",
    priority: "Critical",
    status: "Completed",
    dueDate: "2024-01-30",
    createdDate: "2024-01-10"
  },
  {
    id: "4",
    projectId: "proj-3",
    projectName: "Factory Renovation",
    title: "Floor Renovation",
    description: "Complete renovation of production floor area",
    assignedTo: "user-1",
    assigneeName: "John Smith",
    priority: "Low",
    status: "On Hold",
    dueDate: "2024-03-15",
    createdDate: "2024-01-25"
  }
];

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("createdDate");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedBOMItems, setSelectedBOMItems] = useState<string[]>([]);

  const form = useForm({
    resolver: yupResolver(workOrderSchema),
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
      assignedTo: "",
      priority: "Medium",
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      if (editingWorkOrder) {
        // Update existing work order
        const updatedWorkOrder: WorkOrder = {
          ...editingWorkOrder,
          projectId: data.projectId,
          projectName: data.projectId === "proj-1" ? "Office Building Construction" : 
                      data.projectId === "proj-2" ? "Residential Complex" : "Factory Renovation",
          title: data.title,
          description: data.description,
          assignedTo: data.assignedTo,
          assigneeName: data.assignedTo === "user-1" ? "John Smith" : 
                       data.assignedTo === "user-2" ? "Sarah Johnson" : "Mike Wilson",
          priority: data.priority,
          dueDate: data.dueDate,
          bomItems: selectedBOMItems
        };

        setWorkOrders(workOrders.map(wo => wo.id === editingWorkOrder.id ? updatedWorkOrder : wo));
        toast.success("Work order updated successfully!");
      } else {
        // Create new work order
        const newWorkOrder: WorkOrder = {
          id: (workOrders.length + 1).toString(),
          projectId: data.projectId,
          projectName: data.projectId === "proj-1" ? "Office Building Construction" : 
                      data.projectId === "proj-2" ? "Residential Complex" : "Factory Renovation",
          title: data.title,
          description: data.description,
          assignedTo: data.assignedTo,
          assigneeName: data.assignedTo === "user-1" ? "John Smith" : 
                       data.assignedTo === "user-2" ? "Sarah Johnson" : "Mike Wilson",
          priority: data.priority,
          status: "Planned",
          dueDate: data.dueDate,
          createdDate: new Date().toISOString().split('T')[0],
          bomItems: selectedBOMItems
        };

        setWorkOrders([newWorkOrder, ...workOrders]);
        toast.success("Work order created successfully!");
      }
      
      setOpen(false);
      form.reset();
      setEditingWorkOrder(null);
      setSelectedBOMItems([]);
    } catch (error) {
      toast.error(editingWorkOrder ? "Failed to update work order" : "Failed to create work order");
    }
  };

  const handleEditWorkOrder = (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder);
    form.setValue("projectId", workOrder.projectId);
    form.setValue("title", workOrder.title);
    form.setValue("description", workOrder.description);
    form.setValue("assignedTo", workOrder.assignedTo);
    form.setValue("priority", workOrder.priority);
    form.setValue("dueDate", workOrder.dueDate);
    setSelectedBOMItems(workOrder.bomItems || []);
    setOpen(true);
  };

  const handleCreateNew = () => {
    setEditingWorkOrder(null);
    form.reset();
    setSelectedBOMItems([]);
    setOpen(true);
  };

  const handleBOMItemToggle = (itemId: string) => {
    setSelectedBOMItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedWorkOrders = workOrders
    .filter(wo => {
      const matchesSearch = wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          wo.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          wo.assigneeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || wo.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || wo.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof WorkOrder];
      let bValue: any = b[sortField as keyof WorkOrder];
      
      if (sortField === 'dueDate' || sortField === 'createdDate') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredAndSortedWorkOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWorkOrders = filteredAndSortedWorkOrders.slice(startIndex, startIndex + itemsPerPage);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'In Progress': return 'default';
      case 'Planned': return 'secondary';
      case 'On Hold': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">Manage manufacturing and construction work orders</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Work Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWorkOrder ? "Update Work Order" : "Create New Work Order"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="proj-1">Office Building Construction</SelectItem>
                            <SelectItem value="proj-2">Residential Complex</SelectItem>
                            <SelectItem value="proj-3">Factory Renovation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Install Electrical Wiring" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="user-1">John Smith</SelectItem>
                            <SelectItem value="user-2">Sarah Johnson</SelectItem>
                            <SelectItem value="user-3">Mike Wilson</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <Textarea placeholder="Detailed description of the work to be done" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Pending BOM Items</h3>
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>BOM ID</TableHead>
                          <TableHead>Material Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockBOMItems.filter(item => item.status === 'Pending').map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedBOMItems.includes(item.id)}
                                onCheckedChange={() => handleBOMItemToggle(item.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{item.bomId}</TableCell>
                            <TableCell>{item.materialName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{item.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {selectedBOMItems.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedBOMItems.length} item(s) selected for this work order
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingWorkOrder ? "Update Work Order" : "Create Work Order"}</Button>
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
                placeholder="Search work orders..."
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
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort('title')}
                >
                  Title <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('projectName')}
                >
                  Project <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('assigneeName')}
                >
                  Assigned To <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('dueDate')}
                >
                  Due Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('createdDate')}
                >
                  Created Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedWorkOrders.map((workOrder) => (
                <TableRow key={workOrder.id}>
                  <TableCell className="font-medium">{workOrder.title}</TableCell>
                  <TableCell>{workOrder.projectName}</TableCell>
                  <TableCell>{workOrder.assigneeName}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(workOrder.priority) as any}>
                      {workOrder.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(workOrder.status) as any}>
                      {workOrder.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(workOrder.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(workOrder.createdDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={workOrder.description}>
                    {workOrder.description}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditWorkOrder(workOrder)}
                      title="Edit Work Order"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedWorkOrders.length)} of {filteredAndSortedWorkOrders.length} results
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