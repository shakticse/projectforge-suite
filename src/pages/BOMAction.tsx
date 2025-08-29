import { useState } from "react";
import { Search, Edit, Save, X, Plus } from "lucide-react";
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

const projects = [
  { id: "1", name: "Residential Complex A" },
  { id: "2", name: "Commercial Plaza B" },
  { id: "3", name: "Industrial Warehouse C" }
];

export default function BOMAction() {
  const [bomItems, setBOMItems] = useState<BOMItem[]>(mockBOMItems);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<BOMItem>>({});

  const filteredItems = bomItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.specification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesPriority = filterPriority === "all" || item.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleEdit = (item: BOMItem) => {
    setEditingId(item.id);
    setEditData(item);
  };

  const handleSave = () => {
    if (!editingId) return;
    
    setBOMItems(items => 
      items.map(item => 
        item.id === editingId 
          ? { 
              ...item, 
              ...editData,
              pendingQuantity: (editData.requiredQuantity || item.requiredQuantity) - (editData.allocatedQuantity || item.allocatedQuantity),
              status: (editData.allocatedQuantity || item.allocatedQuantity) === 0 ? 'pending' as const :
                      (editData.allocatedQuantity || item.allocatedQuantity) >= (editData.requiredQuantity || item.requiredQuantity) ? 'complete' as const : 'partial' as const
            }
          : item
      )
    );
    
    setEditingId(null);
    setEditData({});
    toast.success("BOM item updated successfully");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleAllocateQuantity = (itemId: string, quantity: number) => {
    setBOMItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const newAllocated = Math.min(quantity, item.requiredQuantity);
          const newPending = item.requiredQuantity - newAllocated;
          const newStatus = newAllocated === 0 ? 'pending' as const :
                           newAllocated >= item.requiredQuantity ? 'complete' as const : 'partial' as const;
          
          return {
            ...item,
            allocatedQuantity: newAllocated,
            pendingQuantity: newPending,
            status: newStatus
          };
        }
        return item;
      })
    );
    toast.success("Quantity allocated successfully");
  };

  const getStatusBadge = (status: string) => {
    const variants = {
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
          <h1 className="text-3xl font-bold tracking-tight">BOM Action</h1>
          <p className="text-muted-foreground">
            Allocate quantities and manage Bill of Materials
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Selection & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>BOM Items ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Specification</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Required Qty</TableHead>
                <TableHead className="text-right">Allocated Qty</TableHead>
                <TableHead className="text-right">Pending Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {editingId === item.id ? (
                      <Input
                        value={editData.itemName || item.itemName}
                        onChange={(e) => setEditData({...editData, itemName: e.target.value})}
                        className="w-full"
                      />
                    ) : (
                      item.itemName
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        value={editData.specification || item.specification}
                        onChange={(e) => setEditData({...editData, specification: e.target.value})}
                        className="w-full"
                      />
                    ) : (
                      item.specification
                    )}
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        value={editData.requiredQuantity || item.requiredQuantity}
                        onChange={(e) => setEditData({...editData, requiredQuantity: Number(e.target.value)})}
                        className="w-20 text-right"
                      />
                    ) : (
                      item.requiredQuantity
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editData.allocatedQuantity || item.allocatedQuantity}
                          onChange={(e) => setEditData({...editData, allocatedQuantity: Number(e.target.value)})}
                          className="w-20 text-right"
                          max={editData.requiredQuantity || item.requiredQuantity}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAllocateQuantity(item.id, editData.allocatedQuantity || item.allocatedQuantity)}
                        >
                          Allocate
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{item.allocatedQuantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const quantity = prompt("Enter quantity to allocate:", item.allocatedQuantity.toString());
                            if (quantity && !isNaN(Number(quantity))) {
                              handleAllocateQuantity(item.id, Number(quantity));
                            }
                          }}
                        >
                          Quick Allocate
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{item.pendingQuantity}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell className="text-center">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleSave}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}