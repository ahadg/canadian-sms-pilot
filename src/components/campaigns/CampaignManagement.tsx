import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Users,
  FileText,
  BarChart3,
  Edit,
  Trash2,
  Loader2,

} from "lucide-react";
import { Device, useCampaigns } from "@/hooks/useCampaigns";
import { toast } from "sonner";
import { ContactManager } from "./ContactManager";
import { useContactManagement } from "@/hooks/useContactManagement";
import { messageAPI, MessageVariant } from "@/lib/api/messages";
import { contactAPI } from "@/lib/api/contacts";
import { Campaign } from "@/lib/api/campaign";
import { useSocketStore } from "@/store/useSocketStore";
import { getStatusBadge } from "./utils";
import { CampaignActions } from "./CampaignActions";
// Canadian SMS rules template
const CANADIAN_SMS_TEMPLATE = `Your message here. Reply STOP to unsubscribe.`;
const defulat_taskSettings = {
  interval_min: 30000, // 30 seconds in milliseconds
  interval_max: 50000, // 50 seconds in milliseconds
  timeout: 30,
  charset: "UTF-8" as "UTF-8" | "Base64" | "PDU",
  coding: 0 as 0 | 1 | 2,
  sms_type: 0 as 0 | 1 | 2,
  sdr: true,
  fdr: true,
  dr: true,
  to_all: false,
  flash_sms: false,
  sms_count: 100,
  sms_period: 60
}

