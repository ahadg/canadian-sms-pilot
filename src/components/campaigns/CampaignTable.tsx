// components/CampaignTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Send, Plus, Play, Pause, StopCircle, CirclePlay, Eye, Loader2, AlertTriangle, RotateCcw, Zap, Clock } from "lucide-react";
import { Campaign } from "@/lib/api/campaign";
import { getStatusBadge } from "./utils";
import { Edit } from "lucide-react";

interface CampaignTableProps {
  campaigns: Campaign[];
  loadingActions: { [key: string]: string | null };
  isConnected: boolean;
  onStartCampaign: (id: string) => void;
  onPauseCampaign: (id: string) => void;
  onResumeCampaign: (id: string) => void;
  onStopCampaign: (id: string) => void;
  onViewCampaign: (campaign: Campaign) => void;
  onCreateCampaign: () => void;
  onEditCampaign: (campaign: Campaign) => void;
}

export function CampaignTable({
  campaigns,
  loadingActions,
  isConnected,
  onStartCampaign,
  onPauseCampaign,
  onResumeCampaign,
  onStopCampaign,
  onViewCampaign,
  onCreateCampaign,
  onEditCampaign
}: CampaignTableProps) {
  
  const getCampaignProgress = (campaign: Campaign) => {
    if (!campaign?.totalContacts || campaign.totalContacts === 0) return 0;
    return (campaign.sentMessages / campaign.totalContacts) * 100;
  };

  const getDeliveryRate = (campaign: Campaign) => {
    if (!campaign?.sentMessages || campaign.sentMessages === 0) return 0;
    return ((campaign.deliveredMessages || 0) / campaign.sentMessages) * 100;
  };

  return (
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
            <Button onClick={onCreateCampaign}>
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
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign: Campaign) => {
                  const assignedDevice = campaign.device as any;
                  const progress = getCampaignProgress(campaign);
                  const deliveryRate = getDeliveryRate(campaign);
                  const campaignLoading = loadingActions[campaign._id];
                  
                  return (
                    <TableRow key={campaign._id}>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="font-semibold text-sm">{campaign.name}</div>
                          {(campaign.messagePreview || campaign.messageContent) && (
                            <div className="text-xs text-muted-foreground/80 line-clamp-2 max-w-md leading-relaxed">
                              {campaign.messagePreview || campaign.messageContent?.substring(0, 80) + '...'}
                            </div>
                          )}
                          {(campaign.taskSettings?.messageVariantType === 'ai_random' || 
                            campaign.pauseReason === 'daily_limit_reached' || 
                            campaign.pauseReason === 'no_available_sims' ||
                            campaign.pauseReason === 'no_assigned_sims' ||
                            campaign.pauseReason === 'sim_error' ||
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
                              {campaign.pauseReason === 'no_assigned_sims' && (
                                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0.5 text-xs bg-rose-50 text-rose-700 border-rose-200">
                                  <AlertTriangle className="h-3 w-3" />
                                  No Assigned SIMs
                                </Badge>
                              )}
                              {campaign.pauseReason === 'no_available_sims' && (
                                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0.5 text-xs bg-orange-50 text-orange-700 border-orange-200">
                                  <AlertTriangle className="h-3 w-3" />
                                  No Active SIMs
                                </Badge>
                              )}
                              {campaign.pauseReason === 'sim_error' && (
                                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0.5 text-xs bg-red-50 text-red-700 border-red-200">
                                  <AlertTriangle className="h-3 w-3" />
                                  SIM Error
                                </Badge>
                              )}
                              {campaign.pauseReason === "resume_requested" && (
                                <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0.5 text-xs bg-sky-50 text-sky-700 border-sky-200">
                                  <RotateCcw className="h-3 w-3" />
                                  Resuming
                                </Badge>
                              )}
                                {/* Add Time Restrictions Badge */}
                               {campaign.taskSettings?.timeRestrictions?.enabled && (
                                  <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 text-xs border-blue-200 text-blue-700 bg-blue-50">
                                    <Clock className="h-3 w-3" />
                                    {campaign.taskSettings.timeRestrictions.startHour === 0 ? '12AM' : 
                                    campaign.taskSettings.timeRestrictions.startHour === 12 ? '12PM' : 
                                    campaign.taskSettings.timeRestrictions.startHour < 12 ? 
                                      `${campaign.taskSettings.timeRestrictions.startHour}AM` : 
                                      `${campaign.taskSettings.timeRestrictions.startHour - 12}PM`}
                                    -
                                    {campaign.taskSettings.timeRestrictions.endHour === 0 ? '12AM' : 
                                    campaign.taskSettings.timeRestrictions.endHour === 12 ? '12PM' : 
                                    campaign.taskSettings.timeRestrictions.endHour < 12 ? 
                                      `${campaign.taskSettings.timeRestrictions.endHour}AM` : 
                                      `${campaign.taskSettings.timeRestrictions.endHour - 12}PM`}
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
                          <div className="flex justify-between items-center text-sm">
                            <span>
                              {campaign.sentMessages?.toLocaleString()}/{campaign.totalContacts?.toLocaleString()}
                            </span>
                            <span className="text-red-600 font-medium">
                              {campaign.failedMessages ? campaign.failedMessages?.toLocaleString() : ''}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2 w-24" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {deliveryRate.toFixed(1)}%
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
                              onClick={() => onStartCampaign(campaign._id)}
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
                                onClick={() => onPauseCampaign(campaign._id)}
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
                                onClick={() => onStopCampaign(campaign._id)}
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
                          {campaign.status === 'paused' || campaign.status === 'completed' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEditCampaign(campaign)}
                                disabled={!!campaignLoading}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              
                            </>
                          )}
                         {campaign.status === 'paused' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEditCampaign(campaign)}
                                disabled={!!campaignLoading}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onResumeCampaign(campaign._id)}
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
                                onClick={() => onStopCampaign(campaign._id)}
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onViewCampaign(campaign)}
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
  );
}
