import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { FileUploader } from '@/components/FileUploader';
import { ConfigPanel } from '@/components/ConfigPanel';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

const Index = () => {
  const [activeTab, setActiveTab] = useState('chat');

  const handleSendMessage = async (message: string): Promise<string> => {
    // In a real implementation, this would:
    // 1. Query the vector database for relevant documents
    // 2. Send the context + question to Gemini API
    // 3. Return the AI response
    
    // For now, return a demo response
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return `I understand you're asking: "${message}"\n\nTo provide accurate insights, I need you to:\n\n1. Upload your CSV/PDF files using the File Upload tab\n2. Configure your Gemini API key in the Configuration tab\n3. Once your data is processed, I'll be able to analyze it and provide detailed insights based on your specific data.\n\nCurrently, no documents have been uploaded to the vector database. Please upload your Hero-Vida strategy documents and I'll help analyze them!`;
  };

  const handleFilesUploaded = async (files: File[]) => {
    // This is now handled in the FileUploader component
    console.log('Files uploaded:', files);
  };

  const handleConfigSave = async (config: any) => {
    // In a real implementation, this would save to Supabase
    console.log('Config saved:', config);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface onSendMessage={handleSendMessage} />;
      case 'upload':
        return <FileUploader onFilesUploaded={handleFilesUploaded} />;
      case 'config':
        return <ConfigPanel onConfigSave={handleConfigSave} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <ChatInterface onSendMessage={handleSendMessage} />;
    }
  };

  return (
    <div className="h-screen flex bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-6">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
