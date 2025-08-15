import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, FileText, Download, Calendar, TrendingUp, Package, Users, Building2 } from "lucide-react";

interface Report {
  id: string;
  name: string;
  type: 'Inventory' | 'Projects' | 'Financial' | 'Users' | 'Vendors';
  description: string;
  lastGenerated: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  status: 'Active' | 'Scheduled' | 'Draft';
}

const mockReports: Report[] = [
  {
    id: "RPT-001",
    name: "Inventory Level Report",
    type: "Inventory",
    description: "Current stock levels and low inventory alerts",
    lastGenerated: "2024-01-20",
    frequency: "Daily",
    status: "Active"
  },
  {
    id: "RPT-002",
    name: "Project Progress Summary",
    type: "Projects",
    description: "Overview of all project statuses and milestones",
    lastGenerated: "2024-01-19",
    frequency: "Weekly",
    status: "Active"
  },
  {
    id: "RPT-003",
    name: "Financial Summary",
    type: "Financial",
    description: "Revenue, expenses, and budget analysis",
    lastGenerated: "2024-01-15",
    frequency: "Monthly",
    status: "Active"
  },
  {
    id: "RPT-004",
    name: "User Activity Report",
    type: "Users",
    description: "User login patterns and system usage",
    lastGenerated: "2024-01-18",
    frequency: "Weekly",
    status: "Scheduled"
  },
  {
    id: "RPT-005",
    name: "Vendor Performance",
    type: "Vendors",
    description: "Vendor delivery times and quality metrics",
    lastGenerated: "2024-01-10",
    frequency: "Monthly",
    status: "Draft"
  }
];

const reportStats = [
  {
    title: "Total Reports",
    value: "24",
    change: "+2",
    changeType: "positive" as const,
    icon: FileText
  },
  {
    title: "Active Reports",
    value: "18",
    change: "+1",
    changeType: "positive" as const,
    icon: BarChart3
  },
  {
    title: "Generated Today",
    value: "7",
    change: "0",
    changeType: "neutral" as const,
    icon: TrendingUp
  },
  {
    title: "Scheduled",
    value: "3",
    change: "-1",
    changeType: "negative" as const,
    icon: Calendar
  }
];

export default function Reports() {
  const [reports] = useState<Report[]>(mockReports);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || report.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Inventory': return Package;
      case 'Projects': return FileText;
      case 'Financial': return TrendingUp;
      case 'Users': return Users;
      case 'Vendors': return Building2;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Scheduled': return 'secondary';
      case 'Draft': return 'outline';
      default: return 'secondary';
    }
  };

  const generateReport = (reportId: string) => {
    console.log("Generating report:", reportId);
    // TODO: Implement report generation
  };

  const downloadReport = (reportId: string) => {
    console.log("Downloading report:", reportId);
    // TODO: Implement report download
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate and manage business reports</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Create Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 
                'text-muted-foreground'
              }`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="Inventory">Inventory</SelectItem>
            <SelectItem value="Projects">Projects</SelectItem>
            <SelectItem value="Financial">Financial</SelectItem>
            <SelectItem value="Users">Users</SelectItem>
            <SelectItem value="Vendors">Vendors</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredReports.map((report) => {
          const TypeIcon = getTypeIcon(report.type);
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <TypeIcon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                  </div>
                  <Badge variant={getStatusColor(report.status) as any}>
                    {report.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium">{report.type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency:</span>
                    <p className="font-medium">{report.frequency}</p>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="text-muted-foreground">Last Generated:</span>
                  <p className="font-medium">{new Date(report.lastGenerated).toLocaleDateString()}</p>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateReport(report.id)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReport(report.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}