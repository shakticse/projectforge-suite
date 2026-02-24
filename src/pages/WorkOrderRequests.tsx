import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, Check, ChevronsUpDown, Edit } from "lucide-react";
import { toast } from "sonner";
import * as yup from "yup";
import { serviceListService } from "@/services/serviceListService";
import { workOrderService } from "@/services/workOrderService";
import { projectService } from "@/services/projectService";
import { formatDateTime } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface WorkOrderRequestItem {
  id: string;
  serviceId: string;
  serviceName: string;
  category?: string;
  uom?: string;
  qty: number;
}

interface WorkOrderRequest {
  id: string;
  requestNumber: string;
  createddBy: string;
  projectName: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed';
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
  items: WorkOrderRequestItem[];
  totalItems: number;
}

interface ServiceOption {
  id: string;
  name: string;
  category?: string;
  uom?: string;
}

const workOrderRequestSchema = yup.object({
  project: yup.string().required("Project is required"),
  description: yup.string().nullable(),
  items: yup.array().nullable(),
});



export default function WorkOrderRequests() {
  const { user } = useAuth();
  const [workOrderRequests, setWorkOrderRequests] = useState<WorkOrderRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("requestDate");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<{ id: string; projectName: string }[]>([]);
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});
  const [servicesOptions, setServicesOptions] = useState<ServiceOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [editingRequest, setEditingRequest] = useState<WorkOrderRequest | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState<WorkOrderRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [popupMessage, setPopupMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });
  const [deletePopupMessage, setDeletePopupMessage] = useState<{ type: 'error' | null; text: string }>({ type: null, text: '' });

  const form = useForm({
    resolver: yupResolver(workOrderRequestSchema),
    defaultValues: {
      project: "",
      description: "",
      items: [],
    },
  });

  const [formItems, setFormItems] = useState<Array<{
    id: number;
    serviceId: string;
    serviceName: string;
    category: string;
    uom: string;
    qty: number;
  }>>([]);

  const fetchWorkOrderRequests = async () => {
    setLoadingRequests(true);
    try {
      const list: any = await workOrderService.getAll();
      setWorkOrderRequests(list || []);
    } catch (err) {
      console.error('Failed to fetch work orders', err);
      toast.error('Failed to load work orders');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
       try {
        const projRes: any = await projectService.getAllProjects();
        setProjects(projRes || []);
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }
      try {
        const services: any = await serviceListService.getAllServices();
        setServicesOptions(services || []);
      } catch (err) {
        console.error('Failed to fetch services', err);
      }

      await fetchWorkOrderRequests();
    };

    fetchAll();
  }, []);

  useEffect(() => {
    form.setValue("items", formItems);
  }, [formItems, form]);

  const addNewRow = () => {
    const newId = formItems.length > 0 ? Math.max(...formItems.map(item => item.id)) + 1 : 1;
    setFormItems([...formItems, { 
      id: newId, 
      serviceId: "", 
      serviceName: "",
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

      const updated = { ...updatedItems[itemIndex], [field]: value } as any;

      if (field === 'serviceId') {
        const selected = servicesOptions.find(s => s.id === value);
        if (selected) {
          updated.serviceName = selected.name;
          updated.category = selected.category || '';
          updated.uom = selected.uom || '';
        }

        // Close the popover
        setOpenPopovers(prev => ({ ...prev, [id]: false }));
      }

      if (field === 'qty') {
        updated.qty = value;
      }

      updatedItems[itemIndex] = updated;
      return updatedItems;
    });
  };

  const onSubmit = async (data: any) => {
    console.log("Form submitted with data:", data);
    console.log("FormItems state:", formItems);
    
    if (formItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const itemsWithService = formItems.filter(item => item.serviceId);
    if (itemsWithService.length === 0) {
      toast.error("Please select a service for all items");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        createdBy: user?.email,
        projectId: data.project,
        description: data.description,
        items: itemsWithService.map((item) => ({
          itemId: item.serviceId,
          qty: item.qty,
        })),
      };

      console.log("Submitting payload:", payload);
      
      if (editingRequest) {
        const updated = await workOrderService.update(editingRequest.id, payload);
        console.log("Update response:", updated);
        toast.success("Work order request updated successfully!");
        setEditingRequest(null);
        setPopupMessage({ type: null, text: '' });
      } else {
        const created = await workOrderService.create(payload);
        console.log("Create response:", created);
        toast.success("Work order request created successfully!");
        setPopupMessage({ type: null, text: '' });
      }

      // refresh list
      await fetchWorkOrderRequests();
      setOpen(false);
      form.reset();
      setFormItems([]);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to save work order request';
      setPopupMessage({ type: 'error', text: String(msg) });
      toast.error(String(msg));
      console.error("Error saving work order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (request: WorkOrderRequest) => {
    try {
      const woDetails: any = await workOrderService.getById(request.id);

      // 1. Project Lookup (Optimized)
      let projectId: string | number = woDetails.projectId;
      if (!projectId && woDetails.projectName) {
        const targetName = woDetails.projectName.toLowerCase();
        projectId = projects.find(p => p.projectName.toLowerCase() == targetName)?.id || '';
      }

      // Ensure projectId is a string for form value
      const projectIdStr = projectId?.toString() || '';
      
      // 2. Populate form items from work order items
      const newFormItems: typeof formItems = [];
      if (woDetails.items && Array.isArray(woDetails.items)) {
        woDetails.items.forEach((item: any, index: number) => {
          // Find the service by itemId
          const service = servicesOptions.find(s => s.id == item.itemId);
          
          newFormItems.push({
            id: index + 1,
            serviceId: item.itemId,
            serviceName: service?.name || '',
            category: service?.category || '',
            uom: service?.uom || '',
            qty: item.qty || 1,
          });
        });
      }

      // Reset form with project data
      form.reset({
        project: projectIdStr,
        description: woDetails.description || '',
        items: [],
      });

      // Set form items
      setFormItems(newFormItems);
      
      setEditingRequest(woDetails);
      setPopupMessage({ type: null, text: '' });
      setOpen(true);
    } catch (error) {
      console.error("Error fetching work order details:", error);
      toast.error("Failed to load work order details");
    }
  };

  const handleDelete = (request: WorkOrderRequest) => {
    setDeletingRequest(request);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingRequest) return;
    setIsDeleting(true);
    try {
      await workOrderService.delete(deletingRequest.id);
      toast.success("Work order request deleted successfully.");
      setIsDeleteOpen(false);
      setDeletingRequest(null);
      await fetchWorkOrderRequests();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete work order request';
      setDeletePopupMessage({ type: 'error', text: String(msg) });
      toast.error(String(msg));
    } finally {
      setIsDeleting(false);
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
      const lower = searchTerm.toLowerCase();
      const matchesSearch = request.projectName?.toLowerCase().includes(lower) ||
                          request.createdBy?.toLowerCase().includes(lower)
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesProject = projectFilter === "all" || request.projectName === projectFilter;
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
            <Button onClick={() => { setEditingRequest(null); form.reset(); setPopupMessage({ type: null, text: '' }); setFormItems([]); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Work Order
            </Button>
          </DialogTrigger>
                     <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>{editingRequest ? 'Edit Work Order' : 'New Work Order'}</DialogTitle>
            </DialogHeader>
            
            {popupMessage.type && (
              <div className="px-4">
                <Alert variant={popupMessage.type === 'error' ? 'destructive' : 'default'}>
                  <AlertTitle>{popupMessage.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                  <AlertDescription>{popupMessage.text}</AlertDescription>
                </Alert>
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <SelectItem key={project.id.toString()} value={project.id.toString()}>
                                {project.projectName}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter description" className="mt-2" {...field} />
                        </FormControl>
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
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">Row #</TableHead>
                              <TableHead>Item</TableHead>
                              <TableHead className="hidden md:table-cell">Category</TableHead>
                              <TableHead className="hidden md:table-cell">UOM</TableHead>
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
                                        {formItem.serviceId ? 
                                          servicesOptions.find(s => s.id === formItem.serviceId)?.name || "Select Service..." 
                                          : "Select Service..."
                                        }
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="Search Services..." />
                                        <CommandList>
                                          <CommandEmpty>No service found.</CommandEmpty>
                                          <CommandGroup>
                                            {servicesOptions.map((service) => (
                                              <CommandItem
                                                key={service.id}
                                                value={service.name}
                                                onSelect={() => updateFormItem(formItem.id, 'serviceId', service.id)}
                                              >
                                                <Check
                                                  className={`mr-2 h-4 w-4 ${
                                                    formItem.serviceId === service.id ? "opacity-100" : "opacity-0"
                                                  }`}
                                                />
                                                <div className="flex flex-col">
                                                  <span>{service.name}</span>
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  {/* Mobile view: Show category and UOM below item */}
                                  <div className="md:hidden mt-2 space-y-1">
                                    <div className="text-xs text-muted-foreground">
                                      <span className="font-medium">Category:</span> {formItem.category || 'Not selected'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      <span className="font-medium">UOM:</span> {formItem.uom || 'Not selected'}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <Input
                                    value={formItem.category}
                                    disabled
                                    className="bg-muted"
                                  />
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <Input
                                    value={formItem.uom}
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
                        <span>{formItems.filter(item => item.serviceId).length}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Total Quantity: </span>
                        <span>{formItems.reduce((sum, item) => sum + (item.qty || 0), 0)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditingRequest(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formItems.length === 0 || isSubmitting}>
                    {isSubmitting ? (editingRequest ? 'Updating...' : 'Creating...') : (editingRequest ? 'Update Request' : 'Create Request')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if (open) setDeletePopupMessage({ type: null, text: '' }); if (!open) setDeletingRequest(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>

            {deletePopupMessage.type && (
              <div className="px-4">
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{deletePopupMessage.text}</AlertDescription>
                </Alert>
              </div>
            )}

            <div className="py-2">
              <p>Are you sure you want to delete work order request <strong>{deletingRequest?.id}</strong>? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setDeletingRequest(null); setDeletePopupMessage({ type: null, text: '' }); }} disabled={isDeleting}>Cancel</Button>
              <Button className="text-destructive" onClick={confirmDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <SelectItem key={project.id} value={project.id}>{project.projectName}</SelectItem>
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
          {loadingRequests ? (
            <div className="mb-4 py-6 text-center text-sm text-muted-foreground">Loading work order requests...</div>
          ) : workOrderRequests.length === 0 ? (
            <div className="mb-4 py-6 text-center text-sm text-muted-foreground">No work order requests found.</div>
          ) : null}
                     <div className="overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead 
                     className="cursor-pointer" 
                     onClick={() => handleSort('id')}
                   >
                     Request # <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                   </TableHead>
                   <TableHead 
                     className="hidden md:table-cell cursor-pointer"
                     onClick={() => handleSort('projectName')}
                   >
                     Project Name<ArrowUpDown className="ml-2 h-4 w-4 inline" />
                   </TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead 
                     className="hidden md:table-cell cursor-pointer"
                     onClick={() => handleSort('createdDate')}
                   >
                     Created Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                   </TableHead>
                   <TableHead 
                     className="cursor-pointer"
                     onClick={() => handleSort('createdBy')}
                   >
                     Created By <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                   </TableHead>
                   <TableHead 
                     className="hidden md:table-cell cursor-pointer"
                     onClick={() => handleSort('updatedBy')}
                   >
                     Updated By <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                   </TableHead>
                   <TableHead 
                     className="hidden md:table-cell cursor-pointer"
                     onClick={() => handleSort('updatedDate')}
                   >
                     Updated Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                   </TableHead>
                   
                   <TableHead className="w-16">Action</TableHead>
                 </TableRow>
               </TableHeader>
                          <TableBody>
                {paginatedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                          <div><span className="font-medium"></span> {request.projectName}</div>
                        {/* Mobile view: Show project and BOM below requested by */}
                        <div className="md:hidden text-xs text-muted-foreground space-y-1">
                          <div><span className="font-medium">Created By:</span> {formatDateTime(request.createdBy)}</div>
                          <div><span className="font-medium">Updated By:</span> {formatDateTime(request.updatedBy)}</div>
                        </div>
                      </div>
                    </TableCell>
                    {/* <TableCell className="hidden md:table-cell">{request.projectName}</TableCell> */}
                    <TableCell>
                      <Badge variant={getStatusColor(request.status) as any}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDateTime(request.createdDate)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {request.createdBy?? "N/A"}
                    </TableCell>
                     <TableCell className="hidden md:table-cell">
                      {request.updatedBy?? "N/A"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDateTime(request.updatedDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(request)}
                          title="Edit Work Order"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(request)}
                          title="Delete Work Order"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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