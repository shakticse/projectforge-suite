import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Search,
  Filter,
  Eye,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Upload,
  X,
  FileIcon,
  Download
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Mock data
const mockProjects = [
  { id: '1', name: 'Project Alpha' },
  { id: '2', name: 'Project Beta' },
  { id: '3', name: 'Project Gamma' }
];

const mockVendors = [
  { id: '1', name: 'ABC Suppliers Ltd.' },
  { id: '2', name: 'XYZ Materials Inc.' },
  { id: '3', name: 'Best Construction Co.' }
];

const mockPurchaseOrders = [
  { 
    id: '1', 
    number: 'PO-001',
    projectId: '1',
    vendorId: '1',
    items: [
      { id: '1', name: 'Cement', requestedQty: 100, unit: 'bags', receivedQty: 0, rate: 500, discount: 5, amount: 47500 },
      { id: '2', name: 'Steel Bars', requestedQty: 50, unit: 'tons', receivedQty: 0, rate: 65000, discount: 2, amount: 3185000 },
      { id: '3', name: 'Bricks', requestedQty: 1000, unit: 'pieces', receivedQty: 0, rate: 8, discount: 0, amount: 8000 }
    ]
  },
  { 
    id: '2', 
    number: 'PO-002',
    projectId: '1',
    vendorId: '2',
    items: [
      { id: '4', name: 'Paint', requestedQty: 20, unit: 'liters', receivedQty: 0, rate: 250, discount: 10, amount: 4500 },
      { id: '5', name: 'Tiles', requestedQty: 200, unit: 'sq ft', receivedQty: 0, rate: 45, discount: 8, amount: 8280 }
    ]
  }
];

const mockMRNs = [
  {
    id: 'MRN-001',
    projectName: 'Project Alpha',
    vendorName: 'ABC Suppliers Ltd.',
    purchaseOrder: 'PO-001',
    receiptDate: '2024-01-15',
    totalItems: 3,
    status: 'completed',
    remarks: 'All items received in good condition',
    attachments: ['receipt-001.pdf', 'quality-check.jpg']
  },
  {
    id: 'MRN-002',
    projectName: 'Project Alpha',
    vendorName: 'XYZ Materials Inc.',
    purchaseOrder: 'PO-002',
    receiptDate: '2024-01-14',
    totalItems: 2,
    status: 'partial',
    remarks: 'Some items pending delivery',
    attachments: ['receipt-002.pdf']
  },
  {
    id: 'MRN-003',
    projectName: 'Project Beta',
    vendorName: 'Best Construction Co.',
    purchaseOrder: 'PO-003',
    receiptDate: '2024-01-13',
    totalItems: 5,
    status: 'pending',
    remarks: 'Quality inspection pending',
    attachments: []
  }
];

// Form schema
const mrnFormSchema = yup.object({
  projectId: yup.string().required('Project is required'),
  vendorId: yup.string().required('Vendor is required'),
  purchaseOrderId: yup.string().required('Purchase order is required'),
  receiptDate: yup.string().required('Receipt date is required'),
  remarks: yup.string(),
  items: yup.array().of(
    yup.object({
      id: yup.string().required(),
      receivedQty: yup.string().required('Received quantity is required')
    })
  )
});

