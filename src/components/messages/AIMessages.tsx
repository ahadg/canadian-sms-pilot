import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Wand2, 
  RotateCcw, 
  Save, 
  Copy, 
  AlertTriangle, 
  Shield, 
  Timer,
  Shuffle,
  MessageSquare,
  Target,
  Settings,
  Sparkles,
  Download,
  Plus,
  X,
  Eye
} from "lucide-react";
import { toast } from "sonner";

interface MessageVariant {
  id: string;
  content: string;
  length: number;
  segments: number;
  spamScore: number;
}

interface AISettings {
  characterLimit: number;
  emojiLevel: 'none' | 'light' | 'moderate';
  creativityLevel: number;
  rephraseStyle: 'synonym' | 'paraphrase' | 'rewrite';
  bannedWords: string[];
  personalizationTags: string[];
  customInstructions: string;
}

const DEFAULT_PROMPT = `Write 8 short SMS variants (<=160 chars) for a Canadian audience announcing a one-day 20% discount for customers who opted in. Each message must:
- Identify the sender as "Acme Co."
- Include "Reply STOP to unsubscribe"
- Avoid superlative spammy words like "FREE!!!" or deceptive claims
- Be friendly and concise`;

const PERSONALIZATION_TAGS = ['{name}', '{company}', '{date}', '{amount}', '{phone}', '{email}'];

