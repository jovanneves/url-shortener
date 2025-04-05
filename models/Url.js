import mongoose from 'mongoose';

// Configuração global para esperar pela conexão
mongoose.set('bufferCommands', true);

const UrlSchema = new mongoose.Schema({
  urlCode: {
    type: String,
    required: true,
    unique: true,
  },
  longUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
  },
  clicks: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  clickHistory: [{
    date: { 
      type: Date, 
      required: true 
    },
    count: { 
      type: Number, 
      default: 1 
    }
  }]
});

export default mongoose.models.Url || mongoose.model('Url', UrlSchema); 