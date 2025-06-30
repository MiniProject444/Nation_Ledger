
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// IPFS client using Pinata
const uploadToIPFS = async (file: ArrayBuffer, fileName: string, fileType: string = 'text/plain') => {
  try {
    // Get API keys from environment variables
    const apiKey = Deno.env.get('PINATA_API_KEY');
    const apiSecret = Deno.env.get('PINATA_API_SECRET');
    
    if (!apiKey || !apiSecret) {
      throw new Error('Pinata API keys are not configured');
    }
    
    console.log(`Starting IPFS upload with Pinata, file size: ${file.byteLength}, fileName: ${fileName}, fileType: ${fileType}`);
    
    // Create form data with the file
    const data = new FormData();
    const blob = new Blob([file], { type: fileType });
    console.log(`Created blob with size: ${blob.size}, type: ${fileType}`);
    data.append('file', blob, fileName);
    
    // Add metadata for the file
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        source: 'NationLedger',
        uploadDate: new Date().toISOString(),
        contentType: fileType
      }
    });
    data.append('pinataMetadata', metadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 1
    });
    data.append('pinataOptions', pinataOptions);

    console.log('Uploading to Pinata with real API credentials');

    // Upload to Pinata with additional timeout and error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': apiSecret,
      },
      body: data,
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    console.log(`Pinata response status: ${response.status}`);
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error(`Pinata error response: ${errorText}`);
      } catch (e) {
        console.error(`Could not read error response: ${e}`);
        errorText = 'Unknown error';
      }
      
      // Handle specific error cases
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication error with Pinata. Please verify your API keys.`);
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded. Please try again later.`);
      } else {
        throw new Error(`Failed to upload to IPFS: ${response.status} ${errorText}`);
      }
    }

    const result = await response.json();
    console.log(`Pinata upload successful: ${JSON.stringify(result)}`);
    
    if (!result.IpfsHash) {
      throw new Error('No IPFS hash returned from Pinata');
    }
    
    // Return the IpfsHash (Content Identifier) and gateway URL
    return { 
      cid: result.IpfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    };
  } catch (error) {
    console.error(`Error uploading to IPFS: ${error}`);
    if (error.name === 'AbortError') {
      throw new Error('IPFS upload timed out. Please try again later.');
    }
    throw error;
  }
}

// Helper function to determine file type based on filename or default to HTML
const getFileTypeFromName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (!extension) return 'text/html';
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'json': 'application/json',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif'
  };
  
  return mimeTypes[extension] || 'text/html';
}

// Create a better formatted HTML document for text content
const createHtmlDocument = (title: string, content: string): string => {
  const formattedContent = content.split('\n').map(line => `<p>${line}</p>`).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .document-content {
      background: #f9f9f9;
      border-left: 4px solid #2c3e50;
      padding: 15px;
      margin: 20px 0;
    }
    .metadata {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="document-content">
    ${formattedContent}
  </div>
  <div class="metadata">
    <p>Document uploaded to IPFS via NationLedger</p>
    <p>Date: ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Initialize Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://lykxreujpwjfinrvqmtp.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5a3hyZXVqcHdqZmlucnZxbXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjU0MTIsImV4cCI6MjA2MDA0MTQxMn0.8VWPybHR4uQNhqv0EDosY45VsKugQrkT8uI5G4JryBo';
    
    console.log(`Initializing Supabase client with URL: ${supabaseUrl}`);
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });
    
    // Parse request body as JSON
    let requestBody;
    try {
      requestBody = await req.json();
      console.log(`Request body received: ${JSON.stringify(requestBody)}`);
    } catch (error) {
      console.error(`Error parsing request body: ${error}`);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Check if the request is for file upload
    const { method } = requestBody;
    console.log(`Request method: ${method}`);
    
    if (method === 'GET_IPFS_URL') {
      // Return a gateway URL for a given CID
      const { cid } = requestBody;
      if (!cid) {
        return new Response(
          JSON.stringify({ error: 'No CID provided' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cid}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (method === 'UPLOAD') {
      // Get the document details from the request
      const { id, fileId, fileName } = requestBody;
      
      if (!id || !fileId || !fileName) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: id, fileId, or fileName' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.log(`Upload requested for document ID: ${id}, fileId: ${fileId}, fileName: ${fileName}`);
      
      // Check if document exists
      const { data: docCheck, error: docCheckError } = await supabase
        .from('documents')
        .select('id, ipfs_hash, file_type')
        .eq('id', id)
        .single();
      
      if (docCheckError) {
        console.error(`Error checking document: ${docCheckError.message}`);
        throw new Error(`Error checking document: ${docCheckError.message}`);
      }
      
      if (!docCheck) {
        throw new Error(`Document with ID ${id} not found`);
      }
      
      // If document already has an IPFS hash, return it
      if (docCheck.ipfs_hash) {
        console.log(`Document already has IPFS hash: ${docCheck.ipfs_hash}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            cid: docCheck.ipfs_hash,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${docCheck.ipfs_hash}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Determine file type for better preview
      const fileType = getFileTypeFromName(fileName);
      
      // Create a sample document with the document ID
      // In a real app, you would retrieve the actual file from storage
      const currentDate = new Date().toISOString();
      const contentText = `This is a simulated document file for ${fileName} (ID: ${id}).\n` +
                         `This file represents a government document that has been declassified.\n` +
                         `Document created at: ${currentDate}`;
      
      // Use HTML for better document preview
      const htmlContent = createHtmlDocument(fileName, contentText);
      
      // Use the appropriate content based on file type
      const fileContent = fileType.includes('html') ? htmlContent : contentText;
      
      const encoder = new TextEncoder();
      const fileData = encoder.encode(fileContent);
      
      console.log(`Created content for document, size: ${fileData.length} bytes, type: ${fileType}`);
      
      try {
        // Upload to IPFS with the appropriate file type
        const { cid, ipfsUrl } = await uploadToIPFS(fileData, fileName, fileType);
        console.log(`IPFS upload complete, CID: ${cid}, IPFS URL: ${ipfsUrl}`);
        
        // Update the document record with the IPFS hash
        const { error: updateError } = await supabase
          .from('documents')
          .update({ ipfs_hash: cid })
          .eq('id', id);
        
        if (updateError) {
          console.error(`Error updating document record: ${updateError.message}`);
          throw new Error(`Error updating document: ${updateError.message}`);
        }
        
        console.log(`Document record updated with IPFS hash: ${cid}`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            cid,
            ipfsUrl
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error(`IPFS upload failed: ${error.message}`);
        return new Response(
          JSON.stringify({ 
            error: `IPFS upload failed: ${error.message}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Unknown method' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error(`Error in ipfs-upload function: ${error}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
