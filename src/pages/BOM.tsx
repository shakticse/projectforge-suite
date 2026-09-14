import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { projectService } from "@/services/projectService";
import { itemService } from "@/services/itemService";
import { itemStoreService } from "@/services/itemStoreService";
import { bomService } from "@/services/bomService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, FileText, Package, Calculator, Trash2, Filter, ChevronLeft, ChevronRight, Eye, Check, ChevronsUpDown, List, Activity, Edit, X } from "lucide-react";
import { toast } from "sonner";
import { bomSchema } from "@/lib/validations";
import { evaluate } from "mathjs";
import { formatDateTime } from "@/lib/utils";

// Item type constants
type ItemType = 'grouped' | 'child' | 'miscellaneous' | 'non-grouped';

interface BOMItem {
  id: string;
  projectId: string;
  projectName: string;
  description: string;
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
  updatedByUser: string;
  createdByUser: string;
  dueDate: string;
  createdDate: string;
  updatedDate: string;
}

interface BOMFormData {
  projectId: string;
  itemName: string;
  description?: string;
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
  isGroupedItem?: boolean;
  childItems?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    perunit: number;
    availableStock: number;
    expression?: string;
  }>;
}



export default function BOM() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [boms, setBoms] = useState<BOMItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [projects, setProjects] = useState<{ id: string; projectName: string }[]>([]);
  const [materialsOptions, setMaterialsOptions] = useState<MaterialOption[]>([]);
  const [loadingBOMs, setLoadingBOMs] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingBOMs(true);
      try {
        const projRes: any = await projectService.getAllProjects();
        setProjects(projRes || []);
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }

      try {
        const mats: any = await itemService.getAllBomItems();
        setMaterialsOptions(mats || []);
      } catch (err) {
        console.error("Failed to fetch materials", err);
      }

      try {
        const bomRes: any = await bomService.getAll();
        setBoms(bomRes || []);
      } catch (err) {
        console.error("Failed to fetch BOMs", err);
      } finally {
        setLoadingBOMs(false);
      }
    };

    fetchAll();
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOMItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const form = useForm({
    resolver: yupResolver(bomSchema),
    defaultValues: {
      projectId: "",
      description: "",
      materials: [],
    },
  });

  const [materials, setMaterials] = useState<Array<{
    id: number;
    materialId: string;
    quantity: number;
    availableStock: number;
    itemType: ItemType;
    parentId?: number;
    qty?: number;
    min_qty?: number;
    perunit_qty?: number;
    customName?: string;
    expression?: string;
  }>>([]);

  // Sync local materials state with react-hook-form
  useEffect(() => {
    form.setValue("materials", materials);
  }, [materials]);
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});
  const [openMaterialPicker, setOpenMaterialPicker] = useState(false);
  const [materialPickerSearch, setMaterialPickerSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMaterialFromOption = (selectedMaterial: MaterialOption) => {
    setMaterials((currentMaterials) => {
      const baseMax =
        currentMaterials.length > 0
          ? Math.max(...currentMaterials.map((m) => m.id))
          : 0;
      const newId = baseMax + 1;
      const parentRow = {
        id: newId,
        materialId: selectedMaterial.id,
        quantity: 0,
        availableStock: selectedMaterial.availableStock || 0,
        itemType:
          selectedMaterial.childItems && selectedMaterial.childItems.length > 0
            ? ("grouped" as ItemType)
            : ("non-grouped" as ItemType),
      };
      let next = [parentRow, ...currentMaterials];
      if (selectedMaterial.childItems && selectedMaterial.childItems.length > 0) {
        const maxId = Math.max(...next.map((m) => m.id), 0);
        const childItems = selectedMaterial.childItems.map((child, index) => ({
          id: maxId + index + 1,
          materialId: child.id,
          quantity: 0,
          availableStock: child.availableStock,
          itemType: "child" as ItemType,
          parentId: newId,
          min_qty: child.quantity,
          perunit_qty: child.perunit,
          expression: child.expression,
        }));
        const parentIndex = next.findIndex((m) => m.id === newId);
        if (parentIndex !== -1) {
          next.splice(parentIndex + 1, 0, ...childItems);
        } else {
          next.push(...childItems);
        }
      }
      return next;
    });
    setOpenMaterialPicker(false);
    setMaterialPickerSearch("");
  };

  const addMiscellaneousByName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setMaterials((currentMaterials) => {
      const newId =
        currentMaterials.length > 0
          ? Math.max(...currentMaterials.map((m) => m.id)) + 1
          : 1;
      return [
        {
          id: newId,
          materialId: `custom-${newId}`,
          quantity: 0,
          availableStock: 0,
          itemType: "miscellaneous" as ItemType,
          customName: trimmed,
        },
        ...currentMaterials,
      ];
    });
    setOpenMaterialPicker(false);
    setMaterialPickerSearch("");
  };

  const removeMaterialRow = (id: number) => {
    // Remove the parent row and all its children
    setMaterials(materials.filter(m => m.id !== id && m.parentId !== id));
  };

  const getItemTypeLabel = (itemType: ItemType): string => {
    const typeMap: Record<ItemType, string> = {
      'grouped': 'Grouped Item (Parent)',
      'child': 'Child Item',
      'miscellaneous': 'Miscellaneous Item',
      'non-grouped': 'Non-Grouped Item'
    };
    return typeMap[itemType];
  };

  const updateMaterial = (id: number, field: string, value: any) => {
    setMaterials(currentMaterials => {
      let updatedMaterials = [...currentMaterials];
      
      const materialIndex = updatedMaterials.findIndex(m => m.id == id);
      if (materialIndex === -1) return updatedMaterials;
      
      const updated = { ...updatedMaterials[materialIndex], [field]: value };
      
      if (field === 'materialId') {
        const selectedMaterial = materialsOptions.find(mat => mat.id == value);
        updated.availableStock = selectedMaterial?.availableStock || 0;
        updated.customName = undefined;
        
        // Determine item type based on whether material has child items
        if (selectedMaterial?.childItems && selectedMaterial.childItems.length > 0) {
          updated.itemType = 'grouped';
        } else {
          updated.itemType = 'non-grouped';
        }
        
        // Remove any existing child items for this parent
        updatedMaterials = updatedMaterials.filter(m => m.parentId != id);
        
        // Add child items if the selected material has them
        if (selectedMaterial?.childItems) {
          const maxId = Math.max(...updatedMaterials.map(m => m.id), 0);
          const childItems = selectedMaterial.childItems.map((child, index) => ({
            id: maxId + index + 1,
            materialId: child.id,
            quantity: 0,
            availableStock: child.availableStock,
            itemType: 'child' as ItemType,
            parentId: id,
            min_qty: child.quantity,
            perunit_qty: child.perunit,
            expression: child.expression
          }));
          // Find parent row index
          const parentIndex = updatedMaterials.findIndex(m => m.id == id);

          if (parentIndex !== -1) {
            // Insert child items right after parent
            updatedMaterials.splice(parentIndex + 1, 0, ...childItems);
          } else {
            // fallback: push at the end (shouldn't normally happen)
            updatedMaterials.push(...childItems);
          }
        }
        
        // Close the popover
        setOpenPopovers(prev => ({ ...prev, [id]: false }));
      }
      
      if (field === 'customName') {
        updated.customName = value;
      }
      
      if (field === 'itemType') {
        updated.itemType = value as ItemType;
      }
      
      if (field === 'quantity' && updated.itemType !== 'child') {
        // Update child quantities when parent quantity changes
        const selectedMaterial = materialsOptions.find(mat => mat.id == updated.materialId);
        updatedMaterials = updatedMaterials.map(m => {
          if (m.parentId === id ) {
            const ci = selectedMaterial?.childItems?.find(c => c.id == m.materialId);
            if(ci) {
              m.qty = value;
              m.min_qty = ci.quantity;
              m.perunit_qty = ci.perunit;
              m.expression = ci.expression;
              let finalQty =  evaluate(ci.expression || '', m) || 0 ;
              return { ...m, quantity: finalQty};
            }
            else {
              return { ...m};
            }
          }
          return m;
        });
      }
      
      updatedMaterials[materialIndex] = updated;
      return updatedMaterials;
    });
  };

  const onSubmit = async (data: any) => {
    console.log('BOM form submitted', data); // DEBUG
    setIsSubmitting(true);
    try {
      data.createdByEmail = user?.email;
          // Ensure description is included from the form input
          const formData = {
            ...data,
            description: data.description,
            items: materials.map(m => ({
              itemId: m.materialId,
              qty: m.quantity,
              availableStock: m.availableStock,
              itemType: m.itemType,
              ...(m.itemType === 'miscellaneous' && { customName: m.customName }),
              ...(m.itemType === 'child' && { parentId: m.parentId }),
              ...(m.expression && { expression: m.expression }),
              ...(m.min_qty !== undefined && { min_qty: m.min_qty }),
              ...(m.perunit_qty !== undefined && { perunit_qty: m.perunit_qty })
            }))
          };

      if (editingBOM) {
        await bomService.update(editingBOM.id, formData);
        toast.success("BOM updated successfully!");
      } else {
        await bomService.create(formData);
        toast.success("BOM created successfully!");
      }

      // refresh BOMs
      const updated = await bomService.getAll();
      setBoms(updated || []);

      setShowForm(false);
      form.reset();
      setMaterials([]);
      setEditingBOM(null);
    } catch (error) {
      console.error("Error submitting BOM:", error);
      toast.error(editingBOM ? "Failed to update BOM" : "Failed to create BOM");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBOM = async (bom: BOMItem) => {
  try {
    const bomDetails: any = await bomService.getById(bom.id);
    setEditingBOM(bomDetails);

    // 1. Project Lookup (Optimized)
    let projectId: string | number = bomDetails.projectId;
    if (!projectId && bomDetails.projectName) {
      const targetName = bomDetails.projectName.toLowerCase();
      projectId = projects.find(p => p.projectName.toLowerCase() == targetName)?.id || '';
    }

    // Ensure projectId is a string for form value
    const projectIdStr = projectId?.toString() || '';
    
    // Use setTimeout to ensure form state is ready before setting values
    setTimeout(() => {
      form.setValue("projectId", projectIdStr);
      form.setValue("description", bomDetails.description || '');
    }, 0);

    // 2. Transform items using itemType from API
    const bomMaterials = bomDetails.items.map((apiItem: any) => {
      const itemId = apiItem.itemId?.toString() ?? '';
      const itemType = apiItem.itemType as ItemType || 'non-grouped';
      
      // Look up stock/info from library if needed
      const materialOption = materialsOptions.find(mat => mat.id?.toString() == itemId);

      return {
        // Use the actual ID from the DB to ensure React keys stay stable
        id: apiItem.id, 
        materialId: itemId,
        quantity: apiItem.qty,
        availableStock: materialOption?.availableStock || 0,
        itemType: itemType,
        parentId: apiItem.parentId || apiItem.parent_id,
        customName: apiItem.customName || apiItem.itemName,
        // Carry over calculation metadata if they exist in DB
        min_qty: apiItem.min_qty,
        perunit_qty: apiItem.perunit_qty,
        expression: apiItem.expression,
      };
    });

    setMaterials(bomMaterials);
    setShowForm(true);
  } catch (error) {
    console.error("Failed to fetch BOM details:", error);
    toast.error("Failed to fetch BOM details for editing.");
  }
};

  // const handleEditBOM = async (bom: BOMItem) => {
  //   try {
  //     // Fetch latest BOM details
  //     const bomDetails: any = await bomService.getById(bom.id);
  //     setEditingBOM(bomDetails);
      
  //     // Find project ID: if not present, match by projectName
  //     let projectId = bomDetails.projectId;
  //     if (!projectId && bomDetails.projectName) {
  //       const matchedProject = projects.find(p => 
  //         p.projectName.toLowerCase() === bomDetails.projectName.toLowerCase() ||
  //         p.projectName === bomDetails.projectName
  //       );
  //       projectId = matchedProject?.id || '';
  //     }
      
  //     form.setValue("projectId", projectId);
  //     form.setValue("description", bomDetails.description);
      
  //     // Convert BOM items to the format expected by the materials state
  //     const bomMaterials: typeof materials = [];
  //     let maxId = 0;
      
  //     bomDetails.items.forEach((apiItem: any) => {
  //       // Normalize item ID to string for consistent comparison
  //       const itemId = apiItem.itemId?.toString() ?? '';
        
  //       // Detect if this is a custom item (materialId starts with "custom-")
  //       const isCustomItem = itemId.startsWith('custom-');

  //       // check if its a grouped item
  //       const isGroupedItem = apiItem.isGroupedItem ?? false;

  //       // Look up the item in materialsOptions to get full details (including grouped item info)
  //       // Ensure both sides are compared as strings
  //       const materialOption = isGroupedItem 
  //         ? materialsOptions.find(mat => {
  //             const matId = mat.id?.toString() ?? '';
  //             return matId === itemId;
  //           })
  //         : null;
        
  //       const parentId = maxId + 1;
  //       maxId = parentId;
        
  //       // Add parent item
  //       if (isCustomItem) {
  //         // Handle custom items
  //         bomMaterials.push({
  //           id: parentId,
  //           materialId: itemId || `custom-${parentId}`,
  //           quantity: apiItem.qty,
  //           availableStock: 0,
  //           isGroupedItem: false,
  //           isChild: false,
  //           isCustom: true,
  //           customName: apiItem.itemName || apiItem.customName || '', // Try to preserve custom name
  //         });
  //       } else {
  //         // Handle regular items
  //         bomMaterials.push({
  //           id: parentId,
  //           materialId: itemId,
  //           quantity: apiItem.qty,
  //           availableStock: materialOption?.availableStock || 0,
  //           isGroupedItem: materialOption?.isGroupedItem || false,
  //           isChild: false,
  //         });
          
  //         // Add child items if this is a grouped item
  //         if (materialOption?.isGroupedItem && materialOption?.childItems) {
  //           materialOption.childItems.forEach((child) => {
  //             maxId += 1;
              
  //             // Calculate child quantity based on parent quantity and perunit multiplier
  //             let calculatedQty = 0;
  //             if (Number.isFinite(child.perunit) && Number.isFinite(apiItem.qty)) {
  //               calculatedQty = apiItem.qty * child.perunit;
  //             }
              
  //             bomMaterials.push({
  //               id: maxId,
  //               materialId: child.id?.toString() ?? '',
  //               quantity: calculatedQty, // Calculate based on parent qty * perunit
  //               availableStock: child.availableStock,
  //               isGroupedItem: false,
  //               isChild: true,
  //               parentId: parentId,
  //               min_qty: child.quantity,
  //               perunit_qty: child.perunit,
  //               expression: child.expression,
  //               qty: apiItem.qty, // Store parent quantity for expression evaluation
  //             });
  //           });
  //         }
  //       }
  //     });
      
  //     setMaterials(bomMaterials);
  //     setOpen(true);
  //   } catch (error) {
  //     console.error("Failed to fetch BOM details for editing:", error);
  //     toast.error("Failed to fetch BOM details for editing.");
  //   }
  // };

  const handleCreateNew = () => {
    setEditingBOM(null);
    form.reset();
    setMaterials([]);
    setShowForm(true);
  };

  const filteredBOMs = boms.filter(bom =>
    // bom.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
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

  //const totalItems = materials.length;
  //const totalQuantity = materials.reduce((sum, m) => sum + (m.quantity || 0), 0);
  const totalItems = materials.filter(m => m.itemType !== 'grouped').length;
  const totalQuantity = materials
    .filter(m => m.itemType !== 'grouped')
    .reduce((sum, m) => sum + (m.quantity || 0), 0);

  const pickerTrim = materialPickerSearch.trim();
  const pickerLower = pickerTrim.toLowerCase();
  const filteredPickerMaterials = pickerTrim
    ? materialsOptions.filter(
        (m) =>
          m.name.toLowerCase().includes(pickerLower) ||
          (m.id != null && m.id.toString().toLowerCase().includes(pickerLower))
      )
    : materialsOptions;
  const showAddMiscellaneous = pickerTrim.length > 0 && filteredPickerMaterials.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bill of Materials</h1>
          <p className="text-muted-foreground">Manage project material requirements</p>
        </div>
        <Button onClick={() => { console.log('Create BOM button clicked'); handleCreateNew(); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create BOM
        </Button>
      </div>

      {showForm && (
        <div className="mt-6 w-full">
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>{editingBOM ? "Update BOM" : "Create New BOM"}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setEditingBOM(null);
                  form.reset();
                  setMaterials([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Form {...form}>
              {/* Removed console.log from JSX, as it returns void and is not a valid ReactNode */}
              {form.formState.errors && Object.keys(form.formState.errors).length > 0 && (
                <div style={{ color: 'red', marginBottom: 8 }}>
                  {Object.entries(form.formState.errors).map(([key, err]) => (
                    <div key={key}>{key}: {err?.message?.toString()}</div>
                  ))}
                </div>
              )}
              <form onSubmit={e => { console.log('Submitting form', form.getValues(), materials); form.handleSubmit(onSubmit)(e); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value?.toString() || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id.toString()} value={project.id.toString()}>
                                {project.projectName}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Add Description" className="mt-2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                  <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-lg font-semibold shrink-0">Materials</h3>
                    <div className="w-full sm:max-w-md sm:ml-auto">
                      <Popover
                        open={openMaterialPicker}
                        onOpenChange={(open) => {
                          setOpenMaterialPicker(open);
                          if (!open) setMaterialPickerSearch("");
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={openMaterialPicker}
                            className="w-full justify-between"
                          >
                            <span className="truncate text-muted-foreground">
                              Search catalog or type a new item name…
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[min(100vw-2rem,28rem)] p-0" align="end">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search materials or type name…"
                              value={materialPickerSearch}
                              onValueChange={setMaterialPickerSearch}
                            />
                            <CommandList>
                              {filteredPickerMaterials.length > 0 && (
                                <CommandGroup heading="Catalog items">
                                  {filteredPickerMaterials.map((mat) => (
                                    <CommandItem
                                      key={mat.id}
                                      value={`${mat.name} ${mat.id}`}
                                      onSelect={() => addMaterialFromOption(mat)}
                                    >
                                      <div className="flex flex-col">
                                        <span>{mat.name}</span>
                                        {mat.childItems && mat.childItems.length > 0 && (
                                          <span className="text-xs text-muted-foreground">
                                            ({mat.childItems.length} child items)
                                          </span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                              {showAddMiscellaneous && (
                                <CommandGroup heading="Not in catalog">
                                  <CommandItem
                                    value={`__misc__:${pickerTrim}`}
                                    onSelect={() => addMiscellaneousByName(pickerTrim)}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add &quot;{pickerTrim}&quot; as miscellaneous item
                                  </CommandItem>
                                </CommandGroup>
                              )}
                              {!pickerTrim && materialsOptions.length === 0 && (
                                <CommandEmpty>No materials in catalog.</CommandEmpty>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {materials.length > 0 && (
                    <div className="border rounded-lg overflow-hidden bg-card">
                      <Table className="text-xs">
                        <TableHeader>
                          <TableRow className="border-b border-border/60 hover:bg-transparent">
                            <TableHead className="h-8 w-10 min-w-[2.5rem] px-2 py-1.5 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
                              #
                            </TableHead>
                            <TableHead className="h-8 px-2 py-1.5 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
                              Material
                            </TableHead>
                            <TableHead className="h-8 w-28 px-2 py-1.5 text-right align-middle text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
                              Req. qty
                            </TableHead>
                            <TableHead className="h-8 w-12 px-1 py-1.5 text-center align-middle text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
                              <span className="sr-only">Actions</span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="[&_tr:last-child]:border-b [&_tr]:border-b [&_tr]:border-border/50">
                          {materials.map((material, index) => {
                            const materialId = material.materialId?.toString() ?? '';
                            // If this row is a child item, look up the child inside parent options' childItems
                            const materialData = material.itemType === 'child'
                              ? materialsOptions.flatMap(m => m.childItems || []).find(c => c.id?.toString() == materialId)
                              : materialsOptions.find(m => m.id?.toString() == materialId);
                            // const materialData = material.isChild 
                            //   ? materialsOptions.flatMap(m => m.childItems || []).find(child => child.id?.toString() == materialId)
                            //   : materialsOptions.find(m => m.id?.toString() === materialId);
                            
                            return (
                              <TableRow
                                key={material.id}
                                className={
                                  material.itemType === "child"
                                    ? "bg-muted/20 border-l-2 border-l-primary/35 hover:bg-muted/35"
                                    : "hover:bg-muted/40"
                                }
                              >
                                <TableCell className="w-10 min-w-[2.5rem] px-2 py-1 align-middle leading-none text-muted-foreground tabular-nums">
                                  {material.itemType === "child" ? (
                                    <span className="pl-2">{index + 1}</span>
                                  ) : (
                                    index + 1
                                  )}
                                </TableCell>
                                <TableCell className="px-2 py-1 align-middle leading-snug">
                                  {material.itemType === "child" ? (
                                    <span className="block pl-2 text-xs font-medium leading-tight text-foreground">
                                      <span className="text-muted-foreground mr-0.5">└</span>
                                      {materialData?.name || "N/A"}
                                    </span>
                                  ) : material.itemType === "miscellaneous" ? (
                                    <div className="flex flex-col gap-1">
                                      <Input
                                        placeholder="Custom item name"
                                        value={material.customName || ""}
                                        onChange={(e) =>
                                          updateMaterial(material.id, "customName", e.target.value)
                                        }
                                        className="h-8 w-full min-w-0 px-2 py-1 text-xs leading-tight"
                                      />
                                      <Badge
                                        variant="secondary"
                                        className="w-fit px-1.5 py-0 text-[10px] font-normal leading-tight"
                                      >
                                        {getItemTypeLabel(material.itemType)}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <Popover
                                      open={openPopovers[material.id] || false}
                                      onOpenChange={(open) =>
                                        setOpenPopovers((prev) => ({
                                          ...prev,
                                          [material.id]: open,
                                        }))
                                      }
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          aria-expanded={openPopovers[material.id] || false}
                                          className="h-8 w-full min-w-0 justify-between gap-1 px-2 py-1 text-xs font-normal leading-tight"
                                        >
                                          <span className="truncate text-left">
                                            {material.materialId
                                              ? materialsOptions.find(
                                                  (mat) =>
                                                    mat.id?.toString() ===
                                                    material.materialId?.toString()
                                                )?.name || "Select…"
                                              : "Select material…"}
                                          </span>
                                          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                       <PopoverContent className="w-full p-0" align="start">
                                         <Command>
                                           <CommandInput placeholder="Search materials..." />
                                           <CommandList>
                                             <CommandEmpty>No material found.</CommandEmpty>
                                             <CommandGroup>
                                               {materialsOptions.map((mat) => (
                                                 <CommandItem
                                                   key={mat.id}
                                                   value={mat.name}
                                                   onSelect={() => updateMaterial(material.id, 'materialId', mat.id)}
                                                 >
                                                   <Check
                                                     className={`mr-2 h-4 w-4 ${
                                                       material.materialId?.toString() === mat.id?.toString() ? "opacity-100" : "opacity-0"
                                                     }`}
                                                   />
                                                   <div className="flex flex-col">
                                                     <span>{mat.name}</span>
                                                     {mat.childItems && mat.childItems.length > 0 && (
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
                                <TableCell className="w-28 px-2 py-1 align-middle">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={material.quantity || ""}
                                    onChange={(e) =>
                                      updateMaterial(material.id, "quantity", Number(e.target.value))
                                    }
                                    placeholder="0"
                                    disabled={material.itemType === "child" && false}
                                    className="h-8 w-full max-w-[5.5rem] ml-auto block px-2 py-1 text-right text-xs tabular-nums leading-tight"
                                  />
                                </TableCell>
                                <TableCell className="w-12 px-1 py-1 align-middle text-center">
                                  {material.itemType !== "child" ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => removeMaterialRow(material.id)}
                                      aria-label="Remove row"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <span className="inline-block h-8 w-8" aria-hidden />
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
                      <p className="text-sm text-muted-foreground">
                        Use the search field above to add a catalog item or type a new name as a
                        miscellaneous item.
                      </p>
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
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false);
                    setEditingBOM(null);
                    form.reset();
                    setMaterials([]);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={materials.length === 0 || isSubmitting}>
                    {isSubmitting ? (editingBOM ? "Updating..." : "Creating...") : (editingBOM ? "Update BOM" : "Create BOM")}
                  </Button>
                </div>
              </form>
            </Form>
            </CardContent>
          </Card>
        </div>
      )}
        {/* ) : (
          <div className="text-muted-foreground text-sm">
            Only Project Managers can create BOMs
          </div>
        )} */}

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
            <Input
              placeholder="Search BOMs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 rounded-xl border-border/70 bg-background/80 pl-10 shadow-none transition-smooth focus:bg-background"
            />
          </div>
          <Button variant="outline" size="sm" className="h-10 rounded-xl border-border/70 bg-background/80 px-4 shadow-none">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-sm font-medium text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBOMs.length)} of {filteredBOMs.length} results
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-card">
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-background/95 to-primary/5 px-5 py-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <span>BOM Records</span>
          </CardTitle>
          <CardDescription className="pl-[3.25rem]">
            Track project BOMs, ownership, and recent update activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingBOMs ? (
            <div className="mb-4 py-6 text-center text-sm text-muted-foreground">Loading BOMs...</div>
          ) : boms.length === 0 ? (
            <div className="mb-4 py-6 text-center text-sm text-muted-foreground">No BOMs found.</div>
          ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[1120px]">
              <TableHeader className="bg-muted/45">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">BOM ID</TableHead>
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Project Name</TableHead>
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Description</TableHead>
                  {/* <TableHead>BOM For</TableHead>
                  <TableHead>Supervisor In-Charge</TableHead> */}
                  {/* <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Total Quantity</TableHead> */}
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Due Date</TableHead>
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Created By</TableHead>
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Created Date</TableHead>
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Updated By</TableHead>
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Last Updated</TableHead>
                  {/* <TableHead>Status</TableHead> */}
                  <TableHead className="h-11 px-5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {paginatedBOMs.map((bom) => (
                  <TableRow key={bom.id} className={`${
                    user?.role === 'Project Manager' ? 'group hover:bg-primary/5' : 'hover:bg-muted/30'
                  }`}>
                    <TableCell 
                      className={`px-5 py-4 align-top text-sm font-semibold tabular-nums ${
                        user?.role === 'Project Manager' 
                          ? 'text-primary cursor-pointer' 
                          : 'text-foreground'
                      }`}
                      onClick={user?.role === 'Project Manager' ? () => navigate(`/bom/${bom.id}`) : undefined}
                    >
                      <span className="inline-flex h-8 min-w-10 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 px-2 text-primary transition-smooth group-hover:border-primary/25 group-hover:bg-primary/15">
                        {bom.id}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 align-top text-sm font-medium text-foreground">{bom.projectName}</TableCell>
                    <TableCell className="max-w-[16rem] px-5 py-4 align-top text-sm text-muted-foreground">
                      <span className="line-clamp-2">{bom.description || "NA"}</span>
                    </TableCell>
                    {/* <TableCell>{bom.itemName}</TableCell> */}
                    {/* <TableCell>{bom.manager}</TableCell> */}
                    {/* <TableCell>{new Date(bom.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(bom.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{bom.totalQuantity}</TableCell> */}
                    <TableCell className="px-5 py-4 align-top text-sm text-foreground/80">{formatDateTime(bom.dueDate)}</TableCell>
                    <TableCell className="px-5 py-4 align-top text-sm text-foreground/80">{bom.createdByUser}</TableCell>
                    <TableCell className="px-5 py-4 align-top text-sm text-foreground/80">{formatDateTime(bom.createdDate)}</TableCell>
                    <TableCell className="px-5 py-4 align-top text-sm text-foreground/80">{bom.updatedByUser}</TableCell>
                    <TableCell className="px-5 py-4 align-top text-sm text-foreground/80">{formatDateTime(bom.updatedDate)}</TableCell>
                    {/* <TableCell>
                      <Badge variant={getStatusBadgeVariant(bom.approvalStatus)}>
                        {bom.approvalStatus}
                      </Badge>
                    </TableCell> */}
                     <TableCell className="px-5 py-4 text-center align-top">
                       <div className="flex items-center justify-center gap-1.5">
                         {user?.role ? (
                           <>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                               onClick={() => navigate(`/bom-consolidate/${bom.id}`)}
                               title="View BOM Consolidate"
                               aria-label={`View consolidated BOM ${bom.id}`}
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                             {/* {(user?.role === 'Project Manager' || user?.role === 'Store Supervisor' || user?.role === 'Project Supervisor') && ( */}
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                 onClick={() => handleEditBOM(bom)}
                                 title="Edit BOM"
                                 aria-label={`Edit BOM ${bom.id}`}
                               >
                                 <Edit className="h-4 w-4" />
                               </Button>
                             {/* )} */}
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                               onClick={() => navigate(`/bom-details/${bom.id}`)}
                               title="View BOM Items List"
                               aria-label={`View BOM ${bom.id} items`}
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
          )}

          {!loadingBOMs && boms.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-5 py-4">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
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
                    className="h-8 min-w-8 rounded-xl px-3"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
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
