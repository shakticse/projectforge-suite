import { useState, useEffect } from "react";
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
import { roleService } from "@/services/roleService";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
  isManagerRole?: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
}

const menuItems = await roleService.getAllMenu();
// Normalize values to strings to keep comparisons consistent in the form state
const availablePages = menuItems.map((item) => ({
  value: String(item.id),
  label: item.menuName,
}));

// [
//   { value: "dashboard", label: "Dashboard" },
//   { value: "projects", label: "Projects" },
//   { value: "bom", label: "BOM" },
//   { value: "inventory", label: "Inventory" },
//   { value: "purchase-orders", label: "Purchase Orders" },
//   { value: "purchase-requests", label: "Purchase Requests" },
//   { value: "material-request", label: "Material Request" },
//   { value: "mrn-list", label: "MRN List/Challan" },
//   { value: "work-orders", label: "Work Orders" },
//   { value: "work-requests", label: "Work Requests" },
//   { value: "gate-pass", label: "Gate Pass" },
//   { value: "vehicle-request", label: "Vehicle Request" },
//   { value: "users", label: "Users" },
//   { value: "vendors", label: "Vendors" },
//   { value: "reports", label: "Reports" },
//   { value: "settings", label: "Settings" },
//   { value: "query-issue-log", label: "Query/Issue Log" },
// ];



