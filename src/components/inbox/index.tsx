import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Filter,
  Download,
  RefreshCw,
  MessageSquare,
  User,
  Calendar,
  Phone,
  Mail,
  MoreVertical,
  Reply,
  Archive,
  Trash2,
  Eye
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { messageAPI } from "@/lib/api/messages";
import { EjoinAPI } from "@/lib/api/ejoin";

interface ReceivedSMS {
  _id: string;
  campaignId: string;
  campaignName: string;
  fromNumber: string;
  toNumber: string;
  message: string;
  status: 'delivered' | 'read' | 'replied' | 'failed';
  direction: 'inbound' | 'outbound';
  cost: number;
  characterCount: number;
  timestamp: string;
  read: boolean;
  tags: string[];
  replyTo?: string;
}

interface InboxFilters {
  search: string;
  status: string;
  direction: string;
  campaign: string;
  dateFrom: string;
  dateTo: string;
}

const STATUS_OPTIONS = ['all', 'delivered', 'read', 'replied', 'failed'];
const DIRECTION_OPTIONS = ['all', 'inbound', 'outbound'];

export function Inbox() {
  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState<ReceivedSMS[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ReceivedSMS[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ReceivedSMS | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<InboxFilters>({
    search: '',
    status: 'all',
    direction: 'all',
    campaign: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadMessages();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterMessages();
  }, [messages, filters, activeTab]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const response = await EjoinAPI.getCampaignReceivedSms(device,taskId,num);
      // Assuming the API returns data in a structure like { data: { messages: ReceivedSMS[] } }
      const messagesData = response.data?.messages || response.data || [];
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = [...messages];

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(msg => !msg.read);
    } else if (activeTab === 'replied') {
      filtered = filtered.filter(msg => msg.status === 'replied');
    } else if (activeTab === 'inbound') {
      filtered = filtered.filter(msg => msg.direction === 'inbound');
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.message.toLowerCase().includes(searchLower) ||
        msg.fromNumber.includes(filters.search) ||
        msg.campaignName.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(msg => msg.status === filters.status);
    }

    // Filter by direction
    if (filters.direction !== 'all') {
      filtered = filtered.filter(msg => msg.direction === filters.direction);
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(msg => 
        new Date(msg.timestamp) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(msg => 
        new Date(msg.timestamp) <= toDate
      );
    }

    setFilteredMessages(filtered);
  };

  const updateFilter = (key: keyof InboxFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const markAsRead = async (messageId: string) => {
    try {
      // You might need to implement this API endpoint
      // await messageAPI.markAsRead(messageId);
      
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      ));
      
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, read: true } : null);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const exportMessages = () => {
    const csvContent = [
      ['Date', 'From', 'To', 'Message', 'Status', 'Campaign', 'Cost'],
      ...filteredMessages.map(msg => [
        new Date(msg.timestamp).toLocaleString(),
        msg.fromNumber,
        msg.toNumber,
        `"${msg.message.replace(/"/g, '""')}"`,
        msg.status,
        msg.campaignName,
        msg.cost.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms-inbox-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      delivered: 'bg-green-100 text-green-800',
      read: 'bg-blue-100 text-blue-800',
      replied: 'bg-purple-100 text-purple-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? 
      <Mail className="h-4 w-4 text-green-600" /> : 
      <Reply className="h-4 w-4 text-blue-600" />;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground">Please sign in to access the SMS Inbox</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Inbox</h1>
          <p className="text-muted-foreground">
            Manage and monitor all your incoming and outgoing SMS messages
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={exportMessages} disabled={filteredMessages.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={loadMessages} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Search</Label>
                <Input
                  placeholder="Search messages, numbers..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Status</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Direction</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.direction}
                  onChange={(e) => updateFilter('direction', e.target.value)}
                >
                  {DIRECTION_OPTIONS.map(direction => (
                    <option key={direction} value={direction}>
                      {direction.charAt(0).toUpperCase() + direction.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  />
                </div>
                <div>
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="replied">Replied</TabsTrigger>
                  <TabsTrigger value="inbound">Inbound</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Loading messages...</p>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">No messages found</p>
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div
                      key={message._id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedMessage?._id === message._id ? 'bg-muted' : ''
                      } ${!message.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.read) {
                          markAsRead(message._id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getDirectionIcon(message.direction)}
                          <span className="font-medium text-sm">{message.fromNumber}</span>
                          {!message.read && (
                            <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className={getStatusColor(message.status)}>
                            {message.status}
                          </Badge>
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {message.message}
                      </p>
                      
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{message.campaignName}</span>
                        <span>{formatDate(message.timestamp)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Message Details
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm">
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Message Content */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedMessage.fromNumber}</span>
                        <Badge variant={selectedMessage.direction === 'inbound' ? 'default' : 'secondary'}>
                          {selectedMessage.direction}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                  </div>
                </div>

                {/* Message Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">To Number</Label>
                    <p className="font-medium">{selectedMessage.toNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Campaign</Label>
                    <p className="font-medium">{selectedMessage.campaignName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={getStatusColor(selectedMessage.status)}>
                      {selectedMessage.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cost</Label>
                    <p className="font-medium">${selectedMessage.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Characters</Label>
                    <p className="font-medium">{selectedMessage.characterCount}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date & Time</Label>
                    <p className="font-medium">
                      {new Date(selectedMessage.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {selectedMessage.tags && selectedMessage.tags.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedMessage.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Select a Message</h3>
                <p className="text-muted-foreground">
                  Choose a message from the list to view its details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}