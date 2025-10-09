import { useCampaigns } from "@/hooks/useCampaigns";
import { Campaign } from "@/lib/api/campaign";
import { useSocketStore } from "@/store/useSocketStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Send,
  Play,
  Pause,
  Square,
  Eye,
  WifiOff,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function CampaignActions({campaign, devices,isConnected,   
    updateCampaignStatus,
    pauseCampaignTasks,
    resumeCampaignTasks,
    removeCampaignTasks,
    startCampaign   
 }: {
    campaign: Campaign;
    devices: any[];
    isConnected: boolean;
    updateCampaignStatus: (campaignId: string, status: string) => void;
    pauseCampaignTasks: (device: any, taskId: any[]) => void;
    resumeCampaignTasks: (device: any, taskId: any[]) => void;
    removeCampaignTasks: (device: any, taskId: any[]) => void;
    startCampaign: (campaignId: string, deviceId: string) => void;
 }) {
    // Use Zustand socket store
    const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
    const [showSendDialog, setShowSendDialog] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [isSending, setIsSending] = useState(false);
    console.log("campaign", campaign);
    
    // Start campaign handler
    const handleStartCampaign = async (campaign: any) => {
        if (!isConnected) {
            toast.error('Cannot start campaign: WebSocket not connected');
            return;
        }

        setIsSending(true);
        try {
            console.log("campaign", campaign);
            console.log("the_device", devices);
            const the_device = devices?.find(d => d._id === campaign.device?._id);
            console.log("the_device", the_device);
            
            if (!the_device) {
                toast.error('Selected device not found');
                return;
            }

            const deviceConfig = {
                device_ip: the_device?.ipAddress,
                device_port: the_device?.port,
                version: '1.1',
                device: the_device?._id,
                username: the_device?.username,
                password: the_device?.password
            };

            await startCampaign(campaign._id, deviceConfig.device);
            
            setShowSendDialog(false);
            toast.success('Campaign started successfully');
        } catch (error) {
            console.error('Error starting campaign:', error);
            toast.error('Failed to start campaign');
        } finally {
            setIsSending(false);
        }
    };

    const handlePause = async (campaign: Campaign) => {
        if (!isConnected) {
            toast.error('Cannot pause campaign: WebSocket not connected');
            return;
        }
        try {
            await pauseCampaignTasks(campaign.device, [campaign.taskId]);
            await updateCampaignStatus(campaign._id, 'paused');
            toast.success('Campaign paused');
        } catch (error) {
            console.error('Error pausing campaign:', error);
            toast.error('Failed to pause campaign');
        }
    };

    const handleResume = async (campaign: Campaign) => {
        if (!isConnected) {
            toast.error('Cannot resume campaign: WebSocket not connected');
            return;
        }

        try {
            await resumeCampaignTasks(campaign.device, [campaign.taskId]);
            await updateCampaignStatus(campaign._id, 'active');
            toast.success('Campaign resumed');
        } catch (error) {
            console.error('Error resuming campaign:', error);
            toast.error('Failed to resume campaign');
        }
    };

    const handleStop = async (campaign: Campaign) => {
        if (!isConnected) {
            toast.error('Cannot stop campaign: WebSocket not connected');
            return;
        }

        try {
            await removeCampaignTasks(campaign.device, [campaign.taskId]);
            await updateCampaignStatus(campaign._id, 'completed');
            toast.success('Campaign stopped');
        } catch (error) {
            console.error('Error stopping campaign:', error);
            toast.error('Failed to stop campaign');
        }
    };

    // Send dialog component
    const renderSendDialog = () => (
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Send Campaign</DialogTitle>
                    <DialogDescription>
                        Send "{selectedCampaign?.name}" campaign
                        {!isConnected && (
                            <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm">
                                <WifiOff className="h-4 w-4" />
                                WebSocket not connected - real-time updates unavailable
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        className="flex-1" 
                        onClick={() => setShowSendDialog(false)}
                    >
                        Cancel
                    </Button>
                    <Button 
                        className="flex-1" 
                        onClick={() => selectedCampaign && handleStartCampaign(selectedCampaign)}
                        disabled={isSending || !isConnected}
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        {!isConnected ? 'Connecting...' : 'Send Campaign'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );

    // Campaign details dialog component
    const renderDetailsDialog = () => {
        const getStatusColor = (status: string) => {
            const colors: Record<string, string> = {
                scheduled: 'bg-blue-500',
                active: 'bg-green-500',
                paused: 'bg-yellow-500',
                completed: 'bg-gray-500',
                failed: 'bg-red-500'
            };
            return colors[status] || 'bg-gray-500';
        };

        return (
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedCampaign?.name}
                            <Badge className={getStatusColor(selectedCampaign?.status || '')}>
                                {selectedCampaign?.status}
                            </Badge>
                        </DialogTitle>
                        <DialogDescription>
                            Campaign details and statistics
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        {/* Campaign Statistics */}
                        <div>
                            <h3 className="font-semibold mb-2">Statistics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Total Contacts</p>
                                    <p className="text-2xl font-bold">{selectedCampaign?.totalContacts || 0}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Sent Messages</p>
                                    <p className="text-2xl font-bold">{selectedCampaign?.sentMessages || 0}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Delivered</p>
                                    <p className="text-2xl font-bold text-green-600">{selectedCampaign?.deliveredMessages || 0}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Completed</p>
                                    <p className="text-2xl font-bold text-blue-600">{selectedCampaign?.completedMessages || 0}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Failed</p>
                                    <p className="text-2xl font-bold text-red-600">{selectedCampaign?.failedMessages || 0}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Average Processing Time</p>
                                    <p className="text-2xl font-bold">{selectedCampaign?.averageProcessingTime / 1000 || 0} sec</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Message Content */}
                        <div>
                            <h3 className="font-semibold mb-2">Message Content</h3>
                            <div className="bg-muted p-3 rounded-md">
                                <p className="text-sm whitespace-pre-wrap">{selectedCampaign?.messageContent}</p>
                            </div>
                        </div>

                        <Separator />

                        {/* Device & Contact List */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold mb-2">Device</h3>
                                <div className="space-y-1">
                                    <p className="text-sm">{selectedCampaign?.device?.name}</p>
                                    <Badge variant="outline">{selectedCampaign?.device?.status}</Badge>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Contact List</h3>
                                <div className="space-y-1">
                                    <p className="text-sm">{selectedCampaign?.contactList?.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedCampaign?.contactList?.totalContacts} contacts
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Task Settings */}
                        <div>
                            <h3 className="font-semibold mb-2">Task Settings</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Interval Range:</span>
                                    <p>{selectedCampaign?.taskSettings?.interval_min}ms - {selectedCampaign?.taskSettings?.interval_max}ms</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Timeout:</span>
                                    <p>{selectedCampaign?.taskSettings?.timeout}s</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Priority:</span>
                                    <p className="capitalize">{selectedCampaign?.priority}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Charset:</span>
                                    <p>{selectedCampaign?.taskSettings?.charset}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">SMS Count Limit:</span>
                                    <p>{selectedCampaign?.taskSettings?.sms_count} per {selectedCampaign?.taskSettings?.sms_period}min</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Task ID:</span>
                                    <p>{selectedCampaign?.taskId}</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Timestamps */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-muted-foreground">Created:</span>
                                <p>{selectedCampaign?.createdAt ? new Date(selectedCampaign.createdAt).toLocaleString() : 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Last Updated:</span>
                                <p>{selectedCampaign?.updatedAt ? new Date(selectedCampaign.updatedAt).toLocaleString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <div className="flex gap-1">
            {renderSendDialog()}
            {renderDetailsDialog()}
            
            {campaign?.status === "scheduled" && (
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowSendDialog(true);
                    }}
                    disabled={isSending || !isConnected}
                    title={!isConnected ? "WebSocket not connected" : "Start campaign"}
                >
                    <Send className="h-3 w-3" />
                </Button>
            )}
            
            {campaign?.status === "active" && (
                <>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handlePause(campaign)}
                        disabled={!isConnected}
                        title={!isConnected ? "WebSocket not connected" : "Pause campaign"}
                    >
                        <Pause className="h-3 w-3" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStop(campaign)}
                        disabled={!isConnected}
                        title={!isConnected ? "WebSocket not connected" : "Stop campaign"}
                    >
                        <Square className="h-3 w-3" />
                    </Button>
                </>
            )}
            
            {campaign?.status === "paused" && (
                <>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleResume(campaign)}
                        disabled={!isConnected}
                        title={!isConnected ? "WebSocket not connected" : "Resume campaign"}
                    >
                        <Play className="h-3 w-3" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStop(campaign)}
                        disabled={!isConnected}
                        title={!isConnected ? "WebSocket not connected" : "Stop campaign"}
                    >
                        <Square className="h-3 w-3" />
                    </Button>
                </>
            )}
            
            <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                    setSelectedCampaign(campaign);
                    setShowDetailsDialog(true);
                }}
                title="View campaign details"
            >
                <Eye className="h-3 w-3" />
            </Button>
        </div>
    );
}