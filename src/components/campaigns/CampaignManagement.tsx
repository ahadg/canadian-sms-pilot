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
  Loader2,
} from "lucide-react";
import { useCampaigns, type Campaign, type ContactList, type MessageTemplate } from "@/hooks/useCampaigns";
import { toast } from "sonner";

export function CampaignManagement() {
  const {
    campaigns,
    contactLists,
    messageTemplates,
    loading,
    createCampaign,
    updateCampaignStatus,
    createContactList,
    createMessageTemplate,
    deleteMessageTemplate
  } = useCampaigns();

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isCreateContactListOpen, setIsCreateContactListOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  
  // Form states
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    message_content: '',
    contact_list_id: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    status: 'scheduled' as Campaign['status']
  });
  
  const [contactListName, setContactListName] = useState('');
  const [templateForm, setTemplateForm] = useState({
    name: '',
    content: '',
    category: 'general'
  });

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
    if (campaign.sent_messages === 0) return 0;
    return (campaign.delivered_messages / campaign.sent_messages) * 100;
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.message_content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createCampaign({
        name: campaignForm.name,
        message_content: campaignForm.message_content,
        contact_list_id: campaignForm.contact_list_id || undefined,
        priority: campaignForm.priority,
        status: campaignForm.status,
        total_contacts: 0,
        sent_messages: 0,
        delivered_messages: 0,
        failed_messages: 0
      });
      
      setIsCreateCampaignOpen(false);
      setCampaignForm({
        name: '',
        message_content: '',
        contact_list_id: '',
        priority: 'normal',
        status: 'scheduled'
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleCreateContactList = async () => {
    if (!contactListName.trim()) {
      toast.error('Please enter a contact list name');
      return;
    }

    try {
      await createContactList(contactListName);
      setIsCreateContactListOpen(false);
      setContactListName('');
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createMessageTemplate(templateForm);
      setIsCreateTemplateOpen(false);
      setTemplateForm({
        name: '',
        content: '',
        category: 'general'
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
          <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
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
                    <Input 
                      id="campaignName" 
                      placeholder="Winter Sale 2024"
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactList">Contact List</Label>
                    <Select 
                      value={campaignForm.contact_list_id}
                      onValueChange={(value) => setCampaignForm(prev => ({ ...prev, contact_list_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact list" />
                      </SelectTrigger>
                      <SelectContent>
                        {contactLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.name} ({list.opted_in.toLocaleString()} contacts)
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
                    value={campaignForm.message_content}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, message_content: e.target.value }))}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {campaignForm.message_content.length} characters • {Math.ceil(campaignForm.message_content.length / 160)} SMS segment(s)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduleType">Schedule</Label>
                    <Select 
                      value={campaignForm.status}
                      onValueChange={(value) => setCampaignForm(prev => ({ ...prev, status: value as Campaign['status'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Send immediately" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Send Immediately</SelectItem>
                        <SelectItem value="scheduled">Schedule for Later</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={campaignForm.priority}
                      onValueChange={(value) => setCampaignForm(prev => ({ ...prev, priority: value as 'low' | 'normal' | 'high' }))}
                    >
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
                  <Button className="flex-1" onClick={handleCreateCampaign}>
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
                    <p className="text-2xl font-bold">{campaigns.length}</p>
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
                      {campaigns.filter(c => c.status === "active").length}
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
                      {campaigns.reduce((sum, c) => sum + c.sent_messages, 0).toLocaleString()}
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
                    <p className="text-2xl font-bold">
                      {campaigns.length > 0 
                        ? (campaigns.reduce((sum, c) => sum + getDeliveryRate(c), 0) / campaigns.length).toFixed(1)
                        : 0}%
                    </p>
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
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-xs">
                              {campaign.message_preview || campaign.message_content.substring(0, 50) + '...'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {campaign.sent_messages.toLocaleString()}/{campaign.total_contacts.toLocaleString()}
                            </div>
                            <Progress 
                              value={campaign.total_contacts > 0 ? (campaign.sent_messages / campaign.total_contacts) * 100 : 0} 
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
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {campaign.status === "active" ? (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                              >
                                <Pause className="h-3 w-3" />
                              </Button>
                            ) : campaign.status === "paused" ? (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => updateCampaignStatus(campaign.id, 'active')}
                              >
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
                {contactLists.map((list) => (
                  <Card key={list.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium">{list.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Last updated: {new Date(list.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Opted In</span>
                            <span>{list.opted_in.toLocaleString()}/{list.total_contacts.toLocaleString()}</span>
                          </div>
                          <Progress value={list.total_contacts > 0 ? (list.opted_in / list.total_contacts) * 100 : 0} />
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
                <Dialog open={isCreateContactListOpen} onOpenChange={setIsCreateContactListOpen}>
                  <DialogTrigger asChild>
                    <Card className="border-dashed cursor-pointer hover:border-primary/50 transition-colors">
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
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Contact List</DialogTitle>
                      <DialogDescription>
                        Create a new contact list to organize your contacts
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="listName">List Name</Label>
                        <Input 
                          id="listName" 
                          placeholder="Enter list name"
                          value={contactListName}
                          onChange={(e) => setContactListName(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setIsCreateContactListOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleCreateContactList}>
                          Create List
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                {messageTemplates.map((template) => (
                  <div key={template.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <Badge variant="outline" className="text-xs mt-1">
                          {template.category}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteMessageTemplate(template.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.content}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {template.content.length} characters
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Created: {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}

                <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Message Template</DialogTitle>
                      <DialogDescription>
                        Create a reusable message template for your campaigns
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="templateName">Template Name</Label>
                        <Input 
                          id="templateName" 
                          placeholder="Welcome Message"
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="templateCategory">Category</Label>
                        <Select 
                          value={templateForm.category}
                          onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="promotional">Promotional</SelectItem>
                            <SelectItem value="transactional">Transactional</SelectItem>
                            <SelectItem value="notifications">Notifications</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="templateContent">Message Content</Label>
                        <Textarea 
                          id="templateContent" 
                          placeholder="Enter your message template..."
                          className="min-h-[100px]"
                          value={templateForm.content}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {templateForm.content.length} characters
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setIsCreateTemplateOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleCreateTemplate}>
                          Create Template
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}