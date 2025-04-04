import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if it hasn't been already
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: Request) {
  const { idToken } = await request.json();
  
  try {
    // Create a session cookie using the ID token
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });
    
    // Set cookie for future requests
    cookies().set({
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE() {
  cookies().delete('session');
  return NextResponse.json({ success: true });
} 