import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import axios, { AxiosError, type AxiosResponse } from "axios";

interface GuideButton {
  title: string;
  url: string;
  description?: string;
}

interface PlanpratResponse {
  answer: string;
  guides?: GuideButton[];
  error?: string;
  original_header?: string | null;
}

const FASTAPI_PLANPRAT_URL =
  process.env.PLANPRAT_URL ?? "http://localhost:8000/api/planprat";

export const planpratRouter = createTRPCRouter({
  fetchResponse: publicProcedure
    .input(
      z.object({
        query: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { query } = input;

      try {
        const response: AxiosResponse<PlanpratResponse> = await axios.post(
          FASTAPI_PLANPRAT_URL,
          {
            query: query,
          },
        );

        return response.data;
      } catch (error) {
        console.error("tRPC fetchResponse error:", error);
        if (error instanceof AxiosError) {
          throw new Error(
            `Failed to retrieve response from backend: ${error.message}`,
          );
        } else {
          throw new Error(
            `Unknown error while fetching response: ${String(error)}`,
          );
        }
      }
    }),
});
