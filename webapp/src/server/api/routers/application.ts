import { ApplicationStatus, ApplicationType } from "@prisma/client";
import { z } from "zod";
import { db } from "~/server/db";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const applicationRouter = createTRPCRouter({
  createApplication: protectedProcedure
    .input(
      z.object({
        applicationType: z.nativeEnum(ApplicationType),
        subTypeId: z.string().optional(),
        submissionDate: z.date(),
        updatedDate: z.date().optional(),
        status: z.nativeEnum(ApplicationStatus).optional().default("Pabegynt"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const recentApplications = await db.application.findMany({
        where: {
          userID: userId,
          applicationType: input.applicationType,
          submissionDate: {
            gte: new Date(Date.now() - 5000),
          },
        },
      });

      if (recentApplications.length > 0) {
        console.warn("Potential duplicate application creation detected");
        return recentApplications[0];
      }

      const res = await db.application.create({
        data: {
          applicationType: input.applicationType,
          subTypeId: input.subTypeId,
          updatedDate: input.updatedDate ?? new Date(),
          submissionDate: input.submissionDate,
          status: input.status || "Pabegynt",
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      if (!res) {
        throw new Error("Failed to create application");
      }
      return res;
    }),

  updateApplicationSubtype: protectedProcedure
    .input(
      z.object({
        applicationID: z.number(),
        subTypeId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { applicationID, subTypeId } = input;

      return await ctx.db.application.update({
        where: { applicationID },
        data: { subTypeId },
      });
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
        select: { userID: true },
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
    .input(
      z.object({
        applicationID: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const application = await ctx.db.application.findFirst({
          where: {
            applicationID: input.applicationID,
            userID: ctx.session.user.id,
          },
          select: {
            applicationID: true,
            applicationType: true,
            subTypeId: true,
            status: true,
            submissionDate: true,
            updatedDate: true,
            application_fields: true,
          },
        });

        if (!application) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application not found or access denied",
          });
        }

        return {
          ...application,
          submissionDate: application.submissionDate.toISOString(),
          updatedDate: application.updatedDate.toISOString(),
        };
      } catch (error) {
        console.error("getApplication error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch application details",
          cause: error,
        });
      }
    }),

  getAllApplications: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const res = await db.application.findMany({
      where: { userID: userId },
      orderBy: { updatedDate: "desc" },
    });

    return res;
  }),

  deleteApplication: protectedProcedure
    .input(z.object({ applicationID: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const application = await db.application.findUnique({
        where: { applicationID: input.applicationID },
        select: { userID: true },
      });

      if (!application || application.userID !== userId) {
        throw new Error("Not authorized to delete this application");
      }

      try {
        await db.application_field.deleteMany({
          where: { applicationID: input.applicationID },
        });

        const responses = await db.response.findMany({
          where: { applicationID: input.applicationID },
          select: { responseID: true },
        });
        for (const response of responses) {
          await db.response.deleteMany({
            where: { responseID: response.responseID },
          });
        }
        await db.response.deleteMany({
          where: { applicationID: input.applicationID },
        });
        await db.letter.deleteMany({
          where: { applicationID: input.applicationID },
        });
        await db.document.deleteMany({
          where: { applicationID: input.applicationID },
        });
        const deletedApplication = await db.application.delete({
          where: { applicationID: input.applicationID },
        });
        return { success: true, deletedApplication };
      } catch (error) {
        console.error("Error deleting application", error);
        throw new Error("Error deleting application");
      }
    }),

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

      const application = await db.application.findUnique({
        where: { applicationID: input.applicationID },
        select: { userID: true },
      });

      if (!application || application.userID !== userId) {
        throw new Error("Not authorized to update this application");
      }

      const existingField = await db.application_field.findFirst({
        where: {
          applicationID: input.applicationID,
          fieldName: input.fieldName,
        },
      });

      let res;

      if (existingField) {
        res = await db.application_field.update({
          where: {
            application_fieldID: existingField.application_fieldID,
          },
          data: {
            fieldValue: input.fieldValue,
            updatedDate: new Date(),
          },
        });
      } else {
        res = await db.application_field.create({
          data: {
            applicationID: input.applicationID,
            fieldName: input.fieldName,
            fieldValue: input.fieldValue,
            createdDate: new Date(),
            updatedDate: new Date(),
          },
        });
      }

      return res;
    }),

  submitApplication: protectedProcedure
    .input(z.object({ applicationID: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Add debugging
      console.log("Session user:", ctx.session.user);
      console.log("Session user ID:", ctx.session.user.id);

      const userId = ctx.session.user.id;

      // Check if user exists in database
      const userExists = await db.user.findUnique({
        where: { id: userId },
      });
      console.log("User exists in DB:", userExists);

      const application = await db.application.findUnique({
        where: { applicationID: input.applicationID },
        select: { userID: true },
      });

      if (!application || application.userID !== userId) {
        throw new Error("Not authorized to submit this application");
      }

      const res = await db.application.update({
        where: { applicationID: input.applicationID },
        data: {
          status: "Sendt",
          updatedDate: new Date(),
        },
      });

      return res;
    }),
});
