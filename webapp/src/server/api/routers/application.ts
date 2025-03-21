import {   ApplicationStatus, ApplicationType } from "@prisma/client";
import { z } from "zod";
import { db } from "~/server/db";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const applicationRouter = createTRPCRouter({
  createApplication: protectedProcedure
    .input(
      z.object({
        applicationType: z.nativeEnum(ApplicationType),
        submissionDate: z.date(),
        updatedDate: z.date(),
        status: z.nativeEnum(ApplicationStatus).default("Pabegynt"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      // Add safeguard: Check if an application with the same type was created in the last 5 seconds
      const recentApplications = await db.application.findMany({
        where: {
          userID: userId,
          applicationType: input.applicationType,
          submissionDate: {
            gte: new Date(Date.now() - 5000) 
          }
        }
      });
      
      if (recentApplications.length > 0) {
        console.warn("Potential duplicate application creation detected");
        return recentApplications[0];
      }
      
      const res = await db.application.create({
        data: {
          applicationType: input.applicationType,
          submissionDate: input.submissionDate,
          updatedDate: input.updatedDate,
          status: input.status,
          user: {
            connect: {
              id: userId,
            },
          }
        }
      });

      if (!res) {
        throw new Error("Failed to create application");
      }
      return res;
    }),
    
  updateApplication: protectedProcedure
    .input(
      z.object({
        applicationID: z.number(),
        applicationType: z.nativeEnum(ApplicationType).optional(),
        submissionDate: z.date().optional(),
        updatedDate: z.date().optional(),
        status: z.nativeEnum(ApplicationStatus).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
     
      const application = await db.application.findUnique({
        where: { applicationID: input.applicationID },
        select: { userID: true }
      });
      
      if (!application || application.userID !== userId) {
        throw new Error("Not authorized to update this application");
      }
      
      const res = await db.application.update({
        where: { applicationID: input.applicationID },
        data: {
          applicationType: input.applicationType,
          submissionDate: input.submissionDate,
          updatedDate: input.updatedDate,
          status: input.status,
        },
      });

      return res;
    }),
    
  getApplication: protectedProcedure
    .input(z.object({ applicationID: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      const res = await db.application.findUnique({
        where: { 
          applicationID: input.applicationID,
          userID: userId 
        },
        include: {
          documents: true,
          application_fields: true,
          Letters: true,
          responses: {
            include: {
              errors: true
            }
          }
        }
      });

      if (!res) {
        throw new Error("Application not found or not authorized");
      }
      return res;
    }),
    
  getAllApplications: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
    const res = await db.application.findMany({
      where: { userID: userId },
      orderBy: { updatedDate: 'desc' },
      include: {
        application_fields: true,
        documents: true,
      }
    });

    return res;
  }),

  deleteApplication: protectedProcedure
    .input(z.object({applicationID: z.number()}))
    .mutation(async ({ctx, input}) => {
      const userId = ctx.session.user.id;


      const application =await db.application.findUnique({
        where:{applicationID:input.applicationID},
        select:{userID:true}
      });


      if(!application || application.userID !== userId) {
        throw new Error("Not authorized to delete this application");
      }

      try {
        await db.application_field.deleteMany({
          where:{ applicationID: input.applicationID}
        });

        const responses = await db.response.findMany({
          where: {applicationID:input.applicationID},
          select: { responseID:true}
        });
        for (const response of responses) {
          await db.response.deleteMany({
            where : {responseID: response.responseID}
          });
        }
        await db.response.deleteMany({
          where: {applicationID: input.applicationID}
        });
        await db.letter.deleteMany({
          where: {applicationID: input.applicationID}
        });
        await db.document.deleteMany({
          where: {applicationID: input.applicationID}
        });
        const deletedApplication = await db.application.delete({
          where: {applicationID : input.applicationID}
        });
        return {success: true, deletedApplication};

      } catch (error) {
        console.error("Error deleting application", error);
        throw new Error("Error deleting application");
      }
    }),
  
  // Add application field
  addApplicationField: protectedProcedure
    .input(
      z.object({
        applicationID: z.number(),
        fieldName: z.string(),
        fieldValue: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      // Check if application belongs to current user
      const application = await db.application.findUnique({
        where: { applicationID: input.applicationID },
        select: { userID: true }
      });
      
      if (!application || application.userID !== userId) {
        throw new Error("Not authorized to update this application");
      }
      
      const res = await db.application_field.create({
        data: {
          applicationID: input.applicationID,
          fieldName: input.fieldName,
          fieldValue: input.fieldValue, 
          createdDate: new Date(),
          updatedDate: new Date(),
        },
      });

      return res;
    }),


    
  // Submit application (change status to Sendt)
  submitApplication: protectedProcedure
    .input(z.object({ applicationID: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      const application = await db.application.findUnique({
        where: { applicationID: input.applicationID },
        select: { userID: true }
      });
      
      if (!application || application.userID !== userId) {
        throw new Error("Not authorized to submit this application");
      }
      
      const res = await db.application.update({
        where: { applicationID: input.applicationID },
        data: {
          status: "Sendt",
          updatedDate: new Date()
        }
      });
      
      return res;
    }),
    
  // Get application count by status
  getApplicationCountByStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
    const counts = await db.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM Application 
      WHERE userID = ${userId}
      GROUP BY status
    `;
    
    return counts;
  }),

  createAndPopulateApplication: protectedProcedure
    .input(
      z.object({
        applicationType: z.nativeEnum(ApplicationType),
        fieldData: z.record(z.string(), z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      // Create the application first
      const application = await db.application.create({
        data: {
          applicationType: input.applicationType,
          submissionDate: new Date(),
          updatedDate: new Date(),
          status: "Pabegynt",
          user: {
            connect: {
              id: userId,
            },
          }
        }
      });
      
      // Add all the fields
      for (const [fieldName, fieldValue] of Object.entries(input.fieldData)) {
        await db.application_field.create({
          data: {
            applicationID: application.applicationID,
            fieldName,
            fieldValue,
            createdDate: new Date(),
            updatedDate: new Date(),
          },
        });
      }
      
      return application;
    }),
});