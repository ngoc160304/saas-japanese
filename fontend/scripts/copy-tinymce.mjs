import { cp, mkdir, realpath } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = await realpath(resolve(projectRoot, 'node_modules', 'tinymce'));
const targetDirectory = resolve(projectRoot, 'public', 'tinymce');

await mkdir(targetDirectory, { recursive: true });
await cp(sourceDirectory, targetDirectory, { recursive: true, force: true });
