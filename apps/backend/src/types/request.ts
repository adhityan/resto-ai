import { UserType } from "@repo/database";

export type AuthenticatedRequest = Request & { loginPayload: TokenData };

export type TokenData = {
    userId: string;
    userType: UserType | "Restaurant";
    restaurantId?: string; // Only set for Restaurant user type
};

export type VerificationData = { userId: string; userType: UserType };
