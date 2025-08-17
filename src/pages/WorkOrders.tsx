import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Search, ClipboardList, Calendar, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { workOrderSchema } from "@/lib/validations";

interface WorkOrder {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  assignedTo: string;
  assigneeName: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Planned' | 'In Progress' | 'Completed' | 'On Hold';
  dueDate: string;
  createdDate: string;
}

const mockWorkOrders: WorkOrder[] = [
  {
    id: "1",
    projectId: "proj-1",
    projectName: "Office Building Construction",
    title: "Install Electrical Wiring",
    description: "Install main electrical wiring for floors 1-3",
    assignedTo: "user-1",
    assigneeName: "John Smith",
    priority: "High",
    status: "In Progress",
    dueDate: "2024-02-15",
    createdDate: "2024-01-15"
  },
  {
    id: "2",
    projectId: "proj-2",
    projectName: "Residential Complex",
    title: "Plumbing Installation",
    description: "Install water supply and drainage systems",
    assignedTo: "user-2",
    assigneeName: "Sarah Johnson",
    priority: "Medium",
    status: "Planned",
    dueDate: "2024-02-28",
    createdDate: "2024-01-20"
  }
];

export default function WorkOrders() {
  const [workOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: yupResolver(workOrderSchema),
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
      assignedTo: "",
      priority: "Medium",
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      console.log("Creating work order:", data);
      toast.success("Work order created successfully!");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to create work order");
    }
  };

  const filteredWorkOrders = workOrders.filter(wo =>
    wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'In Progress': return 'default';
      case 'Planned': return 'secondary';
      case 'On Hold': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">Manage manufacturing and construction work orders</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Work Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Work Order</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="proj-1">Office Building Construction</SelectItem>
                          <SelectItem value="proj-2">Residential Complex</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Install Electrical Wiring" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detailed description of the work to be done" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user-1">John Smith</SelectItem>
                          <SelectItem value="user-2">Sarah Johnson</SelectItem>
                          <SelectItem value="user-3">Mike Wilson</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
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
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Work Order</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search work orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredWorkOrders.map((workOrder) => (
          <Card key={workOrder.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{workOrder.title}</CardTitle>
                </div>
                <div className="flex space-x-2">
                  <Badge variant={getPriorityColor(workOrder.priority) as any}>
                    {workOrder.priority}
                  </Badge>
                  <Badge variant={getStatusColor(workOrder.status) as any}>
                    {workOrder.status}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{workOrder.projectName}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{workOrder.description}</p>
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Assigned to: {workOrder.assigneeName}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Due: {new Date(workOrder.dueDate).toLocaleDateString()}</span>
              </div>
              
              {workOrder.priority === 'Critical' || workOrder.priority === 'High' ? (
                <div className="flex items-center space-x-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>High priority work order</span>
                </div>
              ) : null}
              
              <div className="text-sm text-muted-foreground">
                <strong>Created:</strong> {new Date(workOrder.createdDate).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}