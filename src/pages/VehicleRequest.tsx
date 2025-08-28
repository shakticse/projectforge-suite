import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, Truck, Calendar, User, ArrowUpDown, Filter } from "lucide-react";
import { toast } from "sonner";
import * as yup from "yup";

interface VehicleRequest {
  id: string;
  projectId: string;
  projectName: string;
  vehicleType: string;
  requestedBy: string;
  requestDate: string;
  requiredDate: string;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  approvedBy?: string;
  assignedVehicle?: string;
}

const vehicleRequestSchema = yup.object({
  projectId: yup.string().required("Project is required"),
  vehicleType: yup.string().required("Vehicle type is required"),
  requiredDate: yup.string().required("Required date is required"),
  purpose: yup.string().required("Purpose is required"),
});

const mockProjects = [
  { id: "1", name: "Highway Construction Project" },
  { id: "2", name: "Bridge Building Project" },
  { id: "3", name: "Commercial Complex" },
];

const vehicleTypes = ["Truck", "Van", "Pickup", "Heavy Equipment Transporter", "Crane"];

const mockVehicleRequests: VehicleRequest[] = [
  {
    id: "VR-001",
    projectId: "1",
    projectName: "Highway Construction Project",
    vehicleType: "Truck",
    requestedBy: "John Manager",
    requestDate: "2024-01-15",
    requiredDate: "2024-01-20",
    purpose: "Material delivery to site",
    status: "Approved",
    approvedBy: "Admin User",
    assignedVehicle: "ABC-1234"
  },
  {
    id: "VR-002",
    projectId: "2",
    projectName: "Bridge Building Project",
    vehicleType: "Crane",
    requestedBy: "Sarah Engineer",
    requestDate: "2024-01-18",
    requiredDate: "2024-01-25",
    purpose: "Heavy equipment transport",
    status: "Pending"
  },
  {
    id: "VR-003",
    projectId: "1",
    projectName: "Highway Construction Project",
    vehicleType: "Van",
    requestedBy: "Mike Supervisor",
    requestDate: "2024-01-20",
    requiredDate: "2024-01-22",
    purpose: "Team transportation",
    status: "Completed",
    approvedBy: "Admin User",
    assignedVehicle: "XYZ-5678"
  }
];

export default function VehicleRequest() {
  const [vehicleRequests] = useState<VehicleRequest[]>(mockVehicleRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [sortBy, setSortBy] = useState<string>("requestDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: yupResolver(vehicleRequestSchema),
    defaultValues: {
      projectId: "",
      vehicleType: "",
      requiredDate: "",
      purpose: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      console.log("Creating vehicle request:", data);
      toast.success("Vehicle request created successfully!");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to create vehicle request");
    }
  };

  const filteredRequests = vehicleRequests
    .filter(request => {
      const matchesSearch = request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.vehicleType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || request.status === statusFilter;
      const matchesProject = projectFilter === "All" || request.projectId === projectFilter;
      
      return matchesSearch && matchesStatus && matchesProject;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "projectName":
          aValue = a.projectName;
          bValue = b.projectName;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "requiredDate":
          aValue = a.requiredDate;
          bValue = b.requiredDate;
          break;
        default:
          aValue = a.requestDate;
          bValue = b.requestDate;
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      case 'Completed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Request</h1>
          <p className="text-muted-foreground">Manage vehicle requests for projects</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Vehicle Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Vehicle Request</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicleTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                  name="requiredDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the purpose for vehicle request..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Request</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicle requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Projects</SelectItem>
            {mockProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("id")}>
                <div className="flex items-center gap-2">
                  Request ID
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("projectName")}>
                <div className="flex items-center gap-2">
                  Project
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Vehicle Type</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("requestDate")}>
                <div className="flex items-center gap-2">
                  Request Date
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("requiredDate")}>
                <div className="flex items-center gap-2">
                  Required Date
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                <div className="flex items-center gap-2">
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Assigned Vehicle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.id}</TableCell>
                <TableCell>{request.projectName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    {request.vehicleType}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {request.requestedBy}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(request.requestDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(request.requiredDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{request.purpose}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(request.status) as any}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>{request.assignedVehicle || "Not assigned"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
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