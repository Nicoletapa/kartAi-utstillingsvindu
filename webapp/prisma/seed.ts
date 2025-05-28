import { PrismaClient, UserRole } from "@prisma/client"; // Import UserRole if you use it directly
const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Seed Models (existing code)
  const models = [{ modelID: 1, modelName: "cadaid" }];
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
    console.log(
      `Upserted model: ${result.modelName} with ID ${result.modelID}`,
    );
  }
  console.log(`Finished seeding models.`);

  // Seed Mock User
  console.log(`Start seeding mock user...`);
  const mockUserName = "user"; // This must match the username in your CredentialsProvider

  // Check if the mock user already exists by name
  // If your User model's 'name' field is not unique, you might need a different unique identifier
  // for the mock user, e.g., a specific email or a dedicated 'isMockUser' flag.
  // For this example, we'll try to upsert based on 'name', assuming it's intended to be unique for this mock.
  // If 'name' is not unique in your schema, you should use 'email' (even a fake one) as the unique identifier.
  // Since 'email' is @unique in your schema, let's use a mock email for upserting.
  const mockUserEmail = "user@gmail.com";

  const mockUser = await prisma.user.upsert({
    where: { email: mockUserEmail },
    update: {
      name: mockUserName,
      role: UserRole.USER,
      address: "Marcus Thranes gate 14",
      bnr: 850,
      fnr: null,
      gnr: 152,
      phone: "12345678",
      postalArea: "Kristiansand",
      postalCode: "4630",
      snr: null,
      image: null,
      emailVerified: new Date(),
    },
    create: {
      email: mockUserEmail,
      name: mockUserName,
      role: UserRole.USER,
      address: "Marcus Thranes gate 14",
      bnr: 850,
      fnr: null,
      gnr: 152,
      phone: "12345678",
      postalArea: "Kristiansand",
      postalCode: "4630",
      snr: null,
      image: null,
      emailVerified: new Date(),
    },
  });
  console.log(
    `Upserted mock user: ${mockUser.name} with email ${mockUser.email}`,
  );

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
