import { useState } from 'react';
import { 
  MessageSquare, 
  Upload, 
  Settings, 
  Database, 
  Brain,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'chat',
      label: 'Chat Interface',
      icon: MessageSquare,
      description: 'AI conversation',
    },
    {
      id: 'upload',
      label: 'File Upload',
      icon: Upload,
      description: 'Upload CSV/PDF files',
    },
    {
      id: 'config',
      label: 'Configuration',
      icon: Settings,
      description: 'System settings',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Usage statistics',
    },
  ];

  const statusItems = [
    {
      label: 'Vector DB',
      icon: Database,
      status: 'connected',
    },
    {
      label: 'AI Model',
      icon: Brain,
      status: 'ready',
    },
    {
      label: 'Documents',
      icon: FileText,
      status: '0 processed',
    },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'connected' || status === 'ready') return 'text-green-500';
    if (status.includes('processed')) return 'text-blue-500';
    return 'text-yellow-500';
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg gradient-text">Hero-Vida RAG</h1>
              <p className="text-xs text-sidebar-foreground/70">Strategy AI System</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="shrink-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  isActive && "glow-primary",
                  isCollapsed && "px-2"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                )}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Status Section */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <h3 className="text-sm font-medium mb-3 text-sidebar-foreground">System Status</h3>
          <div className="space-y-2">
            {statusItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-sidebar-foreground/70" />
                    <span className="text-sidebar-foreground/70">{item.label}</span>
                  </div>
                  <span className={cn("text-xs font-medium", getStatusColor(item.status))}>
                    {item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};