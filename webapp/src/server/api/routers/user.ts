import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
    getUserDetails:protectedProcedure
    .query(async({ctx})=>{
        const userId = ctx.session.user.id;

        const user = await ctx.db.user.findUnique({
            where:{id:userId},
            select:{
                id:true, 
                name:true,
                email:true,
                phone:true,
                address:true,
                gnr:true,
                bnr:true,
                postalCode:true,
                postalArea:true,


            },
        });
        console.log("getUserDetails API returning:", user);

        return user;
    }), 

    updateUserDetails: protectedProcedure
    .input(z.object({
        name:z.string().optional(),
        email:z.string().optional(),
        phone:z.string().optional(),
        address:z.string().optional(),
        gnr:z.number().optional(),
        bnr:z.number().optional(),
        postalCode: z.string().optional(),
        postalArea:z.string().optional(),

    }))
    .mutation(async({ctx,input})=>{
        const userId = ctx.session.user.id;

        const user = await ctx.db.user.update({
            where:{id:userId},
            data: {
                name: input.name,
                email: input.email,
                phone: input.phone,
                address: input.address,
                gnr: input.gnr,
                bnr: input.bnr,
                postalCode: input.postalCode,
                postalArea: input.postalArea,
            },
        });
        return user;
    })
})