import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {}

main()
    .then(async () => {
        const id = "353816f8-4204-406c-842f-529347706874";
        const restaurantPhone = "+33753549003";
        const restaurantName = "Miri Mary";
        const zenchefId = "378114";
        const apiToken = "e3469030-41fc-4ec3-8754-10f333fde782";

        const restaurant = await prisma.restaurant.upsert({
            where: { id },
            update: {},
            create: {
                id,
                name: restaurantName,
                incomingPhoneNumber: restaurantPhone,
                zenchefId,
                apiToken,
            },
        });

        console.log("Restaurant seeded successfully!");
        console.log(`Name: ${restaurant.name}`);
        console.log(`Phone: ${restaurant.incomingPhoneNumber}`);
        console.log(`Zenchef ID: ${restaurant.zenchefId}`);

        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("Error seeding database:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
