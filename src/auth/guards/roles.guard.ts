import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { RequestWithUser } from 'src/common/bases/request-user.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ERole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Không có decorator @Roles, cho phép truy cập
    }

    // Lấy user object từ request (đã được JwtStrategy gán vào)
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !Array.isArray(user.roles)) {
      return false;
    }
    // Kiểm tra xem user.roles có chứa bất kỳ role nào được yêu cầu không
    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
