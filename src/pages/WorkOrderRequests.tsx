import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import * as yup from "yup";

interface WorkOrderRequestItem {
  id: string;
  item: string;
  category: string;
  uom: string;
  qty: number;
}

interface WorkOrderRequest {
  id: string;
  requestNumber: string;
  requestedBy: string;
  department: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed';
  requestDate: string;
  items: WorkOrderRequestItem[];
  totalItems: number;
}

const workOrderRequestSchema = yup.object({
  department: yup.string().required("Department is required"),
  priority: yup.string().required("Priority is required"),
  items: yup.array().of(
    yup.object({
      item: yup.string().required("Item is required"),
      category: yup.string().required("Category is required"),
      uom: yup.string().required("UOM is required"),
      qty: yup.number().min(1, "Quantity must be at least 1").required("Quantity is required"),
    })
  ).min(1, "At least one item is required"),
});

const mockWorkOrderRequests: WorkOrderRequest[] = [
  {
    id: "1",
    requestNumber: "WOR-2024-001",
    requestedBy: "John Smith",
    department: "Production",
    priority: "High",
    status: "Pending",
    requestDate: "2024-01-15",
    items: [
      { id: "1", item: "Steel Rods", category: "Raw Materials", uom: "Tons", qty: 5 },
      { id: "2", item: "Concrete Mix", category: "Construction", uom: "Bags", qty: 100 }
    ],
    totalItems: 2
  },
  {
    id: "2",
    requestNumber: "WOR-2024-002",
    requestedBy: "Sarah Johnson", 
    department: "Manufacturing",
    priority: "Medium",
    status: "Approved",
    requestDate: "2024-01-20",
    items: [
      { id: "3", item: "Electrical Cables", category: "Electrical", uom: "Meters", qty: 500 }
    ],
    totalItems: 1
  }
];

const categories = ["Raw Materials", "Construction", "Electrical", "Mechanical", "Tools", "Safety Equipment"];
const departments = ["Production", "Manufacturing", "Engineering", "Quality Control", "Maintenance"];
const uomOptions = ["Pieces", "Meters", "Kilograms", "Tons", "Liters", "Bags", "Boxes"];

export default function WorkOrderRequests() {
  const [workOrderRequests, setWorkOrderRequests] = useState<WorkOrderRequest[]>(mockWorkOrderRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("requestDate");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: yupResolver(workOrderRequestSchema),
    defaultValues: {
      department: "",
      priority: "Medium",
      items: [{ item: "", category: "", uom: "", qty: 1 }],
    },
  });


  const [formItems, setFormItems] = useState([
    { item: "", category: "", uom: "", qty: 1 }
  ]);

  const addNewRow = () => {
    setFormItems([...formItems, { item: "", category: "", uom: "", qty: 1 }]);
  };

  const removeRow = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  const updateFormItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormItems(updatedItems);
  };

  const onSubmit = async (data: any) => {
    try {
      const newRequest: WorkOrderRequest = {
        id: (workOrderRequests.length + 1).toString(),
        requestNumber: `WOR-2024-${String(workOrderRequests.length + 1).padStart(3, '0')}`,
        requestedBy: "Current User",
        department: data.department,
        priority: data.priority,
        status: "Pending",
        requestDate: new Date().toISOString().split('T')[0],
        items: formItems.filter(item => item.item.trim() !== "").map((item, index) => ({
          id: (index + 1).toString(),
          ...item
        })),
        totalItems: formItems.filter(item => item.item.trim() !== "").length
      };

      setWorkOrderRequests([newRequest, ...workOrderRequests]);
      toast.success("Work order request created successfully!");
      setOpen(false);
      form.reset();
      setFormItems([{ item: "", category: "", uom: "", qty: 1 }]);
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
                          request.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
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
              Create Request
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
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Request Items</h3>
                    <Button type="button" onClick={addNewRow} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Row
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formItems.map((formItem, index) => (
                      <div key={index} className="grid grid-cols-5 gap-3 items-end">
                        <div>
                          <label className="text-sm font-medium">Item</label>
                          <Input
                            placeholder="Enter item name"
                            value={formItem.item}
                            onChange={(e) => updateFormItem(index, 'item', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Category</label>
                          <Select
                            value={formItem.category}
                            onValueChange={(value) => updateFormItem(index, 'category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">UOM</label>
                          <Select
                            value={formItem.uom}
                            onValueChange={(value) => updateFormItem(index, 'uom', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select UOM" />
                            </SelectTrigger>
                            <SelectContent>
                              {uomOptions.map((uom) => (
                                <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Qty</label>
                          <Input
                            type="number"
                            min="1"
                            value={formItem.qty}
                            onChange={(e) => updateFormItem(index, 'qty', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          {formItems.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeRow(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
                  onClick={() => handleSort('department')}
                >
                  Department <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('requestDate')}
                >
                  Request Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead>Total Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestNumber}</TableCell>
                  <TableCell>{request.requestedBy}</TableCell>
                  <TableCell>{request.department}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(request.priority) as any}>
                      {request.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(request.status) as any}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(request.requestDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{request.totalItems}</TableCell>
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