export function AIMessages() {
  const [basePrompt, setBasePrompt] = useState(DEFAULT_PROMPT);
  const [generatedVariants, setGeneratedVariants] = useState<MessageVariant[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [newBannedWord, setNewBannedWord] = useState('');
  
  const [aiSettings, setAiSettings] = useState<AISettings>({
    characterLimit: 160,
    emojiLevel: 'light',
    creativityLevel: 0.7,
    rephraseStyle: 'paraphrase',
    bannedWords: ['free', 'urgent', 'limited time', 'act now'],
    personalizationTags: ['{name}', '{company}'],
    customInstructions: ''
  });

  const calculateSpamScore = (content: string): number => {
    const spamWords = ['free', 'urgent', 'limited', 'act now', 'call now', 'guarantee'];
    const capsPercentage = (content.match(/[A-Z]/g) || []).length / content.length;
    const exclamationCount = (content.match(/!/g) || []).length;
    
    let score = 0;
    
    // Check for spam words
    spamWords.forEach(word => {
      if (content.toLowerCase().includes(word)) score += 2;
    });
    
    // Excessive caps
    if (capsPercentage > 0.3) score += 3;
    
    // Excessive exclamation marks
    if (exclamationCount > 2) score += 2;
    
    return Math.min(score, 10);
  };

  const generateVariants = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate AI generation for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockVariants: MessageVariant[] = [
        {
          id: '1',
          content: 'Acme Co.: 20% off today only on your next order. Use code ACME20. Reply STOP to unsubscribe.',
          length: 89,
          segments: 1,
          spamScore: 1
        },
        {
          id: '2',
          content: 'Acme Co. — Quick heads up: 20% off all items today. Tap link to shop. Reply STOP to unsubscribe.',
          length: 95,
          segments: 1,
          spamScore: 0
        },
        {
          id: '3',
          content: 'Hi from Acme Co.! Enjoy 20% off your purchase today with code SAVE20. Reply STOP to unsubscribe.',
          length: 95,
          segments: 1,
          spamScore: 0
        },
        {
          id: '4',
          content: 'Acme Co.: Today only - save 20% on everything. Code: DEAL20. Shop now! Reply STOP to unsubscribe.',
          length: 96,
          segments: 1,
          spamScore: 2
        },
        {
          id: '5',
          content: 'Special discount from Acme Co.: 20% off expires tonight. Use SAVE20. Reply STOP to unsubscribe.',
          length: 98,
          segments: 1,
          spamScore: 1
        },
        {
          id: '6',
          content: 'Acme Co. here! Get 20% off your order today - code TWENTY. Valid until midnight. Reply STOP to opt out.',
          length: 105,
          segments: 1,
          spamScore: 0
        },
        {
          id: '7',
          content: 'One day only: 20% off at Acme Co. Use discount code SAVE20 at checkout. Reply STOP to unsubscribe.',
          length: 101,
          segments: 1,
          spamScore: 1
        },
        {
          id: '8',
          content: 'Acme Co.: Flash sale! 20% off everything today. Code: FLASH20. Don\'t miss out! Reply STOP to unsubscribe.',
          length: 107,
          segments: 1,
          spamScore: 3
        }
      ];
      
      setGeneratedVariants(mockVariants);
      toast.success('Generated 8 message variants successfully!');
    } catch (error) {
      toast.error('Failed to generate variants');
    } finally {
      setIsGenerating(false);
    }
  };

  const getSpamBadge = (score: number) => {
    if (score <= 2) return <Badge variant="secondary" className="bg-success/10 text-success">Low Risk</Badge>;
    if (score <= 5) return <Badge variant="secondary" className="bg-warning/10 text-warning">Medium Risk</Badge>;
    return <Badge variant="secondary" className="bg-destructive/10 text-destructive">High Risk</Badge>;
  };

  const toggleVariantSelection = (id: string) => {
    const newSelected = new Set(selectedVariants);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedVariants(newSelected);
  };

  const addBannedWord = () => {
    if (newBannedWord.trim() && !aiSettings.bannedWords.includes(newBannedWord.trim())) {
      setAiSettings(prev => ({
        ...prev,
        bannedWords: [...prev.bannedWords, newBannedWord.trim()]
      }));
      setNewBannedWord('');
    }
  };

  const removeBannedWord = (word: string) => {
    setAiSettings(prev => ({
      ...prev,
      bannedWords: prev.bannedWords.filter(w => w !== word)
    }));
  };

  const addPersonalizationTag = (tag: string) => {
    if (!aiSettings.personalizationTags.includes(tag)) {
      setAiSettings(prev => ({
        ...prev,
        personalizationTags: [...prev.personalizationTags, tag]
      }));
    }
  };

  const removePersonalizationTag = (tag: string) => {
    setAiSettings(prev => ({
      ...prev,
      personalizationTags: prev.personalizationTags.filter(t => t !== tag)
    }));
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Messages</h1>
          <p className="text-muted-foreground">
            Generate intelligent SMS variations with AI-powered controls
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
          <Button size="sm" className="bg-gradient-primary shadow-primary">
            <Target className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Tabs defaultValue="prompt" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="prompt" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label>Message Prompt</Label>
                    <Textarea
                      value={basePrompt}
                      onChange={(e) => setBasePrompt(e.target.value)}
                      placeholder="Enter your prompt for AI message generation..."
                      className="min-h-[150px] mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Describe what kind of messages you want the AI to generate
                    </p>
                  </div>
                  <Button 
                    onClick={generateVariants} 
                    disabled={isGenerating || !basePrompt.trim()}
                    className="w-full mt-4"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Variants
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Generation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Character Limit</Label>
                    <Input
                      type="number"
                      value={aiSettings.characterLimit}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, characterLimit: parseInt(e.target.value) }))}
                      min="50"
                      max="500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Prevents multi-SMS charges
                    </p>
                  </div>

                  <div>
                    <Label>Emoji Level</Label>
                    <Select 
                      value={aiSettings.emojiLevel} 
                      onValueChange={(value: 'none' | 'light' | 'moderate') => 
                        setAiSettings(prev => ({ ...prev, emojiLevel: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Creativity Level: {aiSettings.creativityLevel}</Label>
                    <Slider
                      value={[aiSettings.creativityLevel]}
                      onValueChange={([value]) => setAiSettings(prev => ({ ...prev, creativityLevel: value }))}
                      min={0}
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Conservative</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div>
                    <Label>Rephrasing Style</Label>
                    <Select 
                      value={aiSettings.rephraseStyle} 
                      onValueChange={(value: 'synonym' | 'paraphrase' | 'rewrite') => 
                        setAiSettings(prev => ({ ...prev, rephraseStyle: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="synonym">Synonym Swap</SelectItem>
                        <SelectItem value="paraphrase">Paraphrase</SelectItem>
                        <SelectItem value="rewrite">Complete Rewrite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Personalization Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {aiSettings.personalizationTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removePersonalizationTag(tag)}>
                          {tag} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <Select onValueChange={addPersonalizationTag}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Add tag..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PERSONALIZATION_TAGS.map((tag) => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Banned Words</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {aiSettings.bannedWords.map((word) => (
                        <Badge key={word} variant="secondary" className="cursor-pointer" onClick={() => removeBannedWord(word)}>
                          {word} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add banned word..."
                        value={newBannedWord}
                        onChange={(e) => setNewBannedWord(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addBannedWord()}
                      />
                      <Button size="sm" onClick={addBannedWord}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Generation and Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Saved Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Generated AI Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedVariants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No AI messages generated yet</p>
                  <p className="text-sm">Create a prompt and generate variants to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Generated {generatedVariants.length} variants • {selectedVariants.size} selected
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Selected
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setBasePrompt(DEFAULT_PROMPT)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Prompt
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {generatedVariants.map((variant) => (
                      <div 
                        key={variant.id} 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedVariants.has(variant.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleVariantSelection(variant.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">Variant {variant.id}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{variant.length} chars</Badge>
                              <Badge variant="outline" className="text-xs">{variant.segments} SMS</Badge>
                              {getSpamBadge(variant.spamScore)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{variant.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}