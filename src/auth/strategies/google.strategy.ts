import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('BACKEND_CALLBACK_URL')!,
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): any {
    const { name, emails, photos } = profile;
    const email = emails && emails[0] ? emails[0].value : null;

    if (!email) {
      return done(
        new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Google account'),
        false,
      );
    }

    const firstName = name?.givenName || '';
    const lastName = name?.familyName || '';
    const fullName = `${firstName} ${lastName}`.trim() || email;
    const picture = photos && photos[0] ? photos[0].value : undefined;

    const user = {
      email,
      firstName,
      lastName,
      fullName,
      picture,
      accessToken,
    };

    done(null, user);
  }
}
