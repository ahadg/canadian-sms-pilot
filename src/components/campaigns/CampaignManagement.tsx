import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Send,
  Plus,
  Play,
  Loader2,
  Calendar,
  Clock,
  Zap,
  MessageCircle,
  Smartphone,
} from "lucide-react";

import { Device, useCampaigns } from "@/hooks/useCampaigns";
import { toast } from "sonner";
import { messageAPI, MessageVariant, SavedMessage } from "@/lib/api/messages";
import { contactAPI } from "@/lib/api/contacts";
import { Campaign, campaignAPI } from "@/lib/api/campaign";
import { useSocketStore } from "@/store/useSocketStore";
import { useContactStore } from "@/store/useContactStore";
import { ContactManagement } from "./ContactManagement";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CampaignDetailsDialog } from "./CampaignDetailsDialog";
import { CampaignStats } from "./CampaignStats";
import { CampaignTable } from "./CampaignTable";
import { MessageVariationSection } from "./MessageVariationSection";
import { EditCampaignDialog } from "./EditCampaignDialog";
import {  Sun, Moon } from "lucide-react";

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
  //dailyMessageLimit: 300,
  messageVariantType: "static" as "static" | "ai_random",
  useAiGeneration: false,
  aiPrompt: "",
  timeRestrictions: {
    enabled: false,
    startHour: 9,
    endHour: 17,
    timezone: 'America/Toronto'
  }
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
    startCampaignProcessing,
    fetchCampaigns
  } = useCampaigns();

  const {
    contactLists,
    refreshContactLists
  } = useContactStore();
  
  console.log("contactLists",contactLists)
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updatingCampaign, setUpdatingCampaign] = useState(false);

  const [timeRestrictions, setTimeRestrictions] = useState({
    enabled: false,
    startHour: 9,
    endHour: 17,
    timezone: 'America/Toronto'
  });

  const resetCreateForm = () => {
    setCampaignForm({
      name: '',
      message_content: CANADIAN_SMS_TEMPLATE,
      contactList: '',
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
    setSendingInterval({ min: 30000, max: 90000 });
    // Reset time restrictions
    setTimeRestrictions({
      enabled: false,
      startHour: 9,
      endHour: 17,
      timezone: 'America/Toronto'
    });
  };

  // Add this handler function
  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCampaign = async (campaignId: string, updates: any) => {
    setUpdatingCampaign(true);
    try {
      await campaignAPI.update(campaignId, updates);
      toast.success('Campaign updated successfully');
      fetchCampaigns()
      setIsEditDialogOpen(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    } finally {
      setUpdatingCampaign(false);
    }
  };



  
  const handleFetchMessageVariants = async (messageId: string): Promise<MessageVariant[]> => {
    try {
      const response = await messageAPI.getVariants(messageId);
      return response.data.variants || [];
    } catch (error) {
      console.error('Error fetching message variants:', error);
      toast.error('Failed to load message variants');
      return [];
    }
  };

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
  //const [dailyMessageLimit, setDailyMessageLimit] = useState(300);
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
  setIsCreatingCampaign(true);
  try {
    const { data: contacts_lists, error: contactsError } = await contactAPI.getListById(campaignForm.contactList);
    console.log("contacts_lists", campaignForm.contactList, contacts_lists);
    
    // Prepare task settings including time restrictions
    const finalTaskSettings = {
      ...taskSettings,
      interval_min: sendingInterval.min,
      interval_max: sendingInterval.max,
      useAiGeneration: messageVariationType === "ai_random",
      aiPrompt: messageVariationType === "ai_random" && selectedAIMessage ? selectedAIMessage.originalPrompt : "",
      baseMessage: messageVariationType === "ai_random" && selectedAIMessage ? selectedAIMessage.baseMessage : "",
      selectedVariantId: messageVariationType === "multiple_variants" ? selectedVariantId : null,
      messageVariationType,
      message: selectedAIMessage?._id || null,
      // Add time restrictions
      timeRestrictions: timeRestrictions.enabled ? timeRestrictions : undefined
    };

    const campaignData = {
      name: campaignForm.name,
      messageContent: campaignForm.message_content,
      contactList: campaignForm.contactList || undefined,
      status: campaignForm.status,
      device: campaignForm.device,
      taskSettings: finalTaskSettings,
      totalContacts: contacts_lists?.contactList?.totalContacts || 0,
      sentMessages: 0,
      deliveredMessages: 0,
      failedMessages: 0,
      message: selectedAIMessage?._id
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
    resetCreateForm(); // Use the reset function
      
  } catch (error) {
    console.error('Error creating campaign:', error);
    toast.error('Failed to create campaign');
  }
  setIsCreatingCampaign(false);
};

  // Handle campaign actions with loading states
  const handleStartCampaign = async (campaignId: string) => {
    setLoadingActions(prev => ({ ...prev, [campaignId]: 'starting' }));
    try {
      await startCampaignProcessing(campaignId);
      // await updateCampaignStatus(campaignId, 'active');
      //toast.success('Campaign started successfully');
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
      //await updateCampaignStatus(campaignId, 'paused');
      //toast.success('Campaign paused successfully');
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
      //await updateCampaignStatus(campaignId, 'active');
      //toast.success('Campaign resumed successfully');
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
     //await updateCampaignStatus(campaignId, 'completed');
      //toast.success('Campaign stopped successfully');
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
                {/* Message Variation Section - REPLACED */}
                <MessageVariationSection
                  messageVariationType={messageVariationType}
                  selectedMessageId={selectedMessageId}
                  selectedAIMessage={selectedAIMessage}
                  messageVariants={messageVariants}
                  selectedVariantId={selectedVariantId}
                  loadingVariants={loadingVariants}
                  customMessageContent={customMessageContent}
                  spamAnalysis={spamAnalysis}
                  checkingSpam={checkingSpam}
                  optimizingMessage={optimizingMessage}
                  optimizationResult={optimizationResult}
                  onVariationTypeChange={handleVariationTypeChange}
                  onVariantSelect={handleVariantSelect}
                  onCustomMessageChange={handleCustomMessageChange}
                  onUseBaseMessage={handleUseBaseMessage}
                  onUseOriginalPrompt={handleUseOriginalPrompt}
                  onCheckSpam={handleCheckSpam}
                  onOptimizeMessage={handleOptimizeMessage}
                  onApplyOptimization={handleApplyOptimization}
                  onRevertToOriginal={handleRevertToOriginal}
                />

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
                          min: (parseInt(e.target.value) || 0) * 1000 
                        }))}
                        min="0"
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
                          max: (parseInt(e.target.value) || 0) * 1000 
                        }))}
                        min="0"
                        max="900"
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

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Restrictions (Optional)
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={timeRestrictions.enabled}
                        onCheckedChange={(checked) => setTimeRestrictions(prev => ({ 
                          ...prev, 
                          enabled: checked 
                        }))}
                      />
                      <Label htmlFor="timeRestrictions" className="text-sm font-medium">
                        Restrict sending to specific hours
                      </Label>
                    </div>

                    {timeRestrictions.enabled && (
                      <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                        <div>
                          <Label htmlFor="startHour" className="flex items-center gap-2 mb-2">
                            <Sun className="h-4 w-4" />
                            Start Time
                          </Label>
                          <Select 
                            value={timeRestrictions.startHour.toString()}
                            onValueChange={(value) => setTimeRestrictions(prev => ({ 
                              ...prev, 
                              startHour: parseInt(value) 
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select start hour" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i === 0 ? '12 AM' : 
                                  i === 12 ? '12 PM' : 
                                  i < 12 ? `${i} AM` : `${i - 12} PM`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="endHour" className="flex items-center gap-2 mb-2">
                            <Moon className="h-4 w-4" />
                            End Time
                          </Label>
                          <Select 
                            value={timeRestrictions.endHour.toString()}
                            onValueChange={(value) => setTimeRestrictions(prev => ({ 
                              ...prev, 
                              endHour: parseInt(value) 
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select end hour" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i === 0 ? '12 AM' : 
                                  i === 12 ? '12 PM' : 
                                  i < 12 ? `${i} AM` : `${i - 12} PM`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor="timezone" className="mb-2">Timezone</Label>
                          <Select 
                            value={timeRestrictions.timezone}
                            onValueChange={(value) => setTimeRestrictions(prev => ({ 
                              ...prev, 
                              timezone: value 
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="America/Toronto">Eastern Time (Toronto)</SelectItem>
                              <SelectItem value="America/Vancouver">Pacific Time (Vancouver)</SelectItem>
                              <SelectItem value="America/Edmonton">Mountain Time (Edmonton)</SelectItem>
                              <SelectItem value="America/Winnipeg">Central Time (Winnipeg)</SelectItem>
                              <SelectItem value="America/Halifax">Atlantic Time (Halifax)</SelectItem>
                              <SelectItem value="America/St_Johns">Newfoundland Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <div className="text-sm text-muted-foreground p-3 bg-background rounded border">
                            <div className="font-medium mb-1">Sending Schedule:</div>
                            <div>
                              Messages will only be sent between{' '}
                              <span className="font-semibold">
                                {timeRestrictions.startHour === 0 ? '12 AM' : 
                                timeRestrictions.startHour === 12 ? '12 PM' : 
                                timeRestrictions.startHour < 12 ? `${timeRestrictions.startHour} AM` : `${timeRestrictions.startHour - 12} PM`}
                              </span>{' '}
                              and{' '}
                              <span className="font-semibold">
                                {timeRestrictions.endHour === 0 ? '12 AM' : 
                                timeRestrictions.endHour === 12 ? '12 PM' : 
                                timeRestrictions.endHour < 12 ? `${timeRestrictions.endHour} AM` : `${timeRestrictions.endHour - 12} PM`}
                              </span>{' '}
                              ({timeRestrictions.timezone})
                            </div>
                            <div className="mt-1 text-xs">
                              Campaign will automatically pause outside these hours and resume during allowed times.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
          <CampaignStats campaigns={campaigns} />
        
          <CampaignTable
            campaigns={campaigns}
            loadingActions={loadingActions}
            isConnected={isConnected}
            onStartCampaign={handleStartCampaign}
            onPauseCampaign={handlePauseCampaign}
            onResumeCampaign={handleResumeCampaign}
            onStopCampaign={handleStopCampaign}
            onViewCampaign={handleViewCampaign}
            onCreateCampaign={() => setIsCreateCampaignOpen(true)}
            onEditCampaign={handleEditCampaign} // Add this line

          />
        </TabsContent>

        <EditCampaignDialog
          campaign={editingCampaign}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingCampaign(null);
            // Reset states
            setSpamAnalysis(null);
            setOptimizationResult(null);
          }}
          onSave={handleUpdateCampaign}
          devices={devices}
          messages={messages}
          loading={updatingCampaign}
          onCheckSpam={handleCheckSpam}
          onOptimizeMessage={handleOptimizeMessage}
          onFetchMessageVariants={handleFetchMessageVariants}
        />

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