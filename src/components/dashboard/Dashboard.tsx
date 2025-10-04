import { StatsCard } from "./StatsCard";
import { DeviceStatus } from "./DeviceStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Router,
  Send,
  MessageSquare,
  TrendingUp,
  Plus,
  Play,
  Pause,
  BarChart3,
} from "lucide-react";

export function Dashboard() {
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
          {/* <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm" className="bg-gradient-primary shadow-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button> */}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Devices"
          value="2/3"
          description="Ejoin gateways online"
          icon={Router}
          variant="success"
          trend={{ value: 5.2, label: "from last week" }}
        />
        <StatsCard
          title="Active SIMs"
          value="843/1536"
          description="SIM cards operational"
          icon={MessageSquare}
          variant="info"
          trend={{ value: -2.1, label: "SIM issues resolved" }}
        />
        <StatsCard
          title="Messages Sent Today"
          value="21,370"
          description="Across all campaigns"
          icon={Send}
          variant="default"
          trend={{ value: 12.5, label: "vs yesterday" }}
        />
        <StatsCard
          title="Success Rate"
          value="98.2%"
          description="Delivery success rate"
          icon={TrendingUp}
          variant="success"
          trend={{ value: 1.3, label: "improvement" }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Device Status - Takes 2 columns */}
        <div className="lg:col-span-2">
          <DeviceStatus devices={[]} />
        </div>

        {/* Active Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Recent/Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Black Friday Promo</span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Progress: 7,245 / 15,000 contacts
                </div>
                <Progress value={48.3} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>48.3% complete</span>
                  <span>ETA: 2h 15m</span>
                </div>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Product Update</span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Progress: 2,156 / 8,500 contacts
                </div>
                <Progress value={25.4} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>25.4% complete</span>
                  <span>Paused</span>
                </div>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Welcome Series</span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Progress: 892 / 3,200 contacts
                </div>
                <Progress value={27.9} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>27.9% complete</span>
                  <span>ETA: 45m</span>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              {/* <Plus className="h-4 w-4 mr-2" /> */}
              Manage Campaign
            </Button>
          </CardContent>
        </Card>
      </div>

 
    </div>
  );
}