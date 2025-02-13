import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const userDocumentsRouter = createTRPCRouter({
  saveDetectionResults: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileType: z.string(),
      detectionResults: z.array(z.any()),
      document: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // First, verify that the AiTech exists
        const aiTech = await ctx.db.aiTech.findFirst();
        
        if (!aiTech) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No AI technology configured in the system",
          });
        }

        const { fileName, document, detectionResults, fileType } = input;
        const userId = ctx.session.user.id;

        // Add size logging before processing
        console.log('Original document size:', document.length);
        console.log('File type:', fileType);

        // Remove the data URL prefix if present
        const base64Data = document.includes('base64,') 
          ? document.split('base64,')[1] 
          : document;

        // Convert base64 to Buffer
        const documentBuffer = Buffer.from(base64Data, 'base64');

        // Log buffer size
        console.log('Document buffer size (bytes):', documentBuffer.length);

        // Add size check (16MB limit as an example)
        if (documentBuffer.length > 16 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File size exceeds 16MB limit",
          });
        }

        // First create the Document entry with minimal data
        const newDocument = await ctx.db.document.create({
          data: {
            fileName,
            document: documentBuffer,
            aiID: aiTech.aiID, // Use the verified aiID
            userID: userId,
          },
          select: {
            documentID: true,
          },
        });

        console.log('Document created with ID:', newDocument.documentID);

        // Then create the UserDocument entry
        const userDocument = await ctx.db.userDocument.create({
          data: {
            userID: userId,
            documentID: newDocument.documentID,
            aiID: 1,
          },
        });

        return {
          success: true,
          documentId: newDocument.documentID,
          userDocumentId: userDocument.userDocumentID,
        };
      } catch (error) {
        console.error('Detailed error:', error);
        
        // Check for specific MySQL errors
        const mysqlError = error as any;
        if (mysqlError.code === 'ER_DATA_TOO_LONG') {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File size too large for database storage",
          });
        }

        if (mysqlError.code === 'ER_PACKAGE_MAX_LENGTH') {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File exceeds maximum allowed upload size",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create document entry: ${error.message || 'Unknown error'}`,
          cause: error,
        });
      }
    }),
});
