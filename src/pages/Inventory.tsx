import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Filter,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock inventory data
  const inventoryItems = [
    {
      id: 1,
      name: "Steel Sheets 4x8",
      sku: "STL-4X8-001",
      category: "Raw Materials",
      quantity: 150,
      minStock: 100,
      maxStock: 500,
      unitPrice: 125.50,
      totalValue: 18825,
      supplier: "MetalCorp Industries",
      location: "Warehouse A-1",
      status: "In Stock"
    },
    {  
      id: 2,
      name: "Aluminum Pipes 2inch",
      sku: "ALU-P2-002", 
      category: "Raw Materials",
      quantity: 45,
      minStock: 50,
      maxStock: 200,
      unitPrice: 35.75,
      totalValue: 1608.75,
      supplier: "Aluminum Solutions",
      location: "Warehouse A-2",
      status: "Low Stock"
    },
    {
      id: 3,
      name: "Industrial Screws M8",
      sku: "SCR-M8-003",
      category: "Hardware", 
      quantity: 2500,
      minStock: 1000,
      maxStock: 5000,
      unitPrice: 0.25,
      totalValue: 625,
      supplier: "FastenTech",
      location: "Warehouse B-1",
      status: "In Stock"
    },
    {
      id: 4,
      name: "Electric Motors 5HP",
      sku: "MOT-5HP-004",
      category: "Equipment",
      quantity: 12,
      minStock: 10,
      maxStock: 30,
      unitPrice: 850.00,
      totalValue: 10200,
      supplier: "ElectroMotors Inc",
      location: "Equipment Storage",
      status: "In Stock"
    },
    {
      id: 5,
      name: "Safety Helmets",
      sku: "SAF-HLM-005",
      category: "Safety",
      quantity: 3,
      minStock: 25,
      maxStock: 100,
      unitPrice: 25.00,
      totalValue: 75,
      supplier: "SafetyFirst Co",
      location: "Safety Depot",
      status: "Critical"
    }
  ];

  const getStatusBadge = (item: any) => {
    if (item.quantity <= item.minStock * 0.5) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Critical</Badge>;
    } else if (item.quantity <= item.minStock) {
      return <Badge variant="warning" className="gap-1"><TrendingDown className="h-3 w-3" />Low Stock</Badge>;
    } else {
      return <Badge variant="success" className="gap-1"><TrendingUp className="h-3 w-3" />In Stock</Badge>;
    }
  };

  const totalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockItems = inventoryItems.filter(item => item.quantity <= item.minStock).length;
  const criticalItems = inventoryItems.filter(item => item.quantity <= item.minStock * 0.5).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage your inventory levels and stock</p>
        </div>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{inventoryItems.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-warning">{lowStockItems}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-destructive">{criticalItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.supplier}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.quantity}</div>
                      <div className="text-xs text-muted-foreground">
                        Min: {item.minStock} | Max: {item.maxStock}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">${item.totalValue.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(item)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.location}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;