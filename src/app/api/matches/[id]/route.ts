import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import Team from '@/models/Team';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const id = (await params).id;
    const body = await request.json();
    const match = await Match.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    
    // Logic to update team stats if match is completed
    if (match.status === 'completed' && body.status === 'completed') {
      const teamA = await Team.findById(match.teamA);
      const teamB = await Team.findById(match.teamB);
      
      if (teamA && teamB) {
        if (match.scoreA > match.scoreB) {
          teamA.wins += 1;
          teamA.points += 3;
          teamB.losses += 1;
        } else if (match.scoreB > match.scoreA) {
          teamB.wins += 1;
          teamB.points += 3;
          teamA.losses += 1;
        }
        await teamA.save();
        await teamB.save();
      }
    }

    if (!match) return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: match });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const id = (await params).id;
    const deletedMatch = await Match.findByIdAndDelete(id);
    if (!deletedMatch) return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
