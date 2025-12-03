import "dotenv/config";
import { PrismaClient, UserType } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { CryptoUtils } from "@repo/utils";

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
    // Seed super admin user
    const superAdminEmail = "me@adhityan.com";
    const superAdminName = "Adhityan";
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!superAdminPassword) {
        throw new Error(
            "SUPER_ADMIN_PASSWORD environment variable is required"
        );
    }

    console.log("Seeding super admin user...");
    const passwordHash = CryptoUtils.encryptPassword(superAdminPassword, 10);

    const user = await prisma.user.upsert({
        where: { email: superAdminEmail },
        update: {},
        create: {
            email: superAdminEmail,
            name: superAdminName,
            passwordHash,
            type: UserType.SUPER_ADMIN,
            isActive: true,
        },
    });

    console.log("Super admin user seeded successfully!");
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Type: ${user.type}`);

    // Seed restaurant
    console.log("Seeding restaurant...");
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

    // Seed restaurant authentication credentials
    console.log("Seeding restaurant authentication...");
    const clientId = "adhityan";
    const clientSecret = "fzLq8TN4ipsHJsv";
    const clientSecretHash = CryptoUtils.encryptPassword(clientSecret, 10);

    const restaurantAuth = await prisma.restaurantAuthentication.upsert({
        where: { clientId },
        update: {},
        create: {
            clientId,
            clientSecret: clientSecretHash,
            restaurantId: restaurant.id,
            isActive: true,
        },
    });

    console.log("Restaurant authentication seeded successfully!");
    console.log(`Client ID: ${restaurantAuth.clientId}`);
    console.log(`Restaurant ID: ${restaurantAuth.restaurantId}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("Error seeding database:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
