import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(2, { message: '用户名至少2个字符' })
  username!: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少6个字符' })
  password!: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '邮箱不能为空' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password!: string;
}
