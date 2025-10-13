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
  Pause,
  CirclePlay,
  StopCircle,
  Calendar,
  Clock,
  Zap,
  MessageCircle,
  Smartphone,
  Target
} from "lucide-react";
import { Device, useCampaigns } from "@/hooks/useCampaigns";
import { toast } from "sonner";
import { ContactManager } from "./ContactManager";
import { messageAPI, MessageVariant } from "@/lib/api/messages";
import { contactAPI } from "@/lib/api/contacts";
import { Campaign } from "@/lib/api/campaign";
import { useSocketStore } from "@/store/useSocketStore";
import { getStatusBadge } from "./utils";
import { CampaignActions } from "./CampaignActions";
import { useContactStore } from "@/store/useContactStore";
import { ContactManagement } from "./ContactManagement";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// Canadian SMS rules template
const CANADIAN_SMS_TEMPLATE = `Your message here. Reply STOP to unsubscribe.`;

const defaultTaskSettings = {
  interval_min: 30000, // 30 seconds in milliseconds
  interval_max: 90000, // 90 seconds in milliseconds
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
  sms_period: 60,
  dailyMessageLimit: 300,
  messageVariantType: "static" as "static" | "ai_random",
  useAiGeneration: false,
  aiPrompt: ""
};

export function CampaignManagement() {
  const {
    campaigns,
    setCampaigns,
    loading,
    createCampaign,
    messages,
    fetchDevices,
    updateCampaignStatus,
    pauseCampaign,
    resumeCampaign,
    stopCampaign,
    startCampaignProcessing
  } = useCampaigns();

  const {
    contactLists,
    deleteContactList,
    refreshContactLists
  } = useContactStore();

  // Use Zustand socket store
  const { 
    isConnected, 
    campaignUpdates, 
    socket 
  } = useSocketStore();

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
  const [messageVariantType, setMessageVariantType] = useState<'static' | 'ai_random'>('static');

  // Task settings state
  const [taskSettings, setTaskSettings] = useState(defaultTaskSettings);
  const [dailyMessageLimit, setDailyMessageLimit] = useState(300);
  const [sendingInterval, setSendingInterval] = useState({
    min: 30000, // 30 seconds
    max: 90000  // 90 seconds
  });

  // Campaign form state with Canadian template as default
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    message_content: CANADIAN_SMS_TEMPLATE,
    contactList: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    status: 'scheduled' as 'scheduled' | 'active' | 'paused' | 'completed',
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
        toast.error('Failed to load devices');
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
   
    try {
      const { data: contacts_lists, error: contactsError } = await contactAPI.getListById(campaignForm.contactList);
      console.log("contacts_lists", campaignForm.contactList, contacts_lists);
      
      const campaignData = {
        name: campaignForm.name,
        messageContent: campaignForm.message_content,
        contactList: campaignForm.contactList || undefined,
        priority: campaignForm.priority,
        status: campaignForm.status,
        device: campaignForm.device,
        taskSettings: {
          ...taskSettings,
          messageVariantType,
          dailyMessageLimit,
          interval_min: sendingInterval.min,
          interval_max: sendingInterval.max,
          useAiGeneration: messageVariantType === 'ai_random',
          aiPrompt: messageVariantType === 'ai_random' ? campaignForm.message_content : ''
        },
        totalContacts: contacts_lists?.contactList?.totalContacts || 0,
        sentMessages: 0,
        deliveredMessages: 0,
        failedMessages: 0
      };

      console.log("Creating campaign with data:", campaignData);
      
      const newCampaign = await createCampaign(campaignData);
      
      // Start processing if status is active
      if (campaignForm.status === 'active') {
        try {
          await startCampaignProcessing(newCampaign._id);
          toast.success('Campaign created and started successfully');
        } catch (error) {
          console.error('Error starting campaign processing:', error);
          toast.error('Campaign created but failed to start processing');
        }
      } else {
        toast.success('Campaign created successfully');
      }
      
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
      setTaskSettings(defaultTaskSettings);
      setSelectedMessageId('');
      setSelectedVariantId('');
      setMessageVariants([]);
      setMessageVariantType('static');
      setDailyMessageLimit(300);
      setSendingInterval({ min: 30000, max: 90000 });
      
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  // Handle campaign actions
  const handleStartCampaign = async (campaignId: string) => {
    try {
      await startCampaignProcessing(campaignId);
      await updateCampaignStatus(campaignId, 'active');
      toast.success('Campaign started successfully');
    } catch (error) {
      console.error('Error starting campaign:', error);
      toast.error('Failed to start campaign');
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await pauseCampaign(campaignId);
      await updateCampaignStatus(campaignId, 'paused');
      toast.success('Campaign paused successfully');
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast.error('Failed to pause campaign');
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      await resumeCampaign(campaignId);
      await updateCampaignStatus(campaignId, 'active');
      toast.success('Campaign resumed successfully');
    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast.error('Failed to resume campaign');
    }
  };

  const handleStopCampaign = async (campaignId: string) => {
    try {
      await stopCampaign(campaignId);
      await updateCampaignStatus(campaignId, 'completed');
      toast.success('Campaign stopped successfully');
    } catch (error) {
      console.error('Error stopping campaign:', error);
      toast.error('Failed to stop campaign');
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
    if (!campaign?.sentMessages || campaign.sentMessages === 0) return 0;
    return ((campaign.deliveredMessages || 0) / campaign.sentMessages) * 100;
  };

  // Calculate campaign progress
  const getCampaignProgress = (campaign: Campaign) => {
    if (!campaign?.totalContacts || campaign.totalContacts === 0) return 0;
    return (campaign.sentMessages / campaign.totalContacts) * 100;
  };

  // Format time
  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading campaigns...</span>
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New SMS Campaign</DialogTitle>
                <DialogDescription>
                  Set up a new SMS campaign with advanced scheduling, AI message variants, and daily limits
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Basic Information */}
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
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              {device.name} 
                              <Badge variant={device.status === 'online' ? 'default' : 'secondary'} className="ml-2">
                                {device.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Contact List and AI Messages */}
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
                            <div className="flex items-center justify-between">
                              <span>{list.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {list.optedInCount?.toLocaleString()} contacts
                              </Badge>
                            </div>
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

                {/* Message Variants Type */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Message Variants
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="variantType">Message Variation Type</Label>
                      <Select 
                        value={messageVariantType}
                        onValueChange={(value: 'static' | 'ai_random') => setMessageVariantType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select variation type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="static">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Use Selected Variants
                            </div>
                          </SelectItem>
                          <SelectItem value="ai_random">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              AI Random Generation
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {messageVariantType === 'ai_random' && (
                      <div>
                        <Label htmlFor="aiPrompt">AI Prompt for Message Generation</Label>
                        <Textarea 
                          id="aiPrompt"
                          placeholder="Describe the type of messages you want to generate. For example: 'Friendly promotional messages for a winter sale with urgency'..."
                          value={campaignForm.message_content}
                          onChange={(e) => setCampaignForm(prev => ({ 
                            ...prev, 
                            message_content: e.target.value 
                          }))}
                          className="min-h-[80px]"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          AI will generate unique message variants based on this prompt for each contact
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Message Content */}
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

                {/* Schedule Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduleType">Schedule Type</Label>
                    <Select 
                      value={campaignForm.status}
                      onValueChange={(value) => setCampaignForm(prev => ({ ...prev, status: value as Campaign['status'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Schedule for Later
                          </div>
                        </SelectItem>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            Start Immediately
                          </div>
                        </SelectItem>
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
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Daily Limits Section */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Daily Limits
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dailyLimit">Daily Message Limit</Label>
                      <Input 
                        id="dailyLimit"
                        type="number" 
                        value={dailyMessageLimit}
                        onChange={(e) => setDailyMessageLimit(parseInt(e.target.value) || 300)}
                        min="1"
                        max="10000"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Campaign will pause after sending {dailyMessageLimit} messages and resume next day automatically
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sending Interval Section */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Sending Intervals
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="intervalMin">Minimum Interval (seconds)</Label>
                      <Input 
                        id="intervalMin"
                        type="number" 
                        value={sendingInterval.min / 1000}
                        onChange={(e) => setSendingInterval(prev => ({ 
                          ...prev, 
                          min: (parseInt(e.target.value) || 30) * 1000 
                        }))}
                        min="10"
                        max="300"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Minimum: {sendingInterval.min / 1000} seconds
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="intervalMax">Maximum Interval (seconds)</Label>
                      <Input 
                        id="intervalMax"
                        type="number" 
                        value={sendingInterval.max / 1000}
                        onChange={(e) => setSendingInterval(prev => ({ 
                          ...prev, 
                          max: (parseInt(e.target.value) || 90) * 1000 
                        }))}
                        min="30"
                        max="300"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Maximum: {sendingInterval.max / 1000} seconds
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Messages will be sent with random intervals between {sendingInterval.min / 1000}s and {sendingInterval.max / 1000}s
                  </div>
                </div>

                {/* Advanced Task Settings */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Advanced Settings</h3>
                  
                  {/* Character Set and Coding */}
                  <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="0">Auto-detect</SelectItem>
                          <SelectItem value="1">USC2 (Unicode)</SelectItem>
                          <SelectItem value="2">GSM 7-bit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Report Settings */}
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sdr"
                        checked={taskSettings.sdr}
                        onCheckedChange={(checked) => setTaskSettings(prev => ({ 
                          ...prev, 
                          sdr: checked 
                        }))}
                      />
                      <Label htmlFor="sdr" className="text-sm">SDR Report</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="fdr"
                        checked={taskSettings.fdr}
                        onCheckedChange={(checked) => setTaskSettings(prev => ({ 
                          ...prev, 
                          fdr: checked 
                        }))}
                      />
                      <Label htmlFor="fdr" className="text-sm">FDR Report</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="dr"
                        checked={taskSettings.dr}
                        onCheckedChange={(checked) => setTaskSettings(prev => ({ 
                          ...prev, 
                          dr: checked 
                        }))}
                      />
                      <Label htmlFor="dr" className="text-sm">DR Report</Label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsCreateCampaignOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700" 
                    onClick={handleCreateCampaign}
                    disabled={!campaignForm.name || !campaignForm.message_content || !campaignForm.device}
                  >
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
                      {campaigns.filter((c: Campaign) => c?.status === "active").length}
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
                      {campaigns.reduce((sum: number, c: Campaign) => sum + (c?.sentMessages || 0), 0).toLocaleString()}
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
                        ? (campaigns.reduce((sum: number, c: Campaign) => sum + getDeliveryRate(c), 0) / campaigns.length).toFixed(1)
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
              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first SMS campaign to get started
                  </p>
                  <Button onClick={() => setIsCreateCampaignOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Delivery Rate</TableHead>
                        <TableHead>Daily Limit</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign: Campaign) => {
                        const assignedDevice = devices.find(d => d.id === campaign.device);
                        const progress = getCampaignProgress(campaign);
                        const deliveryRate = getDeliveryRate(campaign);
                        
                        return (
                          <TableRow key={campaign._id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{campaign.name}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-xs">
                                  {campaign.messagePreview || campaign.messageContent?.substring(0, 50) + '...'}
                                </div>
                                {campaign.taskSettings?.messageVariantType === 'ai_random' && (
                                  <Badge variant="outline" className="mt-1">
                                    <Zap className="h-3 w-3 mr-1" />
                                    AI Variants
                                  </Badge>
                                )}
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
                                  {campaign.sentMessages?.toLocaleString()}/{campaign.totalContacts?.toLocaleString()}
                                </div>
                                <Progress 
                                  value={progress} 
                                  className="h-2 w-24"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {deliveryRate.toFixed(1)}%
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {campaign.taskSettings?.dailyMessageLimit || 300}/day
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(campaign.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {campaign.status === 'scheduled' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStartCampaign(campaign._id)}
                                    disabled={!isConnected}
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Start
                                  </Button>
                                )}
                                {campaign.status === 'active' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePauseCampaign(campaign._id)}
                                      disabled={!isConnected}
                                    >
                                      <Pause className="h-3 w-3 mr-1" />
                                      Pause
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStopCampaign(campaign._id)}
                                    >
                                      <StopCircle className="h-3 w-3 mr-1" />
                                      Stop
                                    </Button>
                                  </>
                                )}
                                {campaign.status === 'paused' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleResumeCampaign(campaign._id)}
                                      disabled={!isConnected}
                                    >
                                      <CirclePlay className="h-3 w-3 mr-1" />
                                      Resume
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStopCampaign(campaign._id)}
                                    >
                                      <StopCircle className="h-3 w-3 mr-1" />
                                      Stop
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    // Edit campaign logic here
                                    toast.info('Edit feature coming soon');
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          {/* Contact Lists */}
          <ContactManagement />
        </TabsContent>
      </Tabs>

      {/* Create Contact List Dialog */}
      <Dialog open={isCreateContactListOpen} onOpenChange={setIsCreateContactListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Contact List</DialogTitle>
            <DialogDescription>
              Create a new contact list to organize your contacts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contactListName">Contact List Name</Label>
              <Input 
                id="contactListName"
                placeholder="My Contact List"
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
  );
}