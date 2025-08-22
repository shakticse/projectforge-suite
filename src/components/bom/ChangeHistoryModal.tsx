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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change History Details</DialogTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
              <p className="text-sm font-semibold">{transactionId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Updated By</p>
              <p className="text-sm font-semibold">{updatedBy}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Update Date</p>
              <p className="text-sm font-semibold">{new Date(updateDate).toLocaleString()}</p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-4">Changes Made ({changes.length} items)</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Field</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {formatChangeDescription(change)}
                    </TableCell>
                    <TableCell>
                      {change.field && (
                        <Badge variant="outline" className="text-xs">
                          {change.field}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {change.oldValue && (
                        <span className="text-sm text-red-600 line-through">
                          {change.oldValue} {change.unit}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {change.newValue && (
                        <span className="text-sm text-green-600 font-medium">
                          {change.newValue} {change.unit}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}