import { NextResponse } from 'next/server';
import { getAllMembersAsync, saveMemberAsync, updateMemberStatusAsync, updateMemberDetailsAsync, deleteMemberAsync, Member } from '@/lib/db';
import { generateCustomDietPlan } from '@/lib/dietGenerator';

// GET all members (for admin dashboard)
export async function GET() {
  try {
    const members = await getAllMembersAsync();
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
      id: 'IHC-' + Math.floor(100000 + Math.random() * 900000),
      name,
      phone,
      age: Number(age) || 0,
      weight: Number(weight) || 0,
      startDate,
      durationMonths: Number(durationMonths) || 0,
      durationDays: Number(durationDays) || 30,
      endDate,
      amount: Number(amount),
      paymentMethod,
      paymentStatus: paymentMethod === 'CASH' ? 'pending' : (utrNumber ? 'pending' : 'verified'),
      utrNumber,
      createdAt: new Date().toISOString(),
      wantsDiet: Boolean(wantsDiet)
    };

    await saveMemberAsync(newMember);

    return NextResponse.json({
      success: true,
      message: 'Member registered successfully',
      data: newMember,
      dietPlan: dietPlan
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - update member full details (Edit option)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, age, weight, startDate, endDate, amount, paymentStatus, paymentMethod } = body;

    if (!id || !name || !phone) {
      return NextResponse.json({ success: false, error: 'ID, name and phone are required' }, { status: 400 });
    }

    const updated = await updateMemberDetailsAsync(id, {
      name,
      phone,
      age: Number(age) || 0,
      weight: Number(weight) || 0,
      startDate,
      endDate,
      amount: Number(amount) || 0,
      paymentStatus,
      paymentMethod
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - update payment status (verify/reject)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !['pending', 'verified', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const updated = await updateMemberStatusAsync(id, status);
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

    const deleted = await deleteMemberAsync(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
