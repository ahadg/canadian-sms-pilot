// components/CampaignStats.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Send, Play, BarChart3, Users } from "lucide-react";
import { Campaign } from "@/lib/api/campaign";

interface CampaignStatsProps {
  campaigns: Campaign[];
}

export function CampaignStats({ campaigns }: CampaignStatsProps) {
  const getDeliveryRate = (campaign: Campaign) => {
    if (!campaign?.sentMessages || campaign.sentMessages === 0) return 0;
    return ((campaign.deliveredMessages || 0) / campaign.sentMessages) * 100;
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold">{campaigns.length}</p>
            </div>
            <Send className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Now</p>
              <p className="text-2xl font-bold">
                {campaigns.filter((c: Campaign) => c?.status === "active").length}
              </p>
            </div>
            <Play className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Messages Sent</p>
              <p className="text-2xl font-bold">
                {campaigns.reduce((sum: number, c: Campaign) => sum + (c?.sentMessages || 0), 0).toLocaleString()}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Delivery Rate</p>
              <p className="text-2xl font-bold">
                {campaigns.length > 0 
                  ? (campaigns.reduce((sum: number, c: Campaign) => sum + getDeliveryRate(c), 0) / campaigns.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}