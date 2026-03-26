import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @IsNotEmpty({ message: '列名称不能为空' })
  title!: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateColumnDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class MoveColumnDto {
  @IsInt()
  @IsNotEmpty()
  newPosition!: number;
}
