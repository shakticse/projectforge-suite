import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { projectService } from "@/services/projectService";
import { userService } from "@/services/userService";

const projectSchema = yup.object({
  projectName: yup.string().required('Project name is required'),
  description: yup.string().optional(),
  address: yup.string().required('Project address is required'),
  pincode: yup.string()
    .matches(/^[0-9]{6}$/, 'Pincode must be 6 digits')
    .required('Pincode is required'),
  state: yup.string().required('State is required'),
  startDate: yup.string().required('Project Start date is required'),
  endDate: yup.string().required('Project End date is required'),
  managerId: yup.string().required('Project manager is required'),
  projectArea: yup.number().positive('Project area must be positive').required('Project area is required'),
  areaUnit: yup.string().required('Area unit is required'),
  sitePossessionStartDate: yup.string().required('Site possession start date is required'),
  sitePossessionEndDate: yup.string().required('Site clearing end date is required'),
  eventStartDate: yup.string().required('Event start date is required'),
  eventEndDate: yup.string().required('Event end date is required'),
});

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (project?: any) => void;
}

interface FileUpload {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onOpenChange, onCreated }) => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Project managers loaded from API
  const [projectManagers, setProjectManagers] = useState<Array<{ id: string; name: string }>>([]);

  // All users (for project team multi-select)
  const [usersList, setUsersList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [teamSearch, setTeamSearch] = useState<string>("");

  // Load users to populate manager dropdown
  useEffect(() => {
    let mounted = true;
    const loadManagers = async () => {
      try {
        const res: any = await userService.getAllManagers();
        const mapped = (res || []).map((u: any) => ({
          id: String(u.id ?? u.userId ?? u.UserId ?? u.id),
          name: `${u.firstName ?? u.first_name ?? ''}${(u.lastName ?? u.last_name) ? ' ' + (u.lastName ?? u.last_name) : ''}`.trim() || u.name || u.email || ''
        }));
        if (mounted) setProjectManagers(mapped);
      } catch (err) {
        console.warn('Failed to load project managers', err);
      }
    };

    loadManagers();
    // also load all users for team selection
    const loadUsers = async () => {
      try {
        const res: any = await userService.getAllUsers();
        const mapped = (res || []).map((u: any) => ({
          id: String(u.id ?? u.userId ?? u.UserId ?? u.id),
          name: `${u.firstName ?? u.first_name ?? ''}${(u.lastName ?? u.last_name) ? ' ' + (u.lastName ?? u.last_name) : ''}`.trim() || u.name || u.email || ''
        }));
        if (mounted) setUsersList(mapped);
      } catch (err) {
        console.warn('Failed to load users for team selection', err);
      }
    };

    loadUsers();
    return () => { mounted = false; };
  }, []);

  // Area unit options
  const areaUnits = [
    { value: "sq_mtr", label: "Square Meters (sq. mtr)" },
    { value: "sq_ft", label: "Square Feet (sq. ft)" },
    { value: "sq_yd", label: "Square Yards (sq. yd)" },
    { value: "acres", label: "Acres" },
    // { value: "hectares", label: "Hectares" },
  ];

  const form = useForm({
    resolver: yupResolver(projectSchema),
    defaultValues: {
      projectName: "",
      description: "",
      address: "",
      pincode: "",
      state: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      managerId: "",
      projectArea: 0,
      areaUnit: "",
      sitePossessionStartDate: new Date().toISOString().split('T')[0],
      sitePossessionEndDate: new Date().toISOString().split('T')[0],
      eventStartDate: new Date().toISOString().split('T')[0],
      eventEndDate: new Date().toISOString().split('T')[0],
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    selectedFiles.forEach(file => {
      const newFileUpload: FileUpload = {
        file,
        progress: 0,
        status: 'uploading'
      };
      
      setFiles(prev => [...prev, newFileUpload]);
      
      // Simulate file upload with progress
      simulateFileUpload(file, (progress) => {
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, progress } : f
        ));
      }, () => {
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, status: 'completed', progress: 100 } : f
        ));
      });
    });
  };

  const simulateFileUpload = (
    file: File, 
    onProgress: (progress: number) => void,
    onComplete: () => void
  ) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onComplete();
      }
      onProgress(progress);
    }, 200);
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Create FormData for file uploads and map form field projectName -> name for backend
      const payload = { ...data };
      // include selected team as array (teamIds)
      if (selectedTeam.length > 0) payload.teamIds = selectedTeam;

      // If there are files, send FormData with JSON under 'projectData', otherwise send JSON
      const hasFiles = files.some(f => f.status === 'completed' && f.file.size > 0);
      let res: any;

      if (hasFiles) {
        const formData = new FormData();
        formData.append('projectData', JSON.stringify(payload));
        files.forEach((fileUpload) => {
          if (fileUpload.status === 'completed') {
            formData.append('documents', fileUpload.file);
          }
        });
        // API call to create project via service (send FormData)
        res = await projectService.createProject(formData);
      } else {
        res = await projectService.createProject(payload);
      }

      toast.success("Project created successfully!");
      // notify parent (so it can refresh) and close
      if (typeof onCreated === 'function') onCreated(res);
      onOpenChange(false);
      form.reset();
      setFiles([]);
      setSelectedTeam([]);
    } catch (error: any) {
      console.error("Error creating project:", error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to create project';
      toast.error(String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the project details to create a new project
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Manager</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project manager" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="p-2">
                          <input
                            placeholder="Search managers..."
                            value={teamSearch}
                            onChange={(e) => setTeamSearch(e.target.value)}
                            className="w-full px-2 py-1 rounded border border-border text-sm mb-2"
                          />
                        </div>
                        {projectManagers
                          .filter(m => !teamSearch || m.name.toLowerCase().includes(teamSearch.toLowerCase()))
                          .map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Project Team multi-select (searchable) */}
              <div className="col-span-1 md:col-span-2">
                <FormLabel>Project Team</FormLabel>
                <div>
                  <Select onValueChange={(val: string) => {
                    if (!val) return;
                    setSelectedTeam(prev => prev.includes(val) ? prev : [...prev, val]);
                  }}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Add team members" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="p-2">
                        <input
                          placeholder="Search users..."
                          value={teamSearch}
                          onChange={(e) => setTeamSearch(e.target.value)}
                          className="w-full px-2 py-1 rounded border border-border text-sm mb-2"
                        />
                      </div>
                      {usersList
                        .filter(u => !teamSearch || u.name.toLowerCase().includes(teamSearch.toLowerCase()))
                        .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedTeam.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedTeam.map((userId) => {
                        const u = usersList.find(x => x.id === userId);
                        const name = u?.name || userId;
                        return (
                          <Badge key={userId} variant="secondary" className="flex items-center gap-2">
                            <span className="text-sm">{name}</span>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setSelectedTeam(prev => prev.filter(id => id !== userId))}>
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project description" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter complete address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter state" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter 6-digit pincode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Project Area Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Area</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter project area"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="areaUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select area unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {areaUnits.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Site Possession Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sitePossessionStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Possession Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sitePossessionEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Clearing End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="eventStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <FormLabel>Project Documents</FormLabel>
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Drop files here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports: PDF, DOC, DOCX, XLS, XLSX (Max 10MB each)
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Choose Files
                  </Button>
                </div>
              </div>

              {/* File List with Progress */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((fileUpload, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {fileUpload.file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({(fileUpload.file.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(fileUpload.file)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {fileUpload.status === 'uploading' && (
                          <div className="space-y-1">
                            <Progress value={fileUpload.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              Uploading... {Math.round(fileUpload.progress)}%
                            </p>
                          </div>
                        )}
                        
                        {fileUpload.status === 'completed' && (
                          <p className="text-xs text-success">Upload completed</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;