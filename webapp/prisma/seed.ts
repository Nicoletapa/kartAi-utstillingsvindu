// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// async function main() {
//   const users = await Promise.all([
//     prisma.user.create({
//       data: {
//         email: "user@example.com",
//         role: "USER",
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: "caseworker@example.com",
//         role: "CASE_WORKER",
//       },
//     }),
//   ]);

//   console.log({ users });
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });
