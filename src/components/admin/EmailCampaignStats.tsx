import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, XCircle, Clock, Eye, MousePointer, AlertTriangle } from "lucide-react";

interface EmailCampaignStatsProps {
  campaignId: string;
}

export function EmailCampaignStats({ campaignId }: EmailCampaignStatsProps) {
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
    bounced: 0,
    opened: 0,
    clicked: 0,
    openRate: 0,
    clickRate: 0,
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
        .select('status, opened_at, clicked_at, open_count, click_count')
        .eq('campaign_id', campaignId);

      if (error) throw error;

      const total = data.length;
      const sent = data.filter(log => log.status === 'sent' || log.status === 'delivered').length;
      const delivered = data.filter(log => log.status === 'delivered').length;
      const failed = data.filter(log => log.status === 'failed').length;
      const pending = data.filter(log => log.status === 'pending').length;
      const bounced = data.filter(log => log.status === 'bounced' || log.status === 'complained').length;
      const opened = data.filter(log => log.opened_at !== null).length;
      const clicked = data.filter(log => log.clicked_at !== null).length;

      const deliveredCount = sent + delivered;
      const openRate = deliveredCount > 0 ? Math.round((opened / deliveredCount) * 100) : 0;
      const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0;

      setStats({
        total,
        sent,
        delivered,
        failed,
        pending,
        bounced,
        opened,
        clicked,
        openRate,
        clickRate,
      });
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
    <div className="space-y-6">
      {/* Delivery stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Livraison</h3>
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
              <CardTitle className="text-sm font-medium">Délivrés</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sent + stats.delivered}</div>
              {stats.total > 0 && (
                <p className="text-xs text-muted-foreground">
                  {Math.round(((stats.sent + stats.delivered) / stats.total) * 100)}%
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
              <CardTitle className="text-sm font-medium">Rebonds</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bounced}</div>
              {stats.total > 0 && (
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.bounced / stats.total) * 100)}%
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Engagement stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Engagement</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ouvertures</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.opened}</div>
              <p className="text-xs text-muted-foreground">
                Taux d'ouverture: {stats.openRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clics</CardTitle>
              <MousePointer className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clicked}</div>
              <p className="text-xs text-muted-foreground">
                Taux de clic: {stats.clickRate}%
              </p>
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

          <Card className="bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Taux d'ouverture</span>
                  <span className="font-medium">{stats.openRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taux de clic</span>
                  <span className="font-medium">{stats.clickRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
