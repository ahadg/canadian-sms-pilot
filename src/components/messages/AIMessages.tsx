import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Wand2, 
  Save, 
  Copy, 
  AlertTriangle, 
  MessageSquare,
  Target,
  Settings,
  Sparkles,
  Download,
  Plus,
  X,
  Eye,
  ThumbsUp,
  Edit3,
  Trash2,
  RefreshCw,
  Globe,
  Languages,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Check,
  FileText,
  Zap,
  MapPin,
  Mail,
  Phone,
  Link,
  AlertCircle
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { messageAPI } from "@/lib/api/messages";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MessageVariant {
  _id?: string;
  id: string;
  content: string;
  tone: string;
  language: string;
  characterCount: number;
  spamScore: number;
  encoding: string;
  cost: number;
  createdAt: string;
}

interface SavedMessage {
  _id: string;
  id: string;
  name: string;
  category: string;
  originalPrompt: string;
  baseMessage: string;
  variants: MessageVariant[];
  settings: GenerationSettings;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
}

interface GenerationSettings {
  variantCount: number;
  characterLimit: number;
  tones: string[];
  languages: string[];
  creativityLevel: number;
  includeEmojis: boolean;
  companyName: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  unsubscribeText: string;
  customInstructions: string;
}

const DEFAULT_SETTINGS: GenerationSettings = {
  variantCount: 5,
  characterLimit: 160,
  tones: ['Professional', 'Friendly'],
  languages: ['English'],
  creativityLevel: 0.7,
  includeEmojis: false,
  companyName: 'Your Company',
  unsubscribeText: 'Reply STOP to unsubscribe',
  customInstructions: ''
};

const TONE_OPTIONS = ['Professional', 'Friendly', 'Casual', 'Urgent', 'Formal', 'Conversational'];
const LANGUAGE_OPTIONS = ['English', 'French', 'Spanish', 'German'];
const CATEGORY_OPTIONS = ["Notification","Alert",'Promotional', 'Transactional', 'Reminder', 'Welcome', 'Survey', 'Update'];
const DEFAULT_CATEGORY = "Notification";

