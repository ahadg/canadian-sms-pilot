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
  Target,
  Wand2,
  Shuffle,
  CheckCircle,
  AlertCircle,
  Eye,
  Copy,
  RotateCcw,
  AlertTriangle,
  Shield,
  RefreshCw
} from "lucide-react";

import { Device, useCampaigns } from "@/hooks/useCampaigns";
import { toast } from "sonner";
import { messageAPI, MessageVariant, SavedMessage } from "@/lib/api/messages";
import { contactAPI } from "@/lib/api/contacts";
import { Campaign } from "@/lib/api/campaign";
import { useSocketStore } from "@/store/useSocketStore";
import { getStatusBadge } from "./utils";
import { CampaignActions } from "./CampaignActions";
import { useContactStore } from "@/store/useContactStore";
import { ContactManagement } from "./ContactManagement";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CampaignDetailsDialog } from "./CampaignDetailsDialog";

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
  sms_count: 100,
  sms_period: 60,
  dailyMessageLimit: 300,
  messageVariantType: "static" as "static" | "ai_random",
  useAiGeneration: false,
  aiPrompt: ""
};

// Message variation types
type MessageVariationType = "single_variant" | "multiple_variants" | "ai_random";

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
    refreshContactLists
  } = useContactStore();
  
  console.log("contactLists",contactLists)
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  
  // Loading states for campaign actions
  const [loadingActions, setLoadingActions] = useState<{[key: string]: 'starting' | 'pausing' | 'resuming' | 'stopping' | null}>({});
  
  // Load contact lists when component mounts
  useEffect(() => {
    refreshContactLists();
  }, []); // Empty dependency array to run only once
  
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

  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isCreateContactListOpen, setIsCreateContactListOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [spamAnalysis, setSpamAnalysis] = useState(null);
  const [checkingSpam, setCheckingSpam] = useState(false);
  const [optimizingMessage, setOptimizingMessage] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);

  
  // Message variant state
  const [selectedMessageId, setSelectedMessageId] = useState<string>('');
  const [selectedAIMessage, setSelectedAIMessage] = useState<SavedMessage | null>(null);
  const [messageVariants, setMessageVariants] = useState<MessageVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [loadingVariants, setLoadingVariants] = useState(false);
  
  // New message variation type state
  const [messageVariationType, setMessageVariationType] = useState<MessageVariationType>("single_variant");
  const [customMessageContent, setCustomMessageContent] = useState(CANADIAN_SMS_TEMPLATE);

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
    // priority: 'normal' as 'low' | 'normal' | 'high',
    status: 'scheduled' as 'scheduled' | 'active' | 'paused' | 'completed',
    device: '',
  });

  // Add this function with your other handlers
  const handleViewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDetailsDialogOpen(true);
  };

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

  // Add this function with your other handlers
const handleCheckSpam = async (messageContent) => {
  if (!messageContent.trim()) {
    toast.error('Please enter a message to check');
    return;
  }

  setCheckingSpam(true);
  try {
    const response = await messageAPI.checkSpam({
      message: messageContent,
      companyName: "Your Company", // You might want to make this dynamic
      messageCategory: "Promotional" // You can make this dynamic based on your needs
    });
   console.log("handleCheckSpam",response)
    setSpamAnalysis(response.data.spamAnalysis);
    toast.success('Spam analysis completed');
  } catch (error) {
    console.error('Error checking spam:', error);
    toast.error('Failed to analyze spam score');
  } finally {
    setCheckingSpam(false);
  }
};

