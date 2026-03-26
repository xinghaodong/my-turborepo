import { IsNotEmpty, IsOptional, IsString, IsInt, IsEnum, IsDateString } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty({ message: '卡片标题不能为空' })
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  coverColor?: string;
}

export class UpdateCardDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  coverColor?: string;
}

export class MoveCardDto {
  @IsString()
  @IsNotEmpty()
  targetColumnId!: string;

  @IsInt()
  @IsNotEmpty()
  newPosition!: number;
}
