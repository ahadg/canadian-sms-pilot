import { useState, useEffect } from "react";
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
  Download,
  X,
} from "lucide-react";
import { Device, useCampaigns, type Campaign } from "@/hooks/useCampaigns";
import { toast } from "sonner";
import { ContactManager } from "./ContactManager";
import { useContactManagement } from "@/hooks/useContactManagement";
import { supabase } from "@/lib/supabase";

// Canadian SMS rules template
const CANADIAN_SMS_TEMPLATE = `Your message here. Reply STOP to unsubscribe.`;

export function CampaignManagement() {
  const {
    campaigns,
    loading,
    createCampaign,
    updateCampaignStatus,
    messages,
    fetchDevices,
    startCampaign,
    testCampaign,
  } = useCampaigns();
  
  const {
    contactLists,
    createContactList,
    deleteContactList,
  } = useContactManagement();

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedContactListId, setSelectedContactListId] = useState<string | null>(null);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isCreateContactListOpen, setIsCreateContactListOpen] = useState(false);
  const [isContactManagerOpen, setIsContactManagerOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedMessageVariant, setSelectedMessageVariant] = useState<string>('');

  // Task settings state
  const [taskSettings, setTaskSettings] = useState({
    interval: 10,
    timeout: 30,
    coding: 0,
    sms_type: 0
  });

  // Campaign form state with Canadian template as default
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    message_content: CANADIAN_SMS_TEMPLATE,
    contact_list_id: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    status: 'scheduled' as Campaign['status'],
    device_id: '',
  });

  // Load devices on component mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const deviceList = await fetchDevices();
        setDevices(deviceList);
        // Auto-select first device if available
        if (deviceList.length > 0 && !campaignForm.device_id) {
          setCampaignForm(prev => ({ ...prev, device_id: deviceList[0].id }));
        }
      } catch (error) {
        console.error('Error loading devices:', error);
      }
    };

    loadDevices();
  }, []);

  // Handle AI message variant selection
  const handleMessageVariantSelect = (variantId: string) => {
    if (variantId === 'none') {
      setCampaignForm(prev => ({ 
        ...prev, 
        message_content: CANADIAN_SMS_TEMPLATE 
      }));
      setSelectedMessageVariant('');
      return;
    }

    // Find the selected variant from messages
    const selectedVariant = messages.flatMap((message: any) => 
      message.variants || []
    ).find((variant: any) => variant.id === variantId);

    if (selectedVariant) {
      setCampaignForm(prev => ({ 
        ...prev, 
        message_content: selectedVariant.content 
      }));
      setSelectedMessageVariant(variantId);
    }
  };

  // Start campaign handler
  const handleStartCampaign = async (campaign: Campaign) => {

    setIsSending(true);
    try {
      console.log("campaign",campaign)
      const the_device = devices?.find(d => d.id === campaign.device_id);
      console.log("the_device",the_device)
      const deviceConfig = {
        device_ip: the_device?.ip_address,
        device_port: the_device?.port,
        version: '1.1',
        device_id: the_device?.id,
        username: the_device?.username,
        password: the_device?.password
      };

      await startCampaign(campaign.id, deviceConfig);
      setShowSendDialog(false);
    } catch (error) {
      console.error('Error starting campaign:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Test campaign handler
  const handleTestCampaign = async (campaign: Campaign) => {
    if (!selectedDevice) {
      toast.error('Please select a device first');
      return;
    }

    const testContactIds = ['test-contact-1', 'test-contact-2'];
    
    setIsSending(true);
    try {
      const deviceConfig = {
        device_ip: selectedDevice.ip_address,
        device_port: selectedDevice.port,
        version: '1.1',
        device_id: selectedDevice.id,
        username: selectedDevice.username,
        password: selectedDevice.password
      };

      await testCampaign(campaign.id, deviceConfig, testContactIds);
    } catch (error) {
      console.error('Error testing campaign:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Create campaign handler
  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.message_content || !campaignForm.device_id) {
      toast.error('Please fill in all required fields including device selection');
      return;
    }
   
    const { data : contacts_lists , error: contactsError } = await supabase
        .from('contact_lists')
        .select('total_contacts')
        .eq('id', campaignForm.contact_list_id)
    console.log("contacts_lists",campaignForm.contact_list_id,contacts_lists)
    try {
      await createCampaign({
        name: campaignForm.name,
        message_content: campaignForm.message_content,
        contact_list_id: campaignForm.contact_list_id || undefined,
        priority: campaignForm.priority,
        status: campaignForm.status,
        device_id: campaignForm.device_id,
        task_settings: taskSettings,
        total_contacts: contacts_lists?.[0]?.total_contacts || 0,
        sent_messages: 0,
        delivered_messages: 0,
        failed_messages: 0
      });
      
      setIsCreateCampaignOpen(false);
      // Reset form
      setCampaignForm({
        name: '',
        message_content: CANADIAN_SMS_TEMPLATE,
        contact_list_id: '',
        priority: 'normal',
        status: 'scheduled',
        device_id: devices.length > 0 ? devices[0].id : ''
      });
      setTaskSettings({
        interval: 10,
        timeout: 30,
        coding: 0,
        sms_type: 0
      });
      setSelectedMessageVariant('');
      toast.success('Campaign created successfully');
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  // Create contact list handler
  const [contactListName, setContactListName] = useState('');
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
      console.error('Error creating contact list:', error);
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
      case "paused":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "scheduled":
        return <Badge variant="outline">Scheduled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Delivery rate calculator
  const getDeliveryRate = (campaign: Campaign) => {
    if (campaign.sent_messages === 0) return 0;
    return (campaign.delivered_messages / campaign.sent_messages) * 100;
  };

  // Campaign actions renderer
  const renderCampaignActions = (campaign: Campaign) => (
    <div className="flex gap-1">
      {campaign.status === "scheduled" && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            setSelectedCampaign(campaign);
            setShowSendDialog(true);
          }}
          disabled={isSending}
        >
          <Send className="h-3 w-3" />
        </Button>
      )}
      {campaign.status === "active" && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => updateCampaignStatus(campaign.id, 'paused')}
        >
          <Pause className="h-3 w-3" />
        </Button>
      )}
      {campaign.status === "paused" && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => updateCampaignStatus(campaign.id, 'active')}
        >
          <Play className="h-3 w-3" />
        </Button>
      )}
      <Button variant="ghost" size="sm">
        <Eye className="h-3 w-3" />
      </Button>
    </div>
  );

  // Send dialog component
  const renderSendDialog = () => (
    <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Campaign</DialogTitle>
          <DialogDescription>
            Send "{selectedCampaign?.name}" campaign
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={() => setShowSendDialog(false)}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1" 
            onClick={() => selectedCampaign && handleStartCampaign(selectedCampaign)}
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Campaign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

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
              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New SMS Campaign</DialogTitle>
                <DialogDescription>
                  Set up a new SMS campaign with your target audience and message
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaignName">Campaign Name *</Label>
                    <Input 
                      id="campaignName" 
                      placeholder="Winter Sale 2024"
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="device">Device *</Label>
                    <Select 
                      value={campaignForm.device_id}
                      onValueChange={(value) => setCampaignForm(prev => ({ ...prev, device_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select device" />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.name} ({device.ip_address})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                            {list.name} ({list?.opted_in_count?.toLocaleString()} contacts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="aiMessage">AI Message Variants</Label>
                    <Select 
                      value={selectedMessageVariant}
                      onValueChange={handleMessageVariantSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI message variant..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Use custom message</SelectItem>
                        {messages?.flatMap((message: any) => 
                          (message.variants || []).map((variant: any) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {variant.content.substring(0, 50)}... ({variant.tone})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="message">Message Content *</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Enter your SMS message here..."
                    className="min-h-[100px]"
                    value={campaignForm.message_content}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, message_content: e.target.value }))}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {campaignForm.message_content.length} characters • {Math.ceil(campaignForm.message_content.length / 160)} SMS segment(s)
                    {campaignForm.message_content.length > 160 && (
                      <span className="text-amber-600 ml-2">Long message (USC2 encoding will be used)</span>
                    )}
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

                {/* Task Settings Section */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Task Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="interval">Interval (seconds) *</Label>
                      <Input 
                        id="interval"
                        type="number" 
                        value={taskSettings.interval}
                        onChange={(e) => setTaskSettings(prev => ({ 
                          ...prev, 
                          interval: parseInt(e.target.value) || 10 
                        }))}
                        min="1"
                        max="3600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timeout">Timeout (seconds) *</Label>
                      <Input 
                        id="timeout"
                        type="number" 
                        value={taskSettings.timeout}
                        onChange={(e) => setTaskSettings(prev => ({ 
                          ...prev, 
                          timeout: parseInt(e.target.value) || 30 
                        }))}
                        min="10"
                        max="300"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label htmlFor="coding">Message Coding</Label>
                      <Select 
                        value={taskSettings.coding.toString()}
                        onValueChange={(value) => setTaskSettings(prev => ({ 
                          ...prev, 
                          coding: parseInt(value) 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select coding" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Auto-detect</SelectItem>
                          <SelectItem value="1">USC2 (Unicode)</SelectItem>
                          <SelectItem value="2">GSM 7-bit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="smsType">SMS Type</Label>
                      <Select 
                        value={taskSettings.sms_type.toString()}
                        onValueChange={(value) => setTaskSettings(prev => ({ 
                          ...prev, 
                          sms_type: parseInt(value) 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select SMS type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Normal SMS</SelectItem>
                          <SelectItem value="1">Flash SMS</SelectItem>
                          <SelectItem value="2">Unicode SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                  <Send className="h-8 w-8 text-blue-500" />
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
                  <Play className="h-8 w-8 text-green-500" />
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
                  <BarChart3 className="h-8 w-8 text-purple-500" />
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
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {renderSendDialog()}

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
                      <TableHead>Device</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Delivery Rate</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => {
                      const assignedDevice = devices.find(d => d.id === campaign.device_id);
                      return (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{campaign.name}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-xs">
                                {campaign.message_preview || campaign.message_content.substring(0, 50) + '...'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {assignedDevice ? assignedDevice.name : 'No device'}
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
                            {renderCampaignActions(campaign)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                            <span>{list.opted_in_count}/{list.total_contacts}</span>
                          </div>
                          <Progress value={list.total_contacts > 0 ? (list.opted_in_count / list.total_contacts) * 100 : 0} />
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedContactListId(list.id);
                              setIsContactManagerOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <FileText className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => deleteContactList(list.id)}
                          >
                            <Trash2 className="h-3 w-3" />
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
      </Tabs>

      {/* Contact Manager Dialog */}
      {selectedContactListId && (
        <ContactManager
          contactListId={selectedContactListId}
          open={isContactManagerOpen}
          onOpenChange={setIsContactManagerOpen}
        />
      )}
    </div>
  );
}