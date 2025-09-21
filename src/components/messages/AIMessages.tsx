import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Plus,
  Wand2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Settings,
  Globe,
  Languages,
  Zap,
  Save,
  Download,
  Sliders,
  Filter,
  Clock,
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Hash,
  RotateCcw,
  Shuffle,
  PieChart,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface MessageVariation {
  id: string;
  original: string;
  variation: string;
  tone: string;
  language: string;
  characterCount: number;
  rating: number;
  isSelected: boolean;
  spamScore?: number;
  encoding?: "GSM-7" | "Unicode";
  cost?: number;
}

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  originalMessage: string;
  variations: MessageVariation[];
  lastGenerated: string;
}

interface GenerationSettings {
  maxCharLimit: number;
  emojiLevel: "none" | "light" | "moderate";
  creativity: number;
  rephrasingMode: "synonym" | "paraphrase" | "rewrite";
  customPrompt: string;
  rotationStrategy: "random" | "roundRobin" | "weighted";
  simQuota: number;
  cooldownInterval: number;
  timeWindow: {
    start: string;
    end: string;
  };
  bannedWords: string[];
  personalizationTags: string[];
}

const mockMessageTemplates: MessageTemplate[] = [
  {
    id: "template-001",
    name: "Black Friday Promotion",
    category: "Promotional",
    originalMessage: "🔥 BLACK FRIDAY: 50% OFF everything! Limited time offer. Use code BF50. Shop now: https://shop.com Reply STOP to opt out.",
    variations: [
      {
        id: "var-001",
        original: "🔥 BLACK FRIDAY: 50% OFF everything! Limited time offer. Use code BF50. Shop now: https://shop.com Reply STOP to opt out.",
        variation: "🛍️ MASSIVE Black Friday Sale: Save 50% on ALL items! Code: BF50. Don't wait - offer expires soon! https://shop.com Text STOP to unsubscribe.",
        tone: "Urgent",
        language: "English",
        characterCount: 143,
        rating: 4.8,
        isSelected: true,
        spamScore: 2.1,
        encoding: "GSM-7",
        cost: 1
      },
      {
        id: "var-002", 
        original: "🔥 BLACK FRIDAY: 50% OFF everything! Limited time offer. Use code BF50. Shop now: https://shop.com Reply STOP to opt out.",
        variation: "Black Friday Special: Half price on everything in store! Enter BF50 at checkout. Limited time only: https://shop.com Reply STOP to opt out.",
        tone: "Professional",
        language: "English", 
        characterCount: 152,
        rating: 4.2,
        isSelected: false,
        spamScore: 1.2,
        encoding: "GSM-7",
        cost: 1
      },
      {
        id: "var-003",
        original: "🔥 BLACK FRIDAY: 50% OFF everything! Limited time offer. Use code BF50. Shop now: https://shop.com Reply STOP to opt out.",
        variation: "Hey! 🎉 It's Black Friday and we're giving you 50% off EVERYTHING! Code: BF50. Grab your favorites: https://shop.com Reply STOP to opt out.",
        tone: "Casual",
        language: "English",
        characterCount: 147,
        rating: 4.5,
        isSelected: false,
        spamScore: 3.5,
        encoding: "Unicode",
        cost: 2
      },
    ],
    lastGenerated: "2024-11-15 14:30",
  },
  {
    id: "template-002",
    name: "Welcome Message",
    category: "Onboarding",
    originalMessage: "Welcome to our platform! Thanks for joining. Here's your 10% welcome bonus. Use code WELCOME10. Questions? Just reply to this message.",
    variations: [
      {
        id: "var-004",
        original: "Welcome to our platform! Thanks for joining. Here's your 10% welcome bonus. Use code WELCOME10. Questions? Just reply to this message.",
        variation: "🎉 Welcome aboard! Thanks for signing up. Enjoy 10% off your first order with code WELCOME10. Need help? Just reply to this text!",
        tone: "Friendly",
        language: "English",
        characterCount: 134,
        rating: 4.7,
        isSelected: true,
        spamScore: 0.8,
        encoding: "GSM-7",
        cost: 1
      },
      {
        id: "var-005",
        original: "Welcome to our platform! Thanks for joining. Here's your 10% welcome bonus. Use code WELCOME10. Questions? Just reply to this message.",
        variation: "Bienvenue sur notre plateforme! Merci de vous être inscrit. Voici votre bonus de bienvenue de 10%. Code: WELCOME10. Des questions? Répondez simplement.",
        tone: "Professional",
        language: "French",
        characterCount: 168,
        rating: 4.3,
        isSelected: false,
        spamScore: 1.5,
        encoding: "Unicode",
        cost: 2
      },
    ],
    lastGenerated: "2024-11-14 09:15",
  },
];

