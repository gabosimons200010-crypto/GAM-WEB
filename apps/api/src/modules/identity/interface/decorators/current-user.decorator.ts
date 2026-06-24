import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../../domain/auth-user';

/** Inyecta el actor autenticado (adjuntado por JwtAuthGuard) en el handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
