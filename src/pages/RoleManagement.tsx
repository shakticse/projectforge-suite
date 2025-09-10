import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Plus, Edit, Trash2, Shield, Users, Eye, FilePenLine, FileText, Trash } from "lucide-react";
import { toast } from "sonner";

interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface PagePermission {
  page: string;
  label: string;
  permissions: Permission;
}

interface Role {
  id: string;
  name: string;
  description: string;
  pagePermissions: PagePermission[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
}

const availablePages = [
  { value: "dashboard", label: "Dashboard" },
  { value: "projects", label: "Projects" },
  { value: "bom", label: "BOM" },
  { value: "inventory", label: "Inventory" },
  { value: "purchase-orders", label: "Purchase Orders" },
  { value: "purchase-requests", label: "Purchase Requests" },
  { value: "material-request", label: "Material Request" },
  { value: "mrn-list", label: "MRN List/Challan" },
  { value: "work-orders", label: "Work Orders" },
  { value: "work-requests", label: "Work Requests" },
  { value: "gate-pass", label: "Gate Pass" },
  { value: "vehicle-request", label: "Vehicle Request" },
  { value: "users", label: "Users" },
  { value: "vendors", label: "Vendors" },
  { value: "reports", label: "Reports" },
  { value: "settings", label: "Settings" },
  { value: "query-issue-log", label: "Query/Issue Log" },
];

const mockRoles: Role[] = [
  {
    id: "1",
    name: "Project Manager",
    description: "Full access to project management features",
    pagePermissions: [
      { page: "dashboard", label: "Dashboard", permissions: { view: true, create: false, edit: false, delete: false } },
      { page: "projects", label: "Projects", permissions: { view: true, create: true, edit: true, delete: true } },
      { page: "bom", label: "BOM", permissions: { view: true, create: true, edit: true, delete: false } },
    ],
    userCount: 5,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
    status: "active"
  },
  {
    id: "2",
    name: "Store Supervisor",
    description: "Access to inventory and material management",
    pagePermissions: [
      { page: "dashboard", label: "Dashboard", permissions: { view: true, create: false, edit: false, delete: false } },
      { page: "inventory", label: "Inventory", permissions: { view: true, create: true, edit: true, delete: false } },
      { page: "material-request", label: "Material Request", permissions: { view: true, create: true, edit: true, delete: false } },
    ],
    userCount: 3,
    createdAt: "2024-01-10",
    updatedAt: "2024-01-18",
    status: "active"
  },
  {
    id: "3",
    name: "Purchase Manager",
    description: "Manages purchase orders and vendor relationships",
    pagePermissions: [
      { page: "dashboard", label: "Dashboard", permissions: { view: true, create: false, edit: false, delete: false } },
      { page: "purchase-orders", label: "Purchase Orders", permissions: { view: true, create: true, edit: true, delete: true } },
      { page: "vendors", label: "Vendors", permissions: { view: true, create: true, edit: true, delete: false } },
    ],
    userCount: 2,
    createdAt: "2024-01-12",
    updatedAt: "2024-01-22",
    status: "active"
  },
];

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedPages: [] as string[],
    pagePermissions: {} as Record<string, Permission>
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      selectedPages: [],
      pagePermissions: {}
    });
  };

  const handlePageSelection = (pageValue: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        selectedPages: [...prev.selectedPages, pageValue],
        pagePermissions: {
          ...prev.pagePermissions,
          [pageValue]: { view: true, create: false, edit: false, delete: false }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedPages: prev.selectedPages.filter(p => p !== pageValue),
        pagePermissions: Object.fromEntries(
          Object.entries(prev.pagePermissions).filter(([key]) => key !== pageValue)
        )
      }));
    }
  };

  const handlePermissionChange = (pageValue: string, permission: keyof Permission, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      pagePermissions: {
        ...prev.pagePermissions,
        [pageValue]: {
          ...prev.pagePermissions[pageValue],
          [permission]: checked
        }
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (formData.selectedPages.length === 0) {
      toast.error("At least one page must be selected");
      return;
    }

    const pagePermissions: PagePermission[] = formData.selectedPages.map(pageValue => {
      const page = availablePages.find(p => p.value === pageValue);
      return {
        page: pageValue,
        label: page?.label || pageValue,
        permissions: formData.pagePermissions[pageValue]
      };
    });

    if (editingRole) {
      setRoles(prev => prev.map(role => 
        role.id === editingRole.id 
          ? {
              ...role,
              name: formData.name,
              description: formData.description,
              pagePermissions,
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : role
      ));
      toast.success("Role updated successfully");
      setEditingRole(null);
    } else {
      const newRole: Role = {
        id: (roles.length + 1).toString(),
        name: formData.name,
        description: formData.description,
        pagePermissions,
        userCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        status: "active"
      };
      setRoles(prev => [...prev, newRole]);
      toast.success("Role created successfully");
    }

    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      selectedPages: role.pagePermissions.map(p => p.page),
      pagePermissions: Object.fromEntries(
        role.pagePermissions.map(p => [p.page, p.permissions])
      )
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (roleId: string) => {
    setRoles(prev => prev.filter(role => role.id !== roleId));
    toast.success("Role deleted successfully");
  };

  // Filter and sort roles
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRoles = filteredRoles.sort((a, b) => {
    const aValue = a[sortBy as keyof Role];
    const bValue = b[sortBy as keyof Role];
    
    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoles = sortedRoles.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">Manage roles and permissions</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setEditingRole(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Edit Role" : "Create New Role"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter role name"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter role description"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Page Permissions</Label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {availablePages.map((page) => (
                    <Card key={page.value} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={page.value}
                            checked={formData.selectedPages.includes(page.value)}
                            onCheckedChange={(checked) => 
                              handlePageSelection(page.value, checked as boolean)
                            }
                          />
                          <Label htmlFor={page.value} className="font-medium">
                            {page.label}
                          </Label>
                        </div>
                        
                        {formData.selectedPages.includes(page.value) && (
                          <div className="ml-6 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${page.value}-view`}
                                  checked={formData.pagePermissions[page.value]?.view || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(page.value, 'view', checked as boolean)
                                  }
                                />
                                <Label htmlFor={`${page.value}-view`} className="text-sm flex items-center">
                                  <Eye className="mr-1 h-3 w-3" />
                                  View
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${page.value}-create`}
                                  checked={formData.pagePermissions[page.value]?.create || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(page.value, 'create', checked as boolean)
                                  }
                                />
                                <Label htmlFor={`${page.value}-create`} className="text-sm flex items-center">
                                  <Plus className="mr-1 h-3 w-3" />
                                  Create
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${page.value}-edit`}
                                  checked={formData.pagePermissions[page.value]?.edit || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(page.value, 'edit', checked as boolean)
                                  }
                                />
                                <Label htmlFor={`${page.value}-edit`} className="text-sm flex items-center">
                                  <FilePenLine className="mr-1 h-3 w-3" />
                                  Edit
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${page.value}-delete`}
                                  checked={formData.pagePermissions[page.value]?.delete || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(page.value, 'delete', checked as boolean)
                                  }
                                />
                                <Label htmlFor={`${page.value}-delete`} className="text-sm flex items-center">
                                  <Trash className="mr-1 h-3 w-3" />
                                  Delete
                                </Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingRole(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Roles List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="userCount">User Count</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="updatedAt">Updated Date</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => handleSort(sortBy)}
              className="w-full sm:w-auto"
            >
              {sortOrder === "asc" ? "↑" : "↓"} Sort
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    Role Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('userCount')}
                  >
                    Users {sortBy === 'userCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Permissions</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 hidden lg:table-cell"
                    onClick={() => handleSort('updatedAt')}
                  >
                    Last Updated {sortBy === 'updatedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">
                      {role.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        {role.userCount}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {role.pagePermissions.slice(0, 3).map((perm) => (
                          <Badge key={perm.page} variant="secondary" className="text-xs">
                            {perm.label}
                          </Badge>
                        ))}
                        {role.pagePermissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.pagePermissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={role.status === 'active' ? 'default' : 'secondary'}>
                        {role.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {role.updatedAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}