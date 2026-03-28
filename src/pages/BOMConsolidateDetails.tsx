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
import { bomService } from "@/services/bomService";
import { toast } from "sonner";

// API returns: item_name, unit of measurement, total_qty, total_allotted_qty, total_purchased_qty, total_fabrication_qty
interface BOMConsolidateItem {
  id: string;
  item_name?: string;
  itemName?: string;
  materialName?: string;
  unit?: string;
  qty?: number;
  total_qty?: number;
  totalQty?: number;
  requiredQuantity?: number;
  total_allotted_qty?: number;
  totalAllottedQty?: number;
  allottedQty?: number;
  purchasedQty?: number;
  purchased?: number;
  fabricationQty?: number;
  fabrication?: number;
  inhouse?: number;
  outsourced?: number;
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
  id?: string;
  projectName?: string;
  itemName?: string;
  totalItems?: number;
  createdBy?: string;
  createdDate?: string;
  status?: 'Approved' | 'Pending' | 'Rejected' | 'In Progress';
  items?: BOMConsolidateItem[];
}

// Normalize API response (handles snake_case and camelCase)
function getItemName(item: BOMConsolidateItem): string {
  return item.item_name ?? item.itemName ?? item.materialName ?? '';
}

function getTotalQty(item: BOMConsolidateItem): number {
  return item.qty ?? 0;
}

function getTotalAllottedQty(item: BOMConsolidateItem): number {
  return item.allottedQty ?? 0;
}

function getTotalPurchasedQty(item: BOMConsolidateItem): number {
  return item.purchasedQty ?? 0;
}

function getTotalFabricationQty(item: BOMConsolidateItem): number {
  return item.fabricationQty ?? 0;
}

function getUnit(item: BOMConsolidateItem): string {
  return item.unit ?? '';
}

// Status: total allocated === total qty → completed; 0 → pending; else in progress
function getItemStatus(item: BOMConsolidateItem): 'completed' | 'pending' | 'in progress' {
  const totalQty = getTotalQty(item);
  const totalAllotted = getTotalAllottedQty(item);
  if (totalAllotted >= totalQty && totalQty > 0) return 'completed';
  if (totalAllotted === 0) return 'pending';
  return 'in progress';
}

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

type SortField = 'item_name' | 'unit' | 'total_qty' | 'total_allotted_qty' | 'total_purchased_qty' | 'total_fabrication_qty' | 'status';
type SortDirection = 'asc' | 'desc';

