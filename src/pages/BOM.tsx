import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, FileText, Package, Calculator, Trash2, Filter, ChevronLeft, ChevronRight, Eye, Check, ChevronsUpDown, Type, List, Activity, Edit } from "lucide-react";
import { toast } from "sonner";
import { bomSchema } from "@/lib/validations";

interface BOMItem {
  id: string;
  projectId: string;
  projectName: string;
  itemName: string;
  manager: string;
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
  childItems?: Array<{
    id: string;
    name: string;
    quantity: number;
    perunit: number;
    availableStock: number;
  }>;
}

const mockProjects = [
  { id: "proj-1", name: "G20 Project" },
  { id: "proj-2", name: "India Energy Week" },
  { id: "proj-3", name: "Kochi Metro" },
];

const mockMaterials: MaterialOption[] = [
  { id: "mat-1", name: "BELT TIGHTNER", availableStock: 150 },
  { id: "mat-2", name: "MDF 17MM 8'X4'", availableStock: 200 },
  { id: "mat-3", name: "PAPER BLADE 9MM", availableStock: 500 },
  { id: "mat-4", name: "CUTTER WIRE ROPE", availableStock: 300 },
  { id: "mat-5", name: "CANOPY BEAM 3 MTR", availableStock: 250 },
  { 
    id: "mat-6", 
    name: "STALL 3 MTR X 3 MTR", 
    availableStock: 50,
    childItems: [
      { id: "mat-6-1", name: "MAXIMA VERTICAL 2.5 MTR", quantity: 3, perunit: 1, availableStock: 100 },
      { id: "mat-6-2", name: "OCTONORM VERTICAL 2.5 MTR", quantity: 5, perunit: 5,availableStock: 80 },
      { id: "mat-6-3", name: "OCTONORM PANEL 1 MTR X 2.5 MTR", quantity: 9, perunit: 6, availableStock: 200 },
      { id: "mat-6-4", name: "OCTONORM SECTION 1 MTR, 37 MM", quantity: 18, perunit: 12, availableStock: 150 },
      { id: "mat-6-5", name: "OCTONORM SECTION 3.0 MTR, 50 MM", quantity: 2, perunit: 2, availableStock: 75 },
      { id: "mat-6-6", name: "MAXIMA FASCIA 3 MTR 26 CM", quantity: 2, perunit: 1, availableStock: 90 }
    ]
  }
];

const mockBOMs: BOMItem[] = [
  {
    id: "BOM-001",
    projectId: "proj-1",
    projectName: "G20 Project",
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
    manager: "John Doe",
    updatedBy: "John Doe",
    createdBy: "Jane Smith"
  },
  {
    id: "BOM-002", 
    projectId: "proj-2",
    projectName: "India Energy Week",
    itemName: "Construction",
    materials: [
      { materialId: "mat-3", materialName: "Concrete Blocks", quantity: 200, availableStock: 500 },
      { materialId: "mat-1", materialName: "Cement", quantity: 75, availableStock: 150 }
    ],
    totalQuantity: 275,
    startDate: "2024-02-01",
    endDate: "2024-02-15",
    approvalStatus: "Pending",
    lastUpdated: "2024-01-12",
    manager: "Mike",
    updatedBy: "Mike Johnson",
    createdBy: "Sarah Wilson"
  }
];

