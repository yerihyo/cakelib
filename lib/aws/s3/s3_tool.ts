import AmazonS3URI from 'amazon-s3-uri'
export default class S3Tool{
  static uri2imploded(uri:string): AmazonS3URI{
    return AmazonS3URI(uri);
  }

  static uri2key(uri:string): string{
    return uri ? AmazonS3URI(uri).key : undefined;
  }

  static s3uri2url(region: string, s3uri: string) {
    if(region==null || s3uri ==null){ return undefined; }

    const uri = AmazonS3URI(s3uri);

    return `https://${uri.bucket}.s3.${region}.amazonaws.com/${uri.key}`
    //   return `https://s3.us-east-2.amazonaws.com/my-bucket-name/filename`;

  }
}