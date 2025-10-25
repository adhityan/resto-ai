import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger, LoggerErrorInterceptor } from "nestjs-pino";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { NestFactory, Reflector } from "@nestjs/core";
import { ExceptionHandler } from "@repo/utils";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import { AuthGuard } from "./modules/auth/guard/auth.guard";
import { MainModule } from "./modules/main/main.module";

const PORT = process.env.PORT ?? 3000;
const isProduction = process.env.NODE_ENV === "production";

async function bootstrap() {
    const fastifyAdapter = new FastifyAdapter({ bodyLimit: 1048576 });

    // Security: Configure Helmet for security headers
    await fastifyAdapter.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: [`'self'`],
                styleSrc: [`'self'`, `'unsafe-inline'`],
                imgSrc: [`'self'`, "data:", "validator.swagger.io"],
                scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
            },
        },
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        },
    });

    // Security: Configure rate limiting
    await fastifyAdapter.register(rateLimit, {
        max: 100, // Max 100 requests
        timeWindow: "15 minutes", // Per 15 minutes
        errorResponseBuilder: () => ({
            statusCode: 429,
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please try again later.",
        }),
    });

    const app = await NestFactory.create(MainModule, fastifyAdapter, {
        bufferLogs: true,
    });

    app.useLogger(app.get(Logger));
    app.useGlobalGuards(app.get(AuthGuard));
    app.useGlobalFilters(new ExceptionHandler());
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        })
    );
    app.useGlobalInterceptors(new LoggerErrorInterceptor());
    app.useGlobalInterceptors(
        new ClassSerializerInterceptor(app.get(Reflector))
    );

    const pathPrefix = process.env.GLOBAL_PATH_PREFIX ?? "/api";
    if (pathPrefix) {
        app.setGlobalPrefix(pathPrefix);
    }
    // Security: Ensure ALLOWED_ORIGINS is set in production
    app.enableCors({
        origin: ["http://localhost:5173", "http://localhost:3001"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true,
        maxAge: 86400, // 24 hours
    });

    // TODO: Security - Only enable Swagger in non-production environments
    const config = new DocumentBuilder()
        .setTitle("Resto AI")
        .setContact("Adhityan", "https://adhityan.com/", "me@adhityan.com")
        .setDescription("This is a restaurant call agent tools API")
        .setBasePath(pathPrefix ?? "")
        .setVersion("0.0.1")
        .addBearerAuth(
            {
                description: `Please enter just the token`,
                name: "authorization",
                bearerFormat: "Bearer",
                scheme: "Bearer",
                type: "http",
                in: "Header",
            },
            "bearer-authentication"
        )
        .addBasicAuth(
            {
                description: "Please enter your username and password",
                name: "authorization",
                type: "http",
                in: "Header",
            },
            "basic-authentication"
        )
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${pathPrefix ?? ""}/swagger`, app, document);

    await app.listen(PORT, <string>(isProduction ? "0.0.0.0" : undefined));
    console.log("Server is running on port", PORT);
}

bootstrap();
