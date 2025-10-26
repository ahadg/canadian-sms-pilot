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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Settings,
  List,
  PieChart,
  Phone,
  User,
  Mail,
  Filter
} from "lucide-react";
import { getStatusBadge } from "./utils";
import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";

interface CampaignDetailsDialogProps {
  campaign: any | null;
  isOpen: boolean;
  onClose: () => void;
}

interface MessageSentDetail {
  _id: string;
  phoneNumber: string;
  content: string;
  status:  'sent' | 'delivered' | 'failed' ;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  errorDetails?: {
    code: string;
    message: string;
  };
  contact?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  device?: {
    name: string;
    model: string;
  };
}

interface MessageStats {
  overview: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
    read: number;
    totalCost: number;
    deliveryRate: number;
    readRate: number;
    avgDeliveryLatency: number;
  };
  dailyStats: Array<{
    _id: string;
    count: number;
    delivered: number;
  }>;
}

function CampaignMessages({ campaignId }: { campaignId: string }) {
  const [messages, setMessages] = useState<MessageSentDetail[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<MessageSentDetail[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'sent' | 'delivered' | 'failed'>('all');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await authFetch(`/api/sentmessages?campaignId=${campaignId}&limit=200`);
        const data = response
        
        if (data.success) {
          setMessages(data.data.messages);
          setFilteredMessages(data.data.messages);
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await authFetch(`/api/sentmessages/stats?campaignId=${campaignId}`);
        const data = response
        
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    if (campaignId) {
      fetchMessages();
      //fetchStats();
    }
  }, [campaignId]);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredMessages(messages);
    } else {
      setFilteredMessages(messages.filter(msg => msg.status === activeFilter));
    }
  }, [activeFilter, messages]);

  const getStatusCounts = () => {
    const counts = {
      all: messages.length,
      sent: messages.filter(msg => msg.status === 'sent').length,
      delivered: messages.filter(msg => msg.status === 'delivered').length,
      failed: messages.filter(msg => msg.status === 'failed').length,
      pending: messages.filter(msg => msg.status === 'pending').length,
      read: messages.filter(msg => msg.status === 'read').length,
    };
    return counts;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'read': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      case 'sent': return <Send className="h-3 w-3" />;
      case 'failed': return <XCircle className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'read': return <MessageCircle className="h-3 w-3" />;
      default: return <MessageCircle className="h-3 w-3" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <XCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Total</p>
                  <p className="text-lg font-bold text-blue-800">{stats.overview.total}</p>
                </div>
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-medium">Delivered</p>
                  <p className="text-lg font-bold text-green-800">{stats.overview.delivered}</p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-600 font-medium">Failed</p>
                  <p className="text-lg font-bold text-red-800">{stats.overview.failed}</p>
                </div>
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 font-medium">Read</p>
                  <p className="text-lg font-bold text-purple-800">{stats.overview.read}</p>
                </div>
                <MessageCircle className="h-4 w-4 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="p-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Message Details
            </h3>
            {stats && (
              <Badge variant="secondary" className="px-3 py-1">
                Delivery Rate: {stats.overview.deliveryRate.toFixed(1)}%
              </Badge>
            )}
          </div>

          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                All
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {statusCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Sent
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {statusCounts.sent}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="delivered" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Delivered
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {statusCounts.delivered}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="failed" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Failed
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {statusCounts.failed}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 flex-1 min-h-0">
              <TabsContent value="all" className="m-0 h-full">
                <MessageList messages={filteredMessages} />
              </TabsContent>
              <TabsContent value="sent" className="m-0 h-full">
                <MessageList messages={filteredMessages} />
              </TabsContent>
              <TabsContent value="delivered" className="m-0 h-full">
                <MessageList messages={filteredMessages} />
              </TabsContent>
              <TabsContent value="failed" className="m-0 h-full">
                <MessageList messages={filteredMessages} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function MessageList({ messages }: { messages: MessageSentDetail[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'read': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      case 'sent': return <Send className="h-3 w-3" />;
      case 'failed': return <XCircle className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'read': return <MessageCircle className="h-3 w-3" />;
      default: return <MessageCircle className="h-3 w-3" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg h-full flex items-center justify-center">
        <div>
          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No messages found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full overflow-y-auto pr-2">
      {messages.map((message) => (
        <Card key={message._id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1 min-w-0">
              {/* Header with Phone and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm truncate">
                    {message.phoneNumber}
                  </span>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`flex items-center gap-1 text-xs border ${getStatusColor(message.status)}`}
                >
                  {getStatusIcon(message.status)}
                  {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                </Badge>
              </div>

              {/* Message Content */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>

              {/* Contact Info */}
              {message.contact && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{message.contact.firstName} {message.contact.lastName}</span>
                  </div>
                  {message.contact.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{message.contact.email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {message.sentAt && (
                  <div className="flex items-center gap-1">
                    <Send className="h-3 w-3" />
                    <span>Sent: {formatDateTime(message.sentAt)}</span>
                  </div>
                )}
                {message.deliveredAt && (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Delivered: {formatDateTime(message.deliveredAt)}</span>
                  </div>
                )}
                {message.failedAt && (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    <span>Failed: {formatDateTime(message.failedAt)}</span>
                  </div>
                )}
              </div>

              {/* Error Details */}
              {message.errorDetails?.message && (
                <div className="text-xs bg-red-50 text-red-700 p-2 rounded border border-red-200">
                  <div className="font-medium">Error Details:</div>
                  <div>{message.errorDetails.message}</div>
                  {message.errorDetails.code && (
                    <div className="mt-1">Error Code: {message.errorDetails.code}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
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
      <DialogContent className="max-w-6xl h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Campaign Details: {campaign.name}
          </DialogTitle>
          <DialogDescription>
            Complete overview of campaign performance and settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="messages" className="space-y-6 flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Message Details
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Campaign Overview
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Message Details Tab */}
          <TabsContent value="messages" className="space-y-4 flex-1 flex flex-col min-h-0 m-0">
            <Card className="flex-1 flex flex-col min-h-0">
              <CardContent className="p-0 flex-1">
                <CampaignMessages campaignId={campaign._id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaign Overview Tab */}
          <TabsContent value="overview" className="space-y-4 m-0">
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

            {/* Message Content */}
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
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 m-0">
            {/* Campaign Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Campaign Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Basic Settings</h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b">
                        <dt className="text-muted-foreground flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Device:
                        </dt>
                        <dd className="font-medium">
                          {(campaign.device as any)?.name || 'No device'}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <dt className="text-muted-foreground">Contact List:</dt>
                        <dd className="font-medium">{(campaign.contactList as any)?.name || 'No list'}</dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <dt className="text-muted-foreground">Priority:</dt>
                        <dd className="font-medium capitalize">{campaign.priority}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Sending Settings</h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b">
                        <dt className="text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Sending Interval:
                        </dt>
                        <dd className="font-medium">
                          {formatInterval(taskSettings.interval_min || 30000, taskSettings.interval_max || 90000)}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <dt className="text-muted-foreground">Character Set:</dt>
                        <dd className="font-medium">{taskSettings.charset || 'UTF-8'}</dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <dt className="text-muted-foreground">Message Coding:</dt>
                        <dd className="font-medium">
                          {taskSettings.coding === 1 ? 'USC2' : taskSettings.coding === 2 ? 'GSM 7-bit' : 'Auto-detect'}
                        </dd>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <dt className="text-muted-foreground">SMS Type:</dt>
                        <dd className="font-medium">
                          {taskSettings.sms_type === 1 ? 'Flash' : taskSettings.sms_type === 2 ? 'Unicode' : 'Normal'}
                        </dd>
                      </div>
                    </dl>
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
                  <div className="flex justify-between items-center py-2 border-b">
                    <dt className="text-muted-foreground">Created:</dt>
                    <dd className="font-medium">{formatDate(campaign.createdAt)}</dd>
                  </div>
                  {campaign.processingStartedAt && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <dt className="text-muted-foreground">Processing Started:</dt>
                      <dd className="font-medium">{formatDate(campaign.processingStartedAt)}</dd>
                    </div>
                  )}
                  {campaign.pausedAt && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <dt className="text-muted-foreground">Paused:</dt>
                      <dd className="font-medium">{formatDate(campaign.pausedAt)}</dd>
                    </div>
                  )}
                  {campaign.resumedAt && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <dt className="text-muted-foreground">Resumed:</dt>
                      <dd className="font-medium">{formatDate(campaign.resumedAt)}</dd>
                    </div>
                  )}
                  {campaign.completedAt && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <dt className="text-muted-foreground">Completed:</dt>
                      <dd className="font-medium">{formatDate(campaign.completedAt)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b">
                    <dt className="text-muted-foreground">Last Updated:</dt>
                    <dd className="font-medium">{formatDate(campaign.updatedAt)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}