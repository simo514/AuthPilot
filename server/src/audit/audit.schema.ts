import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Schema as MongooseSchema, Document } from 'mongoose';

export type AuditDocument = Audit & Document;

@Schema({ timestamps: true })
export class Audit {
    @Prop({
        default: () => randomUUID(),
        unique: true,
        index: true,
    })
    uuid: string;

    @Prop({
        type: MongooseSchema.Types.Mixed,
        required: false,
    })
    user?: Record<string, any>;

    @Prop({
        type: String,
        required: true,
    })
    action: string;


    @Prop({
        type: String,
        required: false,
        enum: ['success', 'failed'],
        default: 'success',
    })
    status?: 'success' | 'failed';

    @Prop({
        type: String,
        required: false,
    })
    details?: string;

    @Prop({
        type: MongooseSchema.Types.Mixed,
        required: false,
    })
    response?: Record<string, any>;

    @Prop({
        type: String,
        required: false,
    })
    ipAddress?: string;
}

export const AuditSchema = SchemaFactory.createForClass(Audit);