import { repl } from "@nestjs/core";
import { MainModule } from "./modules/main/main.module";

async function bootstrap() {
    await repl(MainModule);
}
bootstrap();
