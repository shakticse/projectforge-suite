import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Plus,
  Filter,
  Calendar,
  Users,
  Clock,
  MoreVertical,
  FolderOpen,
  Eye,
  Edit,
  Trash2,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import ViewProjectModal from "@/components/projects/ViewProjectModal";
import EditProjectModal from "@/components/projects/EditProjectModal";

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  startDate: string;
  dueDate: string;
  teamSize: number;
  budget: string;
  manager: string;
}

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock project data (expanded for pagination demo)
  const [allProjects, setAllProjects] = useState<Project[]>([
    {
      id: 1,
      name: "Gujarat Trade Show 2024",
      description: "Vibrant Gujarat Global Trade Show 2024",
      status: "In Progress",
      priority: "High",
      progress: 75,
      startDate: "2024-10-01",
      dueDate: "2024-12-15",
      teamSize: 8,
      budget: "₹125,000",
      manager: "Sarah Johnson"
    },
    {
      id: 2,
      name: "G20 Project",
      description: "G20 India's Presidency 2022- 2023",
      status: "Planning",
      priority: "Medium",
      progress: 25,
      startDate: "2024-11-15",
      dueDate: "2025-01-10",
      teamSize: 5,
      budget: "₹75,000",
      manager: "Mike Chen"
    },
    {
      id: 3,
      name: "India Energy Week",
      description: "India Energy Week 2024, Goa",
      status: "Review",
      priority: "High",
      progress: 90,
      startDate: "2024-09-01",
      dueDate: "2024-12-01", 
      teamSize: 6,
      budget: "₹95,000",
      manager: "Emily Davis"
    },
    {
      id: 4,
      name: "Kochi Metro",
      description: "Museum - Kochi Metro, Kochi",
      status: "In Progress",
      priority: "Low",
      progress: 45,
      startDate: "2024-10-20",
      dueDate: "2024-12-20",
      teamSize: 4,
      budget: "₹60,000",
      manager: "David Wilson"
    },
    {
      id: 5,
      name: "Mumbai Exhibition Center",
      description: "International Trade Fair Setup",
      status: "Completed",
      priority: "Medium",
      progress: 100,
      startDate: "2024-08-01",
      dueDate: "2024-10-30",
      teamSize: 12,
      budget: "₹200,000",
      manager: "Priya Sharma"
    },
    {
      id: 6,
      name: "Delhi Auto Expo",
      description: "Auto Expo 2024 Pavilion Setup",
      status: "Planning",
      priority: "High",
      progress: 15,
      startDate: "2024-12-01",
      dueDate: "2025-02-15",
      teamSize: 10,
      budget: "₹180,000",
      manager: "Raj Patel"
    }
  ]);

  // Filter and sort projects
  const filteredProjects = allProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const getValue = (obj: any, key: string) => {
      switch (key) {
        case "dueDate":
        case "startDate":
          return new Date(obj[key]).getTime();
        case "progress":
        case "teamSize":
          return obj[key];
        default:
          return obj[key]?.toString().toLowerCase() || "";
      }
    };

    const aValue = getValue(a, sortColumn);
    const bValue = getValue(b, sortColumn);

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProjects = sortedProjects.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "default";
      case "Planning": return "secondary";
      case "Review": return "warning";
      case "Completed": return "success";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "warning";
      case "Low": return "secondary";
      default: return "outline";
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setAllProjects(prev => 
      prev.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage and track all your projects in one place</p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
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

      {/* Projects Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50">
                  <TableHead className="h-12">
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("name")}
                    >
                      Project Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="h-12">
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("status")}
                    >
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="h-12">
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("priority")}
                    >
                      Priority
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="h-12">
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("progress")}
                    >
                      Progress
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="h-12">
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("dueDate")}
                    >
                      Due Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="h-12">
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("manager")}
                    >
                      Manager
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="h-12">
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("budget")}
                    >
                      Budget
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="h-12 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjects.map((project) => (
                  <TableRow key={project.id} className="border-b border-border/50 hover:bg-muted/50">
                    <TableCell className="py-4">
                      <div>
                        <div className="font-medium text-sm">{project.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-1 max-w-[200px]">
                          {project.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant={getStatusColor(project.status)} className="text-xs">
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant={getPriorityColor(project.priority)} className="text-xs">
                        {project.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={project.progress} className="h-2 flex-1" />
                        <span className="text-xs font-medium min-w-[30px]">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-sm">
                      {new Date(project.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-4 text-sm">
                      {project.manager}
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium">
                      {project.budget}
                    </TableCell>
                     <TableCell className="py-4">
                       <div className="flex items-center justify-center gap-1">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-8 w-8 p-0"
                           onClick={() => handleViewProject(project)}
                         >
                           <Eye className="h-4 w-4" />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-8 w-8 p-0"
                           onClick={() => handleEditProject(project)}
                         >
                           <Edit className="h-4 w-4" />
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedProjects.length)} of {sortedProjects.length} projects
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {sortedProjects.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first project"}
            </p>
            <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />

      {/* View Project Modal */}
      <ViewProjectModal 
        open={showViewModal}
        onOpenChange={setShowViewModal}
        project={selectedProject}
      />

      {/* Edit Project Modal */}
      <EditProjectModal 
        open={showEditModal}
        onOpenChange={setShowEditModal}
        project={selectedProject}
        onUpdate={handleUpdateProject}
      />
    </div>
  );
};

export default Projects;