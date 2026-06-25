import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import Team from '@/models/Team';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const matches = await Match.find({}).populate('teamA').populate('teamB').sort({ round: 1, matchNumber: 1 });
    return NextResponse.json({ success: true, data: matches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const match = await Match.create(body);
    return NextResponse.json({ success: true, data: match }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
