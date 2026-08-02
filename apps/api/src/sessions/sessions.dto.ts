import { IsBoolean, IsObject, IsOptional, IsString } from "class-validator";
export class StartSessionDto { @IsString() testFormId!: string; }
export class SaveAnswerDto {
  @IsObject() response!: Record<string, unknown>;
  @IsOptional() @IsBoolean() flagged?: boolean;
}
export class IntegrityEventDto {
  @IsString() type!: string;
  @IsOptional() @IsObject() detail?: Record<string, unknown>;
}
