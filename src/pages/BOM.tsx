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
import { Plus, Search, FileText, Package, Calculator } from "lucide-react";
import { toast } from "sonner";
import { bomSchema } from "@/lib/validations";

interface BOMItem {
  id: string;
  projectId: string;
  projectName: string;
  itemName: string;
  materials: Array<{
    materialId: string;
    materialName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  totalCost: number;
  createdDate: string;
  status: 'Draft' | 'Approved' | 'In Use';
}

const mockBOMs: BOMItem[] = [
  {
    id: "1",
    projectId: "proj-1",
    projectName: "Office Building Construction",
    itemName: "Concrete Foundation",
    materials: [
      { materialId: "mat-1", materialName: "Cement", quantity: 50, unitCost: 25, totalCost: 1250 },
      { materialId: "mat-2", materialName: "Steel Rebar", quantity: 100, unitCost: 15, totalCost: 1500 }
    ],
    totalCost: 2750,
    createdDate: "2024-01-15",
    status: "Approved"
  }
];

export default function BOM() {
  const [boms] = useState<BOMItem[]>(mockBOMs);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: yupResolver(bomSchema),
    defaultValues: {
      projectId: "",
      itemName: "",
      materials: [],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      console.log("Creating BOM:", data);
      toast.success("BOM created successfully!");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to create BOM");
    }
  };

  const filteredBOMs = boms.filter(bom =>
    bom.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bill of Materials</h1>
          <p className="text-muted-foreground">Manage project material requirements</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create BOM
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New BOM</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="proj-1">Office Building Construction</SelectItem>
                          <SelectItem value="proj-2">Residential Complex</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="itemName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Concrete Foundation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create BOM</Button>
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
            placeholder="Search BOMs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBOMs.map((bom) => (
          <Card key={bom.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{bom.itemName}</CardTitle>
                </div>
                <Badge variant={bom.status === 'Approved' ? 'default' : 'secondary'}>
                  {bom.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{bom.projectName}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Materials ({bom.materials.length})
                </h4>
                {bom.materials.slice(0, 3).map((material) => (
                  <div key={material.materialId} className="flex justify-between text-sm text-muted-foreground">
                    <span>{material.materialName} (x{material.quantity})</span>
                    <span>${material.totalCost}</span>
                  </div>
                ))}
                {bom.materials.length > 3 && (
                  <p className="text-sm text-muted-foreground">
                    +{bom.materials.length - 3} more materials
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="font-medium">Total Cost:</span>
                </div>
                <span className="text-lg font-bold text-primary">${bom.totalCost}</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <strong>Created:</strong> {new Date(bom.createdDate).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}