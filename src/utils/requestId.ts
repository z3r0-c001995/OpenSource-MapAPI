import { randomUUID } from 'node:crypto';

export const createRequestId = (): string => randomUUID();
