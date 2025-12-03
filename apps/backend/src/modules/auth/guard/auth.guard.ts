import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AuthService } from "../auth.service";
import { AuthenticatedRequest } from "src/types/request";
import { IS_PUBLIC_KEY } from "src/decorators/public.decorator";
import { UserType } from "@repo/database";
import { RestaurantService } from "../../restaurant/restaurant.service";

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);

    @Inject()
    private authService: AuthService;

    @Inject()
    private restaurantService: RestaurantService;

    @Inject()
    private reflector: Reflector;

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const role = this.reflector.get<string>("role", context.getHandler());
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()]
        );
        if (isPublic) return true;

        const request = <AuthenticatedRequest>(
            context.switchToHttp().getRequest()
        );

        try {
            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            if (role === undefined) return true; //API Access role not set. This is isAuthenticated route.
            if (role === "APP") {
                // Check for basic authentication using database credentials
                const restaurant = await this.checkBasicAuth(request);
                if (restaurant) {
                    request["loginPayload"] = {
                        userId: restaurant.id,
                        userType: "Restaurant",
                        restaurantId: restaurant.id,
                    };
                    return true;
                } else return false;
            } else {
                const token = this.extractTokenFromHeader(request);
                if (!token) throw new UnauthorizedException();

                const payload = await this.authService.parseTokenData(token);
                request["loginPayload"] = payload;

                if (role === "ADMIN" && payload.userType === UserType.APP_ADMIN)
                    return true;
                else if (
                    role === "ADMIN" &&
                    payload.userType === UserType.SUPER_ADMIN
                )
                    return true;
                else {
                    this.logger.warn(
                        `API Access role mismatch. Received ${payload.userType} for API locked with ${role}`
                    );
                    return false;
                }
            }
        } catch {
            throw new UnauthorizedException();
        }
    }

    private async checkBasicAuth(
        request: AuthenticatedRequest
    ): Promise<{ id: string; name: string } | null> {
        const authHeader = request.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Basic ")) {
            return null;
        }

        try {
            // Decode the base64 encoded credentials
            const base64Credentials = authHeader.split(" ")[1];
            const credentials = Buffer.from(
                base64Credentials,
                "base64"
            ).toString("ascii");
            const [clientId, clientSecret] = credentials.split(":");

            if (!clientId || !clientSecret) {
                return null;
            }

            // Verify credentials against the database
            const restaurant =
                await this.restaurantService.verifyClientCredentials(
                    clientId,
                    clientSecret
                );

            if (!restaurant) {
                this.logger.warn(
                    `Invalid Basic Auth credentials for clientId: ${clientId}`
                );
                return null;
            }

            this.logger.debug(
                `Basic Auth successful for restaurant: ${restaurant.name}`
            );
            return { id: restaurant.id, name: restaurant.name };
        } catch (error) {
            this.logger.error("Error during Basic Auth verification", error);
            return null;
        }
    }

    public extractTokenFromHeader(
        request: AuthenticatedRequest
    ): string | undefined;
    public extractTokenFromHeader(
        request: AuthenticatedRequest | string
    ): string | undefined {
        const [type, token] =
            (typeof request === "string" || request instanceof String
                ? request
                : request.headers["authorization"]
            )?.split(" ") ?? [];
        return type === "Bearer" ? token : undefined;
    }
}
