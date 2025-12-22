import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { projectService } from "@/services/projectService";
import { userService } from "@/services/userService";

import { Project } from '@/types/project';

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onUpdate: (updatedProject: Project) => void;
}

const editProjectSchema = yup.object().shape({
  name: yup.string().required('Project name is required'),
  description: yup.string().optional(),
  address: yup.string().required('Project address is required'),
  pincode: yup.string().matches(/^[0-9]{6}$/, 'Pincode must be 6 digits').required('Pincode is required'),
  state: yup.string().required('State is required'),
  startDate: yup.string().required('Project Start date is required'),
  dueDate: yup.string().required('Project End date is required'),
  managerId: yup.string().required('Project manager is required'),
  projectArea: yup.number().positive('Project area must be positive').required('Project area is required'),
  areaUnit: yup.string().required('Area unit is required'),
  sitePossessionStartDate: yup.string().required('Site possession start date is required'),
  sitePossessionEndDate: yup.string().required('Site clearing end date is required'),
  eventStartDate: yup.string().required('Event start date is required'),
  eventEndDate: yup.string().required('Event end date is required'),
});

const EditProjectModal: React.FC<EditProjectModalProps> = ({ open, onOpenChange, project, onUpdate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // File uploads state (similar to CreateProjectModal)
  interface FileUpload {
    file: File;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
  }

  const [files, setFiles] = useState<FileUpload[]>([]);

  const form = useForm({
    resolver: yupResolver(editProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      pincode: '',
      state: '',
      startDate: '',
      dueDate: '',
      managerId: '',
      projectArea: 0,
      areaUnit: '',
      sitePossessionStartDate: '',
      sitePossessionEndDate: '',
      eventStartDate: '',
      eventEndDate: '',
    },
  });

  // Project managers loaded from API
  const [projectManagers, setProjectManagers] = useState<Array<{ id: string; name: string }>>([]);

  // Load project managers
  useEffect(() => {
    let mounted = true;
    const loadManagers = async () => {
      try {
        const res: any = await userService.getAllUsers();
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

    return () => { mounted = false; };
  }, []);

  // Reset form when project or managers change
  useEffect(() => {
    if (!project) return;

    // Prefer managerId from project, otherwise try to match by name to get id
    let managerValue = project.managerId ?? null;
    if (!managerValue && project.manager) {
      const found = projectManagers.find(m => m.name === project.manager || m.name === String(project.manager));
      if (found) managerValue = found.id;
    }

    // Prefill form with project values (normalize dates to yyyy-mm-dd where possible)
    const normalizeDate = (d?: string) => d && !isNaN(new Date(d).getTime()) ? new Date(d).toISOString().split('T')[0] : '';

    form.reset({
      name: project.name ?? '',
      description: project.description ?? '',
      address: project.address ?? '',
      pincode: project.pincode ?? '',
      state: project.state ?? '',
      startDate: normalizeDate(project.startDate),
      dueDate: normalizeDate(project.dueDate),
      managerId: managerValue != null ? String(managerValue) : (project.managerId ? String(project.managerId) : ''),
      projectArea: project.projectArea ?? 0,
      areaUnit: project.areaUnit ?? '',
      sitePossessionStartDate: normalizeDate(project.sitePossessionStartDate),
      sitePossessionEndDate: normalizeDate(project.sitePossessionEndDate),
      eventStartDate: normalizeDate(project.eventStartDate),
      eventEndDate: normalizeDate(project.eventEndDate),
    });

    // If project has existing documents, show them as completed entries (read-only name shown)
    if (project.documents && project.documents.length > 0) {
      setFiles(project.documents.map(doc => ({ file: new File([], doc.name), progress: 100, status: 'completed' as const })));
    } else {
      setFiles([]);
    }
  }, [project, projectManagers, form]);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    selectedFiles.forEach(file => {
      const newFileUpload = {
        file,
        progress: 0,
        status: 'uploading' as const
      };

      setFiles(prev => [...prev, newFileUpload]);

      simulateFileUpload(file, (progress) => {
        setFiles(prev => prev.map(f => f.file === file ? { ...f, progress } : f));
      }, () => {
        setFiles(prev => prev.map(f => f.file === file ? { ...f, status: 'completed', progress: 100 } : f));
      });
    });
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const onSubmit = async (data: any) => {
    if (!project) return;

    setIsSubmitting(true);

    try {
      // If there are files (new or existing), send as FormData, otherwise send JSON
      const hasRealFiles = files.some(f => f.status === 'uploading' || (f.status === 'completed' && f.file.size > 0));

      let payload: any = data;

      if (hasRealFiles) {
        const formData = new FormData();
        formData.append('projectData', JSON.stringify(data));
        files.forEach((f) => {
          if (f.status === 'completed' && f.file.size > 0) formData.append('documents', f.file);
        });
        payload = formData;
      }

      const res: any = await projectService.updateProject(project.id, payload);

      // Build updated project object for local state
      const updatedProject: Project = {
        ...project,
        ...(res || {}),
        ...data,
      };

      // Map FormData response if needed — keep documents array if returned
      if (res && res.documents) {
        updatedProject.documents = res.documents;
      }

      onUpdate(updatedProject);
      onOpenChange(false);

      toast({
        title: "Success",
        description: res?.message || "Project updated successfully",
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update project';
      toast({
        title: "Error",
        description: String(msg),
        variant: "destructive",
      });
      // keep dialog open so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Name + Manager */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
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
                        {projectManagers.map((manager) => (
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
                        {[
                          { value: "sq_mtr", label: "Square Meters (sq. mtr)" },
                          { value: "sq_ft", label: "Square Feet (sq. ft)" },
                          { value: "sq_yd", label: "Square Yards (sq. yd)" },
                          { value: "acres", label: "Acres" },
                        ].map((unit) => (
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
                name="dueDate"
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

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>



            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Project"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectModal;