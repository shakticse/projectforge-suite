import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { itemStoreService } from '@/services/itemStoreService';
import { useAuth } from '@/hooks/useAuth';

interface EditInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null; // store item or consolidated item (expects id, Qty/totalQuantity, ItemPrice etc.)
  onSaved?: (updated: any) => void;
  onStart?: () => void;
  onFinish?: () => void;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({ open, onOpenChange, item, onSaved, onStart, onFinish }) => {
  const [qty, setQty] = useState<number | string>('');
  const [price, setPrice] = useState<number | string>('');
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setQty(item?.totalQuantity ?? item?.qty ?? '');
    setPrice(item?.unitPrice ?? item?.itemPrice ?? '');
  }, [item]);

  const handleSave = async () => {
    if (!item?.id) return;
    try {
      onStart && onStart();
      setIsSaving(true);
      const payload: any = {
        Qty: Number(qty),
        ItemPrice: price ? Number(price) : null,
        UpdatedByUser: user?.email,
        UpdatedAt: new Date().toISOString()
      };
      const res = await itemStoreService.update(item.id, payload);
      toast({ title: 'Updated', description: 'Store item updated successfully.' });
      onSaved && onSaved(res);
      onOpenChange(false);
    } catch (err) {
      console.error('Update failed', err);
      toast({ title: 'Error', description: 'Failed to update item.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
      onFinish && onFinish();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Item - {item?.name ?? item?.itemName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Quantity</Label>
            <Input type="number" value={qty as any} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div>
            <Label>Unit Price</Label>
            <Input type="number" value={price as any} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <svg className="animate-spin mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditInventoryModal;