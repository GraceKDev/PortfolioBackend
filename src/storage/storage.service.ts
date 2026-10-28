import { GetObjectCommand, S3Client, paginateListObjectsV2 } from "@aws-sdk/client-s3";
import { Inject, Injectable } from "@nestjs/common";
import { S3_CLIENT } from "./storage.providers.js";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { checkBucketValidity } from "../lib/checkBucketValidity.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

    async getDevBlog(item: string): Promise<{ slug: string; content: string }> {
        const bucket = process.env.S3_BUCKET_NAME;
        const devBlogPrefix = "blogs/Dev/";
        const blogImagePrefix = "blogs/Images";
        const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
        checkBucketValidity(bucket);
        const result = await this.s3Client.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: `${devBlogPrefix}${item}`,
            }),
        );
        if (!result.Body) {
            throw new Error("S3 object has no body");
        }
        const markdown = await result.Body!.transformToString();
        const matches = [...markdown.matchAll(imagePattern)];
        let content = markdown;
        for (const match of matches) {
            const [original, alt, path] = match;
            if (path.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(path)) {
                continue;
            }
            const imageKey = `${blogImagePrefix}/${path}`;
            const url = await getSignedUrl(
                this.s3Client,
                new GetObjectCommand({
                    Bucket: bucket,
                    Key: imageKey,
                }),
                { expiresIn: 3600 }
            );
            content = content.replace(original, `![${alt}](${url})`);
        }
        return { slug: item, content };
    }

    async getAllDevBlogs(): Promise<{ slug: string; content: string }[]> {
        const files = await this.listDevBlog();
        
        const results = await Promise.allSettled(
            files.map(file => this.getDevBlog(file))
        );

        return results
            .filter(
                (result): result is PromiseFulfilledResult<{
                    slug: string;
                    content: string;
                }> => result.status === "fulfilled"
            )
            .map(result => result.value);
    }



}