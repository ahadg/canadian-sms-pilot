import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  User,
  Reply,
  MailPlus,
  Send,
  FolderSync,
  ArrowLeft,
  Phone,
  PhoneIcon,
  PhoneOffIcon
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useMessagesStore, decodeBase64, ReceivedSMS } from "@/store/useMessagesStore";
import { toast } from "sonner";

const STATUS_OPTIONS = ['all', 'delivered', 'read', 'replied', 'failed'];
const DIRECTION_OPTIONS = ['all', 'inbound', 'outbound'];

export function Inbox() {
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { isAuthenticated } = useAuthStore();
  
  // Use refs to prevent unnecessary re-renders
  const selectedDeviceRef = useRef(null);
  
  // Zustand store
  const {
    messages,
    filteredMessages,
    conversations,
    currentConversation,
    isLoading,
    isSyncing,
    filters,
    devices,
    selectedDevice,
    setSelectedDevice,
    fetchDevices,
    updateFilter,
    clearFilters,
    filterMessages,
    syncMessagesFromDevice,
    loadMessages,
    markAsRead,
    sendSMS,
    fetchConversations,
    fetchConversation,
    markConversationAsRead,
    isConversationLoading, 
    setConversationLoading
  } = useMessagesStore();

  // Update ref when selectedDevice changes
  useEffect(() => {
    selectedDeviceRef.current = selectedDevice;
  }, [selectedDevice]);

  // Memoized handlers to prevent recreation on every render
  const handleManualSync = useCallback(async (): Promise<void> => {
    const currentDevice = selectedDeviceRef.current;
    if (!currentDevice) {
      toast.error('No device selected');
      return;
    }
    await syncMessagesFromDevice(currentDevice._id);
  }, [syncMessagesFromDevice]);
  console.log("currentConversation",currentConversation)
  const handleConversationReply = useCallback(async () => {
    const currentDevice = selectedDeviceRef.current;
    if (!currentConversation || !replyText.trim() || !currentDevice) {
      toast.error('Please enter a message to send');
      return;
    }
  
    try {
      await sendSMS({
        device: currentDevice,
        port: currentConversation.port,
        slot: currentConversation.slot,
        to: currentConversation.phoneNumber,
        sms: replyText.trim(),
        contact: currentConversation?.contact
      });
      
      setReplyText('');
      // The state is now updated within sendSMS, no need for additional updates
      
    } catch (error) {
      // Error is handled in the store
      console.error('Failed to send message:', error);
    }
  }, [currentConversation, replyText, sendSMS]);

  const handleConversationClick = useCallback(async (conversation: any) => {
    const currentDevice = selectedDeviceRef.current;
    if (!currentDevice) {
      toast.error('No device selected');
      return;
    }
    console.log("conversation",conversation)
    // Fetch the conversation first
    await fetchConversation(
      conversation.simId, 
      conversation.contact?._id, 
      conversation.phoneNumber, 
      conversation.port, 
      conversation.slot, 
      currentDevice._id
    );
    
    // Mark THIS conversation as read in frontend state
    if (conversation.unreadCount > 0) {
      markConversationAsRead(conversation.phoneNumber, conversation.port, conversation.slot);
    }
  }, [fetchConversation, markConversationAsRead]);



  const formatDate = useCallback((timestamp: string): string => {
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
  }, []);

  const formatTime = useCallback((timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Effects with proper dependencies
  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices();
    }
  }, [isAuthenticated, fetchDevices]);

  useEffect(() => {
    if (isAuthenticated && selectedDevice) {
      loadMessages();
    }
  }, [isAuthenticated, selectedDevice, loadMessages]);

  // Filter messages only when dependencies change
  useEffect(() => {
    filterMessages(activeTab);
  }, [messages, filters, activeTab, filterMessages]);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !selectedDevice) return;
    if (messages.length === 0) return;
    if (hasFetchedRef.current) return;
  
    hasFetchedRef.current = true;
    fetchConversations(selectedDevice._id);
  }, [isAuthenticated, selectedDevice?._id, messages.length, fetchConversations]);
  
  // reset when device changes so you can fetch for the new device
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [selectedDevice?._id]);
  
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
      {/* Header */}
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
        {/* Conversations List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversations
                <Badge variant="secondary" className="ml-2">
                  {conversations.length}
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
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">No conversations found</p>
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
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={`${conversation.phoneNumber}-${conversation.port}-${conversation.slot}`}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        currentConversation?.phoneNumber === conversation.phoneNumber && 
                        currentConversation?.port === conversation.port && 
                        currentConversation?.slot === conversation.slot ? 
                        'bg-muted border-l-4 border-l-primary' : ''
                      } ${conversation.unreadCount > 0 ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm truncate" title={conversation.phoneNumber}>
                            {conversation.phoneNumber || 'Unknown'}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="bg-blue-500 text-white text-xs px-1 py-0">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDate(conversation.lastTimestamp)}
                        </span>
                      </div>
                      
                      <p 
                        className="text-sm text-muted-foreground line-clamp-2 mb-2 break-words"
                        title={decodeBase64(conversation.lastMessage)}
                      >
                        {decodeBase64(conversation.lastMessage)}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <PhoneIcon className="h-3 w-3" />
                        <div>
                        <span>Port {conversation.port}-{conversation.slot}</span>
                        </div>
                        {conversation?.isReport && <PhoneOffIcon className="h-3 w-3" color="red" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-2">
          {isConversationLoading ? (
            // Loader when switching conversations
            <Card className="h-full flex items-center justify-center">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Loading Conversation</h3>
                <p className="text-muted-foreground">
                  Loading messages...
                </p>
              </CardContent>
            </Card>
          ) : currentConversation ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-xl">
                        {currentConversation.phoneNumber || 'Unknown Number'}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <PhoneIcon className="h-3 w-3" />
                        Port {currentConversation.port}-{currentConversation.slot}
                      </Badge>
                      {currentConversation.unreadCount > 0 && (
                        <Badge variant="default" className="bg-blue-500 text-white">
                          {currentConversation.unreadCount} unread
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Conversation Messages */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[500px]">
                  {!currentConversation.messages || currentConversation.messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2" />
                      <p>No messages in this conversation</p>
                    </div>
                  ) : (
                    currentConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-4 ${
                            message.direction === 'outbound'
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-900 rounded-bl-none'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.direction === 'inbound' && (
                              <User className="h-3 w-3" />
                            )}
                            <span className="text-xs opacity-75">
                              {message.direction === 'outbound' ? 'You' : message.from}
                            </span>
                            <span className="text-xs opacity-60">
                              {formatTime(message.timestamp)}
                            </span>
                            {!message.read && message.direction === 'inbound' && (
                              <Badge variant="default" className="bg-orange-500 text-white text-xs px-1 py-0">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {decodeBase64(message.sms)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Box */}
                <div className="border-t p-4 bg-muted/20">
                  <div className="space-y-3">
                    <Label htmlFor="conversation-reply" className="text-sm font-medium">
                      Reply to {currentConversation.phoneNumber} {currentConversation?.isReport ? '(Report)' : ''}
                    </Label>
                    <div className="flex gap-2">
                      <Textarea
                        id="conversation-reply"
                        placeholder="Type your message..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        className="resize-none flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleConversationReply();
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        Press Enter to send, Shift+Enter for new line
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => setReplyText('')}
                          disabled={!replyText.trim()}
                          size="sm"
                        >
                          Clear
                        </Button>
                        <Button 
                          onClick={handleConversationReply}
                          disabled={!replyText.trim() || !selectedDevice}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <MessageSquare className="h-16 w-16 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
                <p className="text-muted-foreground mb-4">
                  Choose a conversation from the list to start messaging
                </p>
                {messages.length === 0 && selectedDevice && (
                  <Button 
                    variant="outline" 
                    onClick={handleManualSync} 
                    disabled={isSyncing}
                    className="flex items-center gap-2"
                  >
                    {isSyncing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <FolderSync className="h-4 w-4" />
                    )}
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