type SortField = 'id' | 'projectName' | 'vendorName' | 'receiptDate' | 'status';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export default function MRNList() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMRN, setSelectedMRN] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedPOItems, setSelectedPOItems] = useState<any[]>([]);

  const form = useForm({
    resolver: yupResolver(mrnFormSchema),
    defaultValues: {
      projectId: '',
      vendorId: '',
      purchaseOrderId: '',
      receiptDate: '',
      remarks: '',
      items: []
    }
  });

  // Watch for purchase order changes
  const watchedPOId = form.watch('purchaseOrderId');
  const watchedProjectId = form.watch('projectId');
  const watchedVendorId = form.watch('vendorId');

  // Filter POs based on selected project and vendor
  const filteredPOs = useMemo(() => {
    return mockPurchaseOrders.filter(po => 
      (!watchedProjectId || po.projectId === watchedProjectId) &&
      (!watchedVendorId || po.vendorId === watchedVendorId)
    );
  }, [watchedProjectId, watchedVendorId]);

  // Update items when PO is selected
  React.useEffect(() => {
    if (watchedPOId) {
      const selectedPO = mockPurchaseOrders.find(po => po.id === watchedPOId);
      if (selectedPO) {
        setSelectedPOItems(selectedPO.items);
        form.setValue('items', selectedPO.items.map(item => ({
          id: item.id,
          receivedQty: '0'
        })));
      }
    } else {
      setSelectedPOItems([]);
      form.setValue('items', []);
    }
  }, [watchedPOId, form]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let filtered = mockMRNs.filter(mrn => {
      const matchesSearch = mrn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mrn.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mrn.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || mrn.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'receiptDate') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [searchTerm, statusFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'partial': return 'secondary';
      case 'pending': return 'destructive';
      default: return 'outline';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: any) => {
    try {
      console.log('MRN Data:', data);
      console.log('Uploaded Files:', uploadedFiles);
      
      toast({
        title: "Success",
        description: "MRN created successfully",
      });
      
      setIsCreateModalOpen(false);
      form.reset();
      setUploadedFiles([]);
      setSelectedPOItems([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create MRN",
        variant: "destructive",
      });
    }
  };

  const updateItemQuantity = (itemId: string, quantity: string) => {
    const currentItems = form.getValues('items');
    const updatedItems = currentItems.map((item: any) => 
      item.id === itemId ? { ...item, receivedQty: quantity } : item
    );
    form.setValue('items', updatedItems);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">MRN List/Challan</h1>
          <p className="text-muted-foreground">Manage material receipt notes and challans</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New MRN
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New MRN</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    name="vendorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vendor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockVendors.map(vendor => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.name}
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
                    name="purchaseOrderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Order</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select purchase order" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredPOs.map(po => (
                              <SelectItem key={po.id} value={po.id}>
                                {po.number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="receiptDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedPOItems.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Purchase Order Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Requested Qty</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Discount (%)</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Received Qty</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedPOItems.map((item, index) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.requestedQty}</TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell>₹{item.rate.toLocaleString()}</TableCell>
                              <TableCell>{item.discount}%</TableCell>
                              <TableCell>₹{item.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.requestedQty}
                                  placeholder="0"
                                  className="w-24"
                                  onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
                )}

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter any remarks or comments"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">Attachments</h3>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                        <span>
                          <Upload className="h-4 w-4" />
                          Upload Files
                        </span>
                      </Button>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <FileIcon className="h-4 w-4" />
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create MRN</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search MRNs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* MRN Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Receipt Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('id')}
                    >
                      MRN ID
                      {getSortIcon('id')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('projectName')}
                    >
                      Project
                      {getSortIcon('projectName')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('vendorName')}
                    >
                      Vendor
                      {getSortIcon('vendorName')}
                    </Button>
                  </TableHead>
                  <TableHead>Purchase Order</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('receiptDate')}
                    >
                      Receipt Date
                      {getSortIcon('receiptDate')}
                    </Button>
                  </TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((mrn) => (
                    <TableRow key={mrn.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{mrn.id}</TableCell>
                      <TableCell>{mrn.projectName}</TableCell>
                      <TableCell>{mrn.vendorName}</TableCell>
                      <TableCell>{mrn.purchaseOrder}</TableCell>
                      <TableCell>{new Date(mrn.receiptDate).toLocaleDateString()}</TableCell>
                      <TableCell>{mrn.totalItems}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(mrn.status)}>
                          {mrn.status.charAt(0).toUpperCase() + mrn.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMRN(mrn);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No MRNs found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of{' '}
                {filteredData.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View MRN Dialog */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>MRN Details</DialogTitle>
          </DialogHeader>
          {selectedMRN && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold">General Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MRN ID:</span>
                      <span className="font-medium">{selectedMRN.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project:</span>
                      <span>{selectedMRN.projectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendor:</span>
                      <span>{selectedMRN.vendorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchase Order:</span>
                      <span>{selectedMRN.purchaseOrder}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold">Receipt Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receipt Date:</span>
                      <span>{new Date(selectedMRN.receiptDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Items:</span>
                      <span>{selectedMRN.totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusColor(selectedMRN.status)}>
                        {selectedMRN.status.charAt(0).toUpperCase() + selectedMRN.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold">Remarks</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedMRN.remarks || 'No remarks provided'}
                </p>
              </div>

              {selectedMRN.attachments && selectedMRN.attachments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold">Attachments</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedMRN.attachments.map((file: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <FileIcon className="h-4 w-4" />
                          <span className="text-sm flex-1">{file}</span>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}