import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsArray, IsEnum } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty({ message: '房间名称不能为空' })
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  background?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsOptional()
  password?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateRoomDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  background?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsOptional()
  password?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty({ message: '邀请码不能为空' })
  inviteCode!: string;

  @IsString()
  @IsOptional()
  password?: string;
}
