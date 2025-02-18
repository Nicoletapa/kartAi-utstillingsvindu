import { z } from "zod";
import { db } from "~/server/db";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { type Document } from "@prisma/client";

const VALUES = ["OTHER", "XML"] as const;

export const documentRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      fileName: z.string(),
      document: z.string(),
      applicationID: z.number().optional(),
      modelID: z.number(),
      userID: z.string(),
    }))
    .mutation(async ({ input }) => {
      const res: Document = await db.document.create({
        data: {
          fileName: input.fileName,
          document: Buffer.from(input.document),
          applicationID: input.applicationID,
          modelID: input.modelID,
          userID: input.userID,
        },
      });
      return res;
    }),
  updateDocument: publicProcedure
    .input(
      z.object({
        documentID: z.number(),
        type: z.enum(VALUES).optional(),
        document: z.string().base64().optional(),
        applicationID: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const res: Document = await db.document.update({
        where: { documentID: input.documentID },
        data: {
         
          document: Buffer.from(input.document ?? ""),
          applicationID: input.applicationID,
        },
      });

      if (!res) {
        throw new Error("Failed to update document");
      }
      return res;
    }),
  getDocument: publicProcedure
    .input(z.object({ documentID: z.number() }))
    .query(async ({ input }) => {
      const res: Document | null = await db.document.findUnique({
        where: { documentID: input.documentID },
      });

      if (!res) {
        throw new Error("Document not found");
      }
      return res;
    }),
});
