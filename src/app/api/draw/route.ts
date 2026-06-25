import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';

export async function POST() {
  try {
    await dbConnect();
    const teams = await Team.find({});
    
    if (teams.length === 0) {
      return NextResponse.json({ success: false, error: 'No teams available for draw' }, { status: 400 });
    }

    // Shuffle array using Fisher-Yates
    const shuffledTeams = [...teams];
    for (let i = shuffledTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
    }

    // Update draw numbers
    const updates = shuffledTeams.map((team, index) => {
      return Team.findByIdAndUpdate(team._id, { drawNumber: index + 1 });
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true, message: 'Draw completed successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
