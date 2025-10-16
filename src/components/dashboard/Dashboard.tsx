import { useState, useEffect } from 'react';
import { StatsCard } from "./StatsCard";
import { DeviceStatus } from "./DeviceStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Router,
  Send,
  MessageSquare,
  TrendingUp,
  Plus,
  BarChart3,
  Users,
  DollarSign,
  Activity,
  Signal,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { authFetch } from '@/lib/api';
import { useNavigationStore } from '@/store/useNavigationStore';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [devices, setDevices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  console.log("stats",stats)
  const { activeSection, setActiveSection } = useNavigationStore();
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, campaignsRes, devicesRes, analyticsRes] = await Promise.all([
        authFetch('/api/dashboard/stats'),
        authFetch('/api/dashboard/recent-campaigns?limit=5'),
        authFetch('/api/dashboard/devices'),
        authFetch('/api/dashboard/analytics?days=7')
      ]);

      if (statsRes.code === 200) setStats(statsRes.data);
      if (campaignsRes.code === 200) setRecentCampaigns(campaignsRes.data.campaigns);
      if (devicesRes.code === 200) setDevices(devicesRes.data.devices);
      if (analyticsRes.code === 200) setAnalytics(analyticsRes.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your SMS campaigns and device performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
          onClick={() => setActiveSection('campaigns')}
          size="sm" className="bg-gradient-primary shadow-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <StatsCard
            title="Active Devices"
            value={stats.activeDevices}
            description={`${stats.deviceHealth?.online} online, ${stats.deviceHealth?.offline} offline`}
            icon={Router}
            variant={stats.deviceHealth?.online > 0 ? "success" : "destructive"}
            trend={{ value: 5.2, label: "from last week" }}
          />
          <StatsCard
            title="Active SIMs"
            value={stats?.activeSIMs || 0}
            description={`${stats.simHealth?.goodSignal} good signal`}
            icon={Signal}
            variant={stats.simHealth?.active > 0 ? "success" : "destructive"}
            trend={{ value: -2.1, label: "SIM issues resolved" }}
          />
          <StatsCard
            title="Messages Today"
            value={stats.messagesSentToday?.toLocaleString() || "0"}
            description={`${stats.performance?.deliveryRate} delivery rate`}
            icon={Send}
            variant="default"
            trend={{ value: stats.performance?.messageTrend || 0, label: "vs yesterday" }}
          />
          <StatsCard
            title="Success Rate"
            value={stats.successRate}
            description="Overall delivery success"
            icon={TrendingUp}
            variant={parseFloat(stats.successRate) > 95 ? "success" : "warning"}
            trend={{ value: 1.3, label: "improvement" }}
          />
          <StatsCard
            title="Total Contacts"
            value={stats.totalContacts?.toLocaleString() || "0"}
            description="Across all lists"
            icon={Users}
            variant="info"
            trend={{ value: 8.7, label: "growth" }}
          />
          {/* <StatsCard
            title="Avg Sms Today"
            value={`${stats.averageProcessingTimeToday / 1000 || '0.00'} sec`}
            description="Avg Sms sending"
            icon={DollarSign}
            variant="default"
            trend={{ value: -12.5, label: "vs yesterday" }}
          /> */}
        </div>
      )}

      {/* Performance Overview */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                Device Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Online Devices</span>
                <Badge variant="outline" className="bg-green-50">
                  {stats.deviceHealth?.online || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Offline Devices</span>
                <Badge variant="outline" className="bg-red-50">
                  {stats.deviceHealth?.offline || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Warning</span>
                <Badge variant="outline" className="bg-yellow-50">
                  {stats.deviceHealth?.warning || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Signal className="h-4 w-4" />
                SIM Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active SIMs</span>
                <Badge variant="outline" className="bg-green-50">
                  {stats.simHealth?.active || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Good Signal</span>
                <Badge variant="outline" className="bg-blue-50">
                  {stats.simHealth?.goodSignal || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Weak Signal</span>
                <Badge variant="outline" className="bg-yellow-50">
                  {stats.simHealth?.weakSignal || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Delivery Rate</span>
                <span className="text-sm font-medium">{stats.performance?.deliveryRate || '0%'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Failure Rate</span>
                <span className="text-sm font-medium text-red-600">
                  {stats.performance?.failureRate || '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Signal</span>
                <span className="text-sm font-medium">{stats.performance?.averageSignal || 0} dBm</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Device Status - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <DeviceStatus devices={devices} />
          
          {/* Campaign Progress */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Campaign Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.campaignProgress?.slice(0, 4).map((campaign, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{campaign.name}</span>
                    <Badge variant={
                      campaign.status === 'active' ? 'default' :
                      campaign.status === 'paused' ? 'secondary' : 'outline'
                    }>
                      {campaign.status}
                    </Badge>
                  </div>
                  <Progress value={campaign.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{campaign.progress.toFixed(1)}% complete</span>
                    <span>{campaign.sent?.toLocaleString()} / {campaign.total?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {(!stats?.campaignProgress || stats.campaignProgress.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active campaigns</p>
                </div>
              )}
            </CardContent>
          </Card> */}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recent Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Recent Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign._id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{campaign.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        campaign.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : campaign.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Progress: {campaign.sentMessages?.toLocaleString()} / {campaign.totalContacts?.toLocaleString()} contacts
                    </div>
                    <Progress value={campaign.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{campaign.progress?.toFixed(1)}% complete</span>
                      <span>{campaign.eta}</span>
                    </div>
                  </div>
                ))}
                
                {recentCampaigns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No campaigns found</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </div>
                )}
              </div>

              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                View All Campaigns
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

// Loading Skeleton Component
function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded"></div>
          ))}
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-60 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-6">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}