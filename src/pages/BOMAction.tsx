import { useState } from "react";
import { Search, Edit, Save, X, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface BOMItem {
  id: string;
  itemName: string;
  specification: string;
  unit: string;
  requiredQuantity: number;
  allocatedQuantity: number;
  pendingQuantity: number;
  status: 'pending' | 'partial' | 'complete';
  priority: 'low' | 'medium' | 'high';
  category: string;
  supplier: string;
}

interface BOM {
  id: string;
  projectName: string;
  bomNumber: string;
  status: 'draft' | 'approved' | 'in-progress' | 'completed';
  totalItems: number;
  completedItems: number;
  createdBy: string;
  createdDate: string;
  modifiedDate: string;
  items: BOMItem[];
}

const mockBOMItems: BOMItem[] = [
  {
    id: "1",
    itemName: "Steel Rebar 12mm",
    specification: "Grade 60, Length 12m",
    unit: "Tonnes",
    requiredQuantity: 50,
    allocatedQuantity: 30,
    pendingQuantity: 20,
    status: 'partial',
    priority: 'high',
    category: 'Steel',
    supplier: 'Steel Corp Ltd'
  },
  {
    id: "2", 
    itemName: "Cement Portland",
    specification: "OPC 53 Grade",
    unit: "Bags",
    requiredQuantity: 500,
    allocatedQuantity: 500,
    pendingQuantity: 0,
    status: 'complete',
    priority: 'high',
    category: 'Cement',
    supplier: 'Cement Industries'
  },
  {
    id: "3",
    itemName: "Aggregate 20mm",
    specification: "Crushed Stone",
    unit: "Cubic Meters",
    requiredQuantity: 100,
    allocatedQuantity: 0,
    pendingQuantity: 100,
    status: 'pending',
    priority: 'medium',
    category: 'Aggregate',
    supplier: 'Stone Quarry Co'
  },
  {
    id: "4",
    itemName: "Bricks",
    specification: "Class A, Size 230x110x75mm",
    unit: "Thousands",
    requiredQuantity: 25,
    allocatedQuantity: 15,
    pendingQuantity: 10,
    status: 'partial',
    priority: 'medium',
    category: 'Masonry',
    supplier: 'Brick Works Ltd'
  }
];

const mockBOMs: BOM[] = [
  {
    id: "BOM001",
    projectName: "Residential Complex A",
    bomNumber: "BOM-2024-001",
    status: 'in-progress',
    totalItems: 4,
    completedItems: 1,
    createdBy: 'user1',
    createdDate: "2024-01-15",
    modifiedDate: "2024-01-17",
    items: mockBOMItems
  },
  {
    id: "BOM002",
    projectName: "Commercial Plaza B", 
    bomNumber: "BOM-2024-002",
    status: 'approved',
    totalItems: 3,
    completedItems: 0,
    createdBy: 'user2',
    createdDate: "2024-01-20",
    modifiedDate: "2024-01-22",
    items: mockBOMItems.slice(0, 3)
  },
  {
    id: "BOM003",
    projectName: "Industrial Warehouse C",
    bomNumber: "BOM-2024-003", 
    status: 'draft',
    totalItems: 2,
    completedItems: 0,
    createdBy: 'user2',
    createdDate: "2024-01-25",
    modifiedDate: "2024-01-27",
    items: mockBOMItems.slice(0, 2)
  }
];

export default function BOMAction() {
  const { user } = useAuth();
  const [boms, setBOMs] = useState<BOM[]>(mockBOMs);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [allocationData, setAllocationData] = useState<Record<string, number>>({});

  const filteredBOMs = boms.filter(bom => {
    const matchesSearch = bom.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bom.bomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || bom.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const openAllocationForm = (bom: BOM) => {
    setSelectedBOM(bom);
    const initialData: Record<string, number> = {};
    bom.items.forEach(item => {
      initialData[item.id] = item.allocatedQuantity;
    });
    setAllocationData(initialData);
  };

  const handleBulkUpdate = () => {
    if (!selectedBOM) return;
    
    setBOMs(boms =>
      boms.map(bom => {
        if (bom.id === selectedBOM.id) {
          const updatedItems = bom.items.map(item => {
            const newAllocated = allocationData[item.id] || 0;
            const newPending = item.requiredQuantity - newAllocated;
            const newStatus = newAllocated === 0 ? 'pending' as const :
                             newAllocated >= item.requiredQuantity ? 'complete' as const : 'partial' as const;
            
            return {
              ...item,
              allocatedQuantity: newAllocated,
              pendingQuantity: newPending,
              status: newStatus
            };
          });
          
          const completedItems = updatedItems.filter(item => item.status === 'complete').length;
          
          return {
            ...bom,
            items: updatedItems,
            completedItems
          };
        }
        return bom;
      })
    );
    
    setSelectedBOM(null);
    toast.success("BOM quantities updated successfully");
  };

  const closeAllocationForm = () => {
    setSelectedBOM(null);
    setAllocationData({});
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      approved: "outline",
      "in-progress": "secondary",
      completed: "default",
      pending: "destructive",
      partial: "secondary", 
      complete: "default"
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "secondary",
      medium: "secondary",
      high: "destructive"
    } as const;
    
    return <Badge variant={variants[priority as keyof typeof variants]}>{priority}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BOM Allocation</h1>
          <p className="text-muted-foreground">
            Material Allocation
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search BOMs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create BOM
            </Button> */}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          {/* <CardTitle>BOMs ({filteredBOMs.length})</CardTitle> */}
          <CardTitle>BOMs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BOM No.</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Created By</TableHead>
                {/* <TableHead className="text-center">Total Items</TableHead>
                <TableHead className="text-center">Completed Items</TableHead> */}
                {/* <TableHead className="text-center">Progress</TableHead> */}
                <TableHead className="text-center">Created Date</TableHead>
                <TableHead className="text-center">Updated Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBOMs.map((bom) => (
                <TableRow key={bom.id}>
                  <TableCell className="font-medium">{bom.bomNumber}</TableCell>
                  <TableCell>{bom.projectName}</TableCell>
                  <TableCell>{getStatusBadge(bom.status)}</TableCell>
                  {/* <TableCell className="text-center">{bom.totalItems}</TableCell>
                  <TableCell className="text-center">{bom.completedItems}</TableCell> */}
                  {/* <TableCell className="text-center">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(bom.completedItems / bom.totalItems) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Math.round((bom.completedItems / bom.totalItems) * 100)}%
                        </span>
                        </div>
                        </TableCell> */}
                  <TableCell className="text-center">{bom.createdBy}</TableCell>
                  <TableCell className="text-center">{bom.createdDate}</TableCell>
                  <TableCell className="text-center">{bom.modifiedDate}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAllocationForm(bom)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Allocate
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedBOM && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Allocation Form */}
          <Card className="lg:col-span-2 order-2 lg:order-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">In-House Allocation</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedBOM.bomNumber}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={closeAllocationForm}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* BOM Info Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <span className="text-sm font-medium">Project:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedBOM.projectName}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">BOM Number:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedBOM.bomNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Status:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getStatusBadge(selectedBOM.status)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Items:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedBOM.items.length} items
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Item Name</TableHead>
                        <TableHead className="text-xs sm:text-sm">UOM</TableHead>
                        {user?.role === "Store Supervisor" && (
                          <TableHead className="text-right text-xs sm:text-sm">Available</TableHead>
                        )}
                        <TableHead className="text-right text-xs sm:text-sm">Required</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Pending</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Allocate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBOM.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            {item.itemName}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">{item.unit}</TableCell>
                          {user?.role === "Store Supervisor" && (
                            <TableCell className="text-right text-xs sm:text-sm">
                              {item.allocatedQuantity}
                            </TableCell>
                          )}
                          <TableCell className="text-right text-xs sm:text-sm">
                            {item.requiredQuantity}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            {item.requiredQuantity - (allocationData[item.id] || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={allocationData[item.id] || 0}
                              onChange={(e) =>
                                setAllocationData({
                                  ...allocationData,
                                  [item.id]: Number(e.target.value),
                                })
                              }
                              className="w-16 sm:w-20 text-right text-xs sm:text-sm"
                              min={0}
                              max={item.requiredQuantity}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={closeAllocationForm}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkUpdate}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Update Allocations
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Summary on Desktop */}
          <Card className="order-1 lg:order-2 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-bold">
                      {selectedBOM.completedItems}/{selectedBOM.totalItems}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (selectedBOM.completedItems / selectedBOM.totalItems) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(
                      (selectedBOM.completedItems / selectedBOM.totalItems) * 100
                    )}
                    % Complete
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Items:</span>
                    <span className="font-medium">{selectedBOM.totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium text-green-600">
                      {selectedBOM.completedItems}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Pending:</span>
                    <span className="font-medium text-orange-600">
                      {selectedBOM.totalItems - selectedBOM.completedItems}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Created By:</span>
                    <p className="font-medium">{selectedBOM.createdBy}</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Created Date:</span>
                    <p className="font-medium">{selectedBOM.createdDate}</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Modified Date:</span>
                    <p className="font-medium">{selectedBOM.modifiedDate}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}