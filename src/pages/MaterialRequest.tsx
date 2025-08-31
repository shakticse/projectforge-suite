import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface MaterialRequest {
  id: string;
  mrNo: string;
  bomId: string;
  fromStoreName: string;
  deliveryLocation: string;
  createdDate: string;
  updatedDate: string;
  completeByDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
}

interface BOMItem {
  id: string;
  itemName: string;
  category: string;
  uom: string;
  totalQty: number;
  allocatedQty: number;
  pendingQty: number;
}

interface MRItem {
  bomItemId: string;
  requestedQty: number;
}

const MaterialRequest = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedBOM, setSelectedBOM] = useState('');
  const [bomItems, setBOMItems] = useState<BOMItem[]>([]);
  const [mrItems, setMRItems] = useState<MRItem[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [fromStore, setFromStore] = useState('');
  const [completeByDate, setCompleteByDate] = useState('');

  const itemsPerPage = 10;

  // Mock data for Material Requests
  const [materialRequests] = useState<MaterialRequest[]>([
    {
      id: '1',
      mrNo: 'MR-001',
      bomId: 'BOM-001',
      fromStoreName: 'Main Warehouse',
      deliveryLocation: 'Site A',
      createdDate: '2024-01-15',
      updatedDate: '2024-01-16',
      completeByDate: '2024-01-20',
      status: 'Pending'
    },
    {
      id: '2',
      mrNo: 'MR-002',
      bomId: 'BOM-002',
      fromStoreName: 'Secondary Store',
      deliveryLocation: 'Store B',
      createdDate: '2024-01-14',
      updatedDate: '2024-01-17',
      completeByDate: '2024-01-22',
      status: 'In Progress'
    },
    {
      id: '3',
      mrNo: 'MR-003',
      bomId: 'BOM-001',
      fromStoreName: 'Main Warehouse',
      deliveryLocation: 'Site C',
      createdDate: '2024-01-12',
      updatedDate: '2024-01-18',
      completeByDate: '2024-01-25',
      status: 'Completed'
    }
  ]);

  // Mock projects
  const projects = [
    { id: '1', name: 'Project Alpha' },
    { id: '2', name: 'Project Beta' },
    { id: '3', name: 'Project Gamma' }
  ];

  // Mock BOMs
  const boms = [
    { id: 'BOM-001', name: 'BOM Alpha Components' },
    { id: 'BOM-002', name: 'BOM Beta Materials' },
    { id: 'BOM-003', name: 'BOM Gamma Parts' }
  ];

  // Mock stores
  const stores = [
    { id: '1', name: 'Main Warehouse' },
    { id: '2', name: 'Secondary Store' },
    { id: '3', name: 'Site Storage' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBOMSelection = (bomId: string) => {
    setSelectedBOM(bomId);
    
    // Mock BOM items with pending quantities
    const mockBOMItems: BOMItem[] = [
      {
        id: '1',
        itemName: 'Steel Beam 10ft',
        category: 'Structural',
        uom: 'PCS',
        totalQty: 100,
        allocatedQty: 60,
        pendingQty: 40
      },
      {
        id: '2',
        itemName: 'Cement Bag 50kg',
        category: 'Materials',
        uom: 'BAG',
        totalQty: 200,
        allocatedQty: 150,
        pendingQty: 50
      },
      {
        id: '3',
        itemName: 'Rebar 12mm',
        category: 'Reinforcement',
        uom: 'MTR',
        totalQty: 500,
        allocatedQty: 300,
        pendingQty: 200
      }
    ];

    setBOMItems(mockBOMItems);
    setMRItems(mockBOMItems.map(item => ({ bomItemId: item.id, requestedQty: 0 })));
  };

  const handleQuantityChange = (bomItemId: string, qty: number) => {
    setMRItems(prev => 
      prev.map(item => 
        item.bomItemId === bomItemId 
          ? { ...item, requestedQty: qty }
          : item
      )
    );
  };

  const handleCreateMR = () => {
    const validItems = mrItems.filter(item => item.requestedQty > 0);
    
    if (!selectedProject || !selectedBOM || !fromStore || !deliveryLocation || !completeByDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add quantities for at least one item",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Material Request created successfully"
    });

    // Reset form
    setSelectedProject('');
    setSelectedBOM('');
    setBOMItems([]);
    setMRItems([]);
    setFromStore('');
    setDeliveryLocation('');
    setCompleteByDate('');
    setIsCreateModalOpen(false);
  };

  // Filter and search logic
  const filteredRequests = materialRequests.filter(mr => {
    const matchesSearch = mr.mrNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mr.bomId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mr.fromStoreName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Material Requests</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create MR
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Material Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bom">BOM *</Label>
                  <Select value={selectedBOM} onValueChange={handleBOMSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select BOM" />
                    </SelectTrigger>
                    <SelectContent>
                      {boms.map(bom => (
                        <SelectItem key={bom.id} value={bom.id}>
                          {bom.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromStore">From Store *</Label>
                  <Select value={fromStore} onValueChange={setFromStore}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map(store => (
                        <SelectItem key={store.id} value={store.name}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryLocation">Delivery Location *</Label>
                  <Input
                    id="deliveryLocation"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="Enter delivery location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completeBy">Complete By Date *</Label>
                  <Input
                    id="completeBy"
                    type="date"
                    value={completeByDate}
                    onChange={(e) => setCompleteByDate(e.target.value)}
                  />
                </div>
              </div>

              {bomItems.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">BOM Items (Pending Quantities)</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>UOM</TableHead>
                          <TableHead>Total Qty</TableHead>
                          <TableHead>Allocated Qty</TableHead>
                          <TableHead>Pending Qty</TableHead>
                          <TableHead>Request Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bomItems.map((item) => {
                          const mrItem = mrItems.find(mr => mr.bomItemId === item.id);
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.itemName}</TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>{item.uom}</TableCell>
                              <TableCell>{item.totalQty}</TableCell>
                              <TableCell>{item.allocatedQty}</TableCell>
                              <TableCell className="font-medium text-orange-600">
                                {item.pendingQty}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.pendingQty}
                                  value={mrItem?.requestedQty || 0}
                                  onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                  className="w-20"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMR}>Create Material Request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material Requests List</CardTitle>
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by MR No, BOM ID, or Store..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MR No</TableHead>
                  <TableHead>BOM ID</TableHead>
                  <TableHead>From Store Name</TableHead>
                  <TableHead>Delivery Location</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Updated Date</TableHead>
                  <TableHead>Complete By Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.map((mr) => (
                  <TableRow key={mr.id}>
                    <TableCell className="font-medium">{mr.mrNo}</TableCell>
                    <TableCell>{mr.bomId}</TableCell>
                    <TableCell>{mr.fromStoreName}</TableCell>
                    <TableCell>{mr.deliveryLocation}</TableCell>
                    <TableCell>{mr.createdDate}</TableCell>
                    <TableCell>{mr.updatedDate}</TableCell>
                    <TableCell>{mr.completeByDate}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(mr.status)}>
                        {mr.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRequests.length)} of {filteredRequests.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
};

export default MaterialRequest;