/**
 * Prepara el bucket de objetos (MinIO en dev): lo crea si no existe y le pone
 * una política de lectura pública, para que las fotos subidas por los vendedores
 * se puedan mostrar en la vitrina.
 *
 * Correr una vez tras `pnpm infra:up`:
 *   pnpm --filter @gamarra/api exec ts-node scripts/setup-storage.ts
 */
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

const endpoint = process.env.STORAGE_ENDPOINT ?? 'http://localhost:9000';
const bucket = process.env.STORAGE_BUCKET ?? 'gamarra-media';

const client = new S3Client({
  region: process.env.STORAGE_REGION ?? 'us-east-1',
  endpoint,
  forcePathStyle: true, // requerido por MinIO
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.STORAGE_SECRET_KEY ?? 'minioadmin',
  },
});

async function main(): Promise<void> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Bucket "${bucket}" ya existe.`);
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`Bucket "${bucket}" creado.`);
  }

  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  };
  await client.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(policy) }));
  console.log(`Política de lectura pública aplicada a "${bucket}".`);
  console.log(`Las fotos serán visibles en ${endpoint}/${bucket}/<key>`);
}

main().catch((e) => {
  console.error('Error configurando el storage:', e);
  process.exit(1);
});
