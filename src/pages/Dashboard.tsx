import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Package,
  FolderOpen,
  Users,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Plus
} from "lucide-react";

const Dashboard = () => {
  // Mock data for dashboard
  const stats = [
    {
      title: "Active Projects",
      value: "12",
      change: "+2.5%",
      icon: FolderOpen,
      color: "text-primary"
    },
    {
      title: "Inventory Items",
      value: "1,247",
      change: "+12.3%", 
      icon: Package,
      color: "text-success"
    },
    {
      title: "Active Users",
      value: "48",
      change: "+5.1%",
      icon: Users,
      color: "text-warning"
    },
    {
      title: "Pending Orders",
      value: "23",
      change: "-8.2%",
      icon: AlertCircle,
      color: "text-destructive"
    }
  ];

  const recentProjects = [
    { name: "Manufacturing System Upgrade", status: "In Progress", progress: 75, dueDate: "Dec 15" },
    { name: "Inventory Optimization", status: "Planning", progress: 25, dueDate: "Jan 10" },
    { name: "Quality Control Implementation", status: "Review", progress: 90, dueDate: "Dec 1" },
    { name: "Supplier Integration", status: "In Progress", progress: 45, dueDate: "Dec 20" }
  ];

  const alerts = [
    { type: "warning", message: "Low stock alert: 5 items below minimum threshold" },
    { type: "info", message: "New vendor registration pending approval" },
    { type: "success", message: "Project milestone completed ahead of schedule" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs text-success font-medium">{stat.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Recent Projects</CardTitle>
            <Button variant="ghost" size="sm" className="gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.map((project, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-smooth">
                <div className="flex-1">
                  <h4 className="font-medium">{project.name}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge 
                      variant={project.status === "In Progress" ? "default" : project.status === "Review" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {project.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Due {project.dueDate}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl">Alerts & Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                <div className={`p-1 rounded-full ${
                  alert.type === "warning" ? "bg-warning/20" :
                  alert.type === "success" ? "bg-success/20" : "bg-primary/20"
                }`}>
                  {alert.type === "warning" ? (
                    <AlertCircle className="h-4 w-4 text-warning" />
                  ) : alert.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full mt-4">
              View All Notifications
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;