import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty()
  full_name: string; // Wait, snake_case on the wire? In class-validator / DTO, if it's snake_case on the wire, the property should be full_name!
}
