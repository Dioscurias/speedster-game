// Combined development and production-preview entry.
import {defineConfig,mergeConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import mantaConfig from './apps/manta/vite.config.js';
export default defineConfig(async env=>mergeConfig(await mantaConfig(env),{build:{outDir:fileURLToPath(new URL('./dist',import.meta.url))}}));
