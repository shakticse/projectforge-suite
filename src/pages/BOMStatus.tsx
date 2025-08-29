import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Filter, Activity, User, Calendar, Package, Truck } from "lucide-react";

interface BOMStatusItem {
  id: string;
  itemName: string;
  quantity: number;
  requestDate: string;
  requestedBy: string;
  attendedBy?: string;
  allocatedQty?: number;
  assignedTo?: 'dispatch' | 'outsourced' | null;
  dispatchStatus: 'Pending' | 'In Transit' | 'Delivered' | 'Not Dispatched';
}

const mockBOMStatus: Record<string, BOMStatusItem[]> = {
  "BOM-001": [
    {
      id: "item-1",
      itemName: "Cement",
      quantity: 50,
      requestDate: "2024-01-10",
      requestedBy: "John Doe",
      attendedBy: "Sarah Wilson",
      allocatedQty: 45,
      assignedTo: 'dispatch',
      dispatchStatus: "In Transit"
    },
    {
      id: "item-2", 
      itemName: "Steel Rebar",
      quantity: 100,
      requestDate: "2024-01-10",
      requestedBy: "John Doe",
      attendedBy: "Mike Johnson",
      allocatedQty: 100,
      assignedTo: 'outsourced',
      dispatchStatus: "Pending"
    }
  ],
  "BOM-002": [
    {
      id: "item-3",
      itemName: "Concrete Blocks",
      quantity: 200,
      requestDate: "2024-01-12",
      requestedBy: "Mike Johnson",
      dispatchStatus: "Not Dispatched"
    },
    {
      id: "item-4",
      itemName: "Cement",
      quantity: 75,
      requestDate: "2024-01-12",
      requestedBy: "Mike Johnson",
      attendedBy: "Sarah Wilson",
      allocatedQty: 70,
      assignedTo: 'dispatch',
      dispatchStatus: "Delivered"
    }
  ]
};

export default function BOMStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const items = mockBOMStatus[id || ""] || [];
  
  const filteredItems = items.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.attendedBy && item.attendedBy.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDispatchStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Delivered': return 'default';
      case 'In Transit': return 'secondary';
      case 'Pending': return 'outline';
      case 'Not Dispatched': return 'destructive';
      default: return 'secondary';
    }
  };

  const getAssignmentBadgeVariant = (assignment: string | null | undefined) => {
    switch (assignment) {
      case 'dispatch': return 'default';
      case 'outsourced': return 'secondary';
      default: return 'outline';
    }
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
            <h1 className="text-3xl font-bold tracking-tight">BOM Item Status</h1>
            <p className="text-muted-foreground">BOM ID: {id}</p>
          </div>
        </div>
      </div>

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
            <Activity className="h-5 w-5 mr-2" />
            BOM Status Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Attended By</TableHead>
                  <TableHead>Allocated Qty</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Dispatch Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {new Date(item.requestDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        {item.requestedBy}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.attendedBy ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          {item.attendedBy}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.allocatedQty ? (
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                          {item.allocatedQty}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.assignedTo ? (
                        <Badge variant={getAssignmentBadgeVariant(item.assignedTo)}>
                          {item.assignedTo === 'dispatch' ? 'Dispatch' : 'Outsourced'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Not Assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Badge variant={getDispatchStatusBadgeVariant(item.dispatchStatus)}>
                          {item.dispatchStatus}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No status information found for this BOM</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}