export default function BOMConsolidateDetails() {
  const { bomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bomData, setBomData] = useState<BOMConsolidateDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>('item_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch consolidated BOM items from API
  useEffect(() => {
    if (!bomId) return;
    setLoading(true);
    bomService
      .GetConsolidatedBomItemsById(bomId)
      .then((data: any) => {
        const raw = data?.data ?? data;
        const items = Array.isArray(raw) ? raw : raw?.items ?? [];
        setBomData({
          id: raw?.id ?? bomId,
          projectName: raw?.projectName ?? raw?.project_name,
          itemName: raw?.itemName ?? raw?.item_name,
          createdDate: raw?.createdDate ?? raw?.created_date,
          status: raw?.status,
          items: items.map((it: any, idx: number) => ({ ...it, id: it.id ?? it.itemId ?? String(idx) })),
        });
      })
      .catch(() => {
        toast.error("Failed to load BOM details");
        setBomData(null);
      })
      .finally(() => setLoading(false));
  }, [bomId]);

  // Change history modal states
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ChangeHistory | null>(null);

  const handleViewChanges = (transaction: ChangeHistory) => {
    setSelectedTransaction(transaction);
    setIsChangeModalOpen(true);
  };

  const items = bomData?.items ?? [];

  // Filter and sort items
  const filteredItems = items.filter(item =>
    getItemName(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    switch (sortField) {
      case 'item_name': aValue = getItemName(a); bValue = getItemName(b); break;
      case 'unit': aValue = getUnit(a); bValue = getUnit(b); break;
      case 'total_qty': aValue = getTotalQty(a); bValue = getTotalQty(b); break;
      case 'total_allotted_qty': aValue = getTotalAllottedQty(a); bValue = getTotalAllottedQty(b); break;
      case 'total_purchased_qty': aValue = getTotalPurchasedQty(a); bValue = getTotalPurchasedQty(b); break;
      case 'total_fabrication_qty': aValue = getTotalFabricationQty(a); bValue = getTotalFabricationQty(b); break;
      case 'status': aValue = getItemStatus(a); bValue = getItemStatus(b); break;
      default: aValue = a[sortField as keyof BOMConsolidateItem]; bValue = b[sortField as keyof BOMConsolidateItem];
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = String(bValue ?? '').toLowerCase();
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

  const getStatusName = (item: BOMConsolidateItem) => {
    //if item qty is same as allotted then its completed
    if(item.qty && item.qty == item.allottedQty) {
      return 'Completed';
    }
    else if(item.qty && item.allottedQty > 0) {
      return 'In-Progress';
    }
    else {
      return 'Pending';
    }
    // switch (status) {
    //   case 'completed': return 'default';
    //   case 'in progress': return 'secondary';
    //   case 'pending': return 'outline';
    //   default: return 'secondary';
    // }
  };

  const getStatusBadgeVariant = (item: BOMConsolidateItem) => {
    //if item qty is same as allotted then its completed
    if(item.qty && item.qty == item.allottedQty) {
      return 'default'; //completed
    }
    else if(item.qty && item.allottedQty > 0) {
      return 'warning'; //in progress
    }
    else {
      return 'outline'; //'pending'
    }
    // switch (status) {
    //   case 'completed': return 'default';
    //   case 'in progress': return 'secondary';
    //   case 'pending': return 'outline';
    //   default: return 'secondary';
    // }
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
        {bomData?.status && (
          <Badge variant={getBOMStatusBadgeVariant(bomData.status)} className="text-sm">
            {bomData.status}
          </Badge>
        )}
      </div>

      {/* BOM Summary Card */}
      {bomData && (
        <Card className="pl-2 pt-4">
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-4">
                <p className="text-lg font-semibold">{bomData.id ?? bomId}</p>
              </div>
              <div className="space-y-4">
                <p className="text-lg font-semibold">{bomData.projectName ?? '-'}</p>
              </div>
              <div className="space-y-4">
                <p className="text-lg font-semibold">{bomData.itemName ?? '-'}</p>
              </div>
              <div className="space-y-4">
                <p className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  {bomData.createdDate ? new Date(bomData.createdDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
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
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems} materials`}
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
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <span className="animate-spin border-2 border-primary border-t-transparent rounded-full h-10 w-10" />
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('item_name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Item Name</span>
                      {getSortIcon('item_name')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('unit')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Unit of Measurement</span>
                      {getSortIcon('unit')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('total_qty')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Req. Qty</span>
                      {getSortIcon('total_qty')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('total_allotted_qty')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Allotted Qty</span>
                      {getSortIcon('total_allotted_qty')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('total_purchased_qty')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Purchased Qty</span>
                      {getSortIcon('total_purchased_qty')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('total_fabrication_qty')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Fabrication Qty</span>
                      {getSortIcon('total_fabrication_qty')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((item) => {
                  const status = getItemStatus(item);
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>{item.unit || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{item.qty}</TableCell>
                      <TableCell className="text-right">
                        <span className={getTotalAllottedQty(item) >= getTotalQty(item) && getTotalQty(item) > 0 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                          {getTotalAllottedQty(item)}
                        </span>
                      </TableCell>
                      <TableCell className={item.purchasedQty > 0 ? "text-right font-medium" : "text-right"}>{item.purchasedQty}</TableCell>
                      <TableCell className={item.fabricationQty > 0 ? "text-right font-medium" : "text-right"}>{item.fabricationQty}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(item)}>
                          {getStatusName(item)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            )}
          </div>

          {!loading && currentItems.length === 0 && filteredItems.length === 0 && (
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