// components/EditCampaignDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, Smartphone, Calendar, Play, Clock, RotateCcw } from "lucide-react";
import { Campaign } from "@/lib/api/campaign";
import { Device } from "@/hooks/useCampaigns";
import { useContactStore } from "@/store/useContactStore";
import { MessageVariationSection } from "./MessageVariationSection";
import { SavedMessage, MessageVariant } from "@/lib/api/messages";
import { Sun, Moon } from "lucide-react";

interface EditCampaignDialogProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaignId: string, updates: any) => Promise<void>;
  devices: Device[];
  messages: SavedMessage[];
  loading?: boolean;
  onCheckSpam: (messageContent: string) => Promise<void>;
  onOptimizeMessage: (messageContent: string) => Promise<void>;
  onFetchMessageVariants: (messageId: string) => Promise<MessageVariant[]>;
}

// Canadian SMS rules template
const CANADIAN_SMS_TEMPLATE = `Your message here. Reply STOP to unsubscribe.`;

// Default task settings
const defaultTaskSettings = {
  interval_min: 30000,
  interval_max: 90000,
  timeout: 30,
  charset: "UTF-8" as "UTF-8" | "Base64" | "PDU",
  coding: 0 as 0 | 1 | 2,
  sms_type: 0 as 0 | 1 | 2,
  sdr: true,
  fdr: true,
  dr: true,
  //to_all: false,
  sms_count: 100,
  sms_period: 60,
};

// Message variation types
type MessageVariationType = "single_variant" | "multiple_variants" | "ai_random";

