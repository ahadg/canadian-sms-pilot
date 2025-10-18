// components/SIMStatus.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  IdCard,
  Signal,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";

export function SIMStatus() {
  const [sims, setSims] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveSIMs = async () => {
    try {
      setLoading(true);
      const data = await authFetch('/api/dashboard/active-sims');
      
      if (data.code === 200) {
        setSims(data.data.sims || []);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching active SIMs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSIMs();
  }, []);

  const getSignalIcon = (signalStrength) => {
    if (!signalStrength || signalStrength < 10) {
      return <Signal className="h-3.5 w-3.5 text-red-500" />;
    } else if (signalStrength < 20) {
      return <Signal className="h-3.5 w-3.5 text-yellow-500" />;
    }
    return <Signal className="h-3.5 w-3.5 text-green-500" />;
  };

  const getUsageColor = (usage) => {
    if (usage >= 100) return "text-red-600";
    if (usage >= 80) return "text-yellow-600";
    return "text-green-600";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IdCard className="h-4 w-4" />
            Active SIMs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 border rounded-lg animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-2 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <IdCard className="h-4 w-4" />
          Active SIMs
          {summary && (
            <span className="text-sm font-normal text-muted-foreground">
              ({summary.totalActiveSIMs})
            </span>
          )}
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchActiveSIMs}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {sims.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Smartphone className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No active SIMs</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sims.map((sim) => (
              <div
                key={sim._id}
                className="p-3 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${
                      sim.dailyUsage.usagePercentage >= 100 ? 'bg-red-50' :
                      sim.dailyUsage.usagePercentage >= 80 ? 'bg-yellow-50' :
                      'bg-green-50'
                    }`}>
                      <Smartphone className={`h-3.5 w-3.5 ${
                        sim.dailyUsage.usagePercentage >= 100 ? 'text-red-600' :
                        sim.dailyUsage.usagePercentage >= 80 ? 'text-yellow-600' :
                        'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {sim.phoneNumber || `Port ${sim.portNumber}`}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {getSignalIcon(sim.signalStrength)}
                        <span>{sim.operator}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getUsageColor(sim.dailyUsage.usagePercentage)}`}>
                      {sim.dailyUsage.usagePercentage}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sim.dailyUsage.sent}/{sim.dailyUsage.limit}
                    </div>
                  </div>
                </div>
                
                <Progress 
                  value={Math.min(sim.dailyUsage.usagePercentage, 100)} 
                  className="h-1.5"
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Summary Footer */}
        {summary && sims.length > 0 && (
          <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
            <span>
              {summary.totalDailySent.toLocaleString()} / {summary.totalDailyLimit.toLocaleString()} sent
            </span>
            <span className={getUsageColor(summary.overallUsage)}>
              {summary.overallUsage}% used
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}