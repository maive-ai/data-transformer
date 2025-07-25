import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/feature-flags";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Check if Pulse API feature is enabled
    if (!isFeatureEnabled("PULSE_API_ENABLED")) {
      return NextResponse.json(
        { error: "Pulse API feature is currently disabled" },
        { status: 503 }
      );
    }

    // Create a new FormData instance for the Pulse API
    const pulseFormData = new FormData();
    pulseFormData.append("file", file);

    // Call Pulse AI API with form data
    const response = await fetch("https://api.runpulse.com/extract", {
      method: "POST",
      headers: {
        "x-api-key": process.env.PULSE_API_KEY || "",
      },
      body: pulseFormData,
    });

    console.log("Got response from Pulse API");

    if (!response.ok) {
      // Log the response details for debugging
      const responseText = await response.text();
      console.error("Pulse API response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });
      throw new Error(`Pulse API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Pulse API Response Data:', JSON.stringify(data, null, 2));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Pulse API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process file" },
      { status: 500 }
    );
  }
} 