export default function BOM() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [boms] = useState<BOMItem[]>(mockBOMs);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOMItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const form = useForm({
    resolver: yupResolver(bomSchema),
    defaultValues: {
      projectId: "",
      materials: [],
    },
  });

  const [materials, setMaterials] = useState<Array<{
    id: number;
    materialId: string;
    quantity: number;
    availableStock: number;
    isChild?: boolean;
    parentId?: number;
    childMultiplier?: number;
    childPerUnitQty?: number;
    isCustom?: boolean;
    customName?: string;
  }>>([]);
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});

  const addMaterialRow = () => {
    const newId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
    setMaterials([{ 
      id: newId, 
      materialId: "", 
      quantity: 0, 
      availableStock: 0 
    }, ...materials]);
  };

  const addCustomMaterialRow = () => {
    const newId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
    setMaterials([{ 
      id: newId, 
      materialId: `custom-${newId}`, 
      quantity: 0, 
      availableStock: 0,
      isCustom: true,
      customName: ""
    }, ...materials]);
  };

  const removeMaterialRow = (id: number) => {
    // Remove the parent row and all its children
    setMaterials(materials.filter(m => m.id !== id && m.parentId !== id));
  };

  const updateMaterial = (id: number, field: string, value: any) => {
    setMaterials(currentMaterials => {
      let updatedMaterials = [...currentMaterials];
      
      const materialIndex = updatedMaterials.findIndex(m => m.id === id);
      if (materialIndex === -1) return updatedMaterials;
      
      const updated = { ...updatedMaterials[materialIndex], [field]: value };
      
      if (field === 'materialId') {
        const selectedMaterial = mockMaterials.find(mat => mat.id === value);
        updated.availableStock = selectedMaterial?.availableStock || 0;
        updated.isCustom = false;
        updated.customName = undefined;
        
        // Remove any existing child items for this parent
        updatedMaterials = updatedMaterials.filter(m => m.parentId !== id);
        
        // Add child items if the selected material has them
        if (selectedMaterial?.childItems) {
          const maxId = Math.max(...updatedMaterials.map(m => m.id), 0);
          const childItems = selectedMaterial.childItems.map((child, index) => ({
            id: maxId + index + 1,
            materialId: child.id,
            quantity: 0,//child.quantity + (((updated.quantity -1)*child.perunit) || 1),
            availableStock: child.availableStock,
            isChild: true,
            parentId: id,
            childMultiplier: child.quantity,
            childPerUnitQty: child.perunit
          }));
          // Find parent row index
          const parentIndex = updatedMaterials.findIndex(m => m.id === id);

          if (parentIndex !== -1) {
            // Insert child items right after parent
            updatedMaterials.splice(parentIndex + 1, 0, ...childItems);
          } else {
            // fallback: push at the end (shouldn't normally happen)
            updatedMaterials.push(...childItems);
          }
          // updatedMaterials.push(...childItems);
        }
        
        // Close the popover
        setOpenPopovers(prev => ({ ...prev, [id]: false }));
      }
      
      if (field === 'customName') {
        updated.customName = value;
      }
      
      if (field === 'quantity' && !updated.isChild) {
        // Update child quantities when parent quantity changes
        updatedMaterials = updatedMaterials.map(m => {
          if (m.parentId === id && m.childMultiplier) {
            return { ...m, quantity: (m.childMultiplier + (m.childPerUnitQty * (value -1))) || 0 };
          }
          return m;
        });
      }
      
      updatedMaterials[materialIndex] = updated;
      return updatedMaterials;
    });
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
      console.log(editingBOM ? "Updating BOM:" : "Creating BOM:", formData);
      toast.success(editingBOM ? "BOM updated successfully!" : "BOM created successfully!");
      setOpen(false);
      form.reset();
      setMaterials([]);
      setEditingBOM(null);
    } catch (error) {
      toast.error(editingBOM ? "Failed to update BOM" : "Failed to create BOM");
    }
  };

  const handleEditBOM = (bom: BOMItem) => {
    setEditingBOM(bom);
    form.setValue("projectId", bom.projectId);
    
    // Convert BOM materials to the format expected by the materials state
    const bomMaterials = bom.materials.map((material, index) => ({
      id: index + 1,
      materialId: material.materialId,
      quantity: material.quantity,
      availableStock: material.availableStock,
    }));
    
    setMaterials(bomMaterials);
    setOpen(true);
  };

  const handleCreateNew = () => {
    setEditingBOM(null);
    form.reset();
    setMaterials([]);
    setOpen(true);
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
        {(user?.role === 'Project Manager' || user?.role === 'Store Supervisor' || user?.role === 'Project Supervisor') ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create BOM
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBOM ? "Update BOM" : "Create New BOM"}</DialogTitle>
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
                  
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Description
                    </label>
                    <Input placeholder="Add Description" className="mt-2" />
                  </div>
                </div>

                  <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Materials</h3>
                    <div className="flex gap-2">
                      <Button type="button" onClick={addMaterialRow} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Material
                      </Button>
                      <Button type="button" onClick={addCustomMaterialRow} size="sm" variant="outline">
                        <Type className="h-4 w-4 mr-2" />
                        Add Miscellaneous Item
                      </Button>
                    </div>
                  </div>

                  {materials.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Row #</TableHead>
                            <TableHead>Material</TableHead>
                            {/* <TableHead className="w-32">Available Stock</TableHead> */}
                            <TableHead className="w-32">Required Quantity</TableHead>
                            <TableHead className="w-16">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {materials.map((material, index) => {
                            const materialData = material.isChild 
                              ? mockMaterials.flatMap(m => m.childItems || []).find(child => child.id === material.materialId)
                              : mockMaterials.find(m => m.id === material.materialId);
                            
                            return (
                              <TableRow 
                                key={material.id} 
                                className={material.isChild ? "bg-muted/30 border-l-4 border-l-primary/30" : ""}
                              >
                                <TableCell>
                                  {material.isChild ? (
                                    <span className="text-muted-foreground ml-4">
                                      {index + 1}
                                    </span>
                                  ) : (
                                    index + 1
                                  )}
                                </TableCell>
                                 <TableCell>
                                   {material.isChild ? (
                                     <div className="pl-4">
                                       <span className="text-sm font-medium">
                                         └&gt; {materialData?.name || 'N/A'}
                                       </span>
                                     </div>
                                   ) : material.isCustom ? (
                                     <Input
                                       placeholder="Enter custom item name"
                                       value={material.customName || ""}
                                       onChange={(e) => updateMaterial(material.id, 'customName', e.target.value)}
                                       className="w-full"
                                     />
                                   ) : (
                                     <Popover
                                       open={openPopovers[material.id] || false}
                                       onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [material.id]: open }))}
                                     >
                                       <PopoverTrigger asChild>
                                         <Button
                                           variant="outline"
                                           role="combobox"
                                           aria-expanded={openPopovers[material.id] || false}
                                           className="w-full justify-between"
                                         >
                                           {material.materialId ? 
                                             mockMaterials.find(mat => mat.id === material.materialId)?.name || "Select material..." 
                                             : "Select material..."
                                           }
                                           <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                         </Button>
                                       </PopoverTrigger>
                                       <PopoverContent className="w-full p-0" align="start">
                                         <Command>
                                           <CommandInput placeholder="Search materials..." />
                                           <CommandList>
                                             <CommandEmpty>No material found.</CommandEmpty>
                                             <CommandGroup>
                                               {mockMaterials.map((mat) => (
                                                 <CommandItem
                                                   key={mat.id}
                                                   value={mat.name}
                                                   onSelect={() => updateMaterial(material.id, 'materialId', mat.id)}
                                                 >
                                                   <Check
                                                     className={`mr-2 h-4 w-4 ${
                                                       material.materialId === mat.id ? "opacity-100" : "opacity-0"
                                                     }`}
                                                   />
                                                   <div className="flex flex-col">
                                                     <span>{mat.name}</span>
                                                     {mat.childItems && (
                                                       <span className="text-xs text-muted-foreground">
                                                         (has {mat.childItems.length} child items)
                                                       </span>
                                                     )}
                                                   </div>
                                                 </CommandItem>
                                               ))}
                                             </CommandGroup>
                                           </CommandList>
                                         </Command>
                                       </PopoverContent>
                                     </Popover>
                                   )}
                                 </TableCell>
                                {/* <TableCell>
                                  <Input 
                                    value={material.availableStock}
                                    readOnly
                                    className="bg-muted"
                                  />
                                </TableCell> */}
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={material.quantity || ""}
                                    onChange={(e) => updateMaterial(material.id, 'quantity', Number(e.target.value))}
                                    placeholder="0"
                                    disabled={material.isChild && false} // Child quantities can be edited
                                  />
                                </TableCell>
                                <TableCell>
                                  {!material.isChild ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeMaterialRow(material.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  ) : (
                                    <div className="w-8"></div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
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
                    {editingBOM ? "Update BOM" : "Create BOM"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        ) : (
          <div className="text-muted-foreground text-sm">
            Only Project Managers can create BOMs
          </div>
        )}
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
                  <TableHead>BOM For</TableHead>
                  <TableHead>Supervisor In-Charge</TableHead>
                  {/* <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Total Quantity</TableHead> */}
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Updated By</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBOMs.map((bom) => (
                  <TableRow key={bom.id} className={`${
                    user?.role === 'Project Manager' ? 'hover:bg-muted/50 cursor-pointer' : ''
                  }`}>
                    <TableCell 
                      className={`font-medium ${
                        user?.role === 'Project Manager' 
                          ? 'text-primary hover:underline cursor-pointer' 
                          : 'text-foreground'
                      }`}
                      onClick={user?.role === 'Project Manager' ? () => navigate(`/bom/${bom.id}`) : undefined}
                    >
                      {bom.id}
                    </TableCell>
                    <TableCell>{bom.projectName}</TableCell>
                    <TableCell>{bom.itemName}</TableCell>
                    <TableCell>{bom.manager}</TableCell>
                    {/* <TableCell>{new Date(bom.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(bom.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{bom.totalQuantity}</TableCell> */}
                    <TableCell>{new Date(bom.lastUpdated).toLocaleDateString()}</TableCell>
                    <TableCell>{bom.updatedBy}</TableCell>
                    <TableCell>{bom.createdBy}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(bom.approvalStatus)}>
                        {bom.approvalStatus}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-center">
                       <div className="flex items-center justify-center gap-2">
                         {user?.role ? (
                           <>
                             {(user?.role === 'Project Manager' || user?.role === 'Store Supervisor' || user?.role === 'Project Supervisor') && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleEditBOM(bom)}
                                 title="Edit BOM"
                               >
                                 <Edit className="h-4 w-4" />
                               </Button>
                             )}
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => navigate(`/bom-consolidate/${bom.id}`)}
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => navigate(`/bom-details/${bom.id}`)}
                               title="View BOM Items List"
                             >
                               <List className="h-4 w-4" />
                             </Button>
                           </>
                         ) : (
                           <span className="text-muted-foreground text-sm">View Only</span>
                         )}
                         {/* <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => navigate(`/bom-status/${bom.id}`)}
                           title="View BOM Item Status"
                         >
                           <Activity className="h-4 w-4" />
                         </Button> */}
                       </div>
                     </TableCell>
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