const handleOptimizeMessage = async (messageContent) => {
  if (!messageContent.trim()) {
    toast.error('Please enter a message to optimize');
    return;
  }

  setOptimizingMessage(true);
  try {
    const response = await messageAPI.optimizeMessage({
      message: messageContent,
      companyName: "Your Company", // Make this dynamic
      messageCategory: "Promotional",
      targetSpamScore: 3,
      preserveIntent: true,
      includeUnsubscribe: true
    });

    setOptimizationResult(response.data.optimizationResult);
    
    // Auto-apply the optimized message
    setCustomMessageContent(response.data.optimizationResult.optimizedMessage);
    setCampaignForm(prev => ({
      ...prev,
      message_content: response.data.optimizationResult.optimizedMessage
    }));
    
    toast.success(`Message optimized! Spam score reduced by ${response.data.optimizationResult.improvement}%`);
  } catch (error) {
    console.error('Error optimizing message:', error);
    toast.error('Failed to optimize message');
  } finally {
    setOptimizingMessage(false);
  }
};

const handleApplyOptimization = () => {
  if (optimizationResult) {
    setCustomMessageContent(optimizationResult.optimizedMessage);
    setCampaignForm(prev => ({
      ...prev,
      message_content: optimizationResult.optimizedMessage
    }));
    setOptimizationResult(null);
    toast.success('Optimized message applied');
  }
};

