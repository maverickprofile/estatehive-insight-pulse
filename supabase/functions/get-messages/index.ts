// supabase/functions/get-messages/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Get environment variables directly
const watiBaseUrl = Deno.env.get('WATI_BASE_URL') || Deno.env.get('VITE_WATI_BASE_URL')
const watiApiKey = Deno.env.get('WATI_API_KEY') || Deno.env.get('VITE_WATI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Ensure API credentials are configured
    if (!watiBaseUrl || !watiApiKey) {
      console.error("WATI API credentials are not set in environment variables.");
      throw new Error("WATI API credentials are not configured.");
    }

    // Fetch messages from the Wati API
    const response = await fetch(`${watiBaseUrl}/api/v1/getMessages?pageSize=100`, {
      method: 'GET',
      headers: {
        'Authorization': watiApiKey,
        'Content-Type': 'application/json',
      },
    });

    // Handle non-successful responses from Wati
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Wati API Error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch messages from Wati. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw WATI API Response:', JSON.stringify(data, null, 2));

    // Transform the response to ensure it has the expected structure
    let transformedData = data;
    
    // Check if the response has messages directly or nested
    if (data.messages) {
      // If messages are already at the top level
      transformedData = data;
    } else if (Array.isArray(data)) {
      // If the response is directly an array of messages
      transformedData = { messages: { items: data } };
    } else if (data.data && Array.isArray(data.data)) {
      // If messages are in a data array
      transformedData = { messages: { items: data.data } };
    } else if (data.result && Array.isArray(data.result)) {
      // If messages are in a result array
      transformedData = { messages: { items: data.result } };
    } else {
      // Try to find any array property that might contain messages
      const keys = Object.keys(data);
      const arrayKey = keys.find(key => Array.isArray(data[key]));
      if (arrayKey) {
        transformedData = { messages: { items: data[arrayKey] } };
      } else {
        // If no array found, return the original data
        console.warn('Could not find messages array in response, returning original data');
        transformedData = { messages: { items: [] } };
      }
    }

    console.log('Transformed response:', JSON.stringify(transformedData, null, 2));

    // Return the transformed data to the client
    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Return an error response if something goes wrong
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
