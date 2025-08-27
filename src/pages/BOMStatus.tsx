import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface BOMStatusItem {
  id: string;
  serialNumber: number;
  itemName: string;
  quantity: number;
  dateEntered: string;
  requestedBy: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold';
}

// Mock data for BOM status
const mockBOMData: BOMStatusItem[] = [
  {
    id: '1',
    serialNumber: 1,
    itemName: 'Steel Rod 12mm',
    quantity: 100,
    dateEntered: '2024-01-15',
    requestedBy: 'John Doe',
    status: 'Completed'
  },
  {
    id: '2',
    serialNumber: 2,
    itemName: 'Cement Bags',
    quantity: 50,
    dateEntered: '2024-01-16',
    requestedBy: 'Jane Smith',
    status: 'In Progress'
  },
  {
    id: '3',
    serialNumber: 3,
    itemName: 'Wire Mesh',
    quantity: 25,
    dateEntered: '2024-01-17',
    requestedBy: 'Mike Johnson',
    status: 'Pending'
  },
  {
    id: '4',
    serialNumber: 4,
    itemName: 'PVC Pipes',
    quantity: 75,
    dateEntered: '2024-01-18',
    requestedBy: 'Sarah Wilson',
    status: 'On Hold'
  },
  {
    id: '5',
    serialNumber: 5,
    itemName: 'Electrical Cable',
    quantity: 200,
    dateEntered: '2024-01-19',
    requestedBy: 'David Brown',
    status: 'Completed'
  }
];

export default function BOMStatus() {
  const [searchTerm, setSearchTerm] = useState('');
  const [bomData] = useState<BOMStatusItem[]>(mockBOMData);

  const filteredData = bomData.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'On Hold': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">BOM Status</h1>
        <p className="text-muted-foreground">
          Track and monitor Bill of Materials status and requests
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>BOM Items Status</CardTitle>
          <CardDescription>
            View all BOM items with their current status and details
          </CardDescription>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items or requested by..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">S#</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="w-[100px]">Qty</TableHead>
                <TableHead>Date Entered/Updated</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.serialNumber}
                  </TableCell>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.dateEntered}</TableCell>
                  <TableCell>{item.requestedBy}</TableCell>
                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredData.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              No BOM items found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}