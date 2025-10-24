import { OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

export class DatabaseService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger(DatabaseService.name);

    async onModuleInit() {
        await this.$connect();
        this.logger.log('Database connected');
    }
}
