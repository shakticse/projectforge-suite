import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Eye, Plus, MessageCircle, Calendar, User, FileText, Upload, Camera, X, Image as ImageIcon, Edit, ChevronUp, ChevronDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// Validation schema
const querySchema = yup.object().shape({
  itemType: yup.string().required("Item type is required"),
  itemId: yup.string().when("itemType", {
    is: (val: string) => val !== "others",
    then: (schema) => schema.required("Item ID is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  description: yup.string().required("Description is required").min(10, "Description must be at least 10 characters"),
  assignedTo: yup.string().required("Please assign to a user"),
  priority: yup.string().required("Priority is required"),
});

// Mock data
const itemTypes = [
  { value: "bom", label: "Bill of Materials (BOM)" },
  { value: "work-order", label: "Work Order" },
  { value: "mrn", label: "Material Receipt Note (MRN)" },
  { value: "vehicle-request", label: "Vehicle Request" },
  { value: "purchase-request", label: "Purchase Request" },
  { value: "gate-pass", label: "Gate Pass" },
  { value: "inventory", label: "Inventory" },
  { value: "others", label: "Others" },
];

const mockUsers = [
  { id: "1", name: "John Smith", email: "john@company.com" },
  { id: "2", name: "Sarah Johnson", email: "sarah@company.com" },
  { id: "3", name: "Mike Davis", email: "mike@company.com" },
  { id: "4", name: "Lisa Wilson", email: "lisa@company.com" },
];

const mockQueries = [
  {
    id: "QRY-001",
    itemType: "BOM",
    itemId: "BOM-123",
    title: "Material quantity discrepancy in BOM-123",
    description: "There's a mismatch between requested and available quantities for steel bars in BOM-123.",
    status: "Open",
    priority: "High",
    assignedTo: "John Smith",
    createdBy: "Sarah Johnson",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-16",
    comments: [
      {
        id: "1",
        user: "John Smith",
        message: "I've reviewed the BOM and found the issue. The steel bar specifications were updated but quantities weren't adjusted.",
        timestamp: "2024-01-16 10:30 AM",
      },
      {
        id: "2",
        user: "Sarah Johnson",
        message: "Thanks for the update. What's the next step to resolve this?",
        timestamp: "2024-01-16 02:15 PM",
      },
      {
        id: "3",
        user: "John Smith",
        message: "I'll coordinate with the procurement team to adjust the quantities. Expected resolution by EOD tomorrow.",
        timestamp: "2024-01-16 03:45 PM",
      },
    ],
  },
  {
    id: "QRY-002",
    itemType: "Work Order",
    itemId: "WO-456",
    title: "Delay in work order completion",
    description: "Work Order WO-456 is behind schedule due to resource constraints.",
    status: "In Progress",
    priority: "Medium",
    assignedTo: "Mike Davis",
    createdBy: "Lisa Wilson",
    createdAt: "2024-01-14",
    updatedAt: "2024-01-15",
    comments: [
      {
        id: "1",
        user: "Mike Davis",
        message: "Resource allocation has been adjusted. We should be back on track by next week.",
        timestamp: "2024-01-15 09:00 AM",
      },
    ],
  },
  {
    id: "QRY-003",
    itemType: "Others",
    itemId: "",
    title: "General system performance issue",
    description: "Users reporting slow system response during peak hours.",
    status: "Resolved",
    priority: "Low",
    assignedTo: "Sarah Johnson",
    createdBy: "John Smith",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-13",
    comments: [
      {
        id: "1",
        user: "Sarah Johnson",
        message: "Server resources have been upgraded. Performance should be improved now.",
        timestamp: "2024-01-13 04:30 PM",
      },
    ],
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Open":
      return "destructive";
    case "In Progress":
      return "default";
    case "Resolved":
      return "secondary";
    default:
      return "outline";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "destructive";
    case "Medium":
      return "default";
    case "Low":
      return "secondary";
    default:
      return "outline";
  }
};

export default function QueryIssueLog() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [queries, setQueries] = useState(mockQueries);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [editingQuery, setEditingQuery] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    itemType: "",
    assignedTo: ""
  });
  const isMobile = useIsMobile();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(querySchema),
    defaultValues: {
      itemType: "",
      itemId: "",
      description: "",
      assignedTo: "",
      priority: "",
    },
  });

  const selectedItemType = watch("itemType");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) uploaded successfully`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast.success("File removed");
  };

  const onSubmit = (data: any) => {
    const newQuery = {
      id: `QRY-${String(queries.length + 1).padStart(3, "0")}`,
      itemType: itemTypes.find(type => type.value === data.itemType)?.label || "Others",
      itemId: data.itemId || "",
      title: data.description.substring(0, 50) + (data.description.length > 50 ? "..." : ""),
      description: data.description,
      status: "Open",
      priority: data.priority,
      assignedTo: mockUsers.find(user => user.id === data.assignedTo)?.name || "",
      createdBy: "Current User",
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      comments: [],
      attachments: uploadedFiles.length,
    };

    setQueries([newQuery, ...queries]);
    toast.success("Query created successfully");
    setShowCreateForm(false);
    setUploadedFiles([]);
    reset();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !editingQuery) return;

    const updatedQueries = queries.map(query => {
      if (query.id === editingQuery.id) {
        const updatedQuery = {
          ...query,
          comments: [
            ...query.comments,
            {
              id: (query.comments.length + 1).toString(),
              user: "Current User",
              message: newComment.trim(),
              timestamp: new Date().toLocaleString(),
            }
          ],
          updatedAt: new Date().toISOString().split('T')[0],
        };
        setEditingQuery(updatedQuery);
        return updatedQuery;
      }
      return query;
    });

    setQueries(updatedQueries);
    setNewComment("");
    toast.success("Comment added successfully");
  };

  const filteredAndSortedQueries = queries
    .filter(query => {
      return (
        (!filters.status || query.status === filters.status) &&
        (!filters.priority || query.priority === filters.priority) &&
        (!filters.itemType || query.itemType === filters.itemType) &&
        (!filters.assignedTo || query.assignedTo === filters.assignedTo)
      );
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === "createdAt" || sortField === "updatedAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  return (
    <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Query/Issue Log</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage and track queries and issues across different modules
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Create Query
        </Button>
      </div>

      {/* Create Query Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Query</CardTitle>
            <CardDescription>
              Raise a query or issue for tracking and resolution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item Type */}
                <div className="space-y-2">
                  <Label htmlFor="itemType">Item Type *</Label>
                  <Select onValueChange={(value) => setValue("itemType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.itemType && (
                    <p className="text-sm text-destructive">{errors.itemType.message}</p>
                  )}
                </div>

                {/* Item ID - Only show if not "Others" */}
                {selectedItemType && selectedItemType !== "others" && (
                  <div className="space-y-2">
                    <Label htmlFor="itemId">Item ID *</Label>
                    <Input
                      id="itemId"
                      placeholder="Enter item ID (e.g., BOM-123, WO-456)"
                      {...register("itemId")}
                    />
                    {errors.itemId && (
                      <p className="text-sm text-destructive">{errors.itemId.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the query or issue in detail..."
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      {isMobile && <Camera className="h-8 w-8 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {isMobile ? "Upload files or capture using camera" : "Upload files"}
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf,.doc,.docx,.txt"
                        capture={isMobile ? "environment" : undefined}
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        {isMobile ? "Choose Files / Camera" : "Choose Files"}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* File Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files ({uploadedFiles.length})</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assigned To */}
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assign To *</Label>
                  <Select onValueChange={(value) => setValue("assignedTo", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.assignedTo && (
                    <p className="text-sm text-destructive">{errors.assignedTo.message}</p>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select onValueChange={(value) => setValue("priority", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className="text-sm text-destructive">{errors.priority.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">Create Query</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Queries List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Queries</CardTitle>
          <CardDescription>
            View and manage all submitted queries and issues
          </CardDescription>
          
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            <Select onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            
            <Select onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select onValueChange={(value) => setFilters(prev => ({ ...prev, itemType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="BOM">BOM</SelectItem>
                <SelectItem value="Work Order">Work Order</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
            
            <Select onValueChange={(value) => setFilters(prev => ({ ...prev, assignedTo: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Assignees</SelectItem>
                {mockUsers.map((user) => (
                  <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            /* Mobile View - Cards */
            <div className="space-y-4">
              {filteredAndSortedQueries.map((query) => (
                <Card key={query.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-sm">{query.id}</h3>
                        <p className="text-xs text-muted-foreground">{query.itemType}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getStatusColor(query.status)} className="text-xs">
                          {query.status}
                        </Badge>
                        <Badge variant={getPriorityColor(query.priority)} className="text-xs">
                          {query.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium line-clamp-2">{query.title}</p>
                      {query.itemId && (
                        <p className="text-xs text-muted-foreground mt-1">Item ID: {query.itemId}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Assigned to: {query.assignedTo}</span>
                      <span>{query.createdAt}</span>
                    </div>
                    
                    <div className="flex justify-end">
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedQuery(query)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent className="max-h-[80vh]">
                          <DrawerHeader>
                            <DrawerTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              {selectedQuery?.id} - {selectedQuery?.title}
                            </DrawerTitle>
                            <DrawerDescription>
                              Query details and conversation history
                            </DrawerDescription>
                          </DrawerHeader>
                          <ScrollArea className="max-h-[60vh] px-4">
                            <div className="space-y-6 pb-4">
                              {/* Query Details */}
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Item Type</Label>
                                    <p className="text-sm text-muted-foreground">{selectedQuery?.itemType}</p>
                                  </div>
                                  {selectedQuery?.itemId && (
                                    <div>
                                      <Label className="text-sm font-medium">Item ID</Label>
                                      <p className="text-sm text-muted-foreground">{selectedQuery?.itemId}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <div className="mt-1">
                                      <Badge variant={getStatusColor(selectedQuery?.status)}>
                                        {selectedQuery?.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Priority</Label>
                                    <div className="mt-1">
                                      <Badge variant={getPriorityColor(selectedQuery?.priority)}>
                                        {selectedQuery?.priority}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Assigned To</Label>
                                  <p className="text-sm text-muted-foreground">{selectedQuery?.assignedTo}</p>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Description</Label>
                                  <p className="text-sm text-muted-foreground mt-1">{selectedQuery?.description}</p>
                                </div>
                              </div>

                              <Separator />

                              {/* Comments Section */}
                              <div className="space-y-4">
                                <h3 className="font-medium flex items-center gap-2">
                                  <MessageCircle className="h-4 w-4" />
                                  Comments & Updates ({selectedQuery?.comments?.length || 0})
                                </h3>
                                
                                {selectedQuery?.comments?.length === 0 ? (
                                  <p className="text-sm text-muted-foreground italic">No comments yet.</p>
                                ) : (
                                  <div className="space-y-4">
                                    {selectedQuery?.comments?.map((comment: any) => (
                                      <div key={comment.id} className="border rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                          <User className="h-4 w-4" />
                                          <span className="font-medium">{comment.user}</span>
                                          <Calendar className="h-4 w-4 ml-2" />
                                          <span className="text-muted-foreground">{comment.timestamp}</span>
                                        </div>
                                        <p className="text-sm">{comment.message}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </ScrollArea>
                        </DrawerContent>
                      </Drawer>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Desktop View - Table */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center gap-1">
                      Query ID
                      {sortField === "id" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("itemType")}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      {sortField === "itemType" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Item ID</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-1">
                      Title
                      {sortField === "title" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === "status" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("priority")}
                  >
                    <div className="flex items-center gap-1">
                      Priority
                      {sortField === "priority" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("assignedTo")}
                  >
                    <div className="flex items-center gap-1">
                      Assigned To
                      {sortField === "assignedTo" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      {sortField === "createdAt" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedQueries.map((query) => (
                  <TableRow key={query.id}>
                    <TableCell className="font-medium">{query.id}</TableCell>
                    <TableCell>{query.itemType}</TableCell>
                    <TableCell>{query.itemId || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{query.title}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(query.status)}>
                        {query.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(query.priority)}>
                        {query.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{query.assignedTo}</TableCell>
                    <TableCell>{query.createdAt}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedQuery(query)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              {selectedQuery?.id} - {selectedQuery?.title}
                            </DialogTitle>
                            <DialogDescription>
                              Query details and conversation history
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-6">
                              {/* Query Details */}
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Item Type</Label>
                                    <p className="text-sm text-muted-foreground">{selectedQuery?.itemType}</p>
                                  </div>
                                  {selectedQuery?.itemId && (
                                    <div>
                                      <Label className="text-sm font-medium">Item ID</Label>
                                      <p className="text-sm text-muted-foreground">{selectedQuery?.itemId}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <div className="mt-1">
                                      <Badge variant={getStatusColor(selectedQuery?.status)}>
                                        {selectedQuery?.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Priority</Label>
                                    <div className="mt-1">
                                      <Badge variant={getPriorityColor(selectedQuery?.priority)}>
                                        {selectedQuery?.priority}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Assigned To</Label>
                                    <p className="text-sm text-muted-foreground">{selectedQuery?.assignedTo}</p>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Description</Label>
                                  <p className="text-sm text-muted-foreground mt-1">{selectedQuery?.description}</p>
                                </div>
                              </div>

                              <Separator />

                              {/* Comments Section */}
                              <div className="space-y-4">
                                <h3 className="font-medium flex items-center gap-2">
                                  <MessageCircle className="h-4 w-4" />
                                  Comments & Updates ({selectedQuery?.comments?.length || 0})
                                </h3>
                                
                                {selectedQuery?.comments?.length === 0 ? (
                                  <p className="text-sm text-muted-foreground italic">No comments yet.</p>
                                ) : (
                                  <div className="space-y-4">
                                    {selectedQuery?.comments?.map((comment: any) => (
                                      <div key={comment.id} className="border rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                          <User className="h-4 w-4" />
                                          <span className="font-medium">{comment.user}</span>
                                          <Calendar className="h-4 w-4 ml-2" />
                                          <span className="text-muted-foreground">{comment.timestamp}</span>
                                        </div>
                                        <p className="text-sm">{comment.message}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingQuery(query)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Edit className="h-5 w-5" />
                              Add Comment - {editingQuery?.id}
                            </DialogTitle>
                            <DialogDescription>
                              Add a comment to this query
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-4">
                              {/* Query Details */}
                              <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium mb-2">{editingQuery?.title}</h4>
                                <p className="text-sm text-muted-foreground">{editingQuery?.description}</p>
                                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                                  <span>Status: <Badge variant={getStatusColor(editingQuery?.status || "")} className="text-xs">{editingQuery?.status}</Badge></span>
                                  <span>Priority: <Badge variant={getPriorityColor(editingQuery?.priority || "")} className="text-xs">{editingQuery?.priority}</Badge></span>
                                  <span>Assigned to: {editingQuery?.assignedTo}</span>
                                </div>
                              </div>

                              {/* Previous Comments */}
                              {editingQuery?.comments && editingQuery.comments.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="font-medium flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    Previous Comments ({editingQuery.comments.length})
                                  </h4>
                                  {editingQuery.comments.map((comment: any) => (
                                    <div key={comment.id} className="p-3 bg-muted/50 rounded-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium text-sm">{comment.user}</span>
                                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                                      </div>
                                      <p className="text-sm">{comment.message}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add New Comment */}
                              <div className="space-y-3">
                                <h4 className="font-medium">Add New Comment</h4>
                                <Textarea
                                  placeholder="Type your comment here..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  rows={4}
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                  >
                                    Add Comment
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      setEditingQuery(null);
                                      setNewComment("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}