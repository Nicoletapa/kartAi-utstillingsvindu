import { z } from "zod";
import path from "path";
import os from "os";
import { db } from "~/server/db";
import fs from "fs";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";

// Define the Detection type
type Detection = {
  type: string;
  confidence: number;
};
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
    // In your document router
    getAllUserDocuments: protectedProcedure.query(async ({ ctx }) => {
      const documents = await db.document.findMany({
        where: {
          userID: ctx.session.user.id
        },
        include: {
          model: true,
          application: {
            select: {
              applicationID: true,
              applicationType: true
            }
          },
          validations: true
        }
      });
    
      // Only convert the Buffer to array, leave Dates as Date objects
      return documents.map(doc => ({
        ...doc,
        document: Array.from(doc.document), // Convert Buffer to array
        // Leave createdAt as Date object
        model: doc.model ? {
          ...doc.model,
          // Leave model dates as Date objects
        } : null,
        validations: doc.validations.map(v => ({
          ...v,
          // Leave validation dates as Date objects
        }))
      }));
    }),
  
    deleteDocument: protectedProcedure
  .input(z.object({
    documentId: z.number(),
    applicationID: z.number().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      // First delete related validations
      await db.documentValidation.deleteMany({
        where: { documentID: input.documentId }
      });

      // Then delete the document
      const deletedDoc = await db.document.delete({
        where: { documentID: input.documentId },
        include: { application: true }
      });

      return {
        success: true,
        deletedFileName: deletedDoc.fileName,
        applicationID: deletedDoc.applicationID
      };
    } catch (error) {
      console.error('Delete document error:', error);
      throw new Error('Failed to delete document');
    }
  }),
  
  replaceDocument: protectedProcedure
  .input(z.object({
    documentId: z.number(),
    file: z.instanceof(Uint8Array),
    fileName: z.string(),
    applicationID: z.number().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    // ... existing document verification code ...
    let tempFilePath: string | undefined; // Declare tempFilePath in a higher scope

    try {
      // 1. Create temp file
      tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}_${input.fileName}`);
      await fs.promises.writeFile(tempFilePath, Buffer.from(input.file));

      // 2. Prepare form data
      const formData = new FormData();
      formData.append('uploaded_files', 
        new Blob([await fs.promises.readFile(tempFilePath)]), 
        input.fileName
      );

      // 3. Call ML service with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const validationResponse = await fetch('http://127.0.0.1:5001/detect', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      }).finally(() => clearTimeout(timeout));

      if (!validationResponse.ok) {
        const errorText = await validationResponse.text();
        console.error('ML Service Error:', errorText);
        throw new Error(`Validation service responded with status ${validationResponse.status}`);
      }

      const detections = await validationResponse.json() as Detection[];

      if (!detections || detections.length === 0) {
        throw new Error('No valid drawing types detected');
      }

      // ... save validations code ...

    } catch (error) {
      console.error('Validation error:', error);
      // Save document anyway but mark as unvalidated
      await db.document.update({
        where: { documentID: input.documentId },
        data: { 
          document: Buffer.from(input.file),
          fileName: input.fileName,
        }
      });

      throw new Error(
        `File was replaced but could not validate: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      // Cleanup temp file
      if (tempFilePath) {
        try {
          await fs.promises.unlink(tempFilePath);
        } catch (cleanupError) {
          console.error('Temp file cleanup failed:', cleanupError);
        }
      }
    }
  }),
});
