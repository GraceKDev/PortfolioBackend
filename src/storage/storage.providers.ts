import { S3Client } from "@aws-sdk/client-s3";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface.js";

export const S3_CLIENT = Symbol('S3_CLIENT');   

export const storageProviders:Provider[] = [
  {
    provide: S3_CLIENT,
    useFactory: () => {
      return new S3Client({
        region:process.env.AWS_REGION ?? 'ap-southeast-1',
      })
    }
    }
]