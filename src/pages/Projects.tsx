import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
import { projectService } from "@/services/projectService";
import { useToast } from "@/hooks/use-toast";
import ViewProjectModal from "@/components/projects/ViewProjectModal";
import EditProjectModal from "@/components/projects/EditProjectModal";

import { Project } from '@/types/project';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePopupMessage, setDeletePopupMessage] = useState<{ type: 'error' | null; text: string }>({ type: null, text: '' });


  // Filter and sort projects
  const filteredProjects = projects.filter(project =>
    (project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.manager || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  const { toast } = useToast();

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res: any = await projectService.getAllProjects();
      // map response to Project[] shape if necessary
      const mapped: Project[] = (res || []).map((p: any) => ({
        id: p.id ?? p.projectId ?? p.ProjectId,
        name: p.projectName ?? p.Name ?? p.name ?? '',
        description: p.description ?? p.Description ?? p.desc ?? '',
        status: p.status ?? p.Status ?? 'Planning',
        priority: p.priority ?? p.Priority ?? 'Medium',
        progress: p.progress ?? p.Progress ?? 0,
        startDate: p.startDate ?? p.StartDate ?? '',
        endDate: p.endDate ?? p.EndDate ?? '',
        teamSize: p.teamSize ?? p.teamSize ?? 0,
        budget: p.budget ?? p.Budget ?? '',
        manager: p.manager ?? p.managerName ?? p.Manager ?? '',
        managerId: p.managerId ?? p.manager_id ?? p.ManagerId ?? '',
        // Additional fields used by edit form
        address: p.address ?? p.Address ?? p.location ?? '',
        pincode: p.pincode ?? p.Pincode ?? p.pinCode ?? p.pin_code ?? '',
        state: p.state ?? p.State ?? '',
        // normalize incoming team to array of ids
        teamIds: (p.teamIds && Array.isArray(p.teamIds)) ? p.teamIds.map(String) : (p.team || p.teamMembers || p.team_list || p.teamIds || '') ? (String(p.team || p.teamMembers || p.team_list || p.teamIds).split(',').map((s: string) => s.trim()).filter(Boolean)) : [],
        projectArea: p.projectArea ?? p.project_area ?? p.ProjectArea ?? 0,
        areaUnit: p.areaUnit ?? p.area_unit ?? p.AreaUnit ?? '',
        sitePossessionStartDate: p.sitePossessionStartDate ?? p.sitePossessionStartDate ?? p.site_possession_start_date ?? p.SitePossessionStartDate ?? '',
        sitePossessionEndDate: p.sitePossessionEndDate ?? p.site_possession_end_date ?? p.SitePossessionEndDate ?? '',
        eventStartDate: p.eventStartDate ?? p.event_start_date ?? p.EventStartDate ?? '',
        eventEndDate: p.eventEndDate ?? p.event_end_date ?? p.EventEndDate ?? '',
        documents: p.documents ?? p.Documents ?? []
      }));
      setProjects(mapped);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || err?.message || 'Failed to load projects', variant: 'destructive' });
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = (project: Project) => {
    setDeletingProject(project);
    setIsDeleteOpen(true);
    setDeletePopupMessage({ type: null, text: '' });
  };

  const confirmDelete = async () => {
    if (!deletingProject) return;
    setIsDeleting(true);
    try {
      await projectService.deleteProject(deletingProject.id);
      toast({ title: 'Project deleted', description: 'Project deleted successfully.' });
      setIsDeleteOpen(false);
      setDeletingProject(null);
      fetchProjects();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete project';
      setDeletePopupMessage({ type: 'error', text: String(msg) });
      toast({ title: 'Error', description: String(msg), variant: 'destructive' });
      // keep dialog open so user can retry
    } finally {
      setIsDeleting(false);
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
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
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
          {loadingProjects ? (
            <div className="p-6">
              <div className="mb-4 py-6 text-center text-sm text-muted-foreground">Loading projects...</div>
            </div>
          ) : (
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
                    {/* <TableHead className="h-12">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort("budget")}
                      >
                        Budget
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead> */}
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
                        {new Date(project.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-4 text-sm">
                        {project.manager}
                      </TableCell>
                      {/* <TableCell className="py-4 text-sm font-medium">
                        {project.budget}
                      </TableCell> */}
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
                           <Button
                             variant="ghost"
                             size="sm"
                             className="h-8 w-8 p-0"
                             onClick={() => handleDelete(project)}
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
          )}

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
        onCreated={() => fetchProjects()}
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
        onUpdate={(p) => { handleUpdateProject(p); fetchProjects(); }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>

          {deletePopupMessage.type && (
            <div className="px-4">
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{deletePopupMessage.text}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="mt-4">
            Are you sure you want to delete <strong>{deletingProject?.name}</strong>?
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;