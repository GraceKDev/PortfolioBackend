export const checkBucketValidity = (bucketName:string | undefined | null): boolean => {
    if(bucketName === undefined || bucketName === null || bucketName === "") {
        throw new Error("S3_BUCKET_NAME is not configured");
    }
    return true;
}