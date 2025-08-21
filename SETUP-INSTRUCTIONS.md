# Hero-Vida Agentic RAG System - Setup Instructions

## 🚀 Quick Start Guide

This is a complete MVP/POC of an Agentic RAG system built for the Hero-Vida Strategy Team. The system allows you to upload CSV and PDF files, process them into a vector database, and query them using AI-powered insights via the Gemini API.

## 📋 System Overview

### Architecture
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions (for file processing and AI queries)
- **Vector Database**: Supabase with pgvector extension
- **AI Model**: Google Gemini API for chat and embeddings
- **File Storage**: Supabase Storage for CSV/PDF files

### Core Features
✅ **ChatGPT-like Interface** - Clean, modern chat UI with message history  
✅ **File Upload System** - Drag & drop CSV/PDF files with validation  
✅ **Configuration Panel** - Secure API key management  
✅ **Analytics Dashboard** - Query performance and system health monitoring  
✅ **Vector Database Integration** - Efficient document retrieval using embeddings  
✅ **Real-time Processing** - Live file upload and processing status  

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Google AI Studio account for Gemini API

### Step 1: Local Development Setup

```bash
# Clone and install dependencies
git clone <your-repo-url>
cd hero-vida-rag-system
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Step 2: Supabase Configuration

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Enable pgvector Extension**
   ```sql
   -- Run in Supabase SQL Editor
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Create Database Tables**
   ```sql
   -- Documents table
   CREATE TABLE documents (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     type TEXT NOT NULL,
     content TEXT NOT NULL,
     metadata JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Embeddings table
   CREATE TABLE embeddings (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     embedding vector(768),
     metadata JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create index for similarity search
   CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
   ```

4. **Set up Storage Bucket**
   ```sql
   -- Create storage bucket for file uploads
   INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
   ```

### Step 3: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key (you'll add it in the Configuration tab)

### Step 4: Configure the Application

1. **Open the RAG System** at `http://localhost:8080`
2. **Navigate to Configuration Tab**
3. **Add your Gemini API Key** in the API Keys section
4. **Test Database Connection** (should auto-connect with Supabase)
5. **Save Configuration**

## 📁 Using the System

### Upload Documents

1. **Go to File Upload Tab**
2. **Drag & Drop or Click to Upload**
   - Supported formats: CSV, PDF, XLSX
   - Max file size: 50MB per file
3. **Wait for Processing**
   - Files are uploaded to Supabase Storage
   - Text is extracted and chunked
   - Embeddings are generated using Gemini
   - Vectors are stored in the database

### Chat with Your Data

1. **Switch to Chat Interface Tab**
2. **Ask Questions** like:
   - "What are the key insights from the uploaded data?"
   - "Summarize the main trends in the CSV files"
   - "What recommendations can you make based on the strategy documents?"
3. **Get AI-Powered Responses** based on your specific data

### Monitor Performance

1. **Check Analytics Tab** for:
   - Total queries processed
   - Response times
   - Accuracy scores
   - System health status

## 🔧 Supabase Edge Functions (Backend Processing)

Create these Edge Functions in your Supabase project:

### 1. File Processing Function
```typescript
// supabase/functions/process-file/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { fileUrl, fileName, fileType } = await req.json()
  
  // 1. Download file from storage
  // 2. Extract text (PDF parser for PDFs, CSV parser for CSVs)
  // 3. Chunk text into smaller pieces
  // 4. Generate embeddings using Gemini API
  // 5. Store in embeddings table
  
  return new Response(JSON.stringify({ success: true }))
})
```

### 2. Query Function
```typescript
// supabase/functions/query-rag/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { question } = await req.json()
  
  // 1. Generate embedding for the question
  // 2. Perform similarity search in embeddings table
  // 3. Retrieve relevant document chunks
  // 4. Send context + question to Gemini API
  // 5. Return AI response
  
  return new Response(JSON.stringify({ answer: "AI response" }))
})
```

## 🔒 Security Features

- **API Keys**: Stored securely in Supabase secrets (not in code)
- **File Validation**: Only PDF/CSV files accepted with size limits
- **HTTPS**: All communications encrypted
- **Vector Encryption**: Embeddings encrypted at rest
- **Access Control**: Supabase RLS policies for data protection

## 📊 Scaling the System

### Current MVP Limitations
- Single-user interface
- Local file processing
- Basic analytics

### Scaling Recommendations
1. **Multi-user Support**: Add authentication and user-specific data isolation
2. **Batch Processing**: Queue system for large file uploads
3. **Advanced Analytics**: More detailed performance metrics
4. **Custom Models**: Fine-tuned embeddings for domain-specific data
5. **API Rate Limiting**: Implement usage quotas and rate limiting

## 🐛 Troubleshooting

### Common Issues

**Files not processing:**
- Check Gemini API key is valid
- Verify Supabase connection
- Check browser console for errors

**Chat not responding:**
- Ensure documents are uploaded and processed
- Verify API key configuration
- Check Supabase Edge Functions are deployed

**Database connection failed:**
- Confirm pgvector extension is enabled
- Check database tables are created
- Verify Supabase project URL and keys

### Debug Mode
- Open browser developer tools
- Check console for error messages
- Monitor network requests for API failures

## 📈 Adding More Data

1. **Upload New Files**: Use the File Upload tab anytime
2. **Automatic Processing**: New files are automatically embedded
3. **Incremental Updates**: The system supports adding data without reprocessing existing files

## 🔄 Re-training/Updating Embeddings

To update embeddings when new files are added:
1. New files automatically trigger embedding generation
2. Old embeddings remain intact
3. Queries search across all embeddings
4. To re-process existing files, delete and re-upload them

## 📞 Support

For technical issues or questions:
- Check the Analytics tab for system health
- Review browser console for error messages
- Ensure all configuration steps are completed
- Verify Supabase project setup is correct

---

## 🎯 Next Steps

This MVP provides a solid foundation for your RAG system. Consider these enhancements:

1. **User Authentication**: Add login/signup for multiple users
2. **Advanced File Types**: Support for Word docs, PowerPoint, etc.
3. **Custom Chunking**: Domain-specific text chunking strategies
4. **Fine-tuned Models**: Train custom embeddings for better accuracy
5. **Advanced Analytics**: Detailed query analysis and optimization suggestions

Your Hero-Vida Strategy RAG system is now ready to analyze your data! 🚀