const handleRevertToOriginal = () => {
  if (optimizationResult) {
    setCustomMessageContent(optimizationResult.originalMessage || customMessageContent);
    setCampaignForm(prev => ({
      ...prev,
      message_content: optimizationResult.originalMessage || customMessageContent
    }));
    setOptimizationResult(null);
    toast.success('Reverted to original message');
  }
};


  // Fetch message variants when a message is selected
  const fetchMessageVariants = async (messageId: string) => {
    if (!messageId) {
      setMessageVariants([]);
      setSelectedVariantId('');
      setSelectedAIMessage(null);
      return;
    }

    setLoadingVariants(true);
    try {
      // Find the selected message from the messages list
      const selectedMessage = messages.find((msg: SavedMessage) => msg._id === messageId);
      setSelectedAIMessage(selectedMessage || null);

      const response = await messageAPI.getVariants(messageId);
      console.log("MessageVariants_response", response);
      const variants = response.data.variants || [];

      setMessageVariants(variants);
      
      // Auto-select first variant if available and set to multiple variants mode
      if (variants.length > 0) {
        setSelectedVariantId(variants[0]._id);
        setMessageVariationType("multiple_variants");
        setCustomMessageContent(variants[0].content);
        setCampaignForm(prev => ({
          ...prev,
          message_content: variants[0].content
        }));
      }
    } catch (error) {
      console.error('Error fetching message variants:', error);
      toast.error('Failed to load message variants');
      setMessageVariants([]);
      setSelectedAIMessage(null);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Handle message selection
  const handleMessageSelect = (messageId: string) => {
    if (messageId === 'none') {
      setSelectedMessageId('');
      setSelectedAIMessage(null);
      setMessageVariants([]);
      setSelectedVariantId('');
      setMessageVariationType("single_variant");
      setCustomMessageContent(CANADIAN_SMS_TEMPLATE);
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
      setCustomMessageContent(selectedVariant.content);
      setCampaignForm(prev => ({
        ...prev,
        message_content: selectedVariant.content
      }));
    }
  };

  // Handle message variation type change
  const handleVariationTypeChange = (type: MessageVariationType) => {
    setMessageVariationType(type);
    
    // Update campaign form based on selection
    if (type === "single_variant") {
      setCampaignForm(prev => ({
        ...prev,
        message_content: customMessageContent
      }));
    } else if (type === "multiple_variants" && selectedVariantId) {
      const selectedVariant = messageVariants.find(v => v._id === selectedVariantId);
      if (selectedVariant) {
        setCampaignForm(prev => ({
          ...prev,
          message_content: selectedVariant.content
        }));
      }
    } else if (type === "ai_random" && selectedAIMessage) {
      // Use the original prompt and base message from the selected AI message
      setCampaignForm(prev => ({
        ...prev,
        message_content: selectedAIMessage.originalPrompt || selectedAIMessage.baseMessage || ""
      }));
    }
  };

  // Handle custom message content change
  const handleCustomMessageChange = (content: string) => {
    setCustomMessageContent(content);
    if (messageVariationType === "single_variant") {
      setCampaignForm(prev => ({
        ...prev,
        message_content: content
      }));
    }
  };

  // Copy base message to custom message
  const handleUseBaseMessage = () => {
    if (selectedAIMessage?.baseMessage) {
      setCustomMessageContent(selectedAIMessage.baseMessage);
      if (messageVariationType === "single_variant") {
        setCampaignForm(prev => ({
          ...prev,
          message_content: selectedAIMessage.baseMessage
        }));
      }
      toast.success("Base message copied to custom message");
    }
  };

  // Copy original prompt to custom message
  const handleUseOriginalPrompt = () => {
    if (selectedAIMessage?.originalPrompt) {
      setCustomMessageContent(selectedAIMessage.originalPrompt);
      if (messageVariationType === "single_variant") {
        setCampaignForm(prev => ({
          ...prev,
          message_content: selectedAIMessage.originalPrompt
        }));
      }
      toast.success("Original prompt copied to custom message");
    }
  };

  // Create campaign handler
  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.message_content || !campaignForm.device) {
      toast.error('Please fill in all required fields including device selection');
      return;
    }
    setIsCreatingCampaign(true); // Start loading
    try {
      const { data: contacts_lists, error: contactsError } = await contactAPI.getListById(campaignForm.contactList);
      console.log("contacts_lists", campaignForm.contactList, contacts_lists);
      
      // Prepare task settings based on message variation type
      const finalTaskSettings = {
        ...taskSettings,
        //messageVariantType: messageVariationType === "ai_random" ? "ai_random" : "static",
        dailyMessageLimit,
        interval_min: sendingInterval.min,
        interval_max: sendingInterval.max,
        useAiGeneration: messageVariationType === "ai_random",
        aiPrompt: messageVariationType === "ai_random" && selectedAIMessage ? selectedAIMessage.originalPrompt : "",
        baseMessage: messageVariationType === "ai_random" && selectedAIMessage ? selectedAIMessage.baseMessage : "",
        selectedVariantId: messageVariationType === "multiple_variants" ? selectedVariantId : null,
        messageVariationType,
        message: selectedAIMessage?._id || null
      };

      const campaignData = {
        name: campaignForm.name,
        messageContent: campaignForm.message_content,
        contactList: campaignForm.contactList || undefined,
        // priority: campaignForm.priority,
        status: campaignForm.status,
        device: campaignForm.device,
        taskSettings: finalTaskSettings,
        totalContacts: contacts_lists?.contactList?.totalContacts || 0,
        sentMessages: 0,
        deliveredMessages: 0,
        failedMessages: 0,
        // Include message reference for AI campaigns
        message: messageVariationType === "ai_random" ? selectedAIMessage?._id : undefined
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
        // priority: 'normal',
        status: 'scheduled',
        device: devices.length > 0 ? devices[0].id : ''
      });
      setTaskSettings(defaultTaskSettings);
      setSelectedMessageId('');
      setSelectedAIMessage(null);
      setSelectedVariantId('');
      setMessageVariants([]);
      setMessageVariationType('single_variant');
      setCustomMessageContent(CANADIAN_SMS_TEMPLATE);
      setDailyMessageLimit(300);
      setSendingInterval({ min: 30000, max: 90000 });
      
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
    setIsCreatingCampaign(false); // Start loading
  };

  // Handle campaign actions with loading states
  const handleStartCampaign = async (campaignId: string) => {
    setLoadingActions(prev => ({ ...prev, [campaignId]: 'starting' }));
    try {
      await startCampaignProcessing(campaignId);
      await updateCampaignStatus(campaignId, 'active');
      toast.success('Campaign started successfully');
    } catch (error) {
      console.error('Error starting campaign:', error);
      toast.error('Failed to start campaign');
    } finally {
      setLoadingActions(prev => ({ ...prev, [campaignId]: null }));
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    setLoadingActions(prev => ({ ...prev, [campaignId]: 'pausing' }));
    try {
      await pauseCampaign(campaignId);
      await updateCampaignStatus(campaignId, 'paused');
      toast.success('Campaign paused successfully');
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast.error('Failed to pause campaign');
    } finally {
      setLoadingActions(prev => ({ ...prev, [campaignId]: null }));
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    setLoadingActions(prev => ({ ...prev, [campaignId]: 'resuming' }));
    try {
      await resumeCampaign(campaignId);
      await updateCampaignStatus(campaignId, 'active');
      toast.success('Campaign resumed successfully');
    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast.error('Failed to resume campaign');
    } finally {
      setLoadingActions(prev => ({ ...prev, [campaignId]: null }));
    }
  };

  const handleStopCampaign = async (campaignId: string) => {
    setLoadingActions(prev => ({ ...prev, [campaignId]: 'stopping' }));
    try {
      await stopCampaign(campaignId);
      await updateCampaignStatus(campaignId, 'completed');
      toast.success('Campaign stopped successfully');
    } catch (error) {
      console.error('Error stopping campaign:', error);
      toast.error('Failed to stop campaign');
    } finally {
      setLoadingActions(prev => ({ ...prev, [campaignId]: null }));
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

  // Get character count and SMS segments
  const getMessageStats = (message: string) => {
    const charCount = message.length;
    const segments = Math.ceil(charCount / 160);
    const encoding = charCount > 160 ? 'USC2' : 'GSM-7';
    return { charCount, segments, encoding };
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
                  Set up a new SMS campaign with advanced message variations and scheduling options
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
                        {(messages || []).map((message: SavedMessage) => (
                          <SelectItem key={message._id} value={message._id}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{message.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {message.category} • {message.baseMessage ? `${message.baseMessage.substring(0, 30)}...` : 'No base message'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Message Variation Type Selection */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Message Variation Strategy
                  </h3>
                  
                  <RadioGroup 
                    value={messageVariationType} 
                    onValueChange={handleVariationTypeChange}
                    className="space-y-3"
                  >
                  {/* Single Variant Option */}
                  {/* Single Variant Option */}
                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="single_variant" id="single_variant" />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="single_variant" className="flex items-center gap-2 font-medium cursor-pointer">
                        <FileText className="h-4 w-4" />
                        Single Message Variant
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Send the same message content to all recipients
                      </p>
                      
                      {messageVariationType === "single_variant" && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="customMessage">Message Content *</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleCheckSpam(customMessageContent)}
                                disabled={checkingSpam || !customMessageContent.trim()}
                              >
                                {checkingSpam ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Shield className="h-3 w-3 mr-1" />
                                )}
                                {checkingSpam ? 'Checking...' : 'Check Spam'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOptimizeMessage(customMessageContent)}
                                disabled={optimizingMessage || !customMessageContent.trim()}
                              >
                                {optimizingMessage ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Wand2 className="h-3 w-3 mr-1" />
                                )}
                                {optimizingMessage ? 'Optimizing...' : 'Optimize'}
                              </Button>
                              {selectedAIMessage && (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleUseBaseMessage}
                                    disabled={!selectedAIMessage.baseMessage}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Use Base
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleUseOriginalPrompt}
                                    disabled={!selectedAIMessage.originalPrompt}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Use Prompt
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <Textarea 
                            id="customMessage"
                            placeholder="Enter your SMS message here..."
                            className="min-h-[100px] font-mono text-sm"
                            value={customMessageContent}
                            onChange={(e) => handleCustomMessageChange(e.target.value)}
                          />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{getMessageStats(customMessageContent).charCount} characters</span>
                            <span>{getMessageStats(customMessageContent).segments} SMS segment(s)</span>
                            <span className={getMessageStats(customMessageContent).encoding === 'USC2' ? 'text-amber-600' : ''}>
                              {getMessageStats(customMessageContent).encoding} encoding
                            </span>
                          </div>

                          {/* Optimization Result */}
                          {optimizationResult && (
                            <div className="mt-4 p-4 border rounded-lg bg-green-50 border-green-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium flex items-center gap-2 text-green-800">
                                  <Wand2 className="h-4 w-4" />
                                  Message Optimized Successfully!
                                </h4>
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  {optimizationResult.improvement}% Improved
                                </Badge>
                              </div>

                              {/* Before/After Comparison */}
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <Label className="text-xs font-medium text-red-600 mb-1">Before (Spam Score: {optimizationResult.originalSpamScore}/10)</Label>
                                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 max-h-20 overflow-y-auto">
                                    {optimizationResult.beforeAfterAnalysis?.originalMessage || customMessageContent}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-green-600 mb-1">After (Spam Score: {optimizationResult.optimizedSpamScore}/10)</Label>
                                  <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800 max-h-20 overflow-y-auto">
                                    {optimizationResult.optimizedMessage}
                                  </div>
                                </div>
                              </div>

                              {/* Changes Made */}
                              {optimizationResult.changesMade && optimizationResult.changesMade.length > 0 && (
                                <div className="mb-3">
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-1 text-green-700">
                                    <CheckCircle className="h-3 w-3" />
                                    Improvements Applied:
                                  </h5>
                                  <ul className="text-xs text-green-600 space-y-1">
                                    {optimizationResult.changesMade.map((change, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        {change}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleApplyOptimization}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Use Optimized
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleRevertToOriginal}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Revert to Original
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Spam Analysis Results */}
                          {spamAnalysis && !optimizationResult && (
                            <div className="mt-4 p-4 border rounded-lg bg-slate-50">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Spam Analysis Results
                                </h4>
                                <Badge 
                                  variant={
                                    spamAnalysis.riskLevel === 'Low' ? 'default' :
                                    spamAnalysis.riskLevel === 'Medium' ? 'secondary' :
                                    spamAnalysis.riskLevel === 'High' ? 'destructive' : 'destructive'
                                  }
                                  className="capitalize"
                                >
                                  {spamAnalysis.riskLevel} Risk
                                </Badge>
                              </div>

                              {/* Spam Score Bar */}
                              <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Spam Score: {spamAnalysis.spamScore}/10</span>
                                  <span className={
                                    spamAnalysis.spamScore <= 3 ? 'text-green-600' :
                                    spamAnalysis.spamScore <= 6 ? 'text-amber-600' : 'text-red-600'
                                  }>
                                    {spamAnalysis.spamScore <= 3 ? 'Good' :
                                    spamAnalysis.spamScore <= 6 ? 'Moderate' : 'Poor'}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      spamAnalysis.spamScore <= 3 ? 'bg-green-500' :
                                      spamAnalysis.spamScore <= 6 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${(spamAnalysis.spamScore / 10) * 100}%` }}
                                  />
                                </div>
                              </div>

                              {/* Key Indicators */}
                              {spamAnalysis.spamIndicators && spamAnalysis.spamIndicators.length > 0 && (
                                <div className="mb-3">
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Spam Indicators Found:
                                  </h5>
                                  <ul className="text-xs text-muted-foreground space-y-1">
                                    {spamAnalysis.spamIndicators.map((indicator, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-amber-600 mt-0.5">•</span>
                                        {indicator}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Improvement Suggestions */}
                              {spamAnalysis.improvementSuggestions && spamAnalysis.improvementSuggestions.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Improvement Suggestions:
                                  </h5>
                                  <ul className="text-xs text-muted-foreground space-y-1">
                                    {spamAnalysis.improvementSuggestions.map((suggestion, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-green-600 mt-0.5">•</span>
                                        {suggestion}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Carrier Risk */}
                              <div className="mt-3 pt-3 border-t text-xs">
                                <div className="flex justify-between">
                                  <span>Carrier Filter Risk:</span>
                                  <Badge 
                                    variant={
                                      spamAnalysis.carrierFilterRisk === 'Low' ? 'default' :
                                      spamAnalysis.carrierFilterRisk === 'Medium' ? 'secondary' : 'destructive'
                                    }
                                  >
                                    {spamAnalysis.carrierFilterRisk}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                    {/* Multiple Variants Option */}
                    <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                      <RadioGroupItem 
                        value="multiple_variants" 
                        id="multiple_variants" 
                        disabled={!selectedMessageId || messageVariants.length === 0}
                      />
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="multiple_variants" className="flex items-center gap-2 font-medium cursor-pointer">
                          <Shuffle className="h-4 w-4" />
                          Multiple AI Variants
                          {selectedMessageId && messageVariants.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {messageVariants.length} variants
                            </Badge>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Rotate between different AI-generated message variants
                        </p>
                        
                        {!selectedMessageId && (
                          <Alert className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Select an AI message above to enable multiple variants
                            </AlertDescription>
                          </Alert>
                        )}

                        {messageVariationType === "multiple_variants" && selectedMessageId && (
                          <div className="mt-3 space-y-2">
                            <Label htmlFor="messageVariant">Select Variant to Preview</Label>
                            <Select 
                              value={selectedVariantId}
                              onValueChange={handleVariantSelect}
                              disabled={loadingVariants}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  loadingVariants ? "Loading variants..." : "Select a variant to preview..."
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {messageVariants.map((variant) => (
                                  <SelectItem key={variant._id} value={variant._id}>
                                    <div className="flex flex-col items-start">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium capitalize">{variant.tone}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {variant.characterCount} chars
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                        {variant.content.substring(0, 60)}...
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {selectedVariantId && (
                              <div className="mt-3 p-3 bg-muted rounded-lg">
                                <Label className="text-sm font-medium">Preview Selected Variant</Label>
                                <div className="mt-2 p-3 bg-background rounded border">
                                  <p className="text-sm whitespace-pre-wrap">{customMessageContent}</p>
                                </div>
                                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                  <span>{getMessageStats(customMessageContent).charCount} characters</span>
                                  <span>{getMessageStats(customMessageContent).segments} SMS segment(s)</span>
                                </div>
                              </div>
                            )}
                            
                            {loadingVariants && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading message variants...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Random Generation Option */}
                    <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                      <RadioGroupItem 
                        value="ai_random" 
                        id="ai_random" 
                        disabled={!selectedAIMessage}
                      />
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="ai_random" className="flex items-center gap-2 font-medium cursor-pointer">
                          <Wand2 className="h-4 w-4" />
                          AI Random Generation
                          {selectedAIMessage && (
                            <Badge variant="secondary" className="ml-2">
                              Using: {selectedAIMessage.name}
                            </Badge>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Generate unique AI messages for each contact using your selected AI message
                        </p>
                        
                        {!selectedAIMessage && (
                          <Alert className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Select an AI message above to enable random generation
                            </AlertDescription>
                          </Alert>
                        )}

                        {messageVariationType === "ai_random" && selectedAIMessage && (
                          <div className="mt-3 space-y-3">
                            {/* Original Prompt Preview */}
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-blue-900 mb-1">Original Prompt</h4>
                                  <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                    {selectedAIMessage.originalPrompt}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Base Message Preview */}
                            {selectedAIMessage.baseMessage && (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <MessageCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium text-green-900 mb-1">Base Message</h4>
                                    <p className="text-sm text-green-800 whitespace-pre-wrap">
                                      {selectedAIMessage.baseMessage}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Settings Preview */}
                            {selectedAIMessage.settings && Object.keys(selectedAIMessage.settings).length > 0 && (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <Eye className="h-4 w-4 text-amber-600 mt-0.5" />
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium text-amber-900 mb-1">AI Settings</h4>
                                    <div className="text-xs text-amber-800 space-y-1">
                                      {Object.entries(selectedAIMessage.settings).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                          <span className="capitalize">{key}:</span>
                                          <span>{String(value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Schedule Settings and other sections remain the same */}
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
                  disabled={!campaignForm.name || !campaignForm.message_content || !campaignForm.device || isCreatingCampaign}
                >
                  {isCreatingCampaign ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Rest of the component remains the same */}
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
                        {/* <TableHead>Daily Limit</TableHead> */}
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign: Campaign) => {
                        console.log("campaign_campaign",campaign)
                        const assignedDevice = campaign.device as any
                        const progress = getCampaignProgress(campaign);
                        const deliveryRate = getDeliveryRate(campaign);
                        const campaignLoading = loadingActions[campaign._id];
                        
                        return (
                          <TableRow key={campaign._id}>
                            <TableCell>
                              <div className="space-y-2">
                                {/* Campaign Name */}
                                <div className="font-semibold text-sm">{campaign.name}</div>

                                {/* Message Preview */}
                                {(campaign.messagePreview || campaign.messageContent) && (
                                  <div className="text-xs text-muted-foreground/80 line-clamp-2 max-w-md leading-relaxed">
                                    {campaign.messagePreview || campaign.messageContent?.substring(0, 80) + '...'}
                                  </div>
                                )}

                                {/* Status Badges */}
                                {(campaign.taskSettings?.messageVariantType === 'ai_random' || 
                                  campaign.pauseReason === 'daily_limit_reached' || 
                                  campaign.pauseReason === 'resume_requested') && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {campaign.taskSettings?.messageVariantType === 'ai_random' && (
                                      <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 text-xs border-purple-200 text-purple-700 bg-purple-50">
                                        <Zap className="h-3 w-3" />
                                        AI Variants
                                      </Badge>
                                    )}

                                    {campaign.pauseReason === 'daily_limit_reached' && (
                                      <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border-amber-200">
                                        <AlertTriangle className="h-3 w-3" />
                                        Daily Limit
                                      </Badge>
                                    )}

                                    {campaign.pauseReason === "resume_requested" && (
                                      <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0.5 text-xs bg-sky-50 text-sky-700 border-sky-200">
                                        <RotateCcw className="h-3 w-3" />
                                        Resuming
                                      </Badge>
                                    )}
                                  </div>
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
                            {/* <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {campaign.taskSettings?.dailyMessageLimit || 300}/day
                              </div>
                            </TableCell> */}
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
                                    disabled={!isConnected || !!campaignLoading}
                                  >
                                    {campaignLoading === 'starting' ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Play className="h-3 w-3 mr-1" />
                                    )}
                                    {campaignLoading === 'starting' ? 'Starting...' : 'Start'}
                                  </Button>
                                )}
                                {campaign.status === 'active' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePauseCampaign(campaign._id)}
                                      disabled={!isConnected || !!campaignLoading}
                                    >
                                      {campaignLoading === 'pausing' ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <Pause className="h-3 w-3 mr-1" />
                                      )}
                                      {campaignLoading === 'pausing' ? 'Pausing...' : 'Pause'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStopCampaign(campaign._id)}
                                      disabled={!!campaignLoading}
                                    >
                                      {campaignLoading === 'stopping' ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <StopCircle className="h-3 w-3 mr-1" />
                                      )}
                                      {campaignLoading === 'stopping' ? 'Stopping...' : 'Stop'}
                                    </Button>
                                  </>
                                )}
                                {campaign.status === 'paused' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleResumeCampaign(campaign._id)}
                                      disabled={!isConnected || !!campaignLoading}
                                    >
                                      {campaignLoading === 'resuming' ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <CirclePlay className="h-3 w-3 mr-1" />
                                      )}
                                      {campaignLoading === 'resuming' ? 'Resuming...' : 'Resume'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStopCampaign(campaign._id)}
                                      disabled={!!campaignLoading}
                                    >
                                      {campaignLoading === 'stopping' ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <StopCircle className="h-3 w-3 mr-1" />
                                      )}
                                      {campaignLoading === 'stopping' ? 'Stopping...' : 'Stop'}
                                    </Button>
                                  </>
                                )}
                                {/* Replace Edit button with View button */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewCampaign(campaign)}
                                  disabled={!!campaignLoading}
                                >
                                  <Eye className="h-3 w-3" />
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

        {/* Campaign Details Dialog */}
        <CampaignDetailsDialog
          campaign={selectedCampaign}
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
        />

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