import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      'https://nupqpsayufclflmtfjin.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { fileName, fileUrl, fileType } = await req.json();
    console.log('Processing file:', fileName, fileType);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(fileUrl);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Extract text based on file type
    let text = '';
    if (fileType === 'text/csv' || fileType === 'application/vnd.ms-excel') {
      text = await fileData.text();
    } else if (fileType === 'application/pdf') {
      // For PDF, we'd need a PDF parser - for now just treating as text
      text = await fileData.text();
    }

    console.log('Extracted text length:', text.length);

    // Store document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        name: fileName,
        type: fileType,
        content: text,
        metadata: { originalUrl: fileUrl }
      })
      .select()
      .single();

    if (docError) {
      console.error('Document insert error:', docError);
      throw new Error(`Failed to store document: ${docError.message}`);
    }

    // Chunk text for embeddings
    const chunks = chunkText(text, 500);
    console.log('Created chunks:', chunks.length);

    // Generate embeddings using Gemini
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const embeddings = [];
    for (const chunk of chunks) {
      try {
        const embeddingResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'models/text-embedding-004',
              content: { parts: [{ text: chunk }] }
            })
          }
        );

        if (!embeddingResponse.ok) {
          console.error('Embedding API error:', await embeddingResponse.text());
          continue;
        }

        const embeddingResult = await embeddingResponse.json();
        const vector = embeddingResult.embedding?.values;

        if (vector) {
          embeddings.push({
            document_id: document.id,
            content: chunk,
            embedding: vector,
            metadata: { chunk_index: embeddings.length }
          });
        }
      } catch (error) {
        console.error('Error generating embedding for chunk:', error);
      }
    }

    // Store embeddings
    if (embeddings.length > 0) {
      const { error: embeddingError } = await supabase
        .from('embeddings')
        .insert(embeddings);

      if (embeddingError) {
        console.error('Embedding insert error:', embeddingError);
        throw new Error(`Failed to store embeddings: ${embeddingError.message}`);
      }
    }

    console.log('Successfully processed file with', embeddings.length, 'embeddings');

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId: document.id,
        chunksProcessed: embeddings.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-file function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function chunkText(text: string, maxTokens: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  
  for (const word of words) {
    currentChunk.push(word);
    if (currentChunk.length >= maxTokens) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }
  
  return chunks;
}