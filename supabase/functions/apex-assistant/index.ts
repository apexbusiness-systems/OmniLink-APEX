import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOmniLinkIntegrationBrainPrompt } from "../_shared/omnilinkIntegrationBrain.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPromptPromise = getOmniLinkIntegrationBrainPrompt();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, history = [] } = await req.json();
    const openAIKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = await systemPromptPromise;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: query },
    ];

    console.log('APEX: Processing query:', query);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages,
        max_completion_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });
    
    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'AI request failed', 
          details: error,
          message: 'Please ensure OPENAI_API_KEY is configured correctly' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
    
    console.log('APEX: Received response');

    // Try to parse as JSON for structured output
    let structuredResponse;
    try {
      structuredResponse = JSON.parse(assistantMessage);
      console.log('APEX: Successfully parsed structured response');
    } catch (e) {
      console.log('APEX: Response not in JSON format, wrapping as plain text');
      // If not JSON, return as plain text
      structuredResponse = {
        summary: [assistantMessage.substring(0, 200)],
        details: [],
        next_actions: ["APEX returned unstructured output - try rephrasing your query"],
        sources_used: ['AI response'],
        notes: assistantMessage,
      };
    }

    return new Response(
      JSON.stringify({ response: structuredResponse, raw: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('APEX assistant error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
