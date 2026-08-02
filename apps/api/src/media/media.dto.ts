import { IsString, Matches } from "class-validator";
export class UploadDto { @IsString() @Matches(/^[\w.-]+$/) filename!: string; @IsString() contentType!: string; }
