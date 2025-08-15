import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, Truck, ArrowRight, ArrowLeft, Package, User } from "lucide-react";
import { toast } from "sonner";
import { gatePassSchema } from "@/lib/validations";

interface GatePass {
  id: string;
  type: 'Inward' | 'Outward';
  vehicleNumber: string;
  driverName: string;
  purpose: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
  }>;
  status: 'Active' | 'Completed' | 'Cancelled';
  createdDate: string;
  completedDate?: string;
}

const mockGatePasses: GatePass[] = [
  {
    id: "GP-001",
    type: "Inward",
    vehicleNumber: "ABC-1234",
    driverName: "John Driver",
    purpose: "Material Delivery",
    items: [
      { itemId: "item-1", itemName: "Steel Rebar", quantity: 100 },
      { itemId: "item-2", itemName: "Cement Bags", quantity: 50 }
    ],
    status: "Completed",
    createdDate: "2024-01-15",
    completedDate: "2024-01-15"
  },
  {
    id: "GP-002",
    type: "Outward",
    vehicleNumber: "XYZ-5678",
    driverName: "Sarah Transport",
    purpose: "Equipment Return",
    items: [
      { itemId: "item-3", itemName: "Power Tools", quantity: 5 }
    ],
    status: "Active",
    createdDate: "2024-01-20"
  }
];

export default function GatePass() {
  const [gatePasses] = useState<GatePass[]>(mockGatePasses);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: yupResolver(gatePassSchema),
    defaultValues: {
      type: "Inward",
      vehicleNumber: "",
      driverName: "",
      purpose: "",
      items: [],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      console.log("Creating gate pass:", data);
      toast.success("Gate pass created successfully!");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to create gate pass");
    }
  };

  const filteredGatePasses = gatePasses.filter(gp =>
    gp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gp.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gp.driverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Active': return 'secondary';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'Inward' ? ArrowRight : ArrowLeft;
  };

  const getTypeColor = (type: string) => {
    return type === 'Inward' ? 'text-green-600' : 'text-blue-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gate Pass</h1>
          <p className="text-muted-foreground">Manage inward and outward movement of goods</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Gate Pass
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Gate Pass</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Inward">Inward</SelectItem>
                          <SelectItem value="Outward">Outward</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vehicleNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Number</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="driverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Driver" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Material delivery, equipment return, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Gate Pass</Button>
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
            placeholder="Search gate passes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGatePasses.map((gatePass) => {
          const TypeIcon = getTypeIcon(gatePass.type);
          return (
            <Card key={gatePass.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{gatePass.id}</CardTitle>
                    <TypeIcon className={`h-4 w-4 ${getTypeColor(gatePass.type)}`} />
                    <Badge variant="outline" className={getTypeColor(gatePass.type)}>
                      {gatePass.type}
                    </Badge>
                  </div>
                  <Badge variant={getStatusColor(gatePass.status) as any}>
                    {gatePass.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Vehicle:</span>
                    <p className="font-medium">{gatePass.vehicleNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Driver:</span>
                    <p className="font-medium">{gatePass.driverName}</p>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="text-muted-foreground">Purpose:</span>
                  <p className="font-medium">{gatePass.purpose}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center text-sm">
                    <Package className="h-4 w-4 mr-2" />
                    Items ({gatePass.items.length})
                  </h4>
                  {gatePass.items.slice(0, 2).map((item) => (
                    <div key={item.itemId} className="flex justify-between text-sm text-muted-foreground">
                      <span>{item.itemName}</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  ))}
                  {gatePass.items.length > 2 && (
                    <p className="text-sm text-muted-foreground">
                      +{gatePass.items.length - 2} more items
                    </p>
                  )}
                </div>
                
                <div className="pt-3 border-t text-sm text-muted-foreground">
                  <div><strong>Created:</strong> {new Date(gatePass.createdDate).toLocaleDateString()}</div>
                  {gatePass.completedDate && (
                    <div><strong>Completed:</strong> {new Date(gatePass.completedDate).toLocaleDateString()}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}