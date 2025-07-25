

export async function processAndForwardToLandingAi(imageFile: File, jobId?: string) {

  console.log(`📤 [LANDING_AI_SERVICE] Received file: ${imageFile.name} (${imageFile.size} bytes). Forwarding as-is to Flask server.`);

  // Create new FormData to forward the original file to the Flask server
  const flaskFormData = new FormData();
  flaskFormData.append('image', imageFile, imageFile.name);

  // If a jobId is provided, include it in the Flask request headers
  const headers: HeadersInit = {};
  if (jobId) {
    headers['X-Job-Id'] = jobId;
    console.log(`📥 [LANDING_AI_SERVICE] Including X-Job-Id header: ${jobId}`);
  }

  // The Flask server at localhost:5000/upload_image will handle PDF to PNG conversion
  console.log(`🔄 [LANDING_AI_SERVICE] Flask server at http://localhost:5000/upload_image will handle PDF to PNG conversion.`);

  // Forward the request to your Flask server
  const controller = new AbortController();
  const timeout = 600000; // 10 minutes in milliseconds
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const flaskResponse = await fetch('http://127.0.0.1:5000/upload_image', {
      method: 'POST',
      body: flaskFormData,
      headers: headers,
      signal: controller.signal, // AbortController signal
      // No 'Content-Type' header is needed for FormData, fetch sets it automatically
    });

    clearTimeout(id); // Clear the timeout if the fetch completes
    console.log(`📡 [LANDING_AI_SERVICE] Received response from Flask server. Status: ${flaskResponse.status}`);

    if (!flaskResponse.ok) {
      const errorData = await flaskResponse.text();
      console.error('❌ [LANDING_AI_SERVICE] Flask server error:', errorData);
      throw new Error(`Flask server error: ${errorData}`);
    }

    const flaskJson = await flaskResponse.json();
    console.log('✅ [LANDING_AI_SERVICE] Successfully forwarded image and received response from Flask server.');

    return flaskJson;
  } catch (error: any) {
    clearTimeout(id); // Ensure timeout is cleared on error too
    if (error.name === 'AbortError') {
      console.error(`❌ [LANDING_AI_SERVICE] Flask server request timed out after ${timeout / 1000} seconds.`);
      throw new Error(`Flask server request timed out.`);
    } else {
      console.error('❌ [LANDING_AI_SERVICE] An unexpected error occurred during Flask request:', error);
      throw error;
    }
  }
} 