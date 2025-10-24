import { applyDecorators, SetMetadata } from "@nestjs/common";
import { ApiBasicAuth, ApiBearerAuth } from "@nestjs/swagger";

export function OnlyApp() {
    return applyDecorators(
        ApiBasicAuth("basic-authentication"),
        SetMetadata("role", "APP")
    );
}

export function OnlyAdmin() {
    return applyDecorators(
        ApiBearerAuth("bearer-authentication"),
        SetMetadata("role", "ADMIN")
    );
}

export function isAuthenticated() {
    return applyDecorators(ApiBearerAuth("authentication"));
}
