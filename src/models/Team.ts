import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: { type: String, default: '' },
  drawNumber: { type: Number, default: null },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  points: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
