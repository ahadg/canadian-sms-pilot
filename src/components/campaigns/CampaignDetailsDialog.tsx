import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Campaign } from "@/lib/api/campaign";
import { 
  Calendar, 
  Clock, 
  Users, 
  Send, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Smartphone,
  MessageCircle,
  Target,
  Zap,
  FileText,
  Settings
} from "lucide-react";
import { getStatusBadge } from "./utils";

interface CampaignDetailsDialogProps {
  campaign: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignDetailsDialog({ campaign, isOpen, onClose }: CampaignDetailsDialogProps) {
  if (!campaign) return null;

  const getDeliveryRate = (camp: Campaign) => {
    if (!camp?.sentMessages || camp.sentMessages === 0) return 0;
    return ((camp.deliveredMessages || 0) / camp.sentMessages) * 100;
  };

  const getCampaignProgress = (camp: Campaign) => {
    if (!camp?.totalContacts || camp.totalContacts === 0) return 0;
    return (camp.sentMessages / camp.totalContacts) * 100;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatInterval = (min: number, max: number) => {
    return `${min / 1000}s - ${max / 1000}s`;
  };

  const taskSettings = campaign.taskSettings || {} as any;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Campaign Details: {campaign.name}
          </DialogTitle>
          <DialogDescription>
            Complete overview of campaign performance and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(campaign.status)}</div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Rate</p>
                    <p className="text-2xl font-bold">
                      {getDeliveryRate(campaign).toFixed(1)}%
                    </p>
                  </div>
                  <Send className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="text-2xl font-bold">
                      {campaign.sentMessages}/{campaign.totalContacts}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Campaign Progress</span>
                  <span>{getCampaignProgress(campaign).toFixed(1)}%</span>
                </div>
                <Progress value={getCampaignProgress(campaign)} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Message Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5" />
                Message Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Message Content
                  </label>
                  <div className="mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                    {campaign.messageContent}
                  </div>
                </div>
                
                {taskSettings.messageVariationType === 'ai_random' && (
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <Zap className="h-3 w-3" />
                    AI Random Generation
                  </Badge>
                )}
                
                {taskSettings.selectedVariantId && (
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <FileText className="h-3 w-3" />
                    Multiple Variants
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Campaign Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-3">Basic Settings</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Device:</dt>
                      <dd className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {(campaign.device as any)?.name || 'No device'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Contact List:</dt>
                      <dd>{(campaign.contactList as any)?.name || 'No list'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Priority:</dt>
                      <dd className="capitalize">{campaign.priority}</dd>
                    </div>
                    {/* <div className="flex justify-between">
                      <dt className="text-muted-foreground">Daily Limit:</dt>
                      <dd>{taskSettings.dailyMessageLimit || 300} messages</dd>
                    </div> */}
                  </dl>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Sending Settings</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Sending Interval:</dt>
                      <dd className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatInterval(taskSettings.interval_min || 30000, taskSettings.interval_max || 90000)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Character Set:</dt>
                      <dd>{taskSettings.charset || 'UTF-8'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Message Coding:</dt>
                      <dd>{taskSettings.coding === 1 ? 'USC2' : taskSettings.coding === 2 ? 'GSM 7-bit' : 'Auto-detect'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">SMS Type:</dt>
                      <dd>{taskSettings.sms_type === 1 ? 'Flash' : taskSettings.sms_type === 2 ? 'Unicode' : 'Normal'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Delivery Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {campaign.deliveredMessages || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Send className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">
                    {campaign.sentMessages || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Sent</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">
                    {campaign.failedMessages || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Campaign Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created:</dt>
                  <dd>{formatDate(campaign.createdAt)}</dd>
                </div>
                {campaign.processingStartedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Processing Started:</dt>
                    <dd>{formatDate(campaign.processingStartedAt)}</dd>
                  </div>
                )}
                {campaign.pausedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Paused:</dt>
                    <dd>{formatDate(campaign.pausedAt)}</dd>
                  </div>
                )}
                {campaign.resumedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Resumed:</dt>
                    <dd>{formatDate(campaign.resumedAt)}</dd>
                  </div>
                )}
                {campaign.completedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Completed:</dt>
                    <dd>{formatDate(campaign.completedAt)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Last Updated:</dt>
                  <dd>{formatDate(campaign.updatedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}