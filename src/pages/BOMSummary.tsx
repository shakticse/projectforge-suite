import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Package, 
  ShoppingCart, 
  Building2, 
  FileText,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface BOMDetails {
  id: string;
  projectName: string;
  itemName: string;
  startDate: string;
  endDate: string;
  approvalStatus: string;
  createdBy: string;
  updatedBy: string;
  lastUpdated: string;
}

interface BOMItem {
  id: string;
  materialName: string;
  stockQuantity: number;
  requestedQuantity: number;
  allocatedQuantity: number;
  pendingQuantity: number;
  unit: string;
  status: 'Available' | 'Partial' | 'Unavailable';
}

interface PurchaseOrderDetail {
  id: string;
  poNumber: string;
  vendorName: string;
  items: string[];
  quantity: number;
  totalAmount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Progress';
  createdDate: string;
  deliveryDate: string;
}

interface MaterialRequest {
  id: string;
  requestId: string;
  fromLocation: string;
  toLocation: string;
  materialName: string;
  requestedQuantity: number;
  approvedQuantity: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Transit' | 'Delivered';
  requestDate: string;
  expectedDate: string;
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

const BOMSummary = () => {
  const { bomId } = useParams<{ bomId: string }>();
  const navigate = useNavigate();
  const [bomDetails, setBomDetails] = useState<BOMDetails | null>(null);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDetail[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isWorkOrderItemsDialogOpen, setIsWorkOrderItemsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API calls
  const mockBOMDetails: BOMDetails = {
    id: bomId || "BOM-001",
    projectName: "Auto Expo",
    itemName: "Auto Expo, Delhi",
    startDate: "2024-01-15",
    endDate: "2024-01-30",
    approvalStatus: "Approved",
    createdBy: "Jane Smith",
    updatedBy: "John Doe",
    lastUpdated: "2024-01-10"
  };

  const mockBOMItems: BOMItem[] = [
    {
      id: "1",
      materialName: "GLASS STOPPER PVC",
      stockQuantity: 0,
      requestedQuantity: 250,
      allocatedQuantity: 200,
      pendingQuantity: 50,
      unit: "bags",
      status: "Partial"
    },
    {
      id: "2", 
      materialName: "GLASS SLIDING LOCK",
      stockQuantity: 660,
      requestedQuantity: 200,
      allocatedQuantity: 200,
      pendingQuantity: 0,
      unit: "units",
      status: "Available"
    },
    {
      id: "3",
      materialName: "HANGAR 10 MTR ROOF COVER",
      stockQuantity: 0,
      requestedQuantity: 500,
      allocatedQuantity: 300,
      pendingQuantity: 200,
      unit: "pieces",
      status: "Unavailable"
    },
    {
      id: "4",
      materialName: "HAMMER 7 KG",
      stockQuantity: 0,
      requestedQuantity: 150,
      allocatedQuantity: 145,
      pendingQuantity: 5,
      unit: "pieces",
      status: "Unavailable"
    }
  ];

  const mockPurchaseOrders: PurchaseOrderDetail[] = [
    {
      id: "1",
      poNumber: "PO-2024-001",
      vendorName: "ABC Supplies",
      items: ["GLASS STOPPER PVC"],
      quantity: 150,
      totalAmount: 25000,
      status: "Approved",
      createdDate: "2024-01-05",
      deliveryDate: "2024-01-20"
    },
    // {
    //   id: "2",
    //   poNumber: "PO-2024-002", 
    //   vendorName: "XYZ Materials",
    //   items: ["Concrete Blocks"],
    //   totalAmount: 15000,
    //   status: "Pending",
    //   createdDate: "2024-01-08",
    //   deliveryDate: "2024-01-25"
    // }
  ];

  const mockMaterialRequests: MaterialRequest[] = [
    {
      id: "1",
      requestId: "MR-2024-001",
      fromLocation: "Kasna",
      toLocation: "Site Store",
      materialName: "HANGAR 10 MTR ROOF COVER",
      requestedQuantity: 500,
      approvedQuantity: 500,
      status: "Delivered",
      requestDate: "2024-01-12",
      expectedDate: "2024-01-15"
    },
    {
      id: "2",
      requestId: "MR-2024-002",
      fromLocation: "Kasna",
      toLocation: "Site Store", 
      materialName: "HAMMER 7 KG",
      requestedQuantity: 150,
      approvedQuantity: 150,
      status: "In Transit",
      requestDate: "2024-01-14",
      expectedDate: "2024-01-18"
    }
  ];

  const mockWorkOrders: WorkOrder[] = [
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
  ];

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
      }
    ]
  };

  useEffect(() => {
    const fetchBOMDetails = async () => {
      try {
        setLoading(true);
        // In real implementation, make API calls
        // const response = await api.get(`/bom/${bomId}`);
        
        // Using mock data for now
        setBomDetails(mockBOMDetails);
        setBomItems(mockBOMItems);
        setPurchaseOrders(mockPurchaseOrders);
        setMaterialRequests(mockMaterialRequests);
        setWorkOrders(mockWorkOrders);
      } catch (error) {
        console.error("Error fetching BOM details:", error);
        toast.error("Failed to load BOM details");
      } finally {
        setLoading(false);
      }
    };

    fetchBOMDetails();
  }, [bomId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
      case 'Approved':
      case 'Delivered':
        return 'default';
      case 'Partial':
      case 'In Transit':
      case 'In Progress':
        return 'secondary';
      case 'Pending':
        return 'outline';
      case 'Unavailable':
      case 'Rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available':
      case 'Approved':
      case 'Delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'Pending':
      case 'In Transit':
        return <Clock className="h-4 w-4" />;
      case 'Unavailable':
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const calculateAllocationPercentage = (allocated: number, requested: number) => {
    return requested > 0 ? Math.round((allocated / requested) * 100) : 0;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading BOM details...</p>
        </div>
      </div>
    );
  }

  if (!bomDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">BOM not found</p>
          <p className="text-muted-foreground mb-4">The requested BOM could not be found.</p>
          <Button onClick={() => navigate('/bom')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to BOM List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/bom')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to BOMs
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">BOM Details</h1>
            <p className="text-muted-foreground">Detailed view of {bomDetails.id}</p>
          </div>
        </div>
      </div>

      {/* BOM Summary */}
      <Card className="pl-2 pt-4">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <p className="text-lg font-semibold">BOM#: {bomDetails.id}</p>
            </div>
            <div className="space-y-4">
              <p className="text-lg font-medium">{bomDetails.projectName}</p>
            </div>
            <div className="space-y-4">
              <p className="text-lg font-medium">{bomDetails.itemName}</p>
            </div>
            <div className="space-y-4">
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                {new Date(bomDetails.startDate).toLocaleDateString("en-GB", { day: "numeric",  month: "short"})} - {new Date(bomDetails.endDate).toLocaleDateString("en-GB", { day: "numeric",  month: "short"})}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            BOM Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">BOM ID</p>
              <p className="text-lg font-semibold">{bomDetails.id}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Project</p>
              <p className="text-lg font-medium">{bomDetails.projectName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Item Name</p>
              <p className="text-lg font-medium">{bomDetails.itemName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={getStatusColor(bomDetails.approvalStatus)}>
                {bomDetails.approvalStatus}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Start Date</p>
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                {new Date(bomDetails.startDate).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">End Date</p>
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                {new Date(bomDetails.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                {bomDetails.createdBy}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                {bomDetails.updatedBy}
              </p>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Detailed Sections */}
      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="items" className="flex items-center">
            <Package className="h-4 w-4 mr-2" />
            BOM Items
          </TabsTrigger>
          <TabsTrigger value="purchase-orders" className="flex items-center">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="material-requests" className="flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            Material Requests
          </TabsTrigger>
          <TabsTrigger value="work-orders" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Work Orders
          </TabsTrigger>
        </TabsList>

        {/* BOM Items Tab */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Material Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material Name</TableHead>
                      <TableHead>Stock Qty</TableHead>
                      <TableHead>Requested Qty</TableHead>
                      <TableHead>Allocated Qty</TableHead>
                      {/* <TableHead>Unit</TableHead> */}
                      <TableHead>Pending Qty</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bomItems.map((item) => {
                      const percentage = calculateAllocationPercentage(item.allocatedQuantity, item.requestedQuantity);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.materialName}</TableCell>
                          <TableCell>{item.stockQuantity}</TableCell>
                          <TableCell>{item.requestedQuantity}</TableCell>
                          <TableCell>{item.allocatedQuantity}</TableCell>
                          <TableCell>{item.pendingQuantity}</TableCell>
                          {/* <TableCell>{item.unit}</TableCell> */}
                          {/* <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress value={percentage} className="w-16 h-2" />
                              <span className="text-sm">{percentage}%</span>
                            </div>
                          </TableCell> */}
                          <TableCell>
                            <Badge variant={getStatusColor(item.status)} className="flex items-center gap-1">
                              {getStatusIcon(item.status)}
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="purchase-orders">
          <Card>
            <CardHeader>
              <CardTitle>Related Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total Quantity</TableHead>
                      <TableHead>Total Amount</TableHead>
                      {/* <TableHead>Status</TableHead> */}
                      <TableHead>Created Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.poNumber}</TableCell>
                        <TableCell>{po.vendorName}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {po.items.map((item, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{po.quantity}</TableCell>
                        <TableCell className="font-medium">₹{po.totalAmount.toLocaleString()}</TableCell>
                        {/* <TableCell>
                          <Badge variant={getStatusColor(po.status)} className="flex items-center gap-1">
                            {getStatusIcon(po.status)}
                            {po.status}
                          </Badge>
                        </TableCell> */}
                        <TableCell>{new Date(po.createdDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(po.deliveryDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Material Requests Tab */}
        <TabsContent value="material-requests">
          <Card>
            <CardHeader>
              <CardTitle>Inter-Store Material Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>From Location</TableHead>
                      <TableHead>To Location</TableHead>
                      <TableHead>Requested Qty</TableHead>
                      <TableHead>Approved Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Expected Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.requestId}</TableCell>
                        <TableCell>{request.materialName}</TableCell>
                        <TableCell>{request.fromLocation}</TableCell>
                        <TableCell>{request.toLocation}</TableCell>
                        <TableCell>{request.requestedQuantity}</TableCell>
                        <TableCell>{request.approvedQuantity}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(request.status)} className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.requestDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(request.expectedDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Orders Tab */}
        <TabsContent value="work-orders">
          <Card>
            <CardHeader>
              <CardTitle>Work Orders</CardTitle>
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
                    {workOrders.map((workOrder) => (
                      <TableRow key={workOrder.id}>
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
};

export default BOMSummary;