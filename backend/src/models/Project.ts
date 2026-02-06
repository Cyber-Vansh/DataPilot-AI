import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  type: 'mysql' | 'csv';

  dbConfig?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  };

  csvPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['mysql', 'csv'], required: true },
  dbConfig: {
    host: String,
    port: Number,
    user: String,
    password: String,
    database: String
  },
  csvPath: String
}, { timestamps: true });


projectSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Project = mongoose.model<IProject>('Project', projectSchema);
