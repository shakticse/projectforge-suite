import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Search, Filter, Calendar, User, Eye } from "lucide-react";

interface BOMDetailItem {
  id: string;
  itemName: string;
  quantity: number;
  requestDate: string;
  modifyDate?: string;
  requestedBy: string;
  categoryHead: string;
  status: 'Pending' | 'Approved' | 'In Progress' | 'Completed' | 'Allocated';
}

interface WorkOrder {
  id: string;
  workOrderId: string;
  createdBy: string;
  createdDate: string;
  lastUpdatedDate: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
}

interface WorkOrderItem {
  id: string;
  itemName: string;
  category: string;
  uom: string;
  quantity: number;
  allocatedQty: number;
  pendingQty: number;
}

const mockBOMDetails: Record<string, BOMDetailItem[]> = {
  "BOM-001": [
    {
      id: "item-1",
      itemName: "GLASS STOPPER PVC",
      quantity: 50,
      requestDate: "2024-01-10",
      modifyDate: "2024-01-12",
      requestedBy: "Mike",
      categoryHead: "Dave",
      status: "Allocated"
    },
    {
      id: "item-2", 
      itemName: "HANGAR 10 MTR ROOF COVER",
      quantity: 100,
      requestDate: "2024-01-10",
      requestedBy: "John",
      categoryHead: "Harry",
      status: "Pending"
    },
    {
      id: "item-3",
      itemName: "GLASS STOPPER PVC",
      quantity: 150,
      requestDate: "2024-01-11",
      modifyDate: "2024-01-12",
      requestedBy: "John",
      categoryHead: "Harry",
      status: "Pending"
    }
  ],
  "BOM-002": [
    {
      id: "item-3",
      itemName: "HAMMER 7 KG",
      quantity: 200,
      requestDate: "2024-01-12",
      requestedBy: "Mike Johnson",
      categoryHead: "Dave",
      status: "Pending"
    },
    {
      id: "item-4",
      itemName: "GLASS STOPPER PVC",
      quantity: 75,
      requestDate: "2024-01-12",
      modifyDate: "2024-01-14",
      requestedBy: "Mike Johnson",
      categoryHead: "Harry",
      status: "Approved"
    },
    {
      id: "item-4",
      itemName: "GLASS STOPPER PVC",
      quantity: 55,
      requestDate: "2024-01-13",
      modifyDate: "2024-01-14",
      requestedBy: "Mike Johnson",
      categoryHead: "Dave",
      status: "Approved"
    }
  ]
};

const mockWorkOrders: Record<string, WorkOrder[]> = {
  "BOM-001": [
    {
      id: "wo-1",
      workOrderId: "WO-2024-001",
      createdBy: "John Smith",
      createdDate: "2024-01-15",
      lastUpdatedDate: "2024-01-16",
      status: "In Progress"
    },
    {
      id: "wo-2",
      workOrderId: "WO-2024-002",
      createdBy: "Mike Johnson",
      createdDate: "2024-01-14",
      lastUpdatedDate: "2024-01-18",
      status: "Completed"
    },
    {
      id: "wo-3",
      workOrderId: "WO-2024-003",
      createdBy: "Sarah Wilson",
      createdDate: "2024-01-12",
      lastUpdatedDate: "2024-01-17",
      status: "Open"
    }
  ],
  "BOM-002": [
    {
      id: "wo-4",
      workOrderId: "WO-2024-004",
      createdBy: "David Brown",
      createdDate: "2024-01-13",
      lastUpdatedDate: "2024-01-19",
      status: "In Progress"
    }
  ]
};

const mockWorkOrderItems: Record<string, WorkOrderItem[]> = {
  "WO-2024-001": [
    {
      id: "woi-1",
      itemName: "GLASS STOPPER PVC",
      category: "Hardware",
      uom: "PCS",
      quantity: 50,
      allocatedQty: 30,
      pendingQty: 20
    },
    {
      id: "woi-2",
      itemName: "HANGAR 10 MTR ROOF COVER",
      category: "Roofing",
      uom: "MTR",
      quantity: 100,
      allocatedQty: 60,
      pendingQty: 40
    }
  ],
  "WO-2024-002": [
    {
      id: "woi-3",
      itemName: "STEEL BEAM 20FT",
      category: "Structural",
      uom: "PCS",
      quantity: 25,
      allocatedQty: 25,
      pendingQty: 0
    }
  ],
  "WO-2024-003": [
    {
      id: "woi-4",
      itemName: "CEMENT BAG 50KG",
      category: "Materials",
      uom: "BAG",
      quantity: 200,
      allocatedQty: 0,
      pendingQty: 200
    },
    {
      id: "woi-5",
      itemName: "REBAR 12MM",
      category: "Reinforcement",
      uom: "MTR",
      quantity: 500,
      allocatedQty: 150,
      pendingQty: 350
    }
  ]
};

export default function BOMDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [workOrderSearchTerm, setWorkOrderSearchTerm] = useState("");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isWorkOrderItemsDialogOpen, setIsWorkOrderItemsDialogOpen] = useState(false);

  const items = mockBOMDetails[id || ""] || [];
  const workOrders = mockWorkOrders[id || ""] || [];
  
  const filteredItems = items.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWorkOrders = workOrders.filter(wo =>
    wo.workOrderId.toLowerCase().includes(workOrderSearchTerm.toLowerCase()) ||
    wo.createdBy.toLowerCase().includes(workOrderSearchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'In Progress': return 'outline';
      case 'Completed': return 'secondary';
      default: return 'secondary';
    }
  };

  const getWorkOrderStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewWorkOrderItems = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setIsWorkOrderItemsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/bom')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to BOM
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">BOM List View</h1>
            <p className="text-muted-foreground">BOM ID: {id}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="material-requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="material-requests">Material Requests</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="material-requests" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredItems.length} items found
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                BOM Items Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Category Head</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{new Date(item.requestDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {item.modifyDate 
                            ? new Date(item.modifyDate).toLocaleDateString()
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            {item.requestedBy}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.categoryHead}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No items found for this BOM</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search work orders..."
                  value={workOrderSearchTerm}
                  onChange={(e) => setWorkOrderSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredWorkOrders.length} work orders found
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Work Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Order ID</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Last Updated Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkOrders.map((workOrder) => (
                      <TableRow key={workOrder.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{workOrder.workOrderId}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            {workOrder.createdBy}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(workOrder.createdDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(workOrder.lastUpdatedDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getWorkOrderStatusColor(workOrder.status)}>
                            {workOrder.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewWorkOrderItems(workOrder)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredWorkOrders.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No work orders found for this BOM</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Work Order Items Dialog */}
      <Dialog open={isWorkOrderItemsDialogOpen} onOpenChange={setIsWorkOrderItemsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Work Order Items - {selectedWorkOrder?.workOrderId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWorkOrder && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-sm text-muted-foreground">Created By:</span>
                  <p className="font-medium">{selectedWorkOrder.createdBy}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={`ml-2 ${getWorkOrderStatusColor(selectedWorkOrder.status)}`}>
                    {selectedWorkOrder.status}
                  </Badge>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Allocated Qty</TableHead>
                    <TableHead>Pending Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedWorkOrder && mockWorkOrderItems[selectedWorkOrder.workOrderId]?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.uom}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-green-600 font-medium">{item.allocatedQty}</TableCell>
                      <TableCell className="text-orange-600 font-medium">{item.pendingQty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}