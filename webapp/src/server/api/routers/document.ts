import { z } from "zod";
import path from "path";
import os from "os";
import { db } from "~/server/db";
import fs from "fs";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";


type Detection = {
  type: string;
  confidence: number;
};

export const documentRouter = createTRPCRouter({

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
    
      return documents.map(doc => ({
        ...doc,
        document: Array.from(doc.document),
        model: doc.model ? {
          ...doc.model,
          
        } : null,
        validations: doc.validations.map(v => ({
          ...v,
         
        }))
      }));
    }),
  
    deleteDocument: protectedProcedure
  .input(z.object({
    documentId: z.number(),
    applicationID: z.number().optional()
  }))
  .mutation(async ({ input}) => {
    try {
      await db.documentValidation.deleteMany({
        where: { documentID: input.documentId }
      });

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
  .mutation(async ({ input }) => {
    
    let tempFilePath: string | undefined;
    try {
      tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}_${input.fileName}`);
      await fs.promises.writeFile(tempFilePath, Buffer.from(input.file));

      const formData = new FormData();
      formData.append('uploaded_files', 
        new Blob([await fs.promises.readFile(tempFilePath)]), 
        input.fileName
      );

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


    } catch (error) {
      console.error('Validation error:', error);
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
