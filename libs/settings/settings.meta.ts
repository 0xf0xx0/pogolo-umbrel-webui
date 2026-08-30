// This settings metadata file is the single source of truth for deriving:
// - the validation schema (settings.schema.ts)
// - default settings values
// - the frontend settings page (React form inputs, descriptions, tool-tips, etc)
//
// `tomlKey` is the key written to pogolo's config.toml. Keys without one belong
// to this webui and are stored separately.

// Tabs for organization (used in the UI to group settings)
export type Tab = 'pool' | 'advanced' | 'webui'

interface BaseOption {
	tab: Tab
	label: string
	// The key in pogolo's config.toml. Omitted for webui-only settings.
	tomlKey?: string
	description: string
	subDescription?: string
}

interface NumberOption extends BaseOption {
	kind: 'number'
	min?: number
	max?: number
	step?: number
	default: number
	unit?: string
}

interface BooleanOption extends BaseOption {
	kind: 'toggle' // rendered as a Switch
	default: boolean
	disabledWhen?: Record<string, (v: unknown) => boolean>
	disabledMessage?: string
}

interface StringOption extends BaseOption {
	kind: 'text'
	default: string
	maxLength?: number
	placeholder?: string
	// Rendered as a password field when true
	secret?: boolean
	// Allowed to be empty even though it is a string
	optional?: boolean
}

interface SelectOption extends BaseOption {
	kind: 'select'
	options: {value: string; label: string}[]
	default: string
}

export type Option = NumberOption | BooleanOption | StringOption | SelectOption

// The coinbase tag is replaced by pogolo's default if it exceeds roughly this
// many characters, so we stop the user before that happens.
export const MAX_TAG_LENGTH = 86

export const settingsMetadata = {
	/* ===== Pool tab ===== */
	tag: {
		tab: 'pool',
		kind: 'text',
		tomlKey: 'tag',
		label: 'Coinbase Tag',
		description: 'The tag embedded in the coinbase of blocks your pool mines.',
		subDescription: `Customize it! Add your swarm stats, like '/pogolo on Umbrel - gamma x1 - decentralize or die/'. Tags longer than about ${MAX_TAG_LENGTH} characters are replaced by the default tag.`,
		default: '/pogolo on Umbrel - decentralize or die/',
		maxLength: MAX_TAG_LENGTH,
		optional: true,
	},

	pool_address: {
		tab: 'pool',
		kind: 'text',
		tomlKey: 'pool_address',
		label: 'Pool Address',
		description: 'The default on-chain address to mine to when a client does not provide one.',
		default: '',
		optional: true,
		placeholder: 'bc1...',
	},

	password: {
		tab: 'pool',
		kind: 'text',
		tomlKey: 'password',
		label: 'Stratum V1 Password',
		description: 'If set, SV1 clients must supply this password to connect.',
		subDescription: 'Leave empty to allow any SV1 client to connect.',
		default: '',
		secret: true,
		optional: true,
	},

	default_difficulty: {
		tab: 'pool',
		kind: 'number',
		tomlKey: 'default_difficulty',
		label: 'Default Difficulty',
		description: 'The share difficulty assigned to a client before automatic adjustment kicks in.',
		min: 0.16,
		step: 0.01,
		default: 1000,
	},

	target_share_interval: {
		tab: 'pool',
		kind: 'number',
		tomlKey: 'target_share_interval',
		label: 'Target Share Interval',
		description:
			'How often, on average, you want each client to submit a share. Automatic difficulty adjustment aims for this interval.',
		min: 1,
		step: 1,
		default: 10,
		unit: 'sec',
	},

	job_interval: {
		tab: 'pool',
		kind: 'number',
		tomlKey: 'job_interval',
		label: 'Job Interval',
		description: 'How often new work is sent to connected clients.',
		min: 1,
		step: 1,
		default: 30,
		unit: 'sec',
	},

	/* ===== Advanced tab ===== */
	disable_vardiff: {
		tab: 'advanced',
		kind: 'toggle',
		tomlKey: 'disable_vardiff',
		label: 'Disable Automatic Difficulty Adjustment',
		description:
			'Keep every client pinned to the default difficulty instead of tuning it to hit the target share interval.',
		default: false,
	},

	ignore_suggested_difficulty: {
		tab: 'advanced',
		kind: 'toggle',
		tomlKey: 'ignore_suggested_difficulty',
		label: 'Ignore Client-Suggested Difficulty',
		description: 'Ignore the difficulty a client asks for and use the pool’s own value instead.',
		default: false,
	},

	extranonce2_size: {
		tab: 'advanced',
		kind: 'number',
		tomlKey: 'extranonce2_size',
		label: 'Extranonce2 Size',
		description: 'Size of the extranonce2 field, in bytes.',
		subDescription: '⚠ This usually should not be touched. Some miners are picky about this value.',
		min: 1,
		max: 8,
		step: 1,
		default: 8,
		unit: 'bytes',
	},

	bip_version_bits: {
		tab: 'advanced',
		kind: 'number',
		tomlKey: 'bip_version_bits',
		label: 'BIP Version Bits',
		description: 'Version bits as an int32, OR-ed with the block template version.',
		subDescription: '⚠ This usually should not be touched.',
		step: 1,
		default: 0,
	},
} satisfies Record<string, Option>

export type SettingKey = keyof typeof settingsMetadata

// Keys that pogolo owns (written to config.toml), and those this webui owns.
export const POGOLO_KEYS = Object.entries(settingsMetadata)
	.filter(([, option]) => 'tomlKey' in option && option.tomlKey)
	.map(([key]) => key) as SettingKey[]

// Map our setting keys to the TOML keys pogolo expects
export const TOML_KEY_BY_SETTING = Object.fromEntries(
	Object.entries(settingsMetadata)
		.filter(([, option]) => 'tomlKey' in option && option.tomlKey)
		.map(([key, option]) => [key, (option as {tomlKey: string}).tomlKey]),
) as Record<SettingKey, string>

// Compute the default form values
export function defaultValues() {
	const defaults = {} as Record<string, unknown>
	for (const key in settingsMetadata) {
		defaults[key] = (settingsMetadata as Record<string, {default: unknown}>)[key].default
	}
	return defaults
}
