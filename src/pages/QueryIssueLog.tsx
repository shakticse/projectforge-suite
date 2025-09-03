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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Eye, Plus, MessageCircle, Calendar, User, FileText } from "lucide-react";
import { toast } from "sonner";

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
    };

    setQueries([newQuery, ...queries]);
    toast.success("Query created successfully");
    setShowCreateForm(false);
    reset();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Query/Issue Log</h1>
          <p className="text-muted-foreground">
            Manage and track queries and issues across different modules
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Query ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Item ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queries.map((query) => (
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}