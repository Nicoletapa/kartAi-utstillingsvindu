import { NextResponse } from 'next/server';

// Ensure this URL points to your FastAPI backend
const BACKEND_PLANPRAT_URL = process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/plan-prat` : 'http://localhost:8000/api/plan-prat';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, spatialData } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid request: query (as text) is required' }, { status: 400 });
    }

    // Call your FastAPI backend service
    const backendResponse = await fetch(BACKEND_PLANPRAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: text, // FastAPI expects 'query'
        spatial_data: spatialData, // FastAPI expects 'spatial_data'
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error('Backend error response:', errorData);
      throw new Error(`Backend responded with ${backendResponse.status}: ${errorData}`);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in Next.js /api/planprat route:', error);
    const message = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}