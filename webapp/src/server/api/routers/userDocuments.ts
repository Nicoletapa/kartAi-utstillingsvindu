import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { requiredDrawingTypes } from "~/utils/helpers";

export const userDocumentsRouter = createTRPCRouter({

  deleteDocument: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      applicationID:z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {

        await ctx.db.documentValidation.deleteMany({
          where: {
            documentID: input.documentId,
          },
        });

        await ctx.db.document.delete({
          where: {
            documentID: input.documentId,
            applicationID:input.applicationID,
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

  replaceExistingFile: protectedProcedure
    .input(z.object({
      applicationID: z.number().optional(),
      fileName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.$transaction(async (tx) => {
          const existingDoc = await tx.document.findFirst({
            where: {
              applicationID: input.applicationID,
              fileName: input.fileName,
              userID: ctx.session.user.id,
            },
          });

          if (existingDoc) {
            await tx.documentValidation.deleteMany({
              where: {
                documentID: existingDoc.documentID,
              },
            });

            await tx.document.delete({
              where: {
                documentID: existingDoc.documentID,
                userID: ctx.session.user.id,
                applicationID: input.applicationID,
              },
            });
          }

          return { exists: !!existingDoc };
        });
      } catch (error) {
        throw new TRPCError({
          code: 'PARSE_ERROR',
          message: 'Failed to check or replace existing file',
          cause: error,
        });
      }
    }),

  getUserDocuments: protectedProcedure
  .input(z.object({
    applicationID :z.number(),
  }))
    .query(async ({ ctx, input }) => {
      try {
        const documents = await ctx.db.document.findMany({
          where: {
            applicationID:input.applicationID,
            userID: ctx.session.user.id,
          },
          select: {
            documentID: true,
            fileName: true,
            applicationID: true,
            userID: true,
            createdAt: true,
            document: true,
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

  getDocumentChunk: protectedProcedure
    .input(z.object({
      applicationID: z.number().optional(),
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
      applicationID:z.number().optional(),
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
        });
        
        if (!hasValidDrawingTypes) {
          return {
            success: false,
            message: 'No valid drawing types found',
            invalidDocument: true
          };
        }

        return await ctx.db.$transaction(async (tx) => {
          const model = await tx.model.findFirst({
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

          const newDocument = await tx.document.create({
            data: {
              fileName: input.fileName,
              document: documentBuffer,
              modelID: model.modelID,
              userID: ctx.session.user.id,
              applicationID: input.applicationID
            },
          });

          if (input.detectionResults && input.detectionResults.length > 0) {
            await Promise.all(input.detectionResults.map(result => {
              const drawingTypes = Array.isArray(result.drawing_type) 
                ? result.drawing_type 
                : [result.drawing_type];

              return Promise.all(drawingTypes.map(type =>
                tx.documentValidation.create({
                  data: {
                    documentID: newDocument.documentID,
                    drawingType: type,
                  }
                })
              ));
            }));
          }

          return { success: true };
        });
      } catch (error) {
        if (error instanceof Error) {
          console.error('Save detection error:', error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to save detection results: ${error.message}`,
            cause: error,
          });
        }
        throw error;
      }
    }),
});
