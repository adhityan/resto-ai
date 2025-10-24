import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, IsString, Matches, MinLength, MaxLength } from "class-validator";

export class UserRegisterRequest {
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255, { message: "Email must be less than 255 characters" })
    @ApiProperty()
    email: string;

    @Matches(/^[a-zA-Z ]*$/, { message: "Name must be proper" })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100, { message: "Name must be less than 100 characters" })
    @ApiProperty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: "Password must be at least 8 characters long" })
    @MaxLength(128, { message: "Password must be less than 128 characters" })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
        message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    })
    @ApiProperty({
        description:
            "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
    })
    password: string;
}
