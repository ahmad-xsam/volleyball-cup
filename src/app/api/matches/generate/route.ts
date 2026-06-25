import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import Team from '@/models/Team';

export async function POST() {
  try {
    await dbConnect();
    
    // Clear existing matches
    await Match.deleteMany({});
    
    // Find teams sorted by drawNumber
    const teams = await Team.find({}).sort({ drawNumber: 1 });
    if (teams.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 teams are required to generate a bracket' },
        { status: 400 }
      );
    }

    // Check if any team has drawNumber missing
    const missingDraw = teams.some(t => t.drawNumber === null || t.drawNumber === undefined);
    if (missingDraw) {
      return NextResponse.json(
        { success: false, error: 'Please perform the Random Draw in the Draw page before generating the bracket.' },
        { status: 400 }
      );
    }

    // Reset team match stats
    await Team.updateMany({}, { wins: 0, losses: 0, points: 0 });

    const numTeams = teams.length;
    
    // Find next power of 2 (P)
    let powerOf2 = 2;
    while (powerOf2 < numTeams) {
      powerOf2 *= 2;
    }

    const totalRounds = Math.log2(powerOf2);
    const bracket: any[][] = [];
    let matchCounter = 1;
    
    // 1. Generate empty bracket layers
    for (let r = 1; r <= totalRounds; r++) {
      const matchesInRound = Math.pow(2, totalRounds - r);
      const roundMatches = [];
      for (let pos = 1; pos <= matchesInRound; pos++) {
        roundMatches.push({
          round: r,
          position: pos,
          matchNumber: 0, // Assigned below
          teamA: null,
          teamB: null,
          scoreA: null,
          scoreB: null,
          nextMatchId: null,
          status: 'scheduled'
        });
      }
      bracket.push(roundMatches);
    }
    
    // 2. Assign match numbers sequentially across the tournament (1 to N)
    for (let r = 0; r < bracket.length; r++) {
      for (let m = 0; m < bracket[r].length; m++) {
        bracket[r][m].matchNumber = matchCounter++;
      }
    }

    // 3. Save matches to DB from Final (root) to Round 1 (leaves)
    // This allows linking nextMatchId correctly
    for (let r = bracket.length - 1; r >= 0; r--) {
      for (let m = 0; m < bracket[r].length; m++) {
        const matchData = bracket[r][m];
        
        // Link to next match if not final
        if (r < bracket.length - 1) {
          const nextMatchPos = Math.floor(m / 2);
          const nextMatch = bracket[r + 1][nextMatchPos];
          matchData.nextMatchId = nextMatch._id;
        }

        const createdMatch = await Match.create(matchData);
        bracket[r][m]._id = createdMatch._id; // save ID for referencing in child matches
      }
    }

    // 4. Distribute Teams into Round 1 (bracket[0])
    const M = bracket[0].length; // Number of matches in Round 1
    const B = powerOf2 - numTeams; // Number of byes needed

    // Determine which match indices in Round 1 will contain a bye
    const byeMatchIndices = new Set<number>();
    if (B > 0) {
      for (let i = 0; i < B; i++) {
        // Distribute byes evenly across the Round 1 matches
        const index = Math.floor((i * M) / B);
        byeMatchIndices.add(index);
      }
    }

    let teamIndex = 0;
    for (let m = 0; m < M; m++) {
      const matchDoc = await Match.findById(bracket[0][m]._id);
      if (matchDoc) {
        const hasBye = byeMatchIndices.has(m);

        if (hasBye) {
          // If match contains a bye, team A automatically wins and advances
          matchDoc.teamA = teams[teamIndex++]?._id || null;
          matchDoc.teamB = null; // Bye
          matchDoc.scoreA = 1;
          matchDoc.scoreB = 0;
          matchDoc.status = 'completed';
        } else {
          // Normal Match
          matchDoc.teamA = teams[teamIndex++]?._id || null;
          matchDoc.teamB = teams[teamIndex++]?._id || null;
          matchDoc.scoreA = null;
          matchDoc.scoreB = null;
          matchDoc.status = 'scheduled';
        }

        await matchDoc.save();

        // Auto-advance the winner to the next round if it was a bye match
        if (matchDoc.status === 'completed' && matchDoc.teamA && matchDoc.nextMatchId) {
          const nextMatch = await Match.findById(matchDoc.nextMatchId);
          if (nextMatch) {
            // Even matches (m = 0, 2, 4...) feed into nextMatch.teamA
            // Odd matches (m = 1, 3, 5...) feed into nextMatch.teamB
            if (m % 2 === 0) {
              nextMatch.teamA = matchDoc.teamA;
            } else {
              nextMatch.teamB = matchDoc.teamA;
            }
            await nextMatch.save();
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Bracket generated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
