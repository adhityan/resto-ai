import { ApiProperty } from "@nestjs/swagger";
import { UserType } from "@repo/database";
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class CreateUserModel {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(100, { message: "Name must be less than 100 characters" })
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    @MaxLength(255, { message: "Email must be less than 255 characters" })
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MinLength(8, { message: "Password must be at least 8 characters long" })
    @MaxLength(128, { message: "Password must be less than 128 characters" })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
        message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    })
    password: string;

    @ApiProperty({ enum: UserType, enumName: "UserType" })
    @IsEnum(UserType)
    type: UserType;
}
