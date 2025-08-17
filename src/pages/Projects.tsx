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
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateProjectModal from "@/components/projects/CreateProjectModal";

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock project data
  const projects = [
    {
      id: 1,
      name: "Manufacturing System Upgrade",
      description: "Complete overhaul of the manufacturing process automation system",
      status: "In Progress",
      priority: "High",
      progress: 75,
      startDate: "2024-10-01",
      dueDate: "2024-12-15",
      teamSize: 8,
      budget: "$125,000",
      manager: "Sarah Johnson"
    },
    {
      id: 2,
      name: "Inventory Optimization",
      description: "Implementation of AI-driven inventory management system",
      status: "Planning",
      priority: "Medium",
      progress: 25,
      startDate: "2024-11-15",
      dueDate: "2025-01-10",
      teamSize: 5,
      budget: "$75,000",
      manager: "Mike Chen"
    },
    {
      id: 3,
      name: "Quality Control Implementation",
      description: "Setting up automated quality control processes",
      status: "Review",
      priority: "High",
      progress: 90,
      startDate: "2024-09-01",
      dueDate: "2024-12-01", 
      teamSize: 6,
      budget: "$95,000",
      manager: "Emily Davis"
    },
    {
      id: 4,
      name: "Supplier Integration Platform",
      description: "Digital platform for seamless supplier collaboration",
      status: "In Progress",
      priority: "Low",
      progress: 45,
      startDate: "2024-10-20",
      dueDate: "2024-12-20",
      teamSize: 4,
      budget: "$60,000",
      manager: "David Wilson"
    }
  ];

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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="glass-card hover:shadow-elegant transition-smooth">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {project.description}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Status and Priority */}
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(project.status)} className="text-xs">
                  {project.status}
                </Badge>
                <Badge variant={getPriorityColor(project.priority)} className="text-xs">
                  {project.priority}
                </Badge>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{project.teamSize} members</span>
                </div>
              </div>

              {/* Manager and Budget */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Manager: {project.manager}</span>
                  <span className="font-medium text-success">{project.budget}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Open
                </Button>
                <Button size="sm" className="flex-1">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State - shown when no projects match search */}
      {projects.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground text-center mb-6">
              Get started by creating your first project
            </p>
            <Button className="gap-2">
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
    </div>
  );
};

export default Projects;