// MongoDB database operations using your API routes
const messageDatabase = {
  // Save message with variants
  saveMessage: async (message: any): Promise<any> => {
    try {
      let response = await messageAPI.create({
        name: message.name,
        category: message.category,
        originalPrompt: message.originalPrompt,
        baseMessage: message.baseMessage,
        settings: message.settings,
        isTemplate: message.isTemplate,
        variants: message.variants
      });
      response = response.data;
      console.log("saveMessage_response",response)

      await messageAPI.createVariant(response.message._id, message.variants);

      return {
        _id: response.message._id,
        id: response.message._id,
        name: response.message.name,
        category: response.message.category,
        originalPrompt: response.message.originalPrompt,
        baseMessage: response.message.baseMessage,
        variants: message.variants,
        settings: response.message.settings,
        createdAt: response.message.createdAt,
        updatedAt: response.message.updatedAt,
        isTemplate: response.message.isTemplate,
      };
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  },

  // Update message with variants
  updateMessage: async (id: string, message: Partial<any>): Promise<any> => {
    try {
      let response = await messageAPI.update(id, {
        name: message.name,
        category: message.category,
        originalPrompt: message.originalPrompt,
        baseMessage: message.baseMessage,
        settings: message.settings,
        isTemplate: message.isTemplate,
        variants: message.variants
      });
      response = response.data;
      return {
        _id: response.message._id,
        id: response.message._id,
        name: response.message.name,
        category: response.message.category,
        originalPrompt: response.message.originalPrompt,
        baseMessage: response.message.baseMessage,
        variants: message.variants || [],
        settings: response.message.settings,
        createdAt: response.message.createdAt,
        updatedAt: response.message.updatedAt,
        isTemplate: response.message.isTemplate,
      };
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  },

  // Get all messages with variants
  getAllMessages: async (): Promise<SavedMessage[]> => {
    try {
      const response = await messageAPI.getAll();
      console.log("response_messages_with_variants",response)
      return response.data.messages.map((message: any) => ({
        _id: message._id,
        id: message._id,
        name: message.name,
        category: message.category,
        originalPrompt: message.originalPrompt,
        baseMessage: message.baseMessage,
        variants: message.variants || [],
        settings: message.settings,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        isTemplate: message.isTemplate,
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Delete message and its variants
  deleteMessage: async (id: string): Promise<void> => {
    try {
      await messageAPI.delete(id);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },
};

export function AIMessages() {
  const [activeTab, setActiveTab] = useState('generate');
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<SavedMessage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { isAuthenticated } = useAuthStore();
  
  // Form states
  const [messageName, setMessageName] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [prompt, setPrompt] = useState('');
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [generatedVariants, setGeneratedVariants] = useState<MessageVariant[]>([]);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [generatorErrors, setGeneratorErrors] = useState<{
    messageName?: string;
    prompt?: string;
    companyName?: string;
    companyAddress?: string;
  }>({});

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedMessages();
    }
  }, [isAuthenticated]);

  const loadSavedMessages = async () => {
    try {
      const messages = await messageDatabase.getAllMessages();
      setSavedMessages(messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const generateVariants = async () => {
    const errors: typeof generatorErrors = {};

    if (!messageName.trim()) {
      errors.messageName = "Message name is required";
    }

    if (!prompt.trim()) {
      errors.prompt = "Message prompt is required";
    }

    if (!settings.companyName.trim()) {
      errors.companyName = "Company name is required";
    }

    if (!settings.companyAddress?.trim()) {
      errors.companyAddress = "Company address is required";
    }

    setGeneratorErrors(errors);

    if (Object.keys(errors).length > 0) return;
    
    setIsGenerating(true);
    
    try {
      const response = await messageAPI.generateVariants({
        prompt,
        variantCount: settings.variantCount,
        characterLimit: settings.characterLimit,
        tones: settings.tones,
        languages: settings.languages,
        creativityLevel: settings.creativityLevel,
        includeEmojis: settings.includeEmojis,
        companyName: settings.companyName,
        companyAddress: settings.companyAddress,
        companyEmail: settings.companyEmail,
        companyPhone: settings.companyPhone,
        companyWebsite: settings.companyWebsite,
        unsubscribeText: settings.unsubscribeText,
        customInstructions: settings.customInstructions,
        category,
      });
  
      setGeneratedVariants(response.data.variants);
    } catch (error) {
      console.error('Failed to generate variants:', error);
      alert('Failed to generate variants. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveMessage = async (asTemplate = false) => {
    if (!messageName.trim() || generatedVariants.length === 0) return;
    
    setIsSaving(true);
    
    try {
      const messageData = {
        name: messageName,
        category: category || 'General',
        originalPrompt: prompt,
        baseMessage: generatedVariants[0]?.content || '',
        variants: generatedVariants,
        settings,
        isTemplate: asTemplate
      };

      let savedMessage: SavedMessage;
      
      if (selectedMessage) {
        savedMessage = await messageDatabase.updateMessage(selectedMessage._id, messageData);
      } else {
        savedMessage = await messageDatabase.saveMessage(messageData);
      }
      
      await loadSavedMessages();
      
      if (!selectedMessage) {
        resetForm();
      }
      
      console.log(`${asTemplate ? 'Template' : 'Message'} saved successfully!`);
      toast({ title: "Success", description: "Saved successfully" });
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadTemplate = (message: SavedMessage) => {
    setMessageName(message.name);
    setCategory(message.category);
    setPrompt(message.originalPrompt);
    setSettings(message.settings);
    setGeneratedVariants(message.variants);
    setSelectedMessage(message);
    setActiveTab('generate');
  };

  const resetForm = () => {
    setMessageName('');
    setCategory(DEFAULT_CATEGORY);
    setPrompt('');
    setSettings(DEFAULT_SETTINGS);
    setGeneratedVariants([]);
    setSelectedMessage(null);
  };

  const deleteMessage = async (id: string) => {
    try {
      await messageDatabase.deleteMessage(id);
      await loadSavedMessages();
      if (selectedMessage?._id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const toggleMessageExpansion = (id: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMessages(newExpanded);
  };

  const updateSettings = (key: keyof GenerationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === "companyName" || key === "companyAddress") {
      setGeneratorErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  const getToneColor = (tone: string) => {
    const colors = {
      'Professional': 'bg-blue-100 text-blue-800',
      'Friendly': 'bg-green-100 text-green-800',
      'Casual': 'bg-purple-100 text-purple-800',
      'Urgent': 'bg-red-100 text-red-800',
      'Formal': 'bg-gray-100 text-gray-800',
      'Conversational': 'bg-yellow-100 text-yellow-800'
    };
    return colors[tone as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSpamScoreColor = (score: number) => {
    if (score <= 2) return 'text-green-600';
    if (score <= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const templates = savedMessages.filter(m => m.isTemplate);
  const messages = savedMessages.filter(m => !m.isTemplate);

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground">Please sign in to access the AI Message Generator</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Message Generator</h1>
          <p className="text-muted-foreground">
            Create intelligent SMS messages with AI-powered variants for your campaigns
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generate Messages</TabsTrigger>
          <TabsTrigger value="messages">Saved Messages ({messages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Settings Panel */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Message Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Message Name *</Label>
                      <Input
                        value={messageName}
                        onChange={(e) => {
                          setMessageName(e.target.value);
                          setGeneratorErrors(prev => ({ ...prev, messageName: undefined }));
                        }}
                        placeholder="e.g., Black Friday Sale"
                        required
                        className={cn(generatorErrors.messageName && "border-destructive focus-visible:ring-destructive")}
                      />
                      {generatorErrors.messageName && (
                        <p className="mt-1 text-sm text-destructive">{generatorErrors.messageName}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Company Name *</Label>
                    <Input
                      value={settings.companyName}
                      onChange={(e) => updateSettings('companyName', e.target.value)}
                      placeholder="Your Company Name"
                      required
                      className={cn(generatorErrors.companyName && "border-destructive focus-visible:ring-destructive")}
                    />
                    {generatorErrors.companyName && (
                      <p className="mt-1 text-sm text-destructive">{generatorErrors.companyName}</p>
                    )}
                  </div>

                  <div>
                    <Label>Unsubscribe Text *</Label>
                    <Input
                      value={settings.unsubscribeText}
                      onChange={(e) => updateSettings('unsubscribeText', e.target.value)}
                      placeholder="Reply STOP to unsubscribe"
                      required
                    />
                  </div>

                  {/* Contact Information Section - Always Visible */}
                  <div className="pt-4 border-t">
                    {/* <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      <Label className="text-base font-semibold text-amber-600">
                        Contact Information (Recommended for CASL Compliance)
                      </Label>
                    </div> */}
                    <p className="text-sm text-muted-foreground mb-4">
                      Adding contact details ensures CASL compliance and builds trust with recipients.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <Label className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          Company Address
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            Required
                          </Badge>
                        </Label>
                        <Input
                          value={settings.companyAddress || ''}
                          onChange={(e) => updateSettings('companyAddress', e.target.value)}
                          placeholder="123 Main St, City, Province, Postal Code"
                          className={cn(
                            "mt-1",
                            generatorErrors.companyAddress && "border-destructive focus-visible:ring-destructive"
                          )}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Required for CASL-friendly sender identification
                        </p>
                        {generatorErrors.companyAddress && (
                          <p className="mt-1 text-sm text-destructive">{generatorErrors.companyAddress}</p>
                        )}
                      </div>

                      <div>
                        <Label className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </Label>
                        <Input
                          type="email"
                          value={settings.companyEmail || ''}
                          onChange={(e) => updateSettings('companyEmail', e.target.value)}
                          placeholder="contact@company.com"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </Label>
                        <Input
                          value={settings.companyPhone || ''}
                          onChange={(e) => updateSettings('companyPhone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2 text-sm">
                          <Link className="h-4 w-4" />
                          Website
                        </Label>
                        <Input
                          value={settings.companyWebsite || ''}
                          onChange={(e) => updateSettings('companyWebsite', e.target.value)}
                          placeholder="https://company.com"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Number of Variants: {settings.variantCount}</Label>
                    <Slider
                      value={[settings.variantCount]}
                      onValueChange={([value]) => updateSettings('variantCount', value)}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Character Limit: {settings.characterLimit}</Label>
                    <Slider
                      value={[settings.characterLimit]}
                      onValueChange={([value]) => updateSettings('characterLimit', value)}
                      min={50}
                      max={500}
                      step={10}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Tones</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {TONE_OPTIONS.map(tone => (
                        <Badge
                          key={tone}
                          variant={settings.tones.includes(tone) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const newTones = settings.tones.includes(tone)
                              ? settings.tones.filter(t => t !== tone)
                              : [...settings.tones, tone];
                            updateSettings('tones', newTones);
                          }}
                        >
                          {tone}
                          {settings.tones.includes(tone) && <Check className="h-3 w-3 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Languages</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {LANGUAGE_OPTIONS.map(lang => (
                        <Badge
                          key={lang}
                          variant={settings.languages.includes(lang) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const newLangs = settings.languages.includes(lang)
                              ? settings.languages.filter(l => l !== lang)
                              : [...settings.languages, lang];
                            updateSettings('languages', newLangs);
                          }}
                        >
                          {lang}
                          {settings.languages.includes(lang) && <Check className="h-3 w-3 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-emojis"
                      checked={settings.includeEmojis}
                      onChange={(e) => updateSettings('includeEmojis', e.target.checked)}
                    />
                    <Label htmlFor="include-emojis">Include Emojis</Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generation Panel */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Generate AI Messages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Message Prompt *</Label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        setGeneratorErrors(prev => ({ ...prev, prompt: undefined }));
                      }}
                      placeholder="Describe the message you want to create. E.g., 'Create a promotional message for a 20% discount on all products, valid for today only.'"
                      className={cn(
                        "min-h-[100px] mt-2",
                        generatorErrors.prompt && "border-destructive focus-visible:ring-destructive"
                      )}
                      required
                    />
                    {generatorErrors.prompt && (
                      <p className="mt-1 text-sm text-destructive">{generatorErrors.prompt}</p>
                    )}
                  </div>

                  <div>
                    <Label>Custom Instructions (Optional)</Label>
                    <Textarea
                      value={settings.customInstructions}
                      onChange={(e) => updateSettings('customInstructions', e.target.value)}
                      placeholder="Any specific requirements or style preferences..."
                      className="min-h-[60px] mt-2"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={generateVariants} 
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating {settings.variantCount} variants...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate {settings.variantCount} Variants
                        </>
                      )}
                    </Button>
                    
                    {generatedVariants.length > 0 && (
                      <Button onClick={generateVariants} variant="outline" disabled={isGenerating}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Generated Variants */}
                  {generatedVariants.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Generated Variants ({generatedVariants.length})</h3>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => saveMessage(false)} 
                            disabled={isSaving || !messageName.trim()}
                            size="sm"
                          >
                            {isSaving ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Message
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid gap-3">
                        {generatedVariants.map((variant, index) => (
                          <div key={variant.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex gap-2 flex-wrap">
                                <Badge className="text-xs">#{index + 1}</Badge>
                                <Badge variant="secondary" className={getToneColor(variant.tone)}>
                                  {variant.tone}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Globe className="h-3 w-3 mr-1" />
                                  {variant.language}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {variant.characterCount}/{settings.characterLimit} chars
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {variant.encoding}
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${getSpamScoreColor(variant.spamScore)}`}>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Spam: {variant.spamScore.toFixed(1)}
                                </Badge>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(variant.content)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm bg-muted p-3 rounded">{variant.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Messages</p>
                    <p className="text-2xl font-bold">{messages.length}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Variants</p>
                    <p className="text-2xl font-bold">
                      {messages.reduce((sum, m) => sum + m.variants.length, 0)}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Variants</p>
                    <p className="text-2xl font-bold">
                      {messages.length > 0 ? Math.round(messages.reduce((sum, m) => sum + m.variants.length, 0) / messages.length) : 0}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold">
                      {new Set(messages.map(m => m.category)).size}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first AI-generated message to get started</p>
                  <Button onClick={() => setActiveTab('generate')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Message
                  </Button>
                </CardContent>
              </Card>
            ) : (
              messages.map((message) => (
                <Card key={message._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          {message.name}
                        </CardTitle>
                        <Badge variant="outline">{message.category}</Badge>
                        <Badge variant="secondary">{message.variants.length} variants</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleMessageExpansion(message._id)}
                        >
                          {expandedMessages.has(message._id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => loadTemplate(message)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMessage(message._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Original Prompt</Label>
                        <p className="text-sm text-muted-foreground mt-1">{message.originalPrompt}</p>
                      </div>
                      
                      {expandedMessages.has(message._id) && (
                        <div>
                          <Label className="text-sm font-medium">Message Variants</Label>
                          <div className="mt-2 space-y-2">
                            {message.variants.map((variant, index) => (
                              <div key={variant.id} className="p-3 border rounded-md">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex gap-2 flex-wrap">
                                    <Badge className="text-xs">#{index + 1}</Badge>
                                    <Badge variant="secondary" className={getToneColor(variant.tone)}>
                                      {variant.tone}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {variant.characterCount} chars
                                    </Badge>
                                    <Badge variant="outline" className={`text-xs ${getSpamScoreColor(variant.spamScore)}`}>
                                      Spam: {variant.spamScore.toFixed(1)}
                                    </Badge>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => copyToClipboard(variant.content)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-sm bg-muted p-2 rounded">{variant.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Created: {new Date(message.createdAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(message.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
