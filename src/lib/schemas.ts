import { z } from 'zod';

/** Shared building blocks for the contract's DTOs (API-ADMIN.md, "General"). */
export const objectId = z.string().regex(/^[0-9a-f]{24}$/i);
export const isoDateTime = z.iso.datetime({ offset: true });
export const isoDate = z.iso.date();
export const nextCursor = z.string().nullable();
