import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { OnModuleInit, Logger } from "@nestjs/common";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL!,
});

export class DatabaseService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger(DatabaseService.name);

    constructor() {
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.log("Database connected");
    }
}