export function CampaignManagement() {
  const {
    campaigns,
    setCampaigns,
    loading,
    createCampaign,
    messages,
    fetchDevices,
  } = useCampaigns();
  
  const {
    contactLists,
    createContactList,
    deleteContactList,
    updateContactList,
    refreshContactLists
  } = useContactManagement();

  // Use Zustand socket store
  const { 
    isConnected, 
    campaignUpdates, 
    socket 
  } = useSocketStore();

  const {
    updateCampaignStatus,
    pauseCampaignTasks,
    resumeCampaignTasks,
    removeCampaignTasks,
    startCampaign
  } = useCampaigns();

  // Handle real-time campaign updates from socket
  useEffect(() => {
    if (campaignUpdates.length > 0) {
      console.log('Processing campaign updates:', campaignUpdates);
      
      campaignUpdates.forEach(update => {
        setCampaigns(prev => 
          prev.map(campaign => {
            if (campaign._id === update.campaignId) {
              const updatedCampaign = {
                ...campaign,
                ...update.updates,
                // Calculate delivery rate in real-time
                deliveryRate: update.updates.sentMessages > 0 
                  ? (update.updates.deliveredMessages / update.updates.sentMessages) * 100 
                  : 0,
                // Update status if provided
                status: update.updates.status || campaign.status
              };
              
              console.log(`Updated campaign ${campaign._id}:`, updatedCampaign);
              return updatedCampaign;
            }
            return campaign;
          }) as Campaign[]
        );
      });
    }
  }, [campaignUpdates, setCampaigns]);

  const [selectedContactListId, setSelectedContactListId] = useState<string | null>(null);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isCreateContactListOpen, setIsCreateContactListOpen] = useState(false);
  const [isContactManagerOpen, setIsContactManagerOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);

  // Message variant state
  const [selectedMessageId, setSelectedMessageId] = useState<string>('');
  const [messageVariants, setMessageVariants] = useState<MessageVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Task settings state
  const [taskSettings, setTaskSettings] = useState(defulat_taskSettings);
  // Campaign form state with Canadian template as default
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    message_content: CANADIAN_SMS_TEMPLATE,
    contactList: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    status: 'scheduled',
    device: '',
  });
  console.log("campaignForm", campaignForm);
  // Load devices on component mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const deviceList = await fetchDevices();
        setDevices(deviceList);
        // Auto-select first device if available
        if (deviceList.length > 0 && !campaignForm.device) {
          setCampaignForm(prev => ({ ...prev, device: deviceList[0].id }));
        }
      } catch (error) {
        console.error('Error loading devices:', error);
      }
    };

    loadDevices();
  }, []);

  // Fetch message variants when a message is selected
  const fetchMessageVariants = async (messageId: string) => {
    if (!messageId) {
      setMessageVariants([]);
      setSelectedVariantId('');
      return;
    }

    setLoadingVariants(true);
    try {
      const response = await messageAPI.getVariants(messageId);
      console.log("MessageVariants_response", response);
      const variants = response.data.variants || [];

      setMessageVariants(variants);
      
      // Auto-select first variant if available
      if (variants.length > 0) {
        setSelectedVariantId(variants[0]._id);
        setCampaignForm(prev => ({
          ...prev,
          message_content: variants[0].content
        }));
      }
    } catch (error) {
      console.error('Error fetching message variants:', error);
      toast.error('Failed to load message variants');
      setMessageVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Handle message selection
  const handleMessageSelect = (messageId: string) => {
    if (messageId === 'none') {
      setSelectedMessageId('');
      setMessageVariants([]);
      setSelectedVariantId('');
      setCampaignForm(prev => ({ 
        ...prev, 
        message_content: CANADIAN_SMS_TEMPLATE 
      }));
      return;
    }

    setSelectedMessageId(messageId);
    fetchMessageVariants(messageId);
  };

  // Handle variant selection
  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    
    const selectedVariant = messageVariants.find(v => v._id === variantId);
    if (selectedVariant) {
      setCampaignForm(prev => ({
        ...prev,
        message_content: selectedVariant.content
      }));
    }
  };

  // Create campaign handler
  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.message_content || !campaignForm.device) {
      toast.error('Please fill in all required fields including device selection');
      return;
    }
   
    const { data: contacts_lists, error: contactsError } = await contactAPI.getListById(campaignForm.contactList);
    console.log("contacts_lists", campaignForm.contactList, contacts_lists);
    
    try {
      await createCampaign({
        name: campaignForm.name,
        messageContent: campaignForm.message_content,
        contactList: campaignForm.contactList || undefined,
        priority: campaignForm.priority,
        status: campaignForm.status,
        device: campaignForm.device,
        taskSettings: taskSettings,
        totalContacts: contacts_lists?.contactList?.totalContacts || 0,
        sentMessages: 0,
        deliveredMessages: 0,
        failedMessages: 0
      });
      
      
      
      setIsCreateCampaignOpen(false);
      // Reset form
      setCampaignForm({
        name: '',
        message_content: CANADIAN_SMS_TEMPLATE,
        contactList: '',
        priority: 'normal',
        status: 'scheduled',
        device: devices.length > 0 ? devices[0].id : ''
      });
      // Update the reset in handleCreateCampaign
      setTaskSettings(defulat_taskSettings);
      setSelectedMessageId('');
      setSelectedVariantId('');
      setMessageVariants([]);
      toast.success('Campaign created successfully');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
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
      await contactAPI.createList({ name: contactListName });
      await refreshContactLists();
      setIsCreateContactListOpen(false);
      setContactListName('');
      toast.success('Contact list created successfully');
    } catch (error) {
      console.error('Error creating contact list:', error);
      toast.error('Failed to create contact list');
    }
  };
  // Delivery rate calculator
  const getDeliveryRate = (campaign: Campaign) => {
    if (campaign?.sentMessages === 0) return 0;
    return (campaign?.deliveredMessages / campaign?.sentMessages) * 100;
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
                      value={campaignForm.device}
                      onValueChange={(value) => setCampaignForm(prev => ({ ...prev, device: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select device" />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map((device) => (
                          <SelectItem key={device._id} value={device._id}>
                            {device.name} 
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
                      value={campaignForm.contactList}
                      onValueChange={(value) => setCampaignForm(prev => ({ ...prev, contactList: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact list" />
                      </SelectTrigger>
                      <SelectContent>
                        {contactLists.map((list) => (
                          <SelectItem key={list._id} value={list._id}>
                            {list.name} ({list?.optedInCount?.toLocaleString()} contacts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="aiMessage">AI Messages</Label>
                    <Select 
                      value={selectedMessageId}
                      onValueChange={handleMessageSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a message..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Use custom message</SelectItem>
                        {(messages || []).map((message: any) => (
                          <SelectItem key={message._id} value={message._id}>
                            {message.name} ({message.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Message Variants Selection */}
                {selectedMessageId && (
                  <div>
                    <Label htmlFor="messageVariant">Message Variants</Label>
                    <Select 
                      value={selectedVariantId}
                      onValueChange={handleVariantSelect}
                      disabled={loadingVariants}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingVariants ? "Loading variants..." : "Select a variant..."
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {messageVariants.map((variant) => (
                          <SelectItem key={variant._id} value={variant._id}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">
                                {variant.tone} ({variant.characterCount} chars)
                              </span>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {variant.content.substring(0, 50)}...
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loadingVariants && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading message variants...
                      </div>
                    )}
                  </div>
                )}
                
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
                </div>

                {/* Task Settings Section */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Task Settings</h3>
                  
                  {/* Interval Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="interval_min">Minimum Interval (ms) *</Label>
                      <Input 
                        id="interval_min"
                        type="number" 
                        value={taskSettings.interval_min}
                        onChange={(e) => setTaskSettings(prev => ({ 
                          ...prev, 
                          interval_min: parseInt(e.target.value) || 30000 
                        }))}
                        min="1000"
                        max="300000"
                        step="1000"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {taskSettings.interval_min / 1000} seconds
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="interval_max">Maximum Interval (ms) *</Label>
                      <Input 
                        id="interval_max"
                        type="number" 
                        value={taskSettings.interval_max}
                        onChange={(e) => setTaskSettings(prev => ({ 
                          ...prev, 
                          interval_max: parseInt(e.target.value) || 50000 
                        }))}
                        min="1000"
                        max="300000"
                        step="1000"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {taskSettings.interval_max / 1000} seconds
                      </div>
                    </div>
                  </div>

                  {/* Timeout and Character Set */}
                  <div className="grid grid-cols-2 gap-4 mt-3">
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
                    <div>
                      <Label htmlFor="charset">Character Set</Label>
                      <Select 
                        value={taskSettings.charset}
                        onValueChange={(value: "UTF-8" | "Base64" | "PDU") => setTaskSettings(prev => ({ 
                          ...prev, 
                          charset: value 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select charset" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTF-8">UTF-8</SelectItem>
                          <SelectItem value="Base64">Base64</SelectItem>
                          <SelectItem value="PDU">PDU</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Coding and SMS Type */}
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label htmlFor="coding">Message Coding</Label>
                      <Select 
                        value={taskSettings.coding.toString()}
                        onValueChange={(value) => setTaskSettings(prev => ({ 
                          ...prev, 
                          coding: parseInt(value) as 0 | 1 | 2 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select coding" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Not Assign (Auto-detect)</SelectItem>
                          <SelectItem value="1">USC2 (Unicode)</SelectItem>
                          <SelectItem value="2">GSM 7-bit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sms_type">SMS Type</Label>
                      <Select 
                        value={taskSettings.sms_type.toString()}
                        onValueChange={(value) => setTaskSettings(prev => ({ 
                          ...prev, 
                          sms_type: parseInt(value) as 0 | 1 | 2 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select SMS type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">SMS</SelectItem>
                          <SelectItem value="1">MMS</SelectItem>
                          <SelectItem value="2">MMS with multiple numbers and subjects</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Report Settings */}
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sdr"
                        checked={taskSettings.sdr}
                        onChange={(e) => setTaskSettings(prev => ({ 
                          ...prev, 
                          sdr: e.target.checked 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="sdr" className="text-sm">SDR Report</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="fdr"
                        checked={taskSettings.fdr}
                        onChange={(e) => setTaskSettings(prev => ({ 
                          ...prev, 
                          fdr: e.target.checked 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="fdr" className="text-sm">FDR Report</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="dr"
                        checked={taskSettings.dr}
                        onChange={(e) => setTaskSettings(prev => ({ 
                          ...prev, 
                          dr: e.target.checked 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="dr" className="text-sm">DR Report</Label>
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="to_all"
                        checked={taskSettings.to_all}
                        onChange={(e) => setTaskSettings(prev => ({ 
                          ...prev, 
                          to_all: e.target.checked 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="to_all" className="text-sm">Use All Ports</Label>
                    </div>
                    {/* <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="flash_sms"
                        checked={taskSettings.flash_sms}
                        onChange={(e) => setTaskSettings(prev => ({ 
                          ...prev, 
                          flash_sms: e.target.checked 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="flash_sms" className="text-sm">Flash SMS</Label>
                    </div> */}
                  </div>

                  {/* Status Report Settings */}
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label htmlFor="sms_count">SMS Count for Status Report</Label>
                      <Input 
                        id="sms_count"
                        type="number" 
                        value={taskSettings.sms_count}
                        onChange={(e) => setTaskSettings(prev => ({ 
                          ...prev, 
                          sms_count: parseInt(e.target.value) || 100 
                        }))}
                        min="0"
                        max="1000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sms_period">Status Report Period (seconds)</Label>
                      <Input 
                        id="sms_period"
                        type="number" 
                        value={taskSettings.sms_period}
                        onChange={(e) => setTaskSettings(prev => ({ 
                          ...prev, 
                          sms_period: parseInt(e.target.value) || 60 
                        }))}
                        min="0"
                        max="3600"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Set to 0 to disable status reports
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* <Button variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button> */}
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
                      {campaigns.filter((c: any) => c?.status === "active").length}
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
                      {campaigns.reduce((sum, c) => sum + c?.sentMessages, 0).toLocaleString()}
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
                      const assignedDevice = devices.find(d => d.id === campaign.device);
                      return (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{campaign.name}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-xs">
                                {campaign.messagePreview || campaign.messageContent.substring(0, 50) + '...'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {campaign?.device ? campaign?.device.name : 'No device'}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                {campaign?.sentMessages.toLocaleString()}/{campaign.totalContacts.toLocaleString()}
                              </div>
                              <Progress 
                                value={campaign.totalContacts > 0 ? (campaign?.sentMessages / campaign.totalContacts) * 100 : 0} 
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
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                          <CampaignActions
                              campaign={campaign}
                              isConnected={isConnected}
                              devices={devices}
                              updateCampaignStatus={updateCampaignStatus}
                              pauseCampaignTasks={pauseCampaignTasks}
                              resumeCampaignTasks={resumeCampaignTasks}
                              removeCampaignTasks={removeCampaignTasks}
                              startCampaign={startCampaign}
                            />
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
                  <Card key={list._id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium">{list.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Last updated: {new Date(list.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Opted In</span>
                            <span>{list.optedInCount}/{list.totalContacts}</span>
                          </div>
                          <Progress value={list.totalContacts > 0 ? (list.optedInCount / list.totalContacts) * 100 : 0} />
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedContactListId(list._id);
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
                            onClick={() => deleteContactList(list._id)}
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