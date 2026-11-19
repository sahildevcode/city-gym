import { NextResponse } from 'next/server';
import { getGymSettings, updateGymSettings } from '@/lib/settings';

// GET settings (plans, pricing, upi, admin pin, day rate)
export async function GET() {
  try {
    const settings = getGymSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST/PUT to update settings from Admin portal
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = updateGymSettings(body);
    return NextResponse.json({ success: true, data: updated, message: 'Settings updated successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
