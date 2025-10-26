// components/MessageVariationSection.tsx
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  FileText, 
  Shuffle, 
  Wand2, 
  AlertCircle, 
  Copy, 
  Loader2,
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  MessageCircle,
  Eye
} from "lucide-react";
import { SavedMessage, MessageVariant } from "@/lib/api/messages";

interface MessageVariationSectionProps {
  messageVariationType: "single_variant" | "multiple_variants" | "ai_random";
  selectedMessageId: string;
  selectedAIMessage: SavedMessage | null;
  messageVariants: MessageVariant[];
  selectedVariantId: string;
  loadingVariants: boolean;
  customMessageContent: string;
  spamAnalysis: any;
  checkingSpam: boolean;
  optimizingMessage: boolean;
  optimizationResult: any;
  onVariationTypeChange: (type: "single_variant" | "multiple_variants" | "ai_random") => void;
  onVariantSelect: (variantId: string) => void;
  onCustomMessageChange: (content: string) => void;
  onUseBaseMessage: () => void;
  onUseOriginalPrompt: () => void;
  onCheckSpam: (content: string) => void;
  onOptimizeMessage: (content: string) => void;
  onApplyOptimization: () => void;
  onRevertToOriginal: () => void;
}

export function MessageVariationSection({
  messageVariationType,
  selectedMessageId,
  selectedAIMessage,
  messageVariants,
  selectedVariantId,
  loadingVariants,
  customMessageContent,
  spamAnalysis,
  checkingSpam,
  optimizingMessage,
  optimizationResult,
  onVariationTypeChange,
  onVariantSelect,
  onCustomMessageChange,
  onUseBaseMessage,
  onUseOriginalPrompt,
  onCheckSpam,
  onOptimizeMessage,
  onApplyOptimization,
  onRevertToOriginal
}: MessageVariationSectionProps) {

  const getMessageStats = (message: string) => {
    const charCount = message.length;
    const segments = Math.ceil(charCount / 160);
    const encoding = charCount > 160 ? 'USC2' : 'GSM-7';
    return { charCount, segments, encoding };
  };

  return (
    <div className="border-t pt-4">
      <h3 className="font-medium mb-3 flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        Message Variation Strategy
      </h3>
      
      <RadioGroup 
        value={messageVariationType} 
        onValueChange={onVariationTypeChange}
        className="space-y-3"
      >
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
                      onClick={() => onCheckSpam(customMessageContent)}
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
                      onClick={() => onOptimizeMessage(customMessageContent)}
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
                          onClick={onUseBaseMessage}
                          disabled={!selectedAIMessage.baseMessage}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Use Base
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onUseOriginalPrompt}
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
                  onChange={(e) => onCustomMessageChange(e.target.value)}
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
                          {optimizationResult.changesMade.map((change: string, index: number) => (
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
                        onClick={onApplyOptimization}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Use Optimized
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onRevertToOriginal}
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
                          {spamAnalysis.spamIndicators.map((indicator: string, index: number) => (
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
                          {spamAnalysis.improvementSuggestions.map((suggestion: string, index: number) => (
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
                  onValueChange={onVariantSelect}
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
  );
}