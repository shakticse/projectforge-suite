import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { itemStoreService } from '@/services/itemStoreService';
import { itemService } from '@/services/itemService';

interface InventoryRow {
  id: string;
  isCustom: boolean;
  itemId?: string | null;
  itemName?: string | null;
  quantity: number;
  source: string;
  price: number | null;
}

interface AddInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  onStart?: () => void;
  onFinish?: () => void;
}

const sources = [
  'New Purchase',
  'Return',
  'Inventory Update',
  'Transfer',
  'Adjustment'
];

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({ open, onOpenChange, onSaved, onStart, onFinish }) => {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [availableItems, setAvailableItems] = useState<Array<any>>([]);
  const [openComboboxes, setOpenComboboxes] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Template row state
  const [template, setTemplate] = useState<{
    isCustom: boolean;
    itemId?: string;
    itemName?: string;
    quantity: number;
    source: string;
    price: number | null;
  }>({
    isCustom: false,
    itemId: undefined,
    itemName: undefined,
    quantity: 1,
    source: '',
    price: null
  });

  useEffect(() => {
    // fetch items from API
    const fetchItems = async () => {
      try {
        const data = await itemService.getAllItems();
        // Expect items with { id, name, price } but be tolerant
        setAvailableItems(Array.isArray(data) ? data : (data?.data ?? []));
      } catch (err) {
        console.error('Failed to load items', err);
        toast({ title: 'Error', description: 'Failed to load items for selection', variant: 'destructive' });
      }
    };

    fetchItems();
  }, []);

  const toggleCombobox = (key: string) => {
    setOpenComboboxes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addTemplateRow = () => {
    const valid = template.isCustom
      ? (template.itemName?.trim() && template.quantity > 0 && template.source)
      : (template.itemId && template.quantity > 0 && template.source);

    if (!valid) {
      toast({ title: 'Invalid', description: 'Please select an item (or enter a custom name), quantity and source.', variant: 'destructive' });
      return;
    }

    const newRow: InventoryRow = {
      id: Date.now().toString(),
      isCustom: !!template.isCustom,
      itemId: template.isCustom ? null : template.itemId ?? null,
      itemName: template.isCustom ? template.itemName ?? '' : template.itemName ?? '',
      quantity: template.quantity,
      source: template.source,
      price: template.price ?? null
    };

    setRows(prev => [...prev, newRow]);

    // reset template
    setTemplate({ isCustom: false, itemId: undefined, itemName: undefined, quantity: 1, source: '', price: null });
  };

  const deleteRow = (rowId: string) => {
    setRows(rows.filter(row => row.id !== rowId));
  };

  const updateRow = (rowId: string, updates: Partial<InventoryRow>) => {
    setRows(rows.map(row => row.id === rowId ? { ...row, ...updates } : row));
  };

  const handleSubmit = async () => {
    const validRows = rows.filter(r => (r.isCustom ? r.itemName?.trim() : r.itemId) && r.quantity > 0 && r.source);
    if (validRows.length === 0) {
      toast({ title: 'Invalid Data', description: 'Please add at least one valid row before submitting.', variant: 'destructive' });
      return;
    }

    const payload = validRows.map(r => ({
      ItemId: r.isCustom ? null : r.itemId,
      ItemName: r.itemName ?? null,
      IsCustom: r.isCustom,
      Qty: r.quantity,
      ItemPrice: r.price ?? null,
      Source: r.source,
      CreatedBy: (user as any)?.id ?? null,
      CreatedAt: new Date().toISOString()
    }));

    try {
      onStart && onStart();
      setIsSubmitting(true);
      await itemStoreService.createBulk(payload);

      toast({ title: 'Success', description: `Successfully added ${payload.length} item(s) to inventory.` });

      // reset
      setRows([]);
      setTemplate({ isCustom: false, itemId: undefined, itemName: undefined, quantity: 1, source: '', price: null });
      onOpenChange(false);
      onSaved && onSaved();
    } catch (err) {
      console.error('Create store items failed', err);
      toast({ title: 'Error', description: 'Failed to add items to inventory.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      onFinish && onFinish();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Items to Inventory</DialogTitle>
          <DialogDescription>
            Add multiple items to your inventory. Select or create a custom item in the template, then click "Add Row" to append it to the list below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Items</h3>
              <Button onClick={addTemplateRow} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
            </div>

            {/* Template Row (outside table) */}
            <div className="border rounded-lg p-3 bg-muted/20">
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-6">
                  <div className="flex gap-2 mb-2">
                    <Button size="sm" variant={!template.isCustom ? 'default' : 'outline'} onClick={() => setTemplate(prev => ({ ...prev, isCustom: false, itemName: undefined }))} className="text-xs">Select Item</Button>
                    <Button size="sm" variant={template.isCustom ? 'default' : 'outline'} onClick={() => setTemplate(prev => ({ ...prev, isCustom: true, itemId: undefined }))} className="text-xs">Custom Item</Button>
                  </div>

                  {!template.isCustom ? (
                    <Popover open={!!openComboboxes['template']} onOpenChange={() => toggleCombobox('template')}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between text-left font-normal" role="combobox">
                          {template.itemName || 'Search and select item...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search items..." />
                          <CommandEmpty>No item found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {availableItems.map((item: any) => (
                                <CommandItem key={item.id ?? item.Id ?? item.ItemId} value={item.name ?? item.ItemName ?? item.Item} onSelect={() => {
                                  const name = item.name ?? item.ItemName ?? item.Name ?? '';
                                  const id = item.id ?? item.ItemId ?? null;
                                  const price = Number(item.itemPrice ?? item.ItemPrice ?? item.UnitPrice ?? 0);
                                  setTemplate(prev => ({ ...prev, itemId: String(id), itemName: `${name}${item.sku ? ` (${item.sku})` : ''}`, price }));
                                  toggleCombobox('template');
                                }}>
                                  <Check className={cn('mr-2 h-4 w-4', template.itemId === String(item.id ?? item.ItemId) ? 'opacity-100' : 'opacity-0')} />
                                  {(item.name ?? item.ItemName ?? item.Name)} {item.sku ? `(${item.sku})` : ''}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Input placeholder="Enter custom item name..." value={template.itemName ?? ''} onChange={(e) => setTemplate(prev => ({ ...prev, itemName: e.target.value }))} />
                  )}
                </div>

                <div className="col-span-2">
                  <Input type="number" min={0} value={template.price ?? ''} placeholder="Price" onChange={(e) => setTemplate(prev => ({ ...prev, price: Number(e.target.value) }))} />
                </div>

                <div className="col-span-1">
                  <Input type="number" min={1} value={template.quantity} onChange={(e) => setTemplate(prev => ({ ...prev, quantity: Number(e.target.value) }))} />
                </div>

                <div className="col-span-2">
                  <Select value={template.source} onValueChange={(value) => setTemplate(prev => ({ ...prev, source: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setTemplate({ isCustom: false, itemId: undefined, itemName: undefined, quantity: 1, source: '', price: null })}>Reset</Button>
                </div>
              </div>
            </div>

            {/* Rows Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[360px]">Item</TableHead>
                    <TableHead className="w-[120px]">Price</TableHead>
                    <TableHead className="w-[120px]">Quantity</TableHead>
                    <TableHead className="w-[180px]">Source</TableHead>
                    <TableHead className="w-[60px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.itemName}</TableCell>
                      <TableCell>
                        <Input type="number" min={0} value={row.price ?? ''} onChange={(e) => updateRow(row.id, { price: Number(e.target.value) })} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min={0} value={row.quantity} onChange={(e) => updateRow(row.id, { quantity: Number(e.target.value) })} />
                      </TableCell>
                      <TableCell>
                        <Select value={row.source} onValueChange={(value) => updateRow(row.id, { source: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => deleteRow(row.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rows.length === 0}>
            {isSubmitting ? (
              <>
                <svg className="animate-spin mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
                Adding...
              </>
            ) : (
              'Add Items to Inventory'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};