import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: number;
  email?: string;
  role?: string;
  exp: number;
  iat?: number;
}

@Injectable()
export class BlacklistService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private jwtService: JwtService,
  ) {}

  async blacklistToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const now = Math.floor(Date.now() / 1000);
      const ttl = payload.exp - now; // Thời gian sống còn lại của token

      if (ttl > 0) {
        await this.cacheManager.set(`blacklist:${token}`, 'true', ttl);
      }
    } catch (e) {
      console.error('Error blacklisting token:', e);
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.cacheManager.get(`blacklist:${token}`);
    return result === 'true';
  }
}
