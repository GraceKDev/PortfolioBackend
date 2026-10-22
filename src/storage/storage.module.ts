import { Module } from '@nestjs/common';

import { storageProviders } from './storage.providers.js';
import { StorageService } from './storage.service.js';
import { StorageController } from './storage.controller.js';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [
        CacheModule.register({
            ttl: 30_000,
        }),
    ],
    providers: [
        ...storageProviders,
        StorageService,

    ],
    exports: [StorageService],
    controllers: [StorageController],
})
export class StorageModule {}