import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// RF-AUTH-001: mínimo 8 caracteres, una mayúscula y un número.
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_MSG = 'La contraseña requiere mínimo 8 caracteres, una mayúscula y un número';

// Celular peruano: 9 dígitos, opcionalmente con prefijo +51.
const PHONE_REGEX = /^(\+51)?9\d{8}$/;

export class RegisterEmailDto {
  @ApiProperty({ example: 'comprador@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Secreta123' })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password!: string;

  @ApiPropertyOptional({ example: 'María Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;
}

export class ConfirmEmailDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  token!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'comprador@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Secreta123' })
  @IsString()
  @MinLength(1)
  password!: string;
}

export class RequestPhoneOtpDto {
  @ApiProperty({ example: '987654321' })
  @Matches(PHONE_REGEX, { message: 'Número de celular peruano inválido' })
  phone!: string;
}

export class VerifyPhoneOtpDto {
  @ApiProperty({ example: '987654321' })
  @Matches(PHONE_REGEX, { message: 'Número de celular peruano inválido' })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' })
  code!: string;
}

export class RequestPasswordResetDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  token!: string;

  @ApiProperty({ example: 'NuevaClave123' })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password!: string;
}
