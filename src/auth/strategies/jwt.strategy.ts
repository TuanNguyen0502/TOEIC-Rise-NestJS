import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { BlacklistService } from '../blacklist/blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly blacklistService: BlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_KEY')!,
    });
  }

  /**
   * Đây là phương thức thay thế cho UserDetailServiceImpl.loadUserByUsername()
   * Payload là nội dung đã được giải mã từ JWT (từ hàm login() của bạn)
   * Bất cứ thứ gì được trả về ở đây sẽ được gán vào `request.user`
   */
  async validate(payload: any) {
    // Chúng ta tin tưởng payload vì strategy đã tự động xác thực chữ ký.
    // Logic của UserDetailServiceImpl.java (load user từ DB) là không cần thiết
    // nếu mọi thông tin bạn cần (như roles) đã có trong token.

    // Nếu bạn cần kiểm tra xem user có còn tồn tại trong DB không,
    // bạn có thể inject UserService và kiểm tra ở đây.

    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
