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
    })

   
})