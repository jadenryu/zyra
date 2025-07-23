import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json();

    // Call the backend auth API
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        full_name,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.detail || 'Registration failed' },
        { status: response.status }
      );
    }

    const userData = await response.json();

    // Auto-login after registration
    const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: email,
        password: password,
      }),
    });

    if (!loginResponse.ok) {
      return NextResponse.json(
        { message: 'Registration successful but auto-login failed' },
        { status: 200 }
      );
    }

    const loginData = await loginResponse.json();

    return NextResponse.json({
      access_token: loginData.access_token,
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        created_at: userData.created_at,
      },
    });
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 