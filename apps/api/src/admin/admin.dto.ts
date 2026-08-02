import { ExamCode, MatchStrategy, QuestionTypeCode, Role, Skill } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from "class-validator";

export class ExamDto { @IsEnum(ExamCode) code!: ExamCode; @IsString() name!: string; @IsOptional() @IsString() description?: string; }
export class SectionDto { @IsString() examId!: string; @IsString() name!: string; @IsInt() @Min(1) order!: number; @IsInt() @Min(10) timeLimitSec!: number; @IsEnum(Skill) skill!: Skill; @IsOptional() @IsString() instructions?: string; @IsOptional() @IsInt() @Min(1) difficultyLevel?: number; }
export class PassageDto { @IsString() sectionId!: string; @IsString() title!: string; @IsString() bodyRichtext!: string; @IsOptional() @IsString() sourceNote?: string; }
export class AudioDto { @IsString() sectionId!: string; @IsString() storageKey!: string; @IsInt() @Min(1) durationSec!: number; @IsOptional() @IsString() transcript?: string; }
export class OptionDto { @IsString() label!: string; @IsString() value!: string; @IsOptional() @IsBoolean() isCorrect?: boolean; @IsInt() @Min(1) order!: number; }
export class AnswerKeyDto { @IsArray() acceptedAnswers!: unknown[]; @IsEnum(MatchStrategy) matchStrategy!: MatchStrategy; @IsOptional() @IsNumber() tolerance?: number; }
export class QuestionDto {
  @IsString() sectionId!: string; @IsOptional() @IsString() passageId?: string; @IsOptional() @IsString() audioAssetId?: string;
  @IsEnum(QuestionTypeCode) type!: QuestionTypeCode; @IsString() prompt!: string; @IsInt() @Min(1) order!: number;
  @IsNumber() @Min(0) points!: number; @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OptionDto) options!: OptionDto[];
  @ValidateNested() @Type(() => AnswerKeyDto) answerKey!: AnswerKeyDto;
}
export class FormSectionDto { @IsString() sectionId!: string; @IsInt() @Min(1) order!: number; @IsOptional() @IsNumber() routeMinPercent?: number; @IsOptional() @IsNumber() routeMaxPercent?: number; }
export class TestFormDto {
  @IsString() examId!: string; @IsString() name!: string; @IsString() slug!: string; @IsInt() @Min(1) version!: number;
  @IsOptional() @IsBoolean() isPublished?: boolean;
  @IsArray() @ValidateNested({ each: true }) @Type(() => FormSectionDto) sections!: FormSectionDto[];
}
export class ImportDto { @IsArray() @ValidateNested({ each: true }) @Type(() => QuestionDto) questions!: QuestionDto[]; }
export class RoleDto { @IsEnum(Role) role!: Role; }
export class FeatureFlagDto { @IsString() key!: string; @IsBoolean() enabled!: boolean; @IsOptional() @IsString() examId?: string; }
