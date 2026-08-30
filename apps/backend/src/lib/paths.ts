import path from 'node:path'
import {fileURLToPath} from 'node:url'
import fse from 'fs-extra'

// Absolute path to the monorepo root
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../')

// pogolo data dir, holding config.toml. In dev this falls back to ./data inside the repo.
export const POGOLO_DIR = process.env['POGOLO_DIR'] || path.join(REPO_ROOT, 'data')

// pogolo's config file
export const POGOLO_CONFIG_TOML = path.join(POGOLO_DIR, 'config.toml')

// pogolo's log file, tailed for the live log stream
export const POGOLO_LOG = process.env['POGOLO_LOG'] || path.join(POGOLO_DIR, 'pogolo.log')

// Settings that belong to this webui rather than to pogolo
export const WEBUI_SETTINGS_JSON = path.join(POGOLO_DIR, 'webui-settings.json')

// Ensure the data directory exists
export async function ensureDirs() {
	await fse.ensureDir(POGOLO_DIR)
}
