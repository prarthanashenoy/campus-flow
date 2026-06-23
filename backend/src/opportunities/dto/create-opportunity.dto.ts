import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator'
import { Category } from '@prisma/client'

export class CreateOpportunityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string

  @IsEnum(Category)
  category: Category

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  location: string

  @IsDateString()
  startDate: string

  @IsOptional()
  @IsDateString()
  endDate?: string | null

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  capacity?: number | null
}

export class UpdateOpportunityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description?: string

  @IsOptional()
  @IsEnum(Category)
  category?: Category

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  location?: string

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string | null

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  capacity?: number | null

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean
}
