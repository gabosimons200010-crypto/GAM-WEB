import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { Env } from '../../../config/env.validation';
import { AuthUser } from '../domain/auth-user';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterEmailUseCase } from '../application/use-cases/register-email.use-case';
import { ConfirmEmailUseCase } from '../application/use-cases/confirm-email.use-case';
import { LoginUseCase, LoginResult } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { RequestPhoneOtpUseCase } from '../application/use-cases/request-phone-otp.use-case';
import { VerifyPhoneOtpUseCase } from '../application/use-cases/verify-phone-otp.use-case';
import { RequestPasswordResetUseCase } from '../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case';
import {
  ConfirmEmailDto,
  LoginDto,
  RegisterEmailDto,
  RequestPasswordResetDto,
  RequestPhoneOtpDto,
  ResetPasswordDto,
  VerifyPhoneOtpDto,
} from './dto/auth.dto';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_PATH = '/api/v1/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly registerEmail: RegisterEmailUseCase,
    private readonly confirmEmail: ConfirmEmailUseCase,
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshTokenUseCase,
    private readonly logout: LogoutUseCase,
    private readonly requestPhoneOtp: RequestPhoneOtpUseCase,
    private readonly verifyPhoneOtp: VerifyPhoneOtpUseCase,
    private readonly requestPasswordReset: RequestPasswordResetUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } }) // RNF-SEC-006: registro 3/h
  @Post('register/email')
  async postRegisterEmail(@Body() dto: RegisterEmailDto) {
    return this.registerEmail.execute(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('confirm-email')
  async postConfirmEmail(@Body() dto: ConfirmEmailDto) {
    await this.confirmEmail.execute(dto.email, dto.token);
    return { confirmed: true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // RNF-SEC-006: login 5/min
  @HttpCode(200)
  @Post('login')
  async postLogin(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.login.execute({
      email: dto.email,
      password: dto.password,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return this.issue(res, result);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async postRefresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const result = await this.refresh.execute(cookie);
    return this.issue(res, result);
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  async postLogout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.logout.execute(cookie);
    res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH });
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 600_000 } }) // 3 solicitudes / 10 min
  @HttpCode(200)
  @Post('register/phone')
  async postRequestOtp(@Body() dto: RequestPhoneOtpDto) {
    await this.requestPhoneOtp.execute(dto.phone);
    return { sent: true };
  }

  @Public()
  @HttpCode(200)
  @Post('verify-otp')
  async postVerifyOtp(@Body() dto: VerifyPhoneOtpDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.verifyPhoneOtp.execute(dto.phone, dto.code);
    return this.issue(res, result);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @HttpCode(200)
  @Post('password/forgot')
  async postForgot(@Body() dto: RequestPasswordResetDto) {
    const token = await this.requestPasswordReset.execute(dto.email);
    // En producción la respuesta es uniforme y no revela si el correo existe.
    // Fuera de producción (demo, sin correo saliente) devolvemos el token para
    // poder completar el flujo desde la UI. El límite de 3/h sigue vigente.
    const isProd = this.config.get('NODE_ENV', { infer: true }) === 'production';
    return isProd ? { ok: true } : { ok: true, demoToken: token };
  }

  @Public()
  @HttpCode(200)
  @Post('password/reset')
  async postReset(@Body() dto: ResetPasswordDto) {
    await this.resetPassword.execute(dto.email, dto.token, dto.password);
    return { ok: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  /** Emite el access token en el cuerpo y el refresh token en cookie HttpOnly. */
  private issue(res: Response, result: LoginResult) {
    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'lax',
      path: COOKIE_PATH,
      maxAge: result.refreshExpiresIn * 1000,
    });
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }
}
