import { NextResponse } from 'next/server';
import { getAllMembers, saveMember, updateMemberStatus, deleteMember, Member } from '@/lib/db';
import { generateCustomDietPlan } from '@/lib/dietGenerator';

// GET all members (for admin dashboard)
export async function GET() {
  try {
    const members = getAllMembers();
    return NextResponse.json({ success: true, data: members });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST new member registration (from client QR scan form)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      age,
      weight,
      startDate,
      durationDays,
      durationMonths,
      amount,
      paymentMethod = 'UPI_QR',
      utrNumber = '',
      wantsDiet = false,
      dietGoal = 'fitness_maintenance',
      foodType = 'veg'
    } = body;

    if (!name || !phone || !startDate || !amount) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Auto calculate End Date based on startDate and durationDays
    const startObj = new Date(startDate);
    const endObj = new Date(startObj);
    endObj.setDate(startObj.getDate() + Number(durationDays));
    const endDate = endObj.toISOString().split('T')[0];

    // Optional AI Diet Generation
    let dietPlan = undefined;
    if (wantsDiet) {
      dietPlan = generateCustomDietPlan({
        name,
        age: Number(age) || 24,
        weight: Number(weight) || 68,
        goal: dietGoal,
        foodType: foodType
      });
    }

    const newMember: Member = {
      id: 'CG-' + Math.floor(100000 + Math.random() * 900000),
      name,
      phone,
      age: Number(age) || 20,
      weight: Number(weight) || 65,
      startDate,
      durationMonths: Number(durationMonths) || 1,
      durationDays: Number(durationDays) || 30,
      endDate,
      amount: Number(amount),
      paymentMethod,
      paymentStatus: 'pending', // Pending until Admin verifies payment on their phone dashboard
      utrNumber,
      createdAt: new Date().toISOString(),
      wantsDiet: !!wantsDiet,
      dietPlan
    };

    saveMember(newMember);

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Verification pending.',
      data: newMember
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH to update payment status (Admin verify / reject)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !['pending', 'verified', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const updated = updateMemberStatus(id, status);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE member
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const success = deleteMember(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
