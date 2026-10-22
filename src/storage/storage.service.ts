import { GetObjectCommand, S3Client, paginateListObjectsV2 } from "@aws-sdk/client-s3";
import { Inject, Injectable } from "@nestjs/common";
import { S3_CLIENT } from "./storage.providers.js";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { checkBucketValidity } from "../lib/checkBucketValidity.js";

@Injectable()
export class StorageService {
    constructor(
        @Inject(S3_CLIENT) private readonly s3Client: S3Client,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    async listFiles(): Promise<string[]> {
        const bucket = process.env.S3_BUCKET_NAME;
        checkBucketValidity(bucket);

        const files: string[] = [];
        for await (const page of paginateListObjectsV2(
            { client: this.s3Client },
            { Bucket: bucket, MaxKeys: 1000 },
        )) {
            for (const object of page.Contents ?? []) {
                if (object.Key) {
                    files.push(object.Key);
                }
            }
        }
        return files;
    }

    async listDevBlog(): Promise<string[]> {
        const bucket = process.env.S3_BUCKET_NAME;
        checkBucketValidity(bucket);

        const files: string[] = [];
        for await (const page of paginateListObjectsV2(
            { client: this.s3Client },
            { Bucket: bucket, Prefix: "blogs/Dev/", MaxKeys: 1000 },
        )) {
            for (const object of page.Contents ?? []) {
                if (object.Key) {
                    const filename = object.Key.split("/").pop();
                    if (filename) {
                        files.push(filename);
                    }
                }
            }
        }
        return files;
    }

    async getDevBlog(item: string): Promise<string> {
        const bucket = process.env.S3_BUCKET_NAME;
        checkBucketValidity(bucket);
        const result = await this.s3Client.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: `blogs/Dev/${item}`,
            }),
        );
        if (!result.Body) {
            throw new Error("S3 object has no body");
        }

        return await result.Body!.transformToString();
    }



}