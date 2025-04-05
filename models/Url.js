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
  }],
  // Campo para controlar se a URL é pública ou privada
  isPublic: {
    type: Boolean,
    default: true, // Por padrão, URLs são públicas
  },
  // Referência ao usuário que criou a URL
  userId: {
    type: String,
    required: false, // Não é obrigatório para URLs anônimas
    index: true, // Adiciona índice para melhorar a performance de consultas
  },
  // Nome do usuário que criou a URL (para exibição)
  userName: {
    type: String,
    required: false,
  }
});

// Índices compostos para otimizar consultas comuns
UrlSchema.index({ userId: 1, isPublic: 1 });
UrlSchema.index({ createdAt: -1 });

export default mongoose.models.Url || mongoose.model('Url', UrlSchema); 