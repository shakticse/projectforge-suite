import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface InventoryRow {
  id: string;
  itemType: 'predefined' | 'custom';
  itemId?: string;
  itemName?: string;
  customName?: string;
  quantity: number;
  source: string;
}

interface AddInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data for available items
const availableItems = [
  { id: 'item1', name: 'Widget A', sku: 'WGT-001' },
  { id: 'item2', name: 'Component B', sku: 'CMP-002' },
  { id: 'item3', name: 'Part C', sku: 'PRT-003' },
  { id: 'item4', name: 'Material D', sku: 'MTL-004' },
  { id: 'item5', name: 'Supply E', sku: 'SUP-005' },
  { id: 'item6', name: 'Tool F', sku: 'TOL-006' },
];

const sources = [
  'New Purchase',
  'Return',
  'Inventory Update',
  'Transfer',
  'Adjustment'
];

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({ open, onOpenChange }) => {
  const [rows, setRows] = useState<InventoryRow[]>([
    {
      id: '1',
      itemType: 'predefined',
      quantity: 0,
      source: ''
    }
  ]);
  const [openComboboxes, setOpenComboboxes] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const addRow = () => {
    const newRow: InventoryRow = {
      id: Date.now().toString(),
      itemType: 'predefined',
      quantity: 0,
      source: ''
    };
    setRows([...rows, newRow]);
  };

  const deleteRow = (rowId: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== rowId));
    }
  };

  const updateRow = (rowId: string, updates: Partial<InventoryRow>) => {
    setRows(rows.map(row => 
      row.id === rowId ? { ...row, ...updates } : row
    ));
  };

  const handleSubmit = () => {
    const validRows = rows.filter(row => {
      const hasValidItem = row.itemType === 'custom' 
        ? row.customName?.trim() 
        : row.itemId;
      return hasValidItem && row.quantity > 0 && row.source;
    });

    if (validRows.length === 0) {
      toast({
        title: "Invalid Data",
        description: "Please fill in all required fields for at least one item.",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically send the data to your backend
    console.log('Submitting inventory data:', validRows);
    
    toast({
      title: "Success",
      description: `Successfully added ${validRows.length} item(s) to inventory.`
    });

    // Reset form and close modal
    setRows([{
      id: '1',
      itemType: 'predefined',
      quantity: 0,
      source: ''
    }]);
    onOpenChange(false);
  };

  const toggleCombobox = (rowId: string) => {
    setOpenComboboxes(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Items to Inventory</DialogTitle>
          <DialogDescription>
            Add multiple items to your inventory. You can select from existing items or add custom items.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Items</h3>
              <Button onClick={addRow} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Item</TableHead>
                    <TableHead className="w-[120px]">Quantity</TableHead>
                    <TableHead className="w-[180px]">Source</TableHead>
                    <TableHead className="w-[60px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              variant={row.itemType === 'predefined' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateRow(row.id, { itemType: 'predefined', customName: '', itemId: '', itemName: '' })}
                              className="text-xs"
                            >
                              Select Item
                            </Button>
                            <Button
                              variant={row.itemType === 'custom' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateRow(row.id, { itemType: 'custom', itemId: '', itemName: '' })}
                              className="text-xs"
                            >
                              Custom Item
                            </Button>
                          </div>

                          {row.itemType === 'predefined' ? (
                            <Popover open={openComboboxes[row.id]} onOpenChange={() => toggleCombobox(row.id)}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between text-left font-normal"
                                >
                                  {row.itemName || "Search and select item..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[280px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search items..." />
                                  <CommandEmpty>No item found.</CommandEmpty>
                                  <CommandList>
                                    <CommandGroup>
                                      {availableItems.map((item) => (
                                        <CommandItem
                                          key={item.id}
                                          value={item.name}
                                          onSelect={() => {
                                            updateRow(row.id, {
                                              itemId: item.id,
                                              itemName: `${item.name} (${item.sku})`
                                            });
                                            toggleCombobox(row.id);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              row.itemId === item.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {item.name} ({item.sku})
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <Input
                              placeholder="Enter custom item name..."
                              value={row.customName || ''}
                              onChange={(e) => updateRow(row.id, { customName: e.target.value })}
                            />
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={row.quantity || ''}
                          onChange={(e) => updateRow(row.id, { quantity: Number(e.target.value) })}
                        />
                      </TableCell>

                      <TableCell>
                        <Select 
                          value={row.source} 
                          onValueChange={(value) => updateRow(row.id, { source: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            {sources.map((source) => (
                              <SelectItem key={source} value={source}>
                                {source}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRow(row.id)}
                          disabled={rows.length === 1}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
          <Button onClick={handleSubmit}>
            Add Items to Inventory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};