export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupMessage, setPopupMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedPages: [] as string[],
    pagePermissions: {} as Record<string, Permission>,
    isManagerRole: false
  });

  const formatDateTime = (date?: string | Date | null): string => {
    if (!date) return 'NA';

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return 'NA';

    if (
      parsedDate.getFullYear() == 1 &&
      parsedDate.getMonth() === 0 &&
      parsedDate.getDate() === 1
    ) {
      return 'NA';
    }

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(parsedDate);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      selectedPages: [],
      pagePermissions: {},
      isManagerRole: false
    });
  };

  // Fetch roles (component-scoped so we can re-use after create/update/delete)
  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res: any = await roleService.getAllRoles();
      // Map API rows to local Role shape
      const mapped: Role[] = (res || []).map((r: any) => ({
        id: String(r.RoleId ?? r.role_id ?? r.roleId ?? ''),
        name: r.Name ?? r.name ?? '',
        description: r.Description ?? r.description ?? '',
        pagePermissions: [],
        userCount: Number(r.Users ?? r.users ?? 0),
        isManagerRole: !!(r.IsManagerRole ?? r.isManagerRole ?? r.is_manager_role ?? false),
        createdAt: r.CreatedAt ?? r.createdAt ?? '',
        updatedAt: r.UpdateDate ?? r.updateDate ?? '',
        status: 'active'
      }));
      setRoles(mapped);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load roles';
      setPopupMessage({ type: 'error', text: String(msg) });
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    // initial load
    fetchRoles();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPopupMessage({ type: null, text: '' });

    if (!formData.name.trim()) {
      setPopupMessage({ type: 'error', text: 'Role name is required' });
      return;
    }

    if (formData.selectedPages.length === 0) {
      setPopupMessage({ type: 'error', text: 'At least one page must be selected' });
      return;
    }

    const pagePermissions: PagePermission[] = formData.selectedPages.map(pageValue => {
      const page = availablePages.find(p => String(p.value) === String(pageValue));
      return {
        page: String(pageValue),
        label: page?.label || String(pageValue),
        permissions: formData.pagePermissions[pageValue]
      };
    });

    // Build API payload
    const payload = {
      Name: formData.name,
      Description: formData.description || null,
      IsManagerRole: !!formData.isManagerRole,
      Permissions: formData.selectedPages.map(pageValue => {
        const page = availablePages.find(p => String(p.value) === String(pageValue));
        const menuId = page ? Number(page.value) : Number(pageValue);
        const perms = formData.pagePermissions[pageValue];
        return {
          MenuId: menuId,
          CanCreate: !!perms.create,
          CanView: !!perms.view,
          CanUpdate: !!perms.edit,
          CanDelete: !!perms.delete
        };
      })
    };

    setIsSubmitting(true);
    try {
      if (editingRole) {
        const res = await roleService.updateRole(editingRole.id, payload);
        // Refresh list from server to ensure correct state
        await fetchRoles();
        // Show toast and close dialog
        toast.success(res?.message || 'Role updated successfully');
        setIsCreateOpen(false);
        setEditingRole(null);
        resetForm();
        setPopupMessage({ type: null, text: '' });
      } else {
        const res = await roleService.createRole(payload);
        // Refresh list from server to ensure correct state
        await fetchRoles();
        toast.success(res?.message || 'Role created successfully');
        setIsCreateOpen(false);
        resetForm();
        setPopupMessage({ type: null, text: '' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save role';
      // Show error (keep dialog open so user can correct and resubmit)
      setPopupMessage({ type: 'error', text: String(msg) });
      toast.error(String(msg));
      // keep dialog open and preserve form state for correction
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (role: Role) => {
    // Clear previous errors and open dialog
    setPopupMessage({ type: null, text: '' });
    setIsCreateOpen(true);
    try {
      const res: any = await roleService.getRoleById(role.id);

      // API expected shape: { Name, Description, Permissions: [ { MenuId, CanCreate, CanView, CanUpdate, CanDelete } ] }
      const permissions = res?.Permissions || res?.permissions || [];

      const selectedPages = permissions.map((p: any) => String(p.MenuId ?? p.menuId ?? p.menuId));

      const pagePermissions = Object.fromEntries(
        permissions.map((p: any) => [
          String(p.MenuId ?? p.menuId ?? p.menuId),
          {
            view: !!(p.CanView ?? p.canView ?? p.can_view),
            create: !!(p.CanCreate ?? p.canCreate ?? p.can_create),
            edit: !!(p.CanUpdate ?? p.canUpdate ?? p.can_update),
            delete: !!(p.CanDelete ?? p.canDelete ?? p.can_delete),
          }
        ])
      );

      // Build pagePermissions array for local Role object (used in listing)
      const pagePermissionsArray: PagePermission[] = selectedPages.map((pageValue: string) => ({
        page: pageValue,
        label: availablePages.find(p => String(p.value) === String(pageValue))?.label || pageValue,
        permissions: pagePermissions[pageValue]
      }));

      const isManagerFlag = !!(res?.IsManagerRole ?? res?.isManagerRole ?? res?.is_manager_role ?? false);

      setEditingRole({
        ...role,
        name: res?.Name ?? res?.name ?? role.name,
        description: res?.Description ?? res?.description ?? role.description,
        isManagerRole: isManagerFlag,
        pagePermissions: pagePermissionsArray
      });

      setFormData({
        name: res?.Name ?? res?.name ?? role.name,
        description: res?.Description ?? res?.description ?? role.description,
        selectedPages,
        pagePermissions,
        isManagerRole: isManagerFlag
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load role details';
      setPopupMessage({ type: 'error', text: String(msg) });
    }
  };

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (role: Role) => {
    setDeletingRole(role);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingRole) return;
    setIsDeleting(true);
    try {
      const res: any = await roleService.deleteRole(deletingRole.id);
      // Refresh list from server to ensure correct state
      await fetchRoles();
      toast.success(res?.message || "Role deleted successfully");
      setIsDeleteOpen(false);
      setDeletingRole(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete role';
      // Keep delete dialog open so user can retry, show toast error
      toast.error(String(msg));
      setPopupMessage({ type: 'error', text: String(msg) });
      // do not close the dialog so user can retry
    } finally {
      setIsDeleting(false);
    }
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
          if (open) {
            // Clear any previous popup messages when opening create/edit dialog
            setPopupMessage({ type: null, text: '' });
          }
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
              {popupMessage.type && (
                <div className="px-4">
                  <Alert variant={popupMessage.type === 'error' ? 'destructive' : 'default'}>
                    <AlertTitle>{popupMessage.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                    <AlertDescription>{popupMessage.text}</AlertDescription>
                  </Alert>
                </div>
              )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name *</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter role name"
                      required
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isManagerRole"
                        checked={!!formData.isManagerRole}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isManagerRole: !!checked }))}
                      />
                      <Label htmlFor="isManagerRole" className="text-sm">Is Manager Role</Label>
                    </div>
                  </div>
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
                    if (isSubmitting) return;
                    setIsCreateOpen(false);
                    setEditingRole(null);
                    resetForm();
                    setPopupMessage({ type: null, text: '' });
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isSubmitting ? (editingRole ? 'Updating...' : 'Saving...') : (editingRole ? 'Update Role' : 'Create Role')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteOpen} onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (open) setPopupMessage({ type: null, text: '' });
          if (!open) setDeletingRole(null);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <p>Are you sure you want to delete the role <strong>{deletingRole?.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => { setIsDeleteOpen(false); setDeletingRole(null); }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button onClick={confirmDelete} className="text-destructive" disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
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
          {loadingRoles ? (
            <div className="mb-4 text-sm text-muted-foreground">Loading roles...</div>
          ) : roles.length === 0 ? (
            <div className="mb-4 py-6 text-center text-sm text-muted-foreground">No roles found.</div>
          ) : null}
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
                      {formatDateTime(role.updatedAt)}
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
                          onClick={() => handleDelete(role)}
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