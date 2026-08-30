// Reads and writes pogolo's config.toml plus this webui's own settings.
//
// IMPORTANT: pogolo's config may contain keys this webui does not model (newer
// options, hand-edited values, comments). Updates therefore parse the existing
// file, overwrite only the keys the user actually changed, and write the result
// back — unknown and unchanged fields survive untouched.

import fse from 'fs-extra'
import {parse as parseToml, stringify as stringifyToml} from 'smol-toml'

import {writeWithBackup} from './fs-helpers.js'
import {POGOLO_CONFIG_TOML, WEBUI_SETTINGS_JSON} from '../../lib/paths.js'
import {defaultValues, settingsMetadata, TOML_KEY_BY_SETTING, settingsSchema, type SettingsSchema} from '#settings'

// Reverse lookup: pogolo's TOML key -> our setting key
const SETTING_BY_TOML_KEY = Object.fromEntries(
	Object.entries(TOML_KEY_BY_SETTING).map(([setting, tomlKey]) => [tomlKey, setting]),
) as Record<string, string>

// In-memory cache of the current settings, refreshed on every successful write
let cachedSettings: SettingsSchema | undefined

// Read and parse config.toml. Returns an empty object when the file is absent
// or unparseable, so a broken config never takes the whole webui down.
async function readTomlConfig(): Promise<Record<string, unknown>> {
	try {
		const raw = await fse.readFile(POGOLO_CONFIG_TOML, 'utf8')
		return parseToml(raw) as Record<string, unknown>
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
			console.error('Failed to parse pogolo config.toml, treating as empty:', error)
		}
		return {}
	}
}

// Settings that belong to the webui rather than pogolo
async function readWebuiSettings(): Promise<Record<string, unknown>> {
	return (await fse.readJson(WEBUI_SETTINGS_JSON).catch(() => ({}))) as Record<string, unknown>
}

// Build the settings object the UI works with, from pogolo's TOML plus our own
// settings, falling back to defaults for anything missing.
export async function getSettings(): Promise<SettingsSchema> {
	if (cachedSettings) return cachedSettings

	const [toml, webui] = await Promise.all([readTomlConfig(), readWebuiSettings()])

	const settings: Record<string, unknown> = {...defaultValues()}

	// Pull in each modelled key that is actually present in the TOML
	for (const [tomlKey, value] of Object.entries(toml)) {
		const settingKey = SETTING_BY_TOML_KEY[tomlKey]
		if (settingKey !== undefined) settings[settingKey] = value
	}

	// webui-only settings override nothing in pogolo's config
	for (const [key, value] of Object.entries(webui)) {
		if (key in settingsMetadata) settings[key] = value
	}

	cachedSettings = settingsSchema.parse(settings) as SettingsSchema
	return cachedSettings
}

// Write the patch back to config.toml, preserving every key we did not touch.
async function writePogoloConfig(patch: Record<string, unknown>): Promise<void> {
	// Start from what is on disk right now so concurrent hand-edits are kept
	const existing = await readTomlConfig()

	let touched = false
	for (const [settingKey, value] of Object.entries(patch)) {
		const tomlKey = TOML_KEY_BY_SETTING[settingKey as keyof typeof TOML_KEY_BY_SETTING]
		// Skip settings that are not pogolo's (webui-only keys)
		if (!tomlKey) continue
		existing[tomlKey] = value
		touched = true
	}

	// Rewriting the file reformats it, so don't touch it for a webui-only patch
	if (!touched) return

	await writeWithBackup(POGOLO_CONFIG_TOML, stringifyToml(existing) + '\n')
}

async function writeWebuiSettings(patch: Record<string, unknown>): Promise<void> {
	const existing = await readWebuiSettings()

	let touched = false
	for (const [key, value] of Object.entries(patch)) {
		// Only keys we model that are NOT pogolo's belong here
		if (!(key in settingsMetadata)) continue
		if (TOML_KEY_BY_SETTING[key as keyof typeof TOML_KEY_BY_SETTING]) continue
		existing[key] = value
		touched = true
	}

	// Nothing webui-owned in this patch, so leave the file alone
	if (!touched) return

	await writeWithBackup(WEBUI_SETTINGS_JSON, JSON.stringify(existing, null, 2) + '\n')
}

// Update settings. Only the keys present in `patch` are changed.
export async function updateSettings(patch: Partial<SettingsSchema>): Promise<SettingsSchema> {
	const current = await getSettings()

	// Validate the full resulting object, but only persist the patched keys
	const merged = {...(current as Record<string, unknown>), ...(patch as Record<string, unknown>)}
	const validated = settingsSchema.parse(merged) as SettingsSchema

	// Persist only what the user actually sent, so untouched keys keep whatever
	// is in config.toml rather than being rewritten from our defaults.
	const changed: Record<string, unknown> = {}
	for (const key of Object.keys(patch)) {
		changed[key] = (validated as Record<string, unknown>)[key]
	}

	await writePogoloConfig(changed)
	await writeWebuiSettings(changed)

	cachedSettings = validated
	return validated
}

// Restore defaults for every setting this webui models.
// Unknown keys in config.toml are still preserved.
export async function restoreDefaults(): Promise<SettingsSchema> {
	const defaults = settingsSchema.parse(defaultValues()) as SettingsSchema

	await writePogoloConfig(defaults as Record<string, unknown>)
	await writeWebuiSettings(defaults as Record<string, unknown>)

	cachedSettings = defaults
	return defaults
}

// Called at server startup: make sure a config.toml exists so pogolo has
// something to read, without clobbering an existing one.
export async function ensureConfig(): Promise<SettingsSchema> {
	const exists = await fse.pathExists(POGOLO_CONFIG_TOML)
	if (!exists) {
		const defaults = settingsSchema.parse(defaultValues()) as SettingsSchema
		await writePogoloConfig(defaults as Record<string, unknown>)
	}

	return getSettings()
}

// Raw config.toml text, for the advanced editor in the settings page
export async function getRawConfig(): Promise<string> {
	return fse.readFile(POGOLO_CONFIG_TOML, 'utf8').catch(() => '')
}

// Overwrite config.toml wholesale with user-supplied text.
// Parsed first so we reject invalid TOML before it reaches pogolo.
export async function updateRawConfig(rawText: string): Promise<string> {
	const normalized = rawText.replace(/\r\n/g, '\n').trimEnd()

	try {
		parseToml(normalized)
	} catch (error) {
		throw Object.assign(new Error(`Invalid TOML: ${(error as Error).message}`), {statusCode: 400})
	}

	await writeWithBackup(POGOLO_CONFIG_TOML, normalized + '\n')

	// The file changed underneath us, so drop the cache
	cachedSettings = undefined

	return normalized
}
