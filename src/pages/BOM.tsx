import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, FileText, Package, Calculator, Trash2, Filter, ChevronLeft, ChevronRight } from "lucide-react";
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
    availableStock: number;
  }>;
  totalQuantity: number;
  startDate: string;
  endDate: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | 'In Progress';
  lastUpdated: string;
  updatedBy: string;
  createdBy: string;
}

interface BOMFormData {
  projectId: string;
  itemName: string;
  materials: Array<{
    materialId: string;
    quantity: number;
    availableStock: number;
  }>;
}

interface MaterialOption {
  id: string;
  name: string;
  availableStock: number;
}

const mockProjects = [
  { id: "proj-1", name: "Office Building Construction" },
  { id: "proj-2", name: "Residential Complex" },
  { id: "proj-3", name: "Shopping Mall Project" },
];

const mockMaterials: MaterialOption[] = [
  { id: "mat-1", name: "Cement", availableStock: 150 },
  { id: "mat-2", name: "Steel Rebar", availableStock: 200 },
  { id: "mat-3", name: "Concrete Blocks", availableStock: 500 },
  { id: "mat-4", name: "Sand", availableStock: 300 },
  { id: "mat-5", name: "Gravel", availableStock: 250 },
];

const mockBOMs: BOMItem[] = [
  {
    id: "BOM-001",
    projectId: "proj-1",
    projectName: "Office Building Construction",
    itemName: "Foundation Work",
    materials: [
      { materialId: "mat-1", materialName: "Cement", quantity: 50, availableStock: 150 },
      { materialId: "mat-2", materialName: "Steel Rebar", quantity: 100, availableStock: 200 }
    ],
    totalQuantity: 150,
    startDate: "2024-01-15",
    endDate: "2024-01-30",
    approvalStatus: "Approved",
    lastUpdated: "2024-01-10",
    updatedBy: "John Doe",
    createdBy: "Jane Smith"
  },
  {
    id: "BOM-002", 
    projectId: "proj-2",
    projectName: "Residential Complex",
    itemName: "Wall Construction",
    materials: [
      { materialId: "mat-3", materialName: "Concrete Blocks", quantity: 200, availableStock: 500 },
      { materialId: "mat-1", materialName: "Cement", quantity: 75, availableStock: 150 }
    ],
    totalQuantity: 275,
    startDate: "2024-02-01",
    endDate: "2024-02-15",
    approvalStatus: "Pending",
    lastUpdated: "2024-01-12",
    updatedBy: "Mike Johnson",
    createdBy: "Sarah Wilson"
  }
];

export default function BOM() {
  const [boms] = useState<BOMItem[]>(mockBOMs);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const form = useForm({
    resolver: yupResolver(bomSchema),
    defaultValues: {
      projectId: "",
      itemName: "",
      materials: [],
    },
  });

  const [materials, setMaterials] = useState<Array<{
    id: number;
    materialId: string;
    quantity: number;
    availableStock: number;
  }>>([]);

  const addMaterialRow = () => {
    const newId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
    setMaterials([...materials, { 
      id: newId, 
      materialId: "", 
      quantity: 0, 
      availableStock: 0 
    }]);
  };

  const removeMaterialRow = (id: number) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const updateMaterial = (id: number, field: string, value: any) => {
    setMaterials(materials.map(m => {
      if (m.id === id) {
        const updated = { ...m, [field]: value };
        if (field === 'materialId') {
          const material = mockMaterials.find(mat => mat.id === value);
          updated.availableStock = material?.availableStock || 0;
        }
        return updated;
      }
      return m;
    }));
  };

  const onSubmit = async (data: any) => {
    try {
      const formData = {
        ...data,
        materials: materials.map(m => ({
          materialId: m.materialId,
          quantity: m.quantity,
          availableStock: m.availableStock
        }))
      };
      console.log("Creating BOM:", formData);
      toast.success("BOM created successfully!");
      setOpen(false);
      form.reset();
      setMaterials([]);
    } catch (error) {
      toast.error("Failed to create BOM");
    }
  };

  const filteredBOMs = boms.filter(bom =>
    bom.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBOMs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBOMs = filteredBOMs.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      case 'In Progress': return 'outline';
      default: return 'secondary';
    }
  };

  const totalItems = materials.length;
  const totalQuantity = materials.reduce((sum, m) => sum + (m.quantity || 0), 0);

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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New BOM</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
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
                          <Input placeholder="Foundation Work" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Materials</h3>
                    <Button type="button" onClick={addMaterialRow} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Material
                    </Button>
                  </div>

                  {materials.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Row #</TableHead>
                            <TableHead>Material</TableHead>
                            <TableHead className="w-32">Available Stock</TableHead>
                            <TableHead className="w-32">Required Quantity</TableHead>
                            <TableHead className="w-16">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {materials.map((material, index) => (
                            <TableRow key={material.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Select 
                                  value={material.materialId} 
                                  onValueChange={(value) => updateMaterial(material.id, 'materialId', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select material" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {mockMaterials.map((mat) => (
                                      <SelectItem key={mat.id} value={mat.id}>
                                        {mat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input 
                                  value={material.availableStock}
                                  readOnly
                                  className="bg-muted"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={material.quantity || ""}
                                  onChange={(e) => updateMaterial(material.id, 'quantity', Number(e.target.value))}
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMaterialRow(material.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {materials.length === 0 && (
                    <div className="border border-dashed rounded-lg p-8 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No materials added yet</p>
                      <p className="text-sm text-muted-foreground">Click "Add Material" to get started</p>
                    </div>
                  )}

                  {materials.length > 0 && (
                    <div className="flex justify-end space-x-6 pt-4 border-t bg-muted/50 p-4 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">Total Items: </span>
                        <span>{totalItems}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Total Quantity: </span>
                        <span>{totalQuantity}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={materials.length === 0}>
                    Create BOM
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between">
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
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBOMs.length)} of {filteredBOMs.length} results
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            BOM Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BOM ID</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Total Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Updated By</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBOMs.map((bom) => (
                  <TableRow key={bom.id} className="hover:bg-muted/50 cursor-pointer">
                    <TableCell className="font-medium">{bom.id}</TableCell>
                    <TableCell>{bom.projectName}</TableCell>
                    <TableCell>{bom.itemName}</TableCell>
                    <TableCell>{new Date(bom.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(bom.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{bom.totalQuantity}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(bom.approvalStatus)}>
                        {bom.approvalStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(bom.lastUpdated).toLocaleDateString()}</TableCell>
                    <TableCell>{bom.updatedBy}</TableCell>
                    <TableCell>{bom.createdBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <div className="flex items-center space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}