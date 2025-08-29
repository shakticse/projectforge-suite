import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, ArrowUpDown, ChevronUp, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { vendorSchema } from "@/lib/validations";

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  status: 'Active' | 'Inactive';
  categories: string[];
  isPreferred: boolean;
  joinDate: string;
}

const vendorCategories = [
  "Raw Materials",
  "Equipment",
  "Services", 
  "Technology",
  "Consulting",
  "Transportation",
  "Maintenance",
  "Software"
];

const mockVendors: Vendor[] = [
  {
    id: "1",
    name: "ABC Suppliers Ltd",
    email: "contact@abcsuppliers.com",
    phone: "+1234567890",
    address: "123 Business District, City",
    contactPerson: "John Smith",
    status: "Active",
    categories: ["Raw Materials", "Equipment"],
    isPreferred: true,
    joinDate: "2024-01-15"
  },
  {
    id: "2",
    name: "XYZ Materials Inc",
    email: "info@xyzmaterials.com",
    phone: "+9876543210",
    address: "456 Industrial Area, City",
    contactPerson: "Sarah Johnson",
    status: "Active",
    categories: ["Raw Materials"],
    isPreferred: false,
    joinDate: "2024-02-20"
  },
  {
    id: "3",
    name: "Global Parts Co",
    email: "sales@globalparts.com",
    phone: "+5551234567",
    address: "789 Trade Center, City",
    contactPerson: "Mike Wilson",
    status: "Active",
    categories: ["Equipment", "Technology"],
    isPreferred: true,
    joinDate: "2024-01-20"
  },
  {
    id: "4",
    name: "Tech Components Ltd",
    email: "orders@techcomponents.com",
    phone: "+4449876543",
    address: "321 Tech Park, City",
    contactPerson: "Lisa Chen",
    status: "Inactive",
    categories: ["Technology", "Software"],
    isPreferred: false,
    joinDate: "2024-03-10"
  },
  {
    id: "5",
    name: "Premium Supplies Inc",
    email: "info@premiumsupplies.com",
    phone: "+3337654321",
    address: "654 Premium Plaza, City",
    contactPerson: "David Brown",
    status: "Active",
    categories: ["Services", "Consulting"],
    isPreferred: true,
    joinDate: "2024-02-05"
  }
];

type SortField = 'name' | 'email' | 'contactPerson' | 'status' | 'joinDate';
type SortDirection = 'asc' | 'desc';

export default function Vendors() {
  const [vendors] = useState<Vendor[]>(mockVendors);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [open, setOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const form = useForm({
    resolver: yupResolver(vendorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      contactPerson: "",
      status: "Active",
      isPreferred: false,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      // TODO: Implement API call
      const vendorData = {
        ...data,
        categories: selectedCategories
      };
      console.log("Creating vendor:", vendorData);
      toast.success("Vendor created successfully!");
      setOpen(false);
      form.reset();
      setSelectedCategories([]);
    } catch (error) {
      toast.error("Failed to create vendor");
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const removeCategory = (category: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== category));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedVendors = [...filteredVendors].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    if (sortField === 'joinDate') {
      aValue = new Date(aValue as string);
      bValue = new Date(bValue as string);
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVendors = sortedVendors.slice(startIndex, startIndex + itemsPerPage);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">Manage your vendor relationships</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Name</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Suppliers Ltd" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@vendor.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Business address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPreferred"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Preferred Vendor</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormLabel>Categories</FormLabel>
                  <Select onValueChange={toggleCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorCategories.map((category) => (
                        <SelectItem 
                          key={category} 
                          value={category}
                          disabled={selectedCategories.includes(category)}
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCategories.map((category) => (
                        <Badge key={category} variant="secondary" className="flex items-center gap-1">
                          {category}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0.5 hover:bg-transparent"
                            onClick={() => removeCategory(category)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Vendor</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-semibold text-left justify-start"
                >
                  Vendor Name {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('email')}
                  className="h-auto p-0 font-semibold text-left justify-start"
                >
                  Email {getSortIcon('email')}
                </Button>
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('contactPerson')}
                  className="h-auto p-0 font-semibold text-left justify-start"
                >
                  Contact Person {getSortIcon('contactPerson')}
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('status')}
                  className="h-auto p-0 font-semibold text-left justify-start"
                >
                  Status {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('joinDate')}
                  className="h-auto p-0 font-semibold text-left justify-start"
                >
                  Join Date {getSortIcon('joinDate')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">{vendor.name}</TableCell>
                <TableCell>{vendor.email}</TableCell>
                <TableCell>{vendor.phone}</TableCell>
                <TableCell>{vendor.contactPerson}</TableCell>
                <TableCell>
                  <Badge variant={vendor.status === 'Active' ? 'default' : 'secondary'}>
                    {vendor.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(vendor.joinDate).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}