import { z } from 'zod';

export const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const autocompleteSchema = z.object({
  query: z.string().trim().min(2).max(120),
  location: latLngSchema.optional(),
});

export const reverseGeocodeSchema = latLngSchema;

export const routeSchema = z.object({
  origin: latLngSchema,
  destination: latLngSchema,
  travelMode: z.enum(['DRIVE', 'WALK', 'BIKE']),
});
