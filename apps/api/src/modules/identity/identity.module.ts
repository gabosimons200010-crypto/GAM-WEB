import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './interface/auth.controller';
import { JwtAuthGuard } from './interface/guards/jwt-auth.guard';
import { RolesGuard } from './interface/guards/roles.guard';

// Puertos
import { PasswordHasher } from './application/ports/password-hasher';
import { TokenService } from './application/ports/token-service';
import { UserRepository } from './application/ports/user.repository';
import { SessionRepository } from './application/ports/session.repository';
import { VerificationRepository } from './application/ports/verification.repository';
import { LoginAttemptRepository } from './application/ports/login-attempt.repository';
import { CodeDelivery } from './application/ports/code-delivery';

// Adaptadores
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { PrismaSessionRepository } from './infrastructure/prisma-session.repository';
import { PrismaVerificationRepository } from './infrastructure/prisma-verification.repository';
import { PrismaLoginAttemptRepository } from './infrastructure/prisma-login-attempt.repository';
import { LogCodeDelivery } from './infrastructure/log-code-delivery';

// Casos de uso
import { RegisterEmailUseCase } from './application/use-cases/register-email.use-case';
import { ConfirmEmailUseCase } from './application/use-cases/confirm-email.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RequestPhoneOtpUseCase } from './application/use-cases/request-phone-otp.use-case';
import { VerifyPhoneOtpUseCase } from './application/use-cases/verify-phone-otp.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';

/**
 * Bounded context IDENTITY (auth, RBAC, sesiones). Sprint 1.
 * Exporta TokenService y los guards para que los demás módulos protejan sus
 * endpoints (RF-AUTH-006).
 */
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    // Puertos → adaptadores
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: TokenService, useClass: JwtTokenService },
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: SessionRepository, useClass: PrismaSessionRepository },
    { provide: VerificationRepository, useClass: PrismaVerificationRepository },
    { provide: LoginAttemptRepository, useClass: PrismaLoginAttemptRepository },
    { provide: CodeDelivery, useClass: LogCodeDelivery },
    // Casos de uso
    RegisterEmailUseCase,
    ConfirmEmailUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    RequestPhoneOtpUseCase,
    VerifyPhoneOtpUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    // Guards
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [TokenService, JwtAuthGuard, RolesGuard],
})
export class IdentityModule {}
