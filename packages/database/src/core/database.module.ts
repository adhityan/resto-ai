import { DynamicModule, Module } from "@nestjs/common";
import { withAccelerate } from "@prisma/extension-accelerate";
import { DatabaseService } from "./database.service.js";

@Module({})
export class DatabaseModule {
    static async forRoot(): Promise<DynamicModule> {
        return {
            global: true,
            module: DatabaseModule,
            providers: [
                {
                    provide: DatabaseService,
                    useFactory: () => {
                        return new DatabaseService().$extends(withAccelerate());
                    },
                },
            ],
            exports: [DatabaseService],
        };
    }
}
