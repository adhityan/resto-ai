import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, IsString, MaxLength } from "class-validator";

export class UserLoginRequest {
    @IsEmail()
    @MaxLength(255, { message: "Email must be less than 255 characters" })
    @ApiProperty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(128, { message: "Password must be less than 128 characters" })
    @ApiProperty()
    password: string;
}
