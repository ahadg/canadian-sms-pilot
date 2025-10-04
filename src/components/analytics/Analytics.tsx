import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Signal,
  AlertTriangle,
} from "lucide-react";

interface AnalyticsData {
  totalMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  deliveryRate: number;
  totalCost: number;
  avgCostPerMessage: number;
  uniqueRecipients: number;
  campaignCount: number;
}

interface DailyStats {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
  cost: number;
}

interface CarrierStats {
  carrier: string;
  messages: number;
  deliveryRate: number;
  avgDelay: number;
  status: "excellent" | "good" | "warning" | "poor";
}

interface DevicePerformance {
  deviceId: string;
  deviceName: string;
  messagesSent: number;
  successRate: number;
  averageSpeed: number;
  errors: number;
}

const mockAnalytics: AnalyticsData = {
  totalMessages: 1284567,
  deliveredMessages: 1261234,
  failedMessages: 23333,
  deliveryRate: 98.2,
  totalCost: 15420.75,
  avgCostPerMessage: 0.012,
  uniqueRecipients: 156789,
  campaignCount: 47,
};

const mockDailyStats: DailyStats[] = [
  { date: "2024-11-09", sent: 15420, delivered: 15156, failed: 264, cost: 185.04 },
  { date: "2024-11-10", sent: 18750, delivered: 18312, failed: 438, cost: 225.00 },
  { date: "2024-11-11", sent: 22340, delivered: 21934, failed: 406, cost: 268.08 },
  { date: "2024-11-12", sent: 19580, delivered: 19234, failed: 346, cost: 234.96 },
  { date: "2024-11-13", sent: 21450, delivered: 21089, failed: 361, cost: 257.40 },
  { date: "2024-11-14", sent: 24680, delivered: 24259, failed: 421, cost: 296.16 },
  { date: "2024-11-15", sent: 26890, delivered: 26445, failed: 445, cost: 322.68 },
];

const mockCarrierStats: CarrierStats[] = [
  {
    carrier: "Rogers",
    messages: 456789,
    deliveryRate: 98.7,
    avgDelay: 2.3,
    status: "excellent",
  },
  {
    carrier: "Bell",
    messages: 387234,
    deliveryRate: 97.9,
    avgDelay: 3.1,
    status: "excellent",
  },
  {
    carrier: "Telus",
    messages: 324567,
    deliveryRate: 98.1,
    avgDelay: 2.8,
    status: "excellent",
  },
  {
    carrier: "Freedom",
    messages: 89234,
    deliveryRate: 94.2,
    avgDelay: 5.7,
    status: "warning",
  },
  {
    carrier: "Others",
    messages: 26743,
    deliveryRate: 91.5,
    avgDelay: 8.2,
    status: "poor",
  },
];

const mockDevicePerformance: DevicePerformance[] = [
  {
    deviceId: "ejoin-001",
    deviceName: "Toronto Gateway",
    messagesSent: 567890,
    successRate: 98.5,
    averageSpeed: 245,
    errors: 12,
  },
  {
    deviceId: "ejoin-002",
    deviceName: "Vancouver Gateway",
    messagesSent: 456234,
    successRate: 97.8,
    averageSpeed: 198,
    errors: 23,
  },
  {
    deviceId: "ejoin-003",
    deviceName: "Montreal Gateway",
    messagesSent: 260443,
    successRate: 98.9,
    averageSpeed: 267,
    errors: 8,
  },
];

