import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Send,
  Plus,
  Play,
  Pause,
  Square,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Upload,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed" | "scheduled";
  totalContacts: number;
  sentMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  scheduledDate?: string;
  createdDate: string;
  messagePreview: string;
}

interface ContactList {
  id: string;
  name: string;
  totalContacts: number;
  optedIn: number;
  lastUpdated: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: "camp-001",
    name: "Black Friday Promo",
    status: "active",
    totalContacts: 15000,
    sentMessages: 7245,
    deliveredMessages: 7156,
    failedMessages: 89,
    createdDate: "2024-11-15",
    messagePreview: "🔥 BLACK FRIDAY: 50% OFF everything! Limited time offer...",
  },
  {
    id: "camp-002", 
    name: "Product Update",
    status: "paused",
    totalContacts: 8500,
    sentMessages: 2156,
    deliveredMessages: 2089,
    failedMessages: 67,
    createdDate: "2024-11-14",
    messagePreview: "Exciting news! Our latest product update includes...",
  },
  {
    id: "camp-003",
    name: "Welcome Series",
    status: "active", 
    totalContacts: 3200,
    sentMessages: 892,
    deliveredMessages: 876,
    failedMessages: 16,
    createdDate: "2024-11-13",
    messagePreview: "Welcome to our platform! Here's what you need to know...",
  },
  {
    id: "camp-004",
    name: "Holiday Greetings",
    status: "scheduled",
    totalContacts: 25000,
    sentMessages: 0,
    deliveredMessages: 0,
    failedMessages: 0,
    scheduledDate: "2024-12-24",
    createdDate: "2024-11-12",
    messagePreview: "🎄 Season's Greetings from our team! Wishing you...",
  },
];

const mockContactLists: ContactList[] = [
  {
    id: "list-001",
    name: "Premium Customers",
    totalContacts: 15420,
    optedIn: 14891,
    lastUpdated: "2024-11-15",
  },
  {
    id: "list-002",
    name: "Newsletter Subscribers", 
    totalContacts: 32150,
    optedIn: 31205,
    lastUpdated: "2024-11-14",
  },
  {
    id: "list-003",
    name: "New Signups",
    totalContacts: 5670,
    optedIn: 5234,
    lastUpdated: "2024-11-15",
  },
];

export function CampaignManagement() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Active</Badge>;
      case "paused":
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Paused</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-info/10 text-info border-info/20">Completed</Badge>;
      case "scheduled":
        return <Badge variant="outline">Scheduled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDeliveryRate = (campaign: Campaign) => {
    if (campaign.sentMessages === 0) return 0;
    return (campaign.deliveredMessages / campaign.sentMessages) * 100;
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and monitor your SMS campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Contacts
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-primary shadow-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New SMS Campaign</DialogTitle>
                <DialogDescription>
                  Set up a new SMS campaign with your target audience and message
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input id="campaignName" placeholder="Winter Sale 2024" />
                  </div>
                  <div>
                    <Label htmlFor="contactList">Contact List</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact list" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockContactLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.name} ({list.optedIn.toLocaleString()} contacts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="message">Message Content</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Enter your SMS message here..."
                    className="min-h-[100px]"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    160 characters = 1 SMS segment
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduleType">Schedule</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Send immediately" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Send Immediately</SelectItem>
                        <SelectItem value="scheduled">Schedule for Later</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Normal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          <TabsTrigger value="contacts">Contact Lists</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Campaign Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Campaigns</p>
                    <p className="text-2xl font-bold">{mockCampaigns.length}</p>
                  </div>
                  <Send className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Now</p>
                    <p className="text-2xl font-bold">
                      {mockCampaigns.filter(c => c.status === "active").length}
                    </p>
                  </div>
                  <Play className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Messages Sent</p>
                    <p className="text-2xl font-bold">
                      {mockCampaigns.reduce((sum, c) => sum + c.sentMessages, 0).toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-info" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Delivery Rate</p>
                    <p className="text-2xl font-bold">98.2%</p>
                  </div>
                  <Users className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Table */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Delivery Rate</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-xs">
                              {campaign.messagePreview}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {campaign.sentMessages.toLocaleString()}/{campaign.totalContacts.toLocaleString()}
                            </div>
                            <Progress 
                              value={(campaign.sentMessages / campaign.totalContacts) * 100} 
                              className="h-2 w-24"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {getDeliveryRate(campaign).toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {campaign.createdDate}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {campaign.status === "active" ? (
                              <Button variant="ghost" size="sm">
                                <Pause className="h-3 w-3" />
                              </Button>
                            ) : campaign.status === "paused" ? (
                              <Button variant="ghost" size="sm">
                                <Play className="h-3 w-3" />
                              </Button>
                            ) : null}
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          {/* Contact Lists */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contact Lists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockContactLists.map((list) => (
                  <Card key={list.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium">{list.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Last updated: {list.lastUpdated}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Opted In</span>
                            <span>{list.optedIn.toLocaleString()}/{list.totalContacts.toLocaleString()}</span>
                          </div>
                          <Progress value={(list.optedIn / list.totalContacts) * 100} />
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <FileText className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Add New List Card */}
                <Card className="border-dashed">
                  <CardContent className="p-4 flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                      <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">Create new contact list</p>
                      <Button variant="outline" size="sm">
                        Add List
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {/* Message Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Message Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Promotional Template</h3>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    🔥 [OFFER_NAME]: [DISCOUNT]% OFF everything! Limited time offer. Use code: [CODE]. Shop now: [LINK] Reply STOP to opt out.
                  </p>
                  <Badge variant="outline" className="text-xs">160 characters</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Welcome Message</h3>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Welcome to [COMPANY_NAME], [FIRST_NAME]! Thanks for joining us. Here's your welcome bonus: [BONUS]. Questions? Reply to this message.
                  </p>
                  <Badge variant="outline" className="text-xs">142 characters</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Appointment Reminder</h3>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Reminder: Your appointment with [PROVIDER] is tomorrow at [TIME]. Location: [ADDRESS]. Reply C to confirm or R to reschedule.
                  </p>
                  <Badge variant="outline" className="text-xs">138 characters</Badge>
                </div>

                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}