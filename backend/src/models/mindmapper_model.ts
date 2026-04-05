import mongoose, { Schema, Document } from 'mongoose';

export interface IMindmapper extends Document {
    user_id: string;
    email: string;
    refresh_token: string;
    folder_id: string;
    folder_name: string;
    page_token: string;
    channel_id?: string;
    resource_id?: string;
    expiration?: Date;
    status: string;
    created_at: Date;
}

// Define the Schema
const MindmapperSchema: Schema = new Schema({
    user_id: {
        type: String,
        required: true,
        index: true // Indexing this makes querying by user_id much faster
    },
    email: {
        type: String,
        required: true
    },
    refresh_token: {
        type: String,
        required: true
    },
    folder_id: {
        type: String,
        required: true
    },
    folder_name: {
        type: String,
        required: true
    },
    page_token: {
        type: String,
        required: true
    },
    channel_id: {
        type: String,
        // Not required initially, as we update this after creation
    },
    resource_id: {
        type: String
    },
    expiration: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'error', 'expired'],
        default: 'pending'
    },
    created_at: {
        type: Date,
        default: Date.now // Automatically sets the current date
    },
});

// Export the Model
const Mindmapper = mongoose.model<IMindmapper>('Mindmapper', MindmapperSchema);

export default Mindmapper;