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
        type: String,
        required: false,
        index: true,
    })
    userUuid?: string;

    @Prop({
        type: String,
        required: true,
    })
    action: string;

    @Prop({
        type: MongooseSchema.Types.Mixed,
        required: false,
    })
    details: Record<string, any>;

    @Prop({
        type: String,
        required: false,
    })
    ipAddress?: string;
}

export const AuditSchema = SchemaFactory.createForClass(Audit);