import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class UserChangePasswordRequest {
    @IsString()
    @IsNotEmpty()
    @MaxLength(128, { message: "Current password must be less than 128 characters" })
    @ApiProperty()
    currentPassword: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: "New password must be at least 8 characters long" })
    @MaxLength(128, { message: "New password must be less than 128 characters" })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
        message: "New password must contain at least one uppercase letter, one lowercase letter, and one number",
    })
    @ApiProperty({
        description:
            "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
    })
    newPassword: string;
}
