import { z } from 'zod';

const bookZodSchema = z.object({
  body: z.object({
    title: z.string(),
    author: z.string(),
    thumbnail: z.string(),
    genre: z.array(z.string()),
    publicationYear: z.string().transform(value => new Date(value)),
    reviews: z
      .array(
        z.object({
          // Define the properties of the reviews here, if needed
        })
      )
      .optional(),
  }),
});

export const bookValidation = {
  bookZodSchema,
};
