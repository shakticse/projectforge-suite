import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Minus, Edit } from "lucide-react";

interface ChangeItem {
  id: string;
  action: 'added' | 'updated' | 'deleted';
  materialName: string;
  groupName?: string;
  oldQty?: string | null;
  newQty?: string | null;
  otherChanges: string[];
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change History Details</DialogTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">#</p>
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
                  <TableHead>Item Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead className="text-right">Previous Qty</TableHead>
                  <TableHead className="text-right">New Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changes.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell className="font-medium">{change.materialName}</TableCell>
                    <TableCell>{change.groupName || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(change.action)}
                        <Badge variant={getActionBadgeVariant(change.action)} className="text-xs">
                          {change.action.charAt(0).toUpperCase() + change.action.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-red-600">{change.oldQty ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-green-700">{change.newQty ?? '—'}</TableCell>
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