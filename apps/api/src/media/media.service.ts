import { Injectable } from "@nestjs/common";
import { CreateBucketCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
@Injectable()
export class MediaService {
  private readonly bucket = process.env.MINIO_BUCKET ?? "exam-media";
  private readonly s3 = new S3Client({ region: "us-east-1", endpoint: `${process.env.MINIO_USE_SSL === "true" ? "https" : "http"}://${process.env.MINIO_ENDPOINT ?? "localhost"}:${process.env.MINIO_PORT ?? "9000"}`, forcePathStyle: true, credentials: { accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin", secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadmin" } });
  private readonly publicS3 = new S3Client({ region: "us-east-1", endpoint: `${process.env.MINIO_USE_SSL === "true" ? "https" : "http"}://${process.env.MINIO_PUBLIC_ENDPOINT ?? "localhost"}:${process.env.MINIO_PORT ?? "9000"}`, forcePathStyle: true, credentials: { accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin", secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadmin" } });
  async upload(filename: string, contentType: string) {
    try { await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket })); } catch { await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket })); }
    const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${filename}`;
    const uploadUrl = await getSignedUrl(this.publicS3, new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }), { expiresIn: 900 });
    return { key, uploadUrl, expiresIn: 900 };
  }
  async getObject(key: string) { return this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key })); }
}
