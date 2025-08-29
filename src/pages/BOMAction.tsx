import { useState } from "react";
import { Search, Edit, Save, X, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [boms, setBOMs] = useState<BOM[]>(mockBOMs);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [allocationData, setAllocationData] = useState<Record<string, number>>({});

  const filteredBOMs = boms.filter(bom => {
    const matchesSearch = bom.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bom.bomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || bom.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const openAllocationModal = (bom: BOM) => {
    setSelectedBOM(bom);
    const initialData: Record<string, number> = {};
    bom.items.forEach(item => {
      initialData[item.id] = item.allocatedQuantity;
    });
    setAllocationData(initialData);
    setIsAllocationModalOpen(true);
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
    
    setIsAllocationModalOpen(false);
    setSelectedBOM(null);
    toast.success("BOM quantities updated successfully");
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
                    <div className="flex items-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAllocationModal(bom)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Allocate
                      </Button>
                      {/* <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button> */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAllocationModalOpen} onOpenChange={setIsAllocationModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Allocate Quantities - {selectedBOM?.bomNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedBOM && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <span className="text-sm font-medium">Project:</span>
                  <p className="text-sm text-muted-foreground">{selectedBOM.projectName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">BOM Number:</span>
                  <p className="text-sm text-muted-foreground">{selectedBOM.bomNumber}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead className="text-right">Required</TableHead>
                    {/* <TableHead className="text-right">Current Allocated</TableHead> */}
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Allocate Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedBOM.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>{item.specification}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">{item.requiredQuantity}</TableCell>
                      {/* <TableCell className="text-right">{item.allocatedQuantity}</TableCell> */}
                      <TableCell className="text-right">
                        {item.requiredQuantity - (allocationData[item.id] || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={allocationData[item.id] || 0}
                          onChange={(e) => setAllocationData({
                            ...allocationData,
                            [item.id]: Number(e.target.value)
                          })}
                          className="w-20 text-right"
                          min={0}
                          max={item.requiredQuantity}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAllocationModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkUpdate}>
                  Update Allocations
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}