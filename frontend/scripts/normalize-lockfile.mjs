import { readFileSync, writeFileSync } from 'node:fs';

const lockfilePath = new URL('../package-lock.json', import.meta.url);
const lockfile = readFileSync(lockfilePath, 'utf8');
const registry = process.env.NPM_REGISTRY?.replace(/\/$/, '') ?? 'https://registry.npmjs.org';
const rewritten = lockfile.replace(
  /https?:\/\/[^/]+\/artifactory\/api\/npm\/[^/]+\//g,
  `${registry}/`,
);

if (rewritten !== lockfile) {
  writeFileSync(lockfilePath, rewritten);
}