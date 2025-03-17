import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { requiredDrawingTypes } from "~/utils/helpers";

export const userDocumentsRouter = createTRPCRouter({

  deleteDocument: protectedProcedure
    .input(z.object({
      documentId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {

        await ctx.db.documentValidation.deleteMany({
          where: {
            documentID: input.documentId,
          },
        });

        // Then delete the document
        await ctx.db.document.delete({
          where: {
            documentID: input.documentId,
            userID: ctx.session.user.id,
          },
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete document',
          cause: error,
        });
      }
    }),

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
        // First delete all validations
        await ctx.db.documentValidation.deleteMany({
          where: {
            documentID: existingDoc.documentID,
          },
        });

        // Then delete the document
        await ctx.db.document.delete({
          where: {
            documentID: existingDoc.documentID,
            userID: ctx.session.user.id,
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
            document: true, // Include document data
            model: {              
              select: {
                modelName: true,  
              },
            },
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

        return documents.map(doc => ({
          ...doc,
          document: doc.document.toString('base64'),
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
            fileName: true,
          },
        });
        
        if (!document) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Document not found',
          });
        }

        return {
          document: document.document.toString('base64'),
          fileName: document.fileName
        };

      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch document',
          cause: error,
        });
      }
    }),

  // Add a new procedure for chunked document retrieval
  getDocumentChunk: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      chunkIndex: z.number(),
      chunkSize: z.number().max(1024 * 1024), 
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

        const base64String = document.document.toString('base64');
        const start = input.chunkIndex * input.chunkSize;
        const end = Math.min(start + input.chunkSize, base64String.length);

        return {
          chunk: base64String.slice(start, end),
          isLastChunk: end >= base64String.length,
          totalSize: base64String.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch document chunk',
          cause: error,
        });
      }
    }),
  saveDetectionResults: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileType: z.string(),
      detectionResults: z.array(z.object({
        drawing_type: z.union([z.string(), z.array(z.string())]),
        file_name: z.string()
      })),
      document: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const hasValidDrawingTypes = input.detectionResults.some(result => {
          const types = Array.isArray(result.drawing_type) ? result.drawing_type : [result.drawing_type];
          return types.some(type => requiredDrawingTypes.includes(type));
        })
        if(!hasValidDrawingTypes) {
          return {
            success:false,
            message:'No valid drawing types found',
            invalidDocument: true
          };
        }
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

        const base64Data = input.document.includes('base64,') 
          ? input.document.split('base64,')[1] 
          : input.document;

        if (!base64Data) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid document data",
          });
        }

        const documentBuffer = Buffer.from(base64Data, 'base64');

        // Create document entry
        const newDocument = await ctx.db.document.create({
          data: {
            fileName: input.fileName,
            document: documentBuffer,
            modelID: model.modelID,
            userID: ctx.session.user.id,
          },
        });

        // Handle detection results
        if (input.detectionResults && input.detectionResults.length > 0) {
          await Promise.all(input.detectionResults.map(result => {
            const drawingTypes = Array.isArray(result.drawing_type) 
              ? result.drawing_type 
              : [result.drawing_type];

            return Promise.all(drawingTypes.map(type =>
              ctx.db.documentValidation.create({
                data: {
                  documentID: newDocument.documentID,
                  drawingType: type,
                }
              })
            ));
          }));
        }

        return { success: true };
      } catch (error) {
        console.error('Save detection error:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save detection results",
          cause: error,
        });
      }
    }),
});
