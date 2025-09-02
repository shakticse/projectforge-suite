import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Minus, Edit } from "lucide-react";

interface ChangeItem {
  id: string;
  action: 'added' | 'updated' | 'deleted';
  materialName: string;
  field?: string;
  oldValue?: string | number;
  newValue?: string | number;
  unit?: string;
}

interface ChangeHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  changes: ChangeItem[];
  updatedBy: string;
  updateDate: string;
}

export default function ChangeHistoryModal({ 
  open, 
  onOpenChange, 
  transactionId, 
  changes, 
  updatedBy, 
  updateDate 
}: ChangeHistoryModalProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'added': return <Plus className="h-4 w-4 text-green-600" />;
      case 'deleted': return <Minus className="h-4 w-4 text-red-600" />;
      case 'updated': return <Edit className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'added': return 'default';
      case 'deleted': return 'destructive';
      case 'updated': return 'secondary';
      default: return 'outline';
    }
  };

  const formatChangeDescription = (change: ChangeItem) => {
    switch (change.action) {
      case 'added':
        return `Added new material: ${change.materialName}`;
      case 'deleted':
        return `Deleted material: ${change.materialName}`;
      case 'updated':
        return `Updated ${change.field} from ${change.oldValue} to ${change.newValue}`;
      default:
        return 'Unknown action';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Change History Details</DialogTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">#</p>
              <p className="text-sm sm:text-base font-semibold">{transactionId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Updated By</p>
              <p className="text-sm sm:text-base font-semibold">{updatedBy}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Update Date</p>
              <p className="text-sm sm:text-base font-semibold">{new Date(updateDate).toLocaleString()}</p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4 sm:mt-6">
          <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Changes Made ({changes.length} items)</h4>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Old Value</TableHead>
                  <TableHead>New Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changes.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(change.action)}
                        <Badge variant={getActionBadgeVariant(change.action)} className="text-xs">
                          {change.action.charAt(0).toUpperCase() + change.action.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{change.materialName}</TableCell>
                    <TableCell>
                      {change.oldValue && (
                        <span className="text-sm text-red-600 line-through">
                          {change.oldValue}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {change.newValue && (
                        <span className="text-sm text-green-600 font-medium">
                          {change.newValue}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {changes.map((change) => (
              <div key={change.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getActionIcon(change.action)}
                    <Badge variant={getActionBadgeVariant(change.action)} className="text-xs">
                      {change.action.charAt(0).toUpperCase() + change.action.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Material Name</p>
                  <p className="font-medium text-base">{change.materialName}</p>
                </div>
                
                {(change.oldValue || change.newValue) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Old Value</p>
                      {change.oldValue ? (
                        <span className="text-sm text-red-600 line-through">
                          {change.oldValue}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">New Value</p>
                      {change.newValue ? (
                        <span className="text-sm text-green-600 font-medium">
                          {change.newValue}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}