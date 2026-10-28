import {
    BadRequestException,
    Controller,
    Get,
    NotFoundException,
    Param,
} from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger";
import { StorageService } from "./storage.service.js";

function isNotFoundError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    if (error.name === "NoSuchKey" || error.name === "NotFound") {
        return true;
    }

    if (!("$metadata" in error)) {
        return false;
    }

    const metadata = error.$metadata;
    return (
        typeof metadata === "object" &&
        metadata !== null &&
        "httpStatusCode" in metadata &&
        metadata.httpStatusCode === 404
    );
}

@ApiTags("Storage")
@Controller("Storage") 
export class StorageController {
    constructor(private readonly storageService: StorageService) {}

    @ApiOperation({ summary: "List object keys in the configured S3 bucket" })
    @ApiOkResponse({ type: [String] })
    @Get()
    getStorageInfo(): Promise<string[]> {
        return this.storageService.listFiles();
    }

    @ApiOperation({ summary: "List filenames under blogs/dev in the configured S3 bucket" })
    @ApiOkResponse({ type: [String] })

    @Get("blogs/dev")
    getDevBlogFiles(): Promise<string[]> {
        return this.storageService.listDevBlog();
    }

    @Get("blogs/dev/all")
    @ApiOperation({ summary: "Retrieve all blog files from blogs/Dev" })
    @ApiOkResponse({ type:String, isArray:true })
    @ApiNotFoundResponse({ description: "The requested blog file was not found" })
    @ApiBadRequestResponse({ description: "The blog file could not be retrieved" })
    async getAllDevBlogs(): Promise<{ slug: string; content: string }[]> {
        try {
            return await this.storageService.getAllDevBlogs();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unable to retrieve the blog file";
            throw new BadRequestException(message, { cause: error });
        }
    }

    @Get("blogs/dev/:item")
    @ApiOperation({ summary: "Retrieve a blog file from blogs/Dev" })
    @ApiOkResponse({ type: String })
    @ApiNotFoundResponse({ description: "The requested blog file was not found" })
    @ApiBadRequestResponse({ description: "The blog file could not be retrieved" })
    async getDevBlogFile(@Param("item") item: string): Promise<{ slug: string; content: string }> {
        try {
            return await this.storageService.getDevBlog(item);
        } catch (error) {
            if (isNotFoundError(error)) {
                throw new NotFoundException(`Blog file "${item}" was not found`, {
                    cause: error,
                });
            }
            const message =
                error instanceof Error
                    ? error.message
                    : "Unable to retrieve the blog file";
            throw new BadRequestException(message, { cause: error });
        }
    }
}