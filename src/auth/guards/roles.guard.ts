import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ERole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // Không có decorator @Roles, cho phép truy cập
    }

    // Lấy user object từ request (đã được JwtStrategy gán vào)
    const { user } = context.switchToHttp().getRequest();

    // Kiểm tra xem user.roles có chứa bất kỳ role nào được yêu cầu không
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
