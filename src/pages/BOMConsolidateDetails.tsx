import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Package, FileText, Calendar, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, History, Eye } from "lucide-react";
import ChangeHistoryModal from "@/components/bom/ChangeHistoryModal";

interface BOMConsolidateItem {
  id: string;
  materialName: string;
  requiredQuantity: number;
  inhouse: number;
  purchased: number;
  outsourced: number;
  unit: string;
  status: 'Complete' | 'Partial' | 'Pending';
}

interface ChangeItem {
  id: string;
  action: 'added' | 'updated' | 'deleted';
  materialName: string;
  field?: string;
  oldValue?: string | number;
  newValue?: string | number;
  unit?: string;
}

interface ChangeHistory {
  id: string;
  transactionId: string;
  updatedBy: string;
  updateDate: string;
  changesCount: number;
  changes: ChangeItem[];
}

interface BOMConsolidateDetails {
  id: string;
  projectName: string;
  itemName: string;
  totalItems: number;
  createdBy: string;
  createdDate: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'In Progress';
  items: BOMConsolidateItem[];
}

const mockConsolidateData: BOMConsolidateDetails = {
  id: "BOM-001",
  projectName: "Office Building Construction",
  itemName: "Foundation Work",
  totalItems: 15,
  createdBy: "Jane Smith",
  createdDate: "2024-01-10",
  status: "Approved",
  items: [
    {
      id: "1",
      materialName: "Cement",
      requiredQuantity: 50,
      inhouse: 20,
      purchased: 25,
      outsourced: 5,
      unit: "bags",
      status: "Complete"
    },
    {
      id: "2", 
      materialName: "Steel Rebar",
      requiredQuantity: 100,
      inhouse: 40,
      purchased: 50,
      outsourced: 0,
      unit: "kg",
      status: "Partial"
    },
    {
      id: "3",
      materialName: "Concrete Blocks",
      requiredQuantity: 200,
      inhouse: 0,
      purchased: 150,
      outsourced: 50,
      unit: "pieces",
      status: "Complete"
    },
    {
      id: "4",
      materialName: "Sand",
      requiredQuantity: 75,
      inhouse: 25,
      purchased: 30,
      outsourced: 0,
      unit: "cubic meters",
      status: "Partial"
    },
    {
      id: "5",
      materialName: "MAXIMA VERTICAL 2.5 MTR",
      requiredQuantity: 15,
      inhouse: 10,
      purchased: 5,
      outsourced: 0,
      unit: "pieces",
      status: "Complete"
    },
    {
      id: "6",
      materialName: "OCTONORM VERTICAL 2.5 MTR",
      requiredQuantity: 25,
      inhouse: 15,
      purchased: 10,
      outsourced: 0,
      unit: "pieces",
      status: "Complete"
    }
  ]
};

const mockChangeHistory: ChangeHistory[] = [
  {
    id: "1",
    transactionId: "001",
    updatedBy: "John Doe",
    updateDate: "2024-01-15T14:30:00Z",
    changesCount: 3,
    changes: [
      {
        id: "c1",
        action: "updated",
        materialName: "Cement",
        field: "Required Quantity",
        oldValue: 45,
        newValue: 50,
        unit: "bags"
      },
      {
        id: "c2",
        action: "updated",
        materialName: "Steel Rebar",
        field: "Purchased",
        oldValue: 45,
        newValue: 50,
        unit: "kg"
      },
      {
        id: "c3",
        action: "added",
        materialName: "MAXIMA VERTICAL 2.5 MTR",
        newValue: 15,
        unit: "pieces"
      }
    ]
  },
  {
    id: "2",
    transactionId: "002",
    updatedBy: "Jane Smith",
    updateDate: "2024-01-12T09:15:00Z",
    changesCount: 2,
    changes: [
      {
        id: "c4",
        action: "added",
        materialName: "Sand",
        newValue: 75,
        unit: "cubic meters"
      },
      {
        id: "c5",
        action: "deleted",
        materialName: "Gravel",
        oldValue: 30,
        unit: "cubic meters"
      }
    ]
  },
  {
    id: "3",
    transactionId: "003",
    updatedBy: "Mike Johnson",
    updateDate: "2024-01-11T16:45:00Z",
    changesCount: 1,
    changes: [
      {
        id: "c6",
        action: "updated",
        materialName: "Concrete Blocks",
        field: "Inhouse",
        oldValue: 5,
        newValue: 0,
        unit: "pieces"
      }
    ]
  }
];

type SortField = 'materialName' | 'requiredQuantity' | 'inhouse' | 'purchased' | 'outsourced' | 'unit' | 'status';
type SortDirection = 'asc' | 'desc';

