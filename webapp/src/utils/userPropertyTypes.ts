import { z  } from "zod"; 


export const PropertyDetailsSchema = z.object({
  address: z.string().optional(),
  property_number: z.string().optional(),
  usage_number: z.string().optional(),
  postal_code: z.string().optional(),
  municipality: z.string().optional(),
  lease_number: z.string().optional(),
  section_number: z.string().optional()
});

export const ApplicantDetailsSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(), 
});


export type PropertyDetails = z.infer<typeof PropertyDetailsSchema>;
export type ApplicantDetails = z.infer<typeof ApplicantDetailsSchema>;



