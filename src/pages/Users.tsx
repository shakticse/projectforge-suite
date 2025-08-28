import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");

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
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
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