export default function BOMConsolidateDetails() {
  const { bomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bomData] = useState<BOMConsolidateDetails>(mockConsolidateData);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>('materialName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Change history modal states
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ChangeHistory | null>(null);

  const handleViewChanges = (transaction: ChangeHistory) => {
    setSelectedTransaction(transaction);
    setIsChangeModalOpen(true);
  };

  // Filter and sort items
  const filteredItems = bomData.items.filter(item =>
    item.materialName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedItems.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Complete': return 'default';
      case 'Partial': return 'secondary';
      case 'Pending': return 'outline';
      default: return 'secondary';
    }
  };

  const getBOMStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      case 'In Progress': return 'outline';
      default: return 'secondary';
    }
  };

  const getTotalQuantity = (item: BOMConsolidateItem) => {
    return item.inhouse + item.purchased + item.outsourced;
  };

  const getCompletionPercentage = (item: BOMConsolidateItem) => {
    return Math.round((getTotalQuantity(item) / item.requiredQuantity) * 100);
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
            <h1 className="text-3xl font-bold tracking-tight">BOM Consolidate Details</h1>
            <p className="text-muted-foreground">Material allocation breakdown for BOM {bomId}</p>
          </div>
        </div>
        <Badge variant={getBOMStatusBadgeVariant(bomData.status)} className="text-sm">
          {bomData.status}
        </Badge>
      </div>

      {/* BOM Summary Card */}
      <Card className="pl-2 pt-4">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-4">
              <p className="text-lg font-semibold">{bomData.id}</p>
            </div>
            <div className="space-y-4">
              <p className="text-lg font-semibold">{bomData.projectName}</p>
            </div>
            <div className="space-y-4">
              <p className="text-lg font-semibold">{bomData.itemName}</p>
            </div>
            <div className="space-y-4">
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                {new Date(bomData.createdDate).toLocaleDateString("en-GB", { day: "numeric",  month: "short"})}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">BOM ID</p>
              <p className="text-lg font-semibold">{bomData.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Project Name</p>
              <p className="text-lg font-semibold">{bomData.projectName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Item Name</p>
              <p className="text-lg font-semibold">{bomData.itemName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <p className="text-lg font-semibold">{bomData.totalItems}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p className="text-lg font-semibold">{bomData.createdBy}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created Date</p>
              <p className="text-lg font-semibold">{new Date(bomData.createdDate).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Search */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm bg-background"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} materials
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Material Allocation Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('materialName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Material Name</span>
                      {getSortIcon('materialName')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('requiredQuantity')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Required Quantity</span>
                      {getSortIcon('requiredQuantity')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('inhouse')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Inhouse</span>
                      {getSortIcon('inhouse')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('purchased')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Purchased</span>
                      {getSortIcon('purchased')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('outsourced')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Outsourced</span>
                      {getSortIcon('outsourced')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Total Allocated</TableHead>
                  {/* <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('unit')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Unit</span>
                      {getSortIcon('unit')}
                    </div>
                  </TableHead> */}
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  {/* <TableHead className="text-right">Completion %</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((item) => {
                  const totalAllocated = getTotalQuantity(item);
                  const completionPercentage = getCompletionPercentage(item);
                  
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.materialName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.requiredQuantity}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {item.inhouse}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                          {item.purchased}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                          {item.outsourced}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={`${totalAllocated >= item.requiredQuantity ? 'text-green-600' : 'text-orange-600'}`}>
                          {totalAllocated}
                        </span>
                      </TableCell>
                      {/* <TableCell>
                        <span className="text-sm text-muted-foreground">{item.unit}</span>
                      </TableCell> */}
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      {/* <TableCell className="text-right">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                completionPercentage >= 100 ? 'bg-green-500' : 
                                completionPercentage >= 75 ? 'bg-blue-500' : 
                                completionPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium min-w-12">
                            {completionPercentage}%
                          </span>
                        </div>
                      </TableCell> */}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {currentItems.length === 0 && filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No materials found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Change History Section */}
      {(user?.role === 'Project Manager' || user?.role === 'Store Supervisor') && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Change History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Updated By</TableHead>
                  <TableHead>Update Date</TableHead>
                  <TableHead className="text-center">Changes Count</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockChangeHistory.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{transaction.transactionId}</TableCell>
                    <TableCell>{transaction.updatedBy}</TableCell>
                    <TableCell>
                      {new Date(transaction.updateDate).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {transaction.changesCount} items
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewChanges(transaction)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {mockChangeHistory.length === 0 && (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No change history found</p>
            </div>
          )}
        </CardContent>
      </Card>)}

      {/* Change History Modal */}
      {selectedTransaction && (
        <ChangeHistoryModal
          open={isChangeModalOpen}
          onOpenChange={setIsChangeModalOpen}
          transactionId={selectedTransaction.transactionId}
          changes={selectedTransaction.changes}
          updatedBy={selectedTransaction.updatedBy}
          updateDate={selectedTransaction.updateDate}
        />
      )}
    </div>
  );
}