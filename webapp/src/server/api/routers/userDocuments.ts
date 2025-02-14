import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const userDocumentsRouter = createTRPCRouter({
  checkFileExists: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      userID: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existingDoc = await ctx.db.document.findFirst({
        where: {
          fileName: input.fileName,
          userID: ctx.session.user.id,
        },
      });

      if (existingDoc) {
        // If file exists, delete the old one
        await ctx.db.document.delete({
          where: {
            documentID: existingDoc.documentID,
          },
        });
      }

      return { exists: !!existingDoc };
    }),

  getUserDocuments: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const documents = await ctx.db.document.findMany({
          where: {
            userID: ctx.session.user.id,
          },
          select: {
            documentID: true,
            fileName: true,
            applicationID: true,
            userID: true,
            createdAt: true,
            model: {              
              select: {
                modelName: true,  
              },
            },
            // Change documentValidation to validations
            validations: {
              select: {
                drawingType: true,
              }
            }
          },
          orderBy: {
            documentID: 'desc',
          },
        });

        // Transform the data to match the expected format
        return documents.map(doc => ({
          ...doc,
          drawing_type: doc.validations.map(v => v.drawingType)
        }));

      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch documents',
          cause: error,
        });
      }
    }),

  saveDetectionResults: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileType: z.string(),
      detectionResults: z.array(z.any()),
      document: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {

        try {
        // Find the CADAiD model
        const model = await ctx.db.model.findFirst({
          where: {
            modelName: 'CADAiD'
          }
        });
        
        if (!model) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "CADAiD model not found in the system",
          });
        }

        const { fileName, document, fileType } = input;
        const userId = ctx.session.user.id;

        // Add size logging before processing
        console.log('Original document size:', document.length);
        console.log('File type:', fileType);

        // Remove the data URL prefix if present
        const base64Data = document.includes('base64,') 
          ? document.split('base64,')[1] 
          : document;

        // Convert base64 to Buffer
        const documentBuffer = Buffer.from(base64Data ?? '', 'base64');

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
            modelID: model.modelID,
            userID: userId,
          },
          select: {
            documentID: true,
          },
        });

        console.log('Document created with ID:', newDocument.documentID);

       // After creating the document, save the drawing types
       if (input.detectionResults.length > 0) {
        const drawingTypes = input.detectionResults.map(result => result.drawing_type).flat();
        
        // Save each drawing type
        for (const type of drawingTypes) {
          await ctx.db.documentValidation.create({
            data: {
              documentID: newDocument.documentID,
              drawingType: type,
            }
          });
        }
      }

        return {
          success: true,
          documentId: newDocument.documentID,
        };
      } catch (error) {
        console.error('Detailed error:', error);
        
        // Check for specific MySQL errors
const mysqlError = error as { code: string; message: string };
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
          message: `Failed to create document entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
          cause: error,
        });
      }

    }),
  getDocumentById: protectedProcedure
    .input(z.object({
      documentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const document = await ctx.db.document.findFirst({
          where: {
            documentID: input.documentId,
            userID: ctx.session.user.id,
          },
          select: {
            document: true,
          },
        });
        
        if (!document) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Document not found',
          });
        }

        // Convert Buffer to base64 string on the server side
        const base64String = document.document.toString('base64');
        return { document: base64String };

      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch document',
          cause: error,
        });
      }
    }),
});
