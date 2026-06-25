import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
  teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  scoreA: { type: Number, default: 0 },
  scoreB: { type: Number, default: 0 },
  status: { type: String, enum: ['scheduled', 'ongoing', 'completed'], default: 'scheduled' },
  round: { type: Number, default: 1 },
  matchNumber: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.models.Match || mongoose.model('Match', MatchSchema);