const personalizationOptions = [
  "{name}",
  "{company}",
  "{date}",
  "{time}",
  "{location}",
  "{product}",
  "{order_id}",
  "{phone}",
  "{email}",
  "{username}"
];

export function AIMessages() {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [originalMessage, setOriginalMessage] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [bannedWords, setBannedWords] = useState("free, win, lottery, prize, cash");
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    maxCharLimit: 160,
    emojiLevel: "light",
    creativity: 0.7,
    rephrasingMode: "paraphrase",
    customPrompt: "",
    rotationStrategy: "random",
    simQuota: 150,
    cooldownInterval: 30,
    timeWindow: {
      start: "09:00",
      end: "20:00"
    },
    bannedWords: ["free", "win", "lottery", "prize", "cash"],
    personalizationTags: []
  });

  const handleGenerateVariations = async () => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  const handleExportVariations = (format: "csv" | "txt") => {
    // In a real app, this would generate and download a file
    console.log(`Exporting variations as ${format}`);
  };

  const getToneColor = (tone: string) => {
    switch (tone.toLowerCase()) {
      case "urgent":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "professional":
        return "bg-info/10 text-info border-info/20";
      case "casual":
        return "bg-success/10 text-success border-success/20";
      case "friendly":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCharacterCountColor = (count: number) => {
    if (count <= 160) return "text-success";
    if (count <= 320) return "text-warning";
    return "text-destructive";
  };

  const getSpamScoreColor = (score: number) => {
    if (score < 2) return "text-success";
    if (score < 4) return "text-warning";
    return "text-destructive";
  };

  const addPersonalizationTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removePersonalizationTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const updateBannedWords = (words: string) => {
    setBannedWords(words);
    setGenerationSettings({
      ...generationSettings,
      bannedWords: words.split(',').map(word => word.trim()).filter(word => word)
    });
  };

  const calculateEstimatedCost = () => {
    // Simple calculation: GSM-7 = 1 credit, Unicode = 2 credits
    let totalCost = 0;
    mockMessageTemplates.forEach(template => {
      template.variations.forEach(variation => {
        totalCost += variation.cost || 1;
      });
    });
    return totalCost;
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Message Variations</h1>
          <p className="text-muted-foreground">
            Generate smart message variations to avoid carrier filtering
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Sliders className="h-4 w-4 mr-2" />
                AI Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>AI Generation Settings</DialogTitle>
                <DialogDescription>
                  Configure how the AI generates message variations
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Message Content Control</h3>
                  
                  <div>
                    <Label htmlFor="maxCharLimit">Max Character Limit</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Slider
                        id="maxCharLimit"
                        min={80}
                        max={500}
                        step={10}
                        value={[generationSettings.maxCharLimit]}
                        onValueChange={(value) => setGenerationSettings({...generationSettings, maxCharLimit: value[0]})}
                        className="flex-1"
                      />
                      <span className="text-sm w-12">{generationSettings.maxCharLimit}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 160 for single SMS, 320 for multi-SMS
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="emojiLevel">Emoji Usage</Label>
                    <Select 
                      value={generationSettings.emojiLevel}
                      onValueChange={(value: "none" | "light" | "moderate") => 
                        setGenerationSettings({...generationSettings, emojiLevel: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select emoji level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Personalization Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2 mb-3">
                      {selectedTags.map(tag => (
                        <Badge key={tag} className="flex items-center gap-1">
                          {tag}
                          <XCircle 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removePersonalizationTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <Select onValueChange={addPersonalizationTag}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add personalization tag" />
                      </SelectTrigger>
                      <SelectContent>
                        {personalizationOptions.map(tag => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bannedWords">Banned Words (comma separated)</Label>
                    <Input 
                      id="bannedWords"
                      value={bannedWords}
                      onChange={(e) => updateBannedWords(e.target.value)}
                      placeholder="free, win, lottery, prize..."
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Variation Generation Settings</h3>
                  
                  <div>
                    <Label htmlFor="creativity">Creativity Level</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">Strict</span>
                      <Slider
                        id="creativity"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[generationSettings.creativity]}
                        onValueChange={(value) => setGenerationSettings({...generationSettings, creativity: value[0]})}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground">Creative</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {generationSettings.creativity.toFixed(1)}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="rephrasingMode">Rephrasing Mode</Label>
                    <Select 
                      value={generationSettings.rephrasingMode}
                      onValueChange={(value: "synonym" | "paraphrase" | "rewrite") => 
                        setGenerationSettings({...generationSettings, rephrasingMode: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rephrasing mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="synonym">Synonym Swap (Light)</SelectItem>
                        <SelectItem value="paraphrase">Paraphrase (Medium)</SelectItem>
                        <SelectItem value="rewrite">Rewrite (Heavy)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="customPrompt">Custom Prompt</Label>
                    <Textarea 
                      id="customPrompt"
                      value={generationSettings.customPrompt}
                      onChange={(e) => setGenerationSettings({...generationSettings, customPrompt: e.target.value})}
                      placeholder="Add additional instructions for the AI..."
                      className="mt-1 min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Delivery & Compliance</h3>
                  
                  <div>
                    <Label htmlFor="rotationStrategy">Rotation Strategy</Label>
                    <Select 
                      value={generationSettings.rotationStrategy}
                      onValueChange={(value: "random" | "roundRobin" | "weighted") => 
                        setGenerationSettings({...generationSettings, rotationStrategy: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rotation strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="random">Random</SelectItem>
                        <SelectItem value="roundRobin">Round Robin</SelectItem>
                        <SelectItem value="weighted">Weighted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="simQuota">Max SMS per SIM per day</Label>
                      <Input 
                        id="simQuota"
                        type="number"
                        value={generationSettings.simQuota}
                        onChange={(e) => setGenerationSettings({...generationSettings, simQuota: parseInt(e.target.value) || 150})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cooldownInterval">Cooldown (seconds)</Label>
                      <Input 
                        id="cooldownInterval"
                        type="number"
                        value={generationSettings.cooldownInterval}
                        onChange={(e) => setGenerationSettings({...generationSettings, cooldownInterval: parseInt(e.target.value) || 30})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Time Window</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        type="time"
                        value={generationSettings.timeWindow.start}
                        onChange={(e) => setGenerationSettings({
                          ...generationSettings, 
                          timeWindow: {...generationSettings.timeWindow, start: e.target.value}
                        })}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input 
                        type="time"
                        value={generationSettings.timeWindow.end}
                        onChange={(e) => setGenerationSettings({
                          ...generationSettings, 
                          timeWindow: {...generationSettings.timeWindow, end: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-primary shadow-primary">
                <Wand2 className="h-4 w-4 mr-2" />
                Generate New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate AI Message Variations</DialogTitle>
                <DialogDescription>
                  Create multiple variations of your message to improve delivery rates
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="originalMessage">Original Message</Label>
                  <Textarea 
                    id="originalMessage"
                    value={originalMessage}
                    onChange={(e) => setOriginalMessage(e.target.value)}
                    placeholder="Enter your original SMS message here..."
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Characters: {originalMessage.length}</span>
                    <span>SMS segments: {Math.ceil(originalMessage.length / 160)}</span>
                    <span className={originalMessage.length > generationSettings.maxCharLimit ? "text-destructive" : ""}>
                      Limit: {generationSettings.maxCharLimit}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="variationCount">Number of Variations</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="5 variations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 variations</SelectItem>
                        <SelectItem value="5">5 variations</SelectItem>
                        <SelectItem value="8">8 variations</SelectItem>
                        <SelectItem value="10">10 variations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="English" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="both">Both Languages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Tone Variations</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Professional", "Casual", "Urgent", "Friendly", "Formal"].map((tone) => (
                      <Badge key={tone} variant="outline" className="cursor-pointer hover:bg-muted">
                        {tone}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-md">
                  <div className="flex items-center justify-between text-sm">
                    <span>Estimated Cost:</span>
                    <span className="font-medium">{Math.ceil(originalMessage.length / 160) * 5} credits</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleGenerateVariations}
                  disabled={isGenerating || !originalMessage.trim()}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating Variations...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate AI Variations
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="variations">Active Variations</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Templates Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Templates</p>
                    <p className="text-2xl font-bold">{mockMessageTemplates.length}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">AI Variations</p>
                    <p className="text-2xl font-bold">
                      {mockMessageTemplates.reduce((sum, t) => sum + t.variations.length, 0)}
                    </p>
                  </div>
                  <Wand2 className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Languages</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                  <Languages className="h-8 w-8 text-info" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Cost</p>
                    <p className="text-2xl font-bold">{calculateEstimatedCost()}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Templates List */}
          <div className="grid gap-6 lg:grid-cols-2">
            {mockMessageTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      {template.name}
                    </CardTitle>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Original Message</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                      {template.originalMessage}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">AI Variations ({template.variations.length})</Label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {template.variations.slice(0, 2).map((variation) => (
                        <div key={variation.id} className="p-3 border rounded-md space-y-2">
                          <div className="text-sm">{variation.variation}</div>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="secondary" className={getToneColor(variation.tone)}>
                                {variation.tone}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                {variation.language}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${getCharacterCountColor(variation.characterCount)}`}>
                                {variation.characterCount} chars
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {variation.encoding}
                              </Badge>
                              {variation.spamScore && (
                                <Badge variant="outline" className={`text-xs ${getSpamScoreColor(variation.spamScore)}`}>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Spam: {variation.spamScore.toFixed(1)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Last generated: {template.lastGenerated}</span>
                    <Button variant="outline" size="sm">
                      <Save className="h-3 w-3 mr-1" />
                      Save Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="variations" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Active Message Variations</h2>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Export options" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv" onSelect={() => handleExportVariations("csv")}>
                    Export as CSV
                  </SelectItem>
                  <SelectItem value="txt" onSelect={() => handleExportVariations("txt")}>
                    Export as TXT
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {mockMessageTemplates[0].variations.map((variation) => (
                  <div key={variation.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm mb-2">{variation.variation}</div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary" className={getToneColor(variation.tone)}>
                            {variation.tone}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {variation.characterCount} chars
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {variation.encoding}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getSpamScoreColor(variation.spamScore || 0)}`}>
                            Spam: {(variation.spamScore || 0).toFixed(1)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Rating: {variation.rating}/5
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Delivery Rate by Tone</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Professional</span>
                        <span className="text-success">98.5%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Casual</span>
                        <span className="text-success">97.8%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Urgent</span>
                        <span className="text-warning">89.2%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Character Count Impact</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>≤160 chars</span>
                        <span className="text-success">99.1%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>161-320 chars</span>
                        <span className="text-warning">94.7%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>&gt;320 chars</span>
                        <span className="text-destructive">87.3%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Language Performance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>English</span>
                        <span className="text-success">98.2%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>French</span>
                        <span className="text-success">97.9%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-4">AI Recommendations</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 bg-info rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Use Professional tone for better delivery rates</p>
                        <p className="text-xs text-muted-foreground">Professional messages have 0.7% higher delivery rate than casual messages</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 bg-warning rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Keep messages under 160 characters when possible</p>
                        <p className="text-xs text-muted-foreground">Single SMS segments have significantly better delivery rates</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 bg-success rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Rotate between 3-5 variations per campaign</p>
                        <p className="text-xs text-muted-foreground">Message rotation reduces carrier filtering by 23%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-4">Cost Analysis</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Encoding Impact</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>GSM-7 Encoding</span>
                          <span className="text-success">1 credit per SMS</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Unicode Encoding</span>
                          <span className="text-warning">2 credits per SMS</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Current Usage</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Variations</span>
                          <span>{mockMessageTemplates.reduce((sum, t) => sum + t.variations.length, 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Estimated Cost</span>
                          <span className="font-medium">{calculateEstimatedCost()} credits</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}