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

    const { question } = await req.json();
    console.log('Processing question:', question);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Generate embedding for the question
    const embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: question }] }
        })
      }
    );

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate question embedding');
    }

    const embeddingResult = await embeddingResponse.json();
    const questionVector = embeddingResult.embedding?.values;

    if (!questionVector) {
      throw new Error('No embedding generated for question');
    }

    // Search for similar embeddings using cosine similarity
    const { data: similarChunks, error: searchError } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: questionVector,
        match_threshold: 0.7,
        match_count: 5
      }
    );

    let relevantContext = '';
    if (searchError) {
      console.log('RPC function not found, falling back to simple search');
      // Fallback: get recent documents
      const { data: documents } = await supabase
        .from('documents')
        .select('content')
        .limit(3);
      
      if (documents && documents.length > 0) {
        relevantContext = documents.map(doc => doc.content).join('\n\n');
      }
    } else if (similarChunks && similarChunks.length > 0) {
      relevantContext = similarChunks.map((chunk: any) => chunk.content).join('\n\n');
    }

    // Generate response using Gemini
    const prompt = `Based on the following context about Hero-Vida data, please answer the user's question. If the information is not available in the context, please say so clearly.

Context:
${relevantContext}

Question: ${question}

Please provide a detailed and accurate answer based only on the information provided in the context.`;

    const generateResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (!generateResponse.ok) {
      throw new Error('Failed to generate response from Gemini');
    }

    const result = await generateResponse.json();
    const answer = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    console.log('Generated answer:', answer.substring(0, 100) + '...');

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in query-rag function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});