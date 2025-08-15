import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, ShoppingCart, Building2, Calendar, Package } from "lucide-react";
import { toast } from "sonner";
import { purchaseOrderSchema } from "@/lib/validations";

interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Confirmed' | 'Delivered' | 'Cancelled';
  deliveryDate: string;
  createdDate: string;
}

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-001",
    vendorId: "vendor-1",
    vendorName: "ABC Suppliers Ltd",
    items: [
      { itemId: "item-1", itemName: "Steel Rebar", quantity: 100, unitPrice: 15, totalPrice: 1500 },
      { itemId: "item-2", itemName: "Cement", quantity: 50, unitPrice: 25, totalPrice: 1250 }
    ],
    totalAmount: 2750,
    status: "Confirmed",
    deliveryDate: "2024-02-15",
    createdDate: "2024-01-10"
  },
  {
    id: "PO-002",
    vendorId: "vendor-2",
    vendorName: "XYZ Materials Inc",
    items: [
      { itemId: "item-3", itemName: "Electrical Wire", quantity: 500, unitPrice: 5, totalPrice: 2500 }
    ],
    totalAmount: 2500,
    status: "Sent",
    deliveryDate: "2024-02-20",
    createdDate: "2024-01-15"
  }
];

export default function PurchaseOrders() {
  const [purchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: yupResolver(purchaseOrderSchema),
    defaultValues: {
      vendorId: "",
      items: [],
      deliveryDate: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      console.log("Creating purchase order:", data);
      toast.success("Purchase order created successfully!");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to create purchase order");
    }
  };

  const filteredPurchaseOrders = purchaseOrders.filter(po =>
    po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'default';
      case 'Confirmed': return 'default';
      case 'Sent': return 'secondary';
      case 'Draft': return 'secondary';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage procurement and supplier orders</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Purchase Order</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vendor-1">ABC Suppliers Ltd</SelectItem>
                          <SelectItem value="vendor-2">XYZ Materials Inc</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Purchase Order</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPurchaseOrders.map((po) => (
          <Card key={po.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{po.id}</CardTitle>
                </div>
                <Badge variant={getStatusColor(po.status) as any}>
                  {po.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{po.vendorName}</span>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Items ({po.items.length})
                </h4>
                {po.items.slice(0, 3).map((item) => (
                  <div key={item.itemId} className="flex justify-between text-sm text-muted-foreground">
                    <span>{item.itemName} (x{item.quantity})</span>
                    <span>${item.totalPrice}</span>
                  </div>
                ))}
                {po.items.length > 3 && (
                  <p className="text-sm text-muted-foreground">
                    +{po.items.length - 3} more items
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Delivery: {new Date(po.deliveryDate).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-bold text-primary">${po.totalAmount}</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <strong>Created:</strong> {new Date(po.createdDate).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}