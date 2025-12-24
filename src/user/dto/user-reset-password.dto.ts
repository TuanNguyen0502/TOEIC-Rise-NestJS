import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class UserResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(
    // Đây là Regex chuẩn cho "Mật khẩu mạnh" thường dùng (giống Constant.PASSWORD_PATTERN)
    // Bao gồm: Ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt, không khoảng trắng
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$/, 
    {
      message: 'Password is invalid (must contain uppercase, lowercase, number, special char)',
    },
  )
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Confirm password must be at least 8 characters' })
  confirmPassword: string;
}
