import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, XCircle, Clock } from "lucide-react";

interface EmailCampaignStatsProps {
  campaignId: string;
}

export function EmailCampaignStats({ campaignId }: EmailCampaignStatsProps) {
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [campaignId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('email_campaign_logs')
        .select('status')
        .eq('campaign_id', campaignId);

      if (error) throw error;

      const stats = {
        total: data.length,
        sent: data.filter(log => log.status === 'sent').length,
        failed: data.filter(log => log.status === 'failed').length,
        pending: data.filter(log => log.status === 'pending').length,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total envoyés</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Réussis</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.sent}</div>
          {stats.total > 0 && (
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.sent / stats.total) * 100)}%
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Échoués</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.failed}</div>
          {stats.total > 0 && (
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.failed / stats.total) * 100)}%
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En attente</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
        </CardContent>
      </Card>
    </div>
  );
}
