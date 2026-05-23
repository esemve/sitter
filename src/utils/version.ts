import { readFileSync } from 'fs';
import { resolveFromPackage } from './package-root.js';

let version: string;
try {
  const packageJsonPath = resolveFromPackage('package.json');
  version = JSON.parse(readFileSync(packageJsonPath, 'utf-8')).version;
} catch {
  version = 'unknown';
}

export const packageVersion: string = version;