export function EditCampaignDialog({
  campaign,
  isOpen,
  onClose,
  onSave,
  devices,
  messages,
  loading = false,
  onCheckSpam,
  onOptimizeMessage,
  onFetchMessageVariants
}: EditCampaignDialogProps) {
  const { contactLists } = useContactStore();
  
  // Form state
  const [editForm, setEditForm] = useState({
    name: '',
    message_content: CANADIAN_SMS_TEMPLATE,
    contactList: '',
    status: 'scheduled' as 'scheduled' | 'active' | 'paused' | 'completed',
    device: '',
  });

  const [timeRestrictions, setTimeRestrictions] = useState({
    enabled: false,
    startHour: 9,
    endHour: 17,
    timezone: 'America/Toronto'
  });

  // Task settings state
  const [taskSettings, setTaskSettings] = useState(defaultTaskSettings);
  const [sendingInterval, setSendingInterval] = useState({
    min: 30000,
    max: 90000
  });

  // Message variation state
  const [selectedMessageId, setSelectedMessageId] = useState<string>('');
  const [selectedAIMessage, setSelectedAIMessage] = useState<SavedMessage | null>(null);
  const [messageVariants, setMessageVariants] = useState<MessageVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [messageVariationType, setMessageVariationType] = useState<MessageVariationType>("single_variant");
  const [customMessageContent, setCustomMessageContent] = useState(CANADIAN_SMS_TEMPLATE);

  // Spam and optimization state
  const [spamAnalysis, setSpamAnalysis] = useState(null);
  const [checkingSpam, setCheckingSpam] = useState(false);
  const [optimizingMessage, setOptimizingMessage] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);

  // Initialize form when campaign changes
  useEffect(() => {
    if (campaign) {
      // Determine message variation type from campaign settings
      const campaignVariationType: MessageVariationType = 
        campaign.taskSettings?.useAiGeneration ? "ai_random" :
        campaign.taskSettings?.selectedVariantId ? "multiple_variants" : "single_variant";

      setEditForm({
        name: campaign.name || '',
        message_content: campaign.messageContent || CANADIAN_SMS_TEMPLATE,
        contactList: campaign.contactList?._id || '',
        status: campaign.status || 'paused',
        device: typeof campaign.device === 'string' ? campaign.device : (campaign.device as any)?._id || '',
      });
      if (campaign.taskSettings?.timeRestrictions) {
        setTimeRestrictions(campaign.taskSettings.timeRestrictions);
      }

      // Initialize task settings from campaign
      if (campaign.taskSettings) {
        setTaskSettings(prev => ({
          ...prev,
          ...campaign.taskSettings,
          charset: campaign.taskSettings.charset || "UTF-8",
          coding: campaign.taskSettings.coding || 0,
          sms_type: campaign.taskSettings.sms_type || 0,
        }));

        setSendingInterval({
          min: campaign.taskSettings.interval_min || 30000,
          max: campaign.taskSettings.interval_max || 90000
        });
      }

      // Initialize message variation state
      setMessageVariationType(campaignVariationType);
      setCustomMessageContent(campaign.messageContent || CANADIAN_SMS_TEMPLATE);
      
      // Set AI message if exists
      if (campaign.message) {
        const aiMessage = messages?.find(msg => msg._id === campaign.message);
        if (aiMessage) {
          setSelectedMessageId(campaign.message);
          setSelectedAIMessage(aiMessage);
          
          // Load variants for AI message
          if (campaignVariationType === "multiple_variants" && campaign.taskSettings?.selectedVariantId) {
            loadMessageVariants(campaign.message, campaign.taskSettings.selectedVariantId);
          } else {
            // Auto-load variants and select the best one
            loadMessageVariants(campaign.message);
          }
        }
      }
    }
  }, [campaign, messages]);

  // Load message variants and auto-select the best variant
  const loadMessageVariants = async (messageId: string, presetVariantId?: string) => {
    setLoadingVariants(true);
    try {
      const variants = await onFetchMessageVariants(messageId);
      setMessageVariants(variants);
      
      let variantToSelect = presetVariantId;

      // If no preset variant ID, auto-select the best variant
      if (!variantToSelect && variants.length > 0) {
        // Strategy: prefer variants with good scores, or just take the first one
        variantToSelect = findBestVariant(variants)?._id || variants[0]._id;
      }

      if (variantToSelect && variants.find(v => v._id === variantToSelect)) {
        setSelectedVariantId(variantToSelect);
        
        // Auto-update message content when variant is selected
        const selectedVariant = variants.find(v => v._id === variantToSelect);
        if (selectedVariant) {
          setCustomMessageContent(selectedVariant.content);
          if (messageVariationType === "multiple_variants") {
            setEditForm(prev => ({
              ...prev,
              message_content: selectedVariant.content
            }));
          }
        }
      } else if (variants.length > 0) {
        // Fallback: select first variant
        setSelectedVariantId(variants[0]._id);
        setCustomMessageContent(variants[0].content);
        if (messageVariationType === "multiple_variants") {
          setEditForm(prev => ({
            ...prev,
            message_content: variants[0].content
          }));
        }
      }
    } catch (error) {
      console.error('Error loading message variants:', error);
      setMessageVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Helper function to find the best variant based on scoring
  const findBestVariant = (variants: MessageVariant[]): MessageVariant | null => {
    if (variants.length === 0) return null;

    // Prefer variants with higher scores if available
    const scoredVariants = variants.filter(v => v.score != null);
    if (scoredVariants.length > 0) {
      return scoredVariants.reduce((best, current) => 
        (current.score || 0) > (best.score || 0) ? current : best
      );
    }

    // Fallback to first variant
    return variants[0];
  };

  const handleSave = async () => {
    if (!campaign) return;
  
    // Check if this is a restart operation
    const isRestart = editForm.status === 'restart';
  
    // Prepare task settings based on message variation type
    const finalTaskSettings = {
      ...taskSettings,
      interval_min: sendingInterval.min,
      interval_max: sendingInterval.max,
      useAiGeneration: messageVariationType === "ai_random",
      aiPrompt: messageVariationType === "ai_random" && selectedAIMessage ? selectedAIMessage.originalPrompt : "",
      baseMessage: messageVariationType === "ai_random" && selectedAIMessage ? selectedAIMessage.baseMessage : "",
      selectedVariantId: messageVariationType === "multiple_variants" ? selectedVariantId : null,
      messageVariationType,
      timeRestrictions: timeRestrictions.enabled ? timeRestrictions : undefined
    };
  
    const updates = {
      name: editForm.name,
      messageContent: editForm.message_content,
      contactList: editForm.contactList || undefined,
      status: isRestart ? 'scheduled' : editForm.status, // Set to scheduled for restart
      device: editForm.device,
      taskSettings: finalTaskSettings,
      message: selectedAIMessage?._id || null,
      // Reset statistics if restarting
      ...(isRestart && {
        sentMessages: 0,
        sentMessagesToday: 0,
        deliveredMessages: 0,
        failedMessages: 0,
        deliveryRate: 0,
        sentCount: 0,
        completedAt: null,
        processingStartedAt: null
      })
    };
  
    await onSave(campaign._id, updates);
  };

  // Message selection handler - FIXED VERSION
  const handleMessageSelect = async (messageId: string) => {
    if (messageId === 'none') {
      setSelectedMessageId('');
      setSelectedAIMessage(null);
      setMessageVariants([]);
      setSelectedVariantId('');
      setMessageVariationType("single_variant");
      setCustomMessageContent(CANADIAN_SMS_TEMPLATE);
      setEditForm(prev => ({ 
        ...prev, 
        message_content: CANADIAN_SMS_TEMPLATE 
      }));
      return;
    }

    setSelectedMessageId(messageId);
    const selectedMessage = messages.find((msg: SavedMessage) => msg._id === messageId);
    setSelectedAIMessage(selectedMessage || null);
    
    // Auto-switch to multiple variants mode when AI message is selected
    setMessageVariationType("multiple_variants");
    
    // Load variants and auto-select the best one
    await loadMessageVariants(messageId);

    // Immediately update the form with base message content as fallback
    if (selectedMessage?.baseMessage) {
      setCustomMessageContent(selectedMessage.baseMessage);
      setEditForm(prev => ({
        ...prev,
        message_content: selectedMessage.baseMessage
      }));
    }
  };

  // Variant selection handler - FIXED to always update message content
  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    
    const selectedVariant = messageVariants.find(v => v._id === variantId);
    if (selectedVariant) {
      setCustomMessageContent(selectedVariant.content);
      // Always update the form message content when variant changes
      setEditForm(prev => ({
        ...prev,
        message_content: selectedVariant.content
      }));
    }
  };

  // Message variation type change handler - FIXED VERSION
  const handleVariationTypeChange = (type: MessageVariationType) => {
    setMessageVariationType(type);
    
    // Update campaign form based on selection
    if (type === "single_variant") {
      // Use custom message content
      setEditForm(prev => ({
        ...prev,
        message_content: customMessageContent
      }));
    } else if (type === "multiple_variants") {
      // Use selected variant content, or base message as fallback
      const selectedVariant = messageVariants.find(v => v._id === selectedVariantId);
      const contentToUse = selectedVariant?.content || selectedAIMessage?.baseMessage || customMessageContent;
      
      setEditForm(prev => ({
        ...prev,
        message_content: contentToUse
      }));
      
      // Update custom message content to match
      setCustomMessageContent(contentToUse);
    } else if (type === "ai_random" && selectedAIMessage) {
      // Use AI random generation - show original prompt in preview
      const contentToUse = selectedAIMessage.originalPrompt || selectedAIMessage.baseMessage || customMessageContent;
      setEditForm(prev => ({
        ...prev,
        message_content: contentToUse
      }));
      setCustomMessageContent(contentToUse);
    }
  };

  // Custom message content change handler - FIXED to handle all variation types
  const handleCustomMessageChange = (content: string) => {
    setCustomMessageContent(content);
    
    // Update form message content based on current variation type
    if (messageVariationType === "single_variant") {
      setEditForm(prev => ({
        ...prev,
        message_content: content
      }));
    }
    // For other types, the form content is managed by variant/ai selection
  };

  // Use base message handler - FIXED to update form content
  const handleUseBaseMessage = () => {
    if (selectedAIMessage?.baseMessage) {
      const baseMessage = selectedAIMessage.baseMessage;
      setCustomMessageContent(baseMessage);
      
      // Update form content based on current variation type
      if (messageVariationType === "single_variant" || messageVariationType === "ai_random") {
        setEditForm(prev => ({
          ...prev,
          message_content: baseMessage
        }));
      }
    }
  };

  // Use original prompt handler - FIXED to update form content
  const handleUseOriginalPrompt = () => {
    if (selectedAIMessage?.originalPrompt) {
      const originalPrompt = selectedAIMessage.originalPrompt;
      setCustomMessageContent(originalPrompt);
      
      // Update form content based on current variation type
      if (messageVariationType === "single_variant" || messageVariationType === "ai_random") {
        setEditForm(prev => ({
          ...prev,
          message_content: originalPrompt
        }));
      }
    }
  };

  // Spam check handler
  const handleCheckSpam = async (messageContent: string) => {
    setCheckingSpam(true);
    try {
      await onCheckSpam(messageContent);
    } finally {
      setCheckingSpam(false);
    }
  };

  // Optimize message handler
  const handleOptimizeMessage = async (messageContent: string) => {
    setOptimizingMessage(true);
    try {
      await onOptimizeMessage(messageContent);
    } finally {
      setOptimizingMessage(false);
    }
  };

  // Apply optimization handler
  const handleApplyOptimization = () => {
    if (optimizationResult) {
      setCustomMessageContent(optimizationResult.optimizedMessage);
      setEditForm(prev => ({
        ...prev,
        message_content: optimizationResult.optimizedMessage
      }));
      setOptimizationResult(null);
    }
  };

  // Revert to original handler
  const handleRevertToOriginal = () => {
    if (optimizationResult) {
      setCustomMessageContent(optimizationResult.originalMessage || customMessageContent);
      setEditForm(prev => ({
        ...prev,
        message_content: optimizationResult.originalMessage || customMessageContent
      }));
      setOptimizationResult(null);
    }
  };

  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
          <DialogDescription>
            Update your campaign settings, message content, and sending configuration
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editCampaignName">Campaign Name *</Label>
              <Input 
                id="editCampaignName" 
                placeholder="Winter Sale 2024"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="editDevice">Device *</Label>
              <Select 
                value={editForm.device}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, device: value }))}
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
              <Label htmlFor="editContactList">Contact List</Label>
              <Select 
                value={editForm.contactList}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, contactList: value }))}
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
              <Label htmlFor="editAiMessage">AI Messages</Label>
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

          {/* Message Variation Section */}
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

          {/* Schedule Settings */}
          <div>
            <Label htmlFor="editStatus">Campaign Status</Label>
            <Select 
              value={editForm.status}
              onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as Campaign['status'] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paused">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Keep Paused
                  </div>
                </SelectItem>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Resume Campaign
                  </div>
                </SelectItem>
                <SelectItem value="scheduled">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule for Later
                  </div>
                </SelectItem>
                {/* Add restart option for completed campaigns */}
                {campaign?.status === 'completed' && (
                  <SelectItem value="restart">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Restart Campaign (Reset Stats)
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* <div className="border-t pt-4">
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
          </div> */}

          {/* Sending Interval Section */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Sending Intervals
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editIntervalMin">Minimum Interval (seconds)</Label>
                <Input 
                  id="editIntervalMin"
                  type="number" 
                  value={sendingInterval.min / 1000}
                  onChange={(e) => setSendingInterval(prev => ({ 
                    ...prev, 
                    min: (parseInt(e.target.value) || 0) * 1000 
                  }))}
                  min="0"
                  max="700"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Minimum: {sendingInterval.min / 1000} seconds
                </div>
              </div>
              <div>
                <Label htmlFor="editIntervalMax">Maximum Interval (seconds)</Label>
                <Input 
                  id="editIntervalMax"
                  type="number" 
                  value={sendingInterval.max / 1000}
                  onChange={(e) => setSendingInterval(prev => ({ 
                    ...prev, 
                    max: (parseInt(e.target.value) || 0) * 1000 
                  }))}
                  min="0"
                  max="700"
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
                <Label htmlFor="editCharset">Character Set</Label>
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
                <Label htmlFor="editCoding">Message Coding</Label>
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

            {/* SMS Type */}
            {/* <div className="mt-3">
              <Label htmlFor="editSmsType">SMS Type</Label>
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
                  <SelectItem value="0">Normal SMS</SelectItem>
                  <SelectItem value="1">Flash SMS</SelectItem>
                  <SelectItem value="2">Unicode SMS</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            {/* Report Settings */}
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="editSdr"
                  checked={taskSettings.sdr}
                  onCheckedChange={(checked) => setTaskSettings(prev => ({ 
                    ...prev, 
                    sdr: checked 
                  }))}
                />
                <Label htmlFor="editSdr" className="text-sm">SDR Report</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editFdr"
                  checked={taskSettings.fdr}
                  onCheckedChange={(checked) => setTaskSettings(prev => ({ 
                    ...prev, 
                    fdr: checked 
                  }))}
                />
                <Label htmlFor="editFdr" className="text-sm">FDR Report</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editDr"
                  checked={taskSettings.dr}
                  onCheckedChange={(checked) => setTaskSettings(prev => ({ 
                    ...prev, 
                    dr: checked 
                  }))}
                />
                <Label htmlFor="editDr" className="text-sm">DR Report</Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700" 
              onClick={handleSave}
              disabled={!editForm.name || !editForm.message_content || !editForm.device || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}