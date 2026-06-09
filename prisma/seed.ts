import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.market.upsert({
    where: { marketCode: "TR" },
    update: {
      defaultLocale: "tr-TR",
      currencyCode: "TRY",
      regulatoryContext: "TİTCK / ÜTS"
    },
    create: {
      marketCode: "TR",
      defaultLocale: "tr-TR",
      currencyCode: "TRY",
      regulatoryContext: "TİTCK / ÜTS"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
