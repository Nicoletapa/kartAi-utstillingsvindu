import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {

  const models = [
    { modelID: 1, modelName: "cadaid" },
   
  ];

  console.log(`Start seeding models...`);
  

  for (const model of models) {
    const result = await prisma.model.upsert({
      where: { modelID: model.modelID },
      update: { modelName: model.modelName },
      create: {
        modelID: model.modelID,
        modelName: model.modelName,
      },
    });
    console.log(`Upserted model: ${result.modelName} with ID ${result.modelID}`);
  }
  
  console.log(`Seeding finished.`);
}


main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });