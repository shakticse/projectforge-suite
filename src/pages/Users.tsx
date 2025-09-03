import { useState } from "react";
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
  Download
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
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserFormData = z.infer<typeof userSchema>;

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
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      // TODO: Save user to backend
      console.log("User data:", data);
      
      toast({
        title: "User added",
        description: "New user has been successfully added to the system.",
      });
      
      setIsAddUserOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mock user data
  const users = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.johnson@projecthub.com",
      phone: "+1 (555) 123-4567",
      role: "Project Manager",
      department: "Operations",
      status: "Active",
      lastLogin: "2024-11-15 09:30",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      projects: 8,
      permissions: ["projects.manage", "users.view", "reports.view"]
    },
    {
      id: 2,
      name: "Mike Chen",
      email: "mike.chen@projecthub.com", 
      phone: "+1 (555) 234-5678",
      role: "Inventory Manager",
      department: "Warehouse",
      status: "Active",
      lastLogin: "2024-11-15 11:15",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
      projects: 3,
      permissions: ["inventory.manage", "orders.create", "reports.view"]
    },
    {
      id: 3,
      name: "Emily Davis",
      email: "emily.davis@projecthub.com",
      phone: "+1 (555) 345-6789",
      role: "Quality Assurance",
      department: "Quality Control",
      status: "Active",
      lastLogin: "2024-11-14 16:45",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
      projects: 5,
      permissions: ["quality.manage", "reports.create", "projects.view"]
    },
    {
      id: 4,
      name: "David Wilson",
      email: "david.wilson@projecthub.com",
      phone: "+1 (555) 456-7890",
      role: "Supply Chain Coordinator",
      department: "Procurement",
      status: "Inactive",
      lastLogin: "2024-11-10 14:20",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      projects: 2,
      permissions: ["suppliers.manage", "orders.view"]
    },
    {
      id: 5,
      name: "Jessica Martinez",
      email: "jessica.martinez@projecthub.com",
      phone: "+1 (555) 567-8901",
      role: "System Administrator",
      department: "IT",
      status: "Active",
      lastLogin: "2024-11-15 08:00",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
      projects: 12,
      permissions: ["system.admin", "users.manage", "all.access"]
    }
  ];

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
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new user account.
              </DialogDescription>
            </DialogHeader>
            
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
                              <SelectItem value="System Administrator">System Administrator</SelectItem>
                              <SelectItem value="Project Manager">Project Manager</SelectItem>
                              <SelectItem value="Inventory Manager">Inventory Manager</SelectItem>
                              <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                              <SelectItem value="Supply Chain Coordinator">Supply Chain Coordinator</SelectItem>
                              <SelectItem value="Procurement Officer">Procurement Officer</SelectItem>
                              <SelectItem value="Finance Manager">Finance Manager</SelectItem>
                              <SelectItem value="Operations Manager">Operations Manager</SelectItem>
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
                              <SelectItem value="IT">IT</SelectItem>
                              <SelectItem value="Operations">Operations</SelectItem>
                              <SelectItem value="Warehouse">Warehouse</SelectItem>
                              <SelectItem value="Quality Control">Quality Control</SelectItem>
                              <SelectItem value="Procurement">Procurement</SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                              <SelectItem value="Human Resources">Human Resources</SelectItem>
                              <SelectItem value="Sales">Sales</SelectItem>
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

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsAddUserOpen(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add User
                  </Button>
                </div>
              </form>
            </Form>
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
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
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
                        <DropdownMenuItem className="text-destructive">
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