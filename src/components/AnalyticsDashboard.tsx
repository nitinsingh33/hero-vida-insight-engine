import { useState, useEffect } from 'react';
import { BarChart3, MessageSquare, FileText, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnalyticsData {
  totalQueries: number;
  documentsProcessed: number;
  avgResponseTime: number;
  accuracy: number;
  recentQueries: Array<{
    id: string;
    question: string;
    timestamp: Date;
    responseTime: number;
    relevanceScore: number;
  }>;
}

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalQueries: 0,
    documentsProcessed: 0,
    avgResponseTime: 0,
    accuracy: 0,
    recentQueries: [],
  });

  useEffect(() => {
    // Load analytics from localStorage or API
    const savedAnalytics = localStorage.getItem('rag-analytics');
    if (savedAnalytics) {
      try {
        const parsed = JSON.parse(savedAnalytics);
        setAnalytics(parsed);
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    }
  }, []);

  const statCards = [
    {
      title: 'Total Queries',
      value: analytics.totalQueries.toLocaleString(),
      icon: MessageSquare,
      trend: '+12%',
      trendColor: 'text-green-500',
    },
    {
      title: 'Documents Processed',
      value: analytics.documentsProcessed.toLocaleString(),
      icon: FileText,
      trend: '+3',
      trendColor: 'text-blue-500',
    },
    {
      title: 'Avg Response Time',
      value: `${analytics.avgResponseTime}ms`,
      icon: Clock,
      trend: '-5%',
      trendColor: 'text-green-500',
    },
    {
      title: 'Accuracy Score',
      value: `${(analytics.accuracy * 100).toFixed(1)}%`,
      icon: TrendingUp,
      trend: '+2.1%',
      trendColor: 'text-green-500',
    },
  ];

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRelevanceBadge = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <Card className="p-6 glass">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Monitor your RAG system performance and usage
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="p-4 bg-card/50 border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className={`text-sm mt-1 ${stat.trendColor}`}>
                      {stat.trend} from last week
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent Queries */}
        <div>
          <h4 className="font-medium mb-4">Recent Queries</h4>
          {analytics.recentQueries.length === 0 ? (
            <Card className="p-8 text-center bg-card/50 border-border">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h5 className="font-medium mb-2">No queries yet</h5>
              <p className="text-sm text-muted-foreground">
                Start asking questions in the chat to see analytics here
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {analytics.recentQueries.map((query) => (
                <Card key={query.id} className="p-4 bg-card/50 border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{query.question}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{query.timestamp.toLocaleString()}</span>
                        <span>{query.responseTime}ms</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge 
                        variant={query.relevanceScore >= 0.8 ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {getRelevanceBadge(query.relevanceScore)}
                      </Badge>
                      <span className={`text-sm font-medium ${getRelevanceColor(query.relevanceScore)}`}>
                        {(query.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* System Health */}
        <div>
          <h4 className="font-medium mb-4">System Health</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Vector Database</p>
                  <p className="text-xs text-muted-foreground">Operational</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Gemini API</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Embeddings</p>
                  <p className="text-xs text-muted-foreground">Processing</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Card>
  );
};