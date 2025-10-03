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
  MoreVertical,
  Reply,
  Archive,
  Trash2,
  Eye,
  MailPlus,
  Send,
  FolderSync
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useMessagesStore, decodeBase64 } from "@/store/useMessagesStore";
import { toast } from "sonner";
import { deviceAPI } from "@/lib/api";

const STATUS_OPTIONS = ['all', 'delivered', 'read', 'replied', 'failed'];
const DIRECTION_OPTIONS = ['all', 'inbound', 'outbound'];

export function Inbox() {
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuthStore();
  
  // Zustand store
  const {
    messages,
    filteredMessages,
    selectedMessage,
    isLoading,
    isSyncing,
    filters,
    devices,
    selectedDevice,
    setSelectedMessage,
    setSelectedDevice,
    updateFilter,
    clearFilters,
    filterMessages,
    fetchDevices,
    syncMessagesFromDevice,
    loadMessages,
    markAsRead
  } = useMessagesStore();

  // Manual sync handler
  const handleManualSync = async (): Promise<void> => {
    if (!selectedDevice) {
      toast.error('No device selected');
      return;
    }
    await syncMessagesFromDevice(selectedDevice._id);
  };

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices();
    }
  }, [isAuthenticated, fetchDevices]);

  useEffect(() => {
    if (isAuthenticated && selectedDevice) {
      loadMessages();
    }
  }, [isAuthenticated, selectedDevice]);

  useEffect(() => {
    filterMessages(activeTab);
  }, [messages, filters, activeTab, filterMessages]);

  // UI Helper Functions
  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? 
      <MailPlus className="h-4 w-4 text-green-600" /> : 
      <Send className="h-4 w-4 text-blue-600" />;
  };

  const formatDate = (timestamp: string): string => {
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

  const getStatusColor = (status: string): string => {
    const colors = {
      delivered: 'border-green-500 text-green-700 bg-green-50',
      read: 'border-blue-500 text-blue-700 bg-blue-50',
      replied: 'border-purple-500 text-purple-700 bg-purple-50',
      failed: 'border-red-500 text-red-700 bg-red-50',
    };
    return colors[status as keyof typeof colors] || 'border-gray-500 text-gray-700 bg-gray-50';
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
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
          <h1 className="text-3xl font-bold tracking-tight">SMS Inbox</h1>
          <p className="text-muted-foreground">
            Manage and monitor all your incoming and outgoing SMS messages
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(filters.search || filters.status !== 'all' || filters.direction !== 'all' || filters.dateFrom || filters.dateTo) && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualSync} 
            disabled={isSyncing || !selectedDevice}
            className="flex items-center gap-2"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FolderSync className="h-4 w-4" />
            )}
            Sync
          </Button>
          <Button 
            size="sm" 
            onClick={loadMessages} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Device Selection */}
      {devices.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="device-select" className="text-sm font-medium whitespace-nowrap">
                Select Device:
              </Label>
              <select
                id="device-select"
                className="w-full p-2 border rounded-md bg-background"
                value={selectedDevice?._id || ''}
                onChange={(e) => {
                  const device = devices.find(d => d._id === e.target.value);
                  setSelectedDevice(device || null);
                }}
              >
                <option value="">Select a device</option>
                {devices.map(device => (
                  <option key={device._id} value={device._id}>
                    {device.name || device._id}
                  </option>
                ))}
              </select>
              {selectedDevice && (
                <Badge variant="outline" className="whitespace-nowrap">
                  {selectedDevice.status || 'Unknown Status'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <Label htmlFor="search" className="text-sm font-medium">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search messages, phone numbers..."
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <select
                  id="status"
                  className="w-full p-2 border rounded-md bg-background"
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
                <Label htmlFor="direction" className="text-sm font-medium">Direction</Label>
                <select
                  id="direction"
                  className="w-full p-2 border rounded-md bg-background"
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

              <div className="flex items-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="dateFrom" className="text-sm font-medium">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="text-sm font-medium">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
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
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
                <Badge variant="secondary" className="ml-2">
                  {filteredMessages.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
                  <TabsTrigger value="inbound" className="text-xs">Inbound</TabsTrigger>
                  <TabsTrigger value="outbound" className="text-xs">Outbound</TabsTrigger>
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
                    <p className="text-sm text-muted-foreground mt-2">
                      {messages.length === 0 ? 'No messages found' : 'No messages match your filters'}
                    </p>
                    {messages.length === 0 && selectedDevice && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleManualSync} 
                        className="mt-2"
                        disabled={isSyncing}
                      >
                        {isSyncing ? 'Syncing...' : 'Sync from Device'}
                      </Button>
                    )}
                    {messages.length > 0 && (
                      <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                        Clear filters
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedMessage?.id === message.id ? 'bg-muted border-l-4 border-l-primary' : ''
                      } ${!message.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.read) {
                          markAsRead(message.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getDirectionIcon(message.direction)}
                          <span className="font-medium text-sm truncate" title={message.from}>
                            {message.from || 'Unknown'}
                          </span>
                          {!message.read && (
                            <Badge variant="default" className="bg-blue-500 text-white text-xs px-1 py-0">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p 
                        className="text-sm text-muted-foreground line-clamp-2 mb-2 break-words"
                        title={decodeBase64(message.sms)}
                      >
                        {decodeBase64(message.sms)}
                      </p>
                      
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span className="truncate flex-1 mr-2" title={`Port: ${message.port}, Slot: ${message.slot}`}>
                          Port {message.port}-{message.slot}
                        </span>
                        <span className="flex-shrink-0">{formatDate(message.timestamp)}</span>
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
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MessageSquare className="h-5 w-5" />
                    Message Details
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Message Content */}
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedMessage.from}</span>
                        {!selectedMessage.read && (
                          <Badge variant="default" className="bg-blue-500 text-white">
                            Unread
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words bg-background p-3 rounded border">
                        {decodeBase64(selectedMessage.sms)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1 flex items-center gap-2">
                    <Reply className="h-4 w-4" />
                    Reply
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
                  Choose a message from the list to view its details and take actions
                </p>
                {messages.length === 0 && selectedDevice && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleManualSync} 
                    className="mt-4"
                    disabled={isSyncing}
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Messages from Device'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}