export function Analytics() {
  const getCarrierStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "good":
        return <CheckCircle className="h-4 w-4 text-info" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "poor":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCarrierStatusBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Excellent</Badge>;
      case "good":
        return <Badge variant="secondary" className="bg-info/10 text-info border-info/20">Good</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Warning</Badge>;
      case "poor":
        return <Badge variant="destructive">Poor</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your SMS campaign performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {/* <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button> */}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{mockAnalytics.totalMessages.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-xs text-success">+12.5% vs last month</span>
                </div>
              </div>
              <Send className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold">{mockAnalytics.deliveryRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-xs text-success">+1.3% vs last month</span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">${mockAnalytics.totalCost.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-success" />
                  <span className="text-xs text-success">-5.2% vs last month</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Recipients</p>
                <p className="text-2xl font-bold">{mockAnalytics.uniqueRecipients.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-xs text-success">+8.7% vs last month</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="carriers">Carrier Performance</TabsTrigger>
          <TabsTrigger value="devices">Device Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Daily Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Performance (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDailyStats.map((day, index) => (
                  <div key={day.date} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Sent: {day.sent.toLocaleString()}</span>
                        <span>Delivered: {day.delivered.toLocaleString()}</span>
                        <span>Failed: {day.failed.toLocaleString()}</span>
                        <span>Cost: ${day.cost.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={(day.delivered / day.sent) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Delivery Rate: {((day.delivered / day.sent) * 100).toFixed(1)}%</span>
                        <span>Avg Cost/SMS: ${(day.cost / day.sent).toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Message Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Delivered</span>
                  <span className="text-sm font-medium text-success">
                    {mockAnalytics.deliveredMessages.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Failed</span>
                  <span className="text-sm font-medium text-destructive">
                    {mockAnalytics.failedMessages.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Pending</span>
                  <span className="text-sm font-medium text-warning">2,547</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Avg Cost/Message</span>
                  <span className="text-sm font-medium">${mockAnalytics.avgCostPerMessage.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Monthly Budget</span>
                  <span className="text-sm font-medium">$25,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Budget Used</span>
                  <span className="text-sm font-medium text-warning">61.7%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total Campaigns</span>
                  <span className="text-sm font-medium">{mockAnalytics.campaignCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active</span>
                  <span className="text-sm font-medium text-success">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Completed</span>
                  <span className="text-sm font-medium">42</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signal className="h-5 w-5" />
                Carrier Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Messages Sent</TableHead>
                      <TableHead>Delivery Rate</TableHead>
                      <TableHead>Avg Delay (seconds)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Market Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCarrierStats.map((carrier) => (
                      <TableRow key={carrier.carrier}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCarrierStatusIcon(carrier.status)}
                            <span className="font-medium">{carrier.carrier}</span>
                          </div>
                        </TableCell>
                        <TableCell>{carrier.messages.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{carrier.deliveryRate}%</span>
                            <Progress value={carrier.deliveryRate} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>{carrier.avgDelay}s</TableCell>
                        <TableCell>{getCarrierStatusBadge(carrier.status)}</TableCell>
                        <TableCell>
                          {((carrier.messages / mockAnalytics.totalMessages) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signal className="h-5 w-5" />
                Device Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Messages Sent</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Avg Speed (msgs/hour)</TableHead>
                      <TableHead>Error Count</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDevicePerformance.map((device) => (
                      <TableRow key={device.deviceId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{device.deviceName}</div>
                            <div className="text-xs text-muted-foreground">{device.deviceId}</div>
                          </div>
                        </TableCell>
                        <TableCell>{device.messagesSent.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{device.successRate}%</span>
                            <Progress value={device.successRate} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>{device.averageSpeed.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={device.errors > 15 ? "destructive" : device.errors > 5 ? "secondary" : "secondary"} 
                                 className={device.errors <= 5 ? "bg-success/10 text-success border-success/20" : ""}>
                            {device.errors}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {device.successRate >= 98 ? (
                            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Excellent</Badge>
                          ) : device.successRate >= 95 ? (
                            <Badge variant="secondary" className="bg-info/10 text-info border-info/20">Good</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Needs Attention</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Canadian Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Daily SMS Limit per SIM</p>
                    <p className="text-sm text-muted-foreground">Max 300 messages/day</p>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    Compliant
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Hourly Rate Limiting</p>
                    <p className="text-sm text-muted-foreground">Max 100 messages/hour</p>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    Compliant
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Opt-out Compliance</p>
                    <p className="text-sm text-muted-foreground">STOP keyword handling</p>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Message Content Review</p>
                    <p className="text-sm text-muted-foreground">AI spam detection</p>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Compliance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border-l-4 border-l-success bg-success/5 rounded">
                  <p className="text-sm font-medium">All systems compliant</p>
                  <p className="text-xs text-muted-foreground">No compliance issues detected in the last 30 days</p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recent Compliance Actions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-success rounded-full"></div>
                      <span className="text-muted-foreground">15:30 - Auto-rotated 45 SIM cards to prevent rate limiting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-info rounded-full"></div>
                      <span className="text-muted-foreground">14:15 - Processed 23 STOP requests automatically</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-warning rounded-full"></div>
                      <span className="text-muted-foreground">12:45 - Rate limit warning: Device ejoin-002 approaching limit</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-success">99.8%</p>
                  <p className="text-sm text-muted-foreground">Compliance Rate</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-sm text-muted-foreground">Auto Opt-outs</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Violations</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold">2.3s</p>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}