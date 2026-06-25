import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const id = (await params).id;
    const body = await request.json();
    const team = await Team.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!team) return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: team });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const id = (await params).id;
    const deletedTeam = await Team.findByIdAndDelete(id);
    if (!deletedTeam) return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
