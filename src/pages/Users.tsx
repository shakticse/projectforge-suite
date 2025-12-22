import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/userService";
import { roleService } from "@/services/roleService";
import { departmentService } from "../services/departmentService";
import { categoryService } from "@/services/categoryService";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Shield,
  Users as UsersIcon,
  Download,
  X
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const userSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
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

type UserFormData = z.infer<typeof userSchema>;

interface User {
  id: string | number;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string; // role name
  roleId?: string | number; // role identifier when available
  department?: string; // department name
  departmentId?: string | number; // department identifier when available
  categories?: string | string[];
  status?: string;
  lastLogin?: string;
  avatar?: string;
  projects?: number;
  permissions?: string[];
  employeeId?: string;
  joiningDate?: string;
}

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      employeeId: "",
      joiningDate: "",
    },
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [popupMessage, setPopupMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });
  const [deletePopupMessage, setDeletePopupMessage] = useState<{ type: 'error' | null; text: string }>({ type: null, text: '' });

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res: any = await userService.getAllUsers();
      // Map API results to local shape; fall back to existing fields when missing
      const mapped: User[] = (res || []).map((u: any) => ({
        id: u.id ?? u.userId ?? u.UserId,
        firstName: u.firstName ?? u.first_name ?? '',
        lastName: u.lastName ?? u.last_name ?? '',
        name: u.name ?? ((u.firstName ?? '') + (u.lastName ? ' ' + u.lastName : '')),
        email: u.email ?? u.Email ?? '',
        phone: u.phone ?? u.Phone ?? '',
        // prefer roleId when available, also keep name
        role: u.role ?? u.Role ?? u.roleName ?? u.Role?.Name ?? '',
        roleId: u.roleId ?? u.RoleId ?? u.role?.id ?? u.Role?.RoleId ?? undefined,
        department: u.department ?? u.Department ?? u.departmentName ?? u.Department?.Name ?? '',
        departmentId: u.departmentId ?? u.DepartmentId ?? u.department?.id ?? u.Department?.DepartmentId ?? undefined,
        categories: u.categories ?? u.Categories ?? (u.CategoryIds ? (Array.isArray(u.CategoryIds) ? u.CategoryIds : String(u.CategoryIds).split(',').map((s: string) => s.trim()).filter(Boolean)) : undefined),
        status: u.status ?? 'Active',
        lastLogin: u.lastLogin ?? u.last_login ?? '',
        avatar: u.avatar ?? u.avatarUrl ?? '',
        projects: u.projects ?? 0,
        permissions: u.permissions ?? [],
        employeeId: u.employeeId ?? u.employee_id ?? '',
        joiningDate: u.joiningDate ?? u.joining_date ?? ''
      }));
      setUsers(mapped);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || err?.message || 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { 
    // initial load
    fetchUsers();

    // fetch roles and departments
    const loadMeta = async () => {
      try {
        const r: any = await roleService.getAllRoles();
        setRoles((r || []).map((x: any) => ({ id: String(x.RoleId ?? x.id ?? x.roleId ?? ''), name: x.Name ?? x.name ?? x.menuName ?? '' })));
      } catch (err) {
        console.warn('Failed to load roles', err);
      }

      try {
        const d: any = await departmentService.getAllDepartments();
        setDepartments((d || []).map((x: any) => ({ id: String(x.DepartmentId ?? x.id ?? x.departmentId ?? ''), name: x.Name ?? x.name ?? x.departmentName ?? '' })));
      } catch (err) {
        console.warn('Failed to load departments', err);
      }

      try {
        const c: any = await categoryService.getAllCategories();
        setCategoriesList((c || []).map((x: any) => ({ id: String(x.CategoryId ?? x.id ?? x.categoryId ?? ''), name: x.Name ?? x.name ?? x.categoryName ?? x })));
      } catch (err) {
        console.warn('Failed to load categories', err);
      }
    };

    loadMeta();
  }, []);

  const onSubmit = async (data: UserFormData) => {
    try {
      const payload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        // if role value is numeric treat as roleId
        roleId: data.role && String(data.role).match(/^\d+$/) ? Number(data.role) : undefined,
        role: data.role && !String(data.role).match(/^\d+$/) ? data.role : undefined,
        departmentId: data.department && String(data.department).match(/^\d+$/) ? Number(data.department) : undefined,
        department: data.department && !String(data.department).match(/^\d+$/) ? data.department : undefined,
        employeeId: data.employeeId,
        joiningDate: data.joiningDate
      };

      // attach categories as comma-separated string when available
      if (selectedCategories.length > 0) payload.categories = selectedCategories.join(',');

      if (editingUser) {
        const res = await userService.updateUser(editingUser.id, payload);
        toast({ title: 'User updated', description: res?.message || 'User updated successfully.' });
        setIsAddUserOpen(false);
        setEditingUser(null);
        form.reset();
        setSelectedCategories([]);
        fetchUsers();
        setPopupMessage({ type: null, text: '' });
      } else {
        const res = await userService.createUser(payload);
        toast({ title: 'User added', description: res?.message || 'New user has been successfully added to the system.' });
        setIsAddUserOpen(false);
        form.reset();
        setSelectedCategories([]);
        fetchUsers();
        setPopupMessage({ type: null, text: '' });
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to save user. Please try again.';
      // Keep dialog open and show inline error for correction
      setPopupMessage({ type: 'error', text: String(msg) });
      toast({ title: 'Error', description: String(msg), variant: 'destructive' });
    }
  };

  const handleDelete = (user: User) => {
    setDeletingUser(user);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await userService.deleteUser(deletingUser.id);
      toast({ title: 'User deleted', description: 'User deleted successfully.' });
      setIsDeleteOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete user';
      setDeletePopupMessage({ type: 'error', text: String(msg) });
      toast({ title: 'Error', description: String(msg), variant: 'destructive' });
      // keep dialog open so user can retry
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const removeCategory = (category: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== category));
  };

  // Note: users are loaded from the API via fetchUsers(); see state above
  // The list is rendered from the `users` state and refreshed after create/update/delete operations.

  const getStatusBadge = (status: string) => {
    return status === "Active" 
      ? <Badge variant="success" className="gap-1"><UserCheck className="h-3 w-3" />Active</Badge>
      : <Badge variant="secondary" className="gap-1"><UserX className="h-3 w-3" />Inactive</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
      "System Administrator": "destructive",
      "Project Manager": "default",
      "Inventory Manager": "success",
      "Quality Assurance": "warning",
      "Supply Chain Coordinator": "secondary"
    };
    return <Badge variant={colors[role] || "outline"} className="text-xs">{role}</Badge>;
  };

  const activeUsers = users.filter(user => user.status === "Active").length;
  const totalProjects = users.reduce((sum, user) => sum + user.projects, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts, roles, and permissions</p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2" onClick={() => { setEditingUser(null); form.reset(); form.clearErrors(); setPopupMessage({ type: null, text: '' }); setSelectedCategories([]); }}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Update user details below.' : 'Fill in the details below to create a new user account.'}
              </DialogDescription>
            </DialogHeader>

            {popupMessage.type && (
              <div className="px-4">
                <Alert variant={popupMessage.type === 'error' ? 'destructive' : 'default'}>
                  <AlertTitle>{popupMessage.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                  <AlertDescription>{popupMessage.text}</AlertDescription>
                </Alert>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
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
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="user@company.com" {...field} />
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
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee ID *</FormLabel>
                          <FormControl>
                            <Input placeholder="EMP001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Work Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {roles.map((r) => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="joiningDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Joining Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <FormLabel>Categories</FormLabel>
                      <Select onValueChange={(value) => toggleCategory(value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select categories" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoriesList.map((category) => (
                            <SelectItem key={category.id} value={category.id} disabled={selectedCategories.includes(category.id)}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedCategories.map((catId) => {
                            const catName = categoriesList.find(c => c.id === catId)?.name || catId;
                            return (
                              <Badge key={catId} variant="secondary" className="flex items-center gap-1">
                                {catName}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0.5 hover:bg-transparent"
                                  onClick={() => removeCategory(catId)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsAddUserOpen(false);
                      form.reset();
                      setEditingUser(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Update User' : 'Add User'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if (open) setDeletePopupMessage({ type: null, text: '' }); if (!open) setDeletingUser(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>

            {deletePopupMessage.type && (
              <div className="px-4">
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{deletePopupMessage.text}</AlertDescription>
                </Alert>
              </div>
            )}

            <div className="py-2">
              <p>Are you sure you want to delete user <strong>{deletingUser?.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setDeletingUser(null); setDeletePopupMessage({ type: null, text: '' }); }} disabled={isDeleting}>Cancel</Button>
              <Button className="text-destructive" onClick={confirmDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-success">{activeUsers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Shield className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{totalProjects}</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="mb-4 py-6 text-center text-sm text-muted-foreground">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="mb-4 py-6 text-center text-sm text-muted-foreground">No users found.</div>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {user.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.department}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        <span className="text-muted-foreground truncate max-w-32">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        <span className="text-muted-foreground">{user.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{user.projects} projects</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(user.lastLogin)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingUser(user);
                          form.reset({
                            firstName: user.name?.split(' ')?.[0] ?? '',
                            lastName: user.name?.split(' ')?.slice(1).join(' ') ?? '',
                            email: user.email ?? '',
                            phone: user.phone ?? '',
                            role: user.roleId ? String(user.roleId) : (user.role ?? ''),
                            department: user.departmentId ? String(user.departmentId) : (user.department ?? ''),
                            employeeId: user.employeeId ?? '',
                            joiningDate: user.joiningDate ? new Date(user.joiningDate).toISOString().split('T')[0] : ''
                          });
                          // parse categories (API may return CSV string or array in user.categories)
                          const catVals = user.categories ? (Array.isArray(user.categories) ? user.categories : String(user.categories).split(',').map((s: string) => s.trim()).filter(Boolean)) : [];
                          setSelectedCategories(catVals);
                          setPopupMessage({ type: null, text: '' });
                          form.clearErrors();
                          setIsAddUserOpen(true);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          Manage Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {user.status === "Active" ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;