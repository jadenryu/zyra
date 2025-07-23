import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Call the backend auth API
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: email,
        password: password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.detail || 'Login failed' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Get user data
    const userResponse = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
      },
    });

    let user;
    if (userResponse.ok) {
      user = await userResponse.json();
    } else {
      // Fallback user data
      user = {
        id: 'temp',
        email: email,
        full_name: email.split('@')[0],
        created_at: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      access_token: data.access_token,
      user: user,
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 