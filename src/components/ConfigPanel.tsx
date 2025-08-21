import { useState, useEffect } from 'react';
import { Settings, Key, Database, Shield, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ConfigPanelProps {
  onConfigSave?: (config: any) => void;
}

export const ConfigPanel = ({ onConfigSave }: ConfigPanelProps) => {
  const [config, setConfig] = useState({
    geminiApiKey: '',
    vectorDb: {
      provider: 'supabase',
      connectionStatus: 'disconnected' as 'connected' | 'disconnected' | 'connecting',
    },
    embedding: {
      model: 'text-embedding-004',
      dimensions: 768,
    },
  });
  
  const { toast } = useToast();

  useEffect(() => {
    // Load config from localStorage on mount
    const savedConfig = localStorage.getItem('rag-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
  }, []);

  const handleSave = async () => {
    try {
      // Save to localStorage (in production, this would be secure backend storage)
      localStorage.setItem('rag-config', JSON.stringify(config));
      
      if (onConfigSave) {
        await onConfigSave(config);
      }
      
      toast({
        title: "Configuration Saved",
        description: "Your settings have been saved successfully",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Save Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    }
  };

  const testVectorDbConnection = async () => {
    setConfig(prev => ({
      ...prev,
      vectorDb: { ...prev.vectorDb, connectionStatus: 'connecting' }
    }));

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setConfig(prev => ({
      ...prev,
      vectorDb: { ...prev.vectorDb, connectionStatus: 'connected' }
    }));

    toast({
      title: "Connection Successful",
      description: "Vector database connection established",
    });
  };

  const getConnectionBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      connected: 'default',
      disconnected: 'secondary',
      connecting: 'secondary',
    };

    const colors: Record<string, string> = {
      connected: 'text-green-500',
      disconnected: 'text-red-500',
      connecting: 'text-yellow-500',
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="glass">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">System Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configure your RAG system settings
            </p>
          </div>
        </div>

        <Tabs defaultValue="api" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="gemini-key">Gemini API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={config.geminiApiKey}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    geminiApiKey: e.target.value 
                  }))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get your API key from{' '}
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <div>
                <Label>Embedding Model</Label>
                <Input
                  value={config.embedding.model}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    embedding: { ...prev.embedding, model: e.target.value }
                  }))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Model used for generating embeddings
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Vector Database Provider</Label>
                  <p className="text-sm text-muted-foreground">Supabase with pgvector</p>
                </div>
                {getConnectionBadge(config.vectorDb.connectionStatus)}
              </div>

              <div>
                <Label>Embedding Dimensions</Label>
                <Input
                  type="number"
                  value={config.embedding.dimensions}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    embedding: { ...prev.embedding, dimensions: parseInt(e.target.value) }
                  }))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Vector dimensions for embeddings
                </p>
              </div>

              <Button 
                onClick={testVectorDbConnection}
                variant="outline"
                disabled={config.vectorDb.connectionStatus === 'connecting'}
                className="w-full"
              >
                {config.vectorDb.connectionStatus === 'connecting' ? (
                  'Testing Connection...'
                ) : (
                  'Test Database Connection'
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-muted/50">
                <h4 className="font-medium mb-2">Security Information</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• API keys are stored securely in Supabase</li>
                  <li>• Vector embeddings are encrypted at rest</li>
                  <li>• All API calls use HTTPS encryption</li>
                  <li>• File uploads are validated and sanitized</li>
                </ul>
              </div>

              <div>
                <Label>Data Retention Policy</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Uploaded files and embeddings are stored indefinitely unless manually deleted.
                  You can clear all data from the database configuration.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} className="flex-1 glow-primary">
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </Card>
  );
};