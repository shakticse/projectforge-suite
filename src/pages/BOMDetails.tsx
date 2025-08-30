import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Filter, Calendar, User } from "lucide-react";

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

export default function BOMDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const items = mockBOMDetails[id || ""] || [];
  
  const filteredItems = items.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
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
    </div>
  );
}