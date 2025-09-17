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
} from "lucide-react";

interface MessageVariation {
  id: string;
  original: string;
  variation: string;
  tone: string;
  language: string;
  characterCount: number;
  rating: number;
  isSelected: boolean;
}

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  originalMessage: string;
  variations: MessageVariation[];
  lastGenerated: string;
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
      },
    ],
    lastGenerated: "2024-11-14 09:15",
  },
];

export function AIMessages() {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [originalMessage, setOriginalMessage] = useState("");

  const handleGenerateVariations = async () => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
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
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            AI Settings
          </Button>
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
                    <p className="text-sm text-muted-foreground">Avg. Rating</p>
                    <p className="text-2xl font-bold">4.5</p>
                  </div>
                  <ThumbsUp className="h-8 w-8 text-success" />
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
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Regenerate
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {template.variations.slice(0, 2).map((variation) => (
                        <div key={variation.id} className="p-3 border rounded-md space-y-2">
                          <div className="text-sm">{variation.variation}</div>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Active Message Variations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMessageTemplates[0].variations.map((variation) => (
                  <div key={variation.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm mb-2">{variation.variation}</div>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className={getToneColor(variation.tone)}>
                            {variation.tone}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {variation.characterCount} chars
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}