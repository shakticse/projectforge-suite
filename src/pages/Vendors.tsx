import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpDown, ChevronDown, ChevronUp, Edit, Eye, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { vendorSchema } from "@/lib/validations";
import { vendorService, type Vendor, type VendorPayload } from "@/services/vendorService";

const vendorCategories = [
  "Raw Materials",
  "Equipment",
  "Services",
  "Technology",
  "Consulting",
  "Transportation",
  "Maintenance",
  "Software",
];

type VendorFormData = {
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  gstNumber?: string;
  status: "Active" | "Inactive";
  isPreferred: boolean;
};
type SortField = "name" | "email" | "contactPerson" | "status" | "city" | "state" | "createdAt";
type SortDirection = "asc" | "desc";

const blankVendor: VendorFormData = {
  name: "",
  email: "",
  phone: "",
  contactPerson: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  gstNumber: "",
  status: "Active",
  isPreferred: false,
};

const errorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error.response;
    if (typeof response === "object" && response !== null && "data" in response) {
      const data = response.data;
      if (typeof data === "object" && data !== null && "title" in data && typeof data.title === "string") {
        return data.title;
      }
      if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
        return data.message;
      }
    }
  }
  return error instanceof Error ? error.message : fallback;
};

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: blankVendor,
  });

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      setVendors(await vendorService.getAll());
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load vendors"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadVendors();
  }, []);

  const startCreate = () => {
    setEditingVendor(null);
    setSelectedCategories([]);
    form.reset(blankVendor);
    setShowForm(true);
  };

  const startEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setSelectedCategories(vendor.categories ?? []);
    form.reset({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      contactPerson: vendor.contactPerson,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      zip: vendor.zip,
      gstNumber: vendor.gstNumber ?? "",
      status: vendor.status,
      isPreferred: vendor.isPreferred,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVendor(null);
    setSelectedCategories([]);
    form.reset(blankVendor);
  };

  const onSubmit = async (data: VendorFormData) => {
    const payload: VendorPayload = {
      ...data,
      gstNumber: data.gstNumber?.trim() || undefined,
      categories: selectedCategories,
    };
    setIsSaving(true);
    try {
      if (editingVendor) {
        const updated = await vendorService.update(editingVendor.id, payload);
        setVendors((current) => current.map((vendor) => vendor.id === updated.id ? updated : vendor));
        toast.success("Vendor updated successfully");
      } else {
        const created = await vendorService.create(payload);
        setVendors((current) => [...current, created]);
        toast.success("Vendor created successfully");
      }
      closeForm();
    } catch (error) {
      toast.error(errorMessage(error, `Failed to ${editingVendor ? "update" : "create"} vendor`));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingVendor) return;
    setIsDeleting(true);
    try {
      await vendorService.delete(deletingVendor.id);
      const remainingVendors = vendors.filter((vendor) => vendor.id !== deletingVendor.id);
      setVendors(remainingVendors);
      setCurrentPage((page) => Math.min(page, Math.max(1, Math.ceil(remainingVendors.length / itemsPerPage))));
      toast.success("Vendor deleted successfully");
      setDeletingVendor(null);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete vendor"));
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const sortedVendors = useMemo(() => {
    const filtered = vendors.filter((vendor) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = [
        vendor.name,
        vendor.email,
        vendor.phone,
        vendor.contactPerson,
        vendor.city,
        vendor.state,
      ].some((value) => value.toLowerCase().includes(term));
      return matchesSearch && (statusFilter === "all" || vendor.status === statusFilter);
    });
    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const comparison = sortField === "createdAt"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : String(aValue).localeCompare(String(bValue));
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [vendors, searchTerm, statusFilter, sortDirection, sortField]);

  const totalPages = Math.ceil(sortedVendors.length / itemsPerPage);
  const paginatedVendors = sortedVendors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const sortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 inline h-4 w-4" />;
    return sortDirection === "asc"
      ? <ChevronUp className="ml-1 inline h-4 w-4" />
      : <ChevronDown className="ml-1 inline h-4 w-4" />;
  };
  const sortButton = (field: SortField, label: string) => (
    <Button variant="ghost" onClick={() => handleSort(field)} className="h-auto p-0 font-semibold text-white hover:bg-white/10 hover:text-white">
      {label}{sortIcon(field)}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">Manage your vendor relationships</p>
        </div>
        <Button onClick={showForm ? closeForm : startCreate}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Close Form" : "Add Vendor"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingVendor ? "Edit Vendor" : "Add New Vendor"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Vendor Name *</FormLabel><FormControl><Input placeholder="ABC Suppliers Ltd" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" placeholder="contact@vendor.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone *</FormLabel><FormControl><Input placeholder="+91 9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contactPerson" render={({ field }) => (
                    <FormItem><FormLabel>Contact Person *</FormLabel><FormControl><Input placeholder="Contact name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="gstNumber" render={({ field }) => (
                    <FormItem><FormLabel>GST Number</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Address *</FormLabel><FormControl><Input placeholder="Street address" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City *</FormLabel><FormControl><Input placeholder="City" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>State *</FormLabel><FormControl><Input placeholder="State" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="zip" render={({ field }) => (
                    <FormItem><FormLabel>ZIP / Postal Code *</FormLabel><FormControl><Input placeholder="Postal code" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="isPreferred" render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3 space-y-0 pt-7">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel>Preferred Vendor</FormLabel>
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-3">
                  <FormLabel>Categories</FormLabel>
                  <Select onValueChange={toggleCategory}>
                    <SelectTrigger><SelectValue placeholder="Select categories (optional)" /></SelectTrigger>
                    <SelectContent>
                      {vendorCategories.map((category) => (
                        <SelectItem key={category} value={category} disabled={selectedCategories.includes(category)}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map((category) => (
                        <Badge key={category} variant="secondary" className="flex items-center gap-1">
                          {category}
                          <button type="button" aria-label={`Remove ${category}`} onClick={() => toggleCategory(category)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeForm} disabled={isSaving}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingVendor ? "Save Changes" : "Create Vendor"}</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search vendors..." value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/70 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{sortButton("name", "Vendor Name")}</TableHead>
              <TableHead>{sortButton("email", "Email")}</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>{sortButton("contactPerson", "Contact Person")}</TableHead>
              <TableHead>{sortButton("city", "City")}</TableHead>
              <TableHead>{sortButton("state", "State")}</TableHead>
              <TableHead>{sortButton("status", "Status")}</TableHead>
              <TableHead>{sortButton("createdAt", "Join Date")}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">Loading vendors...</TableCell></TableRow>
            ) : paginatedVendors.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No vendors found.</TableCell></TableRow>
            ) : paginatedVendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">{vendor.name}</TableCell>
                <TableCell>{vendor.email}</TableCell>
                <TableCell>{vendor.phone}</TableCell>
                <TableCell>{vendor.contactPerson}</TableCell>
                <TableCell>{vendor.city}</TableCell>
                <TableCell>{vendor.state}</TableCell>
                <TableCell><Badge variant={vendor.status === "Active" ? "default" : "secondary"}>{vendor.status}</Badge></TableCell>
                <TableCell>{vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={`View ${vendor.name}`} title="View vendor" onClick={() => setViewingVendor(vendor)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${vendor.name}`} title="Edit vendor" onClick={() => startEdit(vendor)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`Delete ${vendor.name}`} title="Delete vendor" onClick={() => setDeletingVendor(vendor)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <PaginationItem key={page}><PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink></PaginationItem>
            ))}
            <PaginationItem><PaginationNext onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={viewingVendor !== null} onOpenChange={(open) => { if (!open) setViewingVendor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingVendor?.name}</DialogTitle>
            <DialogDescription>Vendor details</DialogDescription>
          </DialogHeader>
          {viewingVendor && (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-muted-foreground">Email</dt><dd>{viewingVendor.email}</dd></div>
              <div><dt className="text-muted-foreground">Phone</dt><dd>{viewingVendor.phone}</dd></div>
              <div><dt className="text-muted-foreground">Contact Person</dt><dd>{viewingVendor.contactPerson}</dd></div>
              <div><dt className="text-muted-foreground">GST Number</dt><dd>{viewingVendor.gstNumber || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Address</dt><dd>{viewingVendor.address}</dd></div>
              <div><dt className="text-muted-foreground">City / State / ZIP</dt><dd>{viewingVendor.city}, {viewingVendor.state} {viewingVendor.zip}</dd></div>
              <div><dt className="text-muted-foreground">Status</dt><dd>{viewingVendor.status}</dd></div>
              <div><dt className="text-muted-foreground">Categories</dt><dd>{viewingVendor.categories?.join(", ") || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Preferred</dt><dd>{viewingVendor.isPreferred ? "Yes" : "No"}</dd></div>
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingVendor !== null} onOpenChange={(open) => { if (!open && !isDeleting) setDeletingVendor(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vendor?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete {deletingVendor?.name}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void confirmDelete(); }} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
