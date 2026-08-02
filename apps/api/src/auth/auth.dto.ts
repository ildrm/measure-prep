import { IsEmail, IsString, Length, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}
export class RegisterDto extends LoginDto {
  @IsString() @Length(2, 80) name!: string;
}
export class EmailDto { @IsEmail() email!: string; }
export class TokenDto { @IsString() @MinLength(32) token!: string; }
export class ResetPasswordDto extends TokenDto { @IsString() @MinLength(8) password!: string; }
