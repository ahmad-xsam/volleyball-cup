import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';

export async function GET() {
  try {
    await dbConnect();
    const teams = await Team.find({}).sort({ points: -1, wins: -1 }); // Sort by points, then wins
    return NextResponse.json({ success: true, data: teams });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const team = await Team.create(body);
    return NextResponse.json({ success: true, data: team }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
