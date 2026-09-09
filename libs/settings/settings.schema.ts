// Validation schema derived from the settings metadata.

import {z} from 'zod'
import {settingsMetadata, type Option} from './settings.meta.js'

function buildSettingsSchema(metadata: Record<string, Option>): z.ZodObject<Record<string, z.ZodTypeAny>> {
	const schemaMap: Record<string, z.ZodTypeAny> = {}

	for (const key of Object.keys(metadata)) {
		const meta = metadata[key] as Option
		switch (meta.kind) {
			case 'number': {
				let schema = z.number({invalid_type_error: `${meta.label} must be a number`})

				if (meta.min !== undefined) {
					schema = schema.min(meta.min, {message: `Minimum ${meta.label} is ${meta.min}${meta.unit ?? ''}`})
				}
				if (meta.max !== undefined) {
					schema = schema.max(meta.max, {message: `Maximum ${meta.label} is ${meta.max}${meta.unit ?? ''}`})
				}
				schemaMap[key] = schema
				break
			}

			case 'toggle': {
				schemaMap[key] = z.boolean({invalid_type_error: `${meta.label} must be true or false`})
				break
			}

			case 'text': {
				let schema = z.string({invalid_type_error: `${meta.label} must be text`})
				if (meta.maxLength !== undefined) {
					schema = schema.max(meta.maxLength, {
						message: `${meta.label} must be ${meta.maxLength} characters or fewer`,
					})
				}
				if (!meta.optional) {
					schema = schema.min(1, {message: `${meta.label} is required`})
				}
				schemaMap[key] = schema
				break
			}

			case 'select': {
				schemaMap[key] = z.enum(meta.options.map((o: {value: string}) => o.value) as [string, ...string[]])
				break
			}
		}
	}

	// Unknown keys pass through: pogolo's config may contain options this webui
	// does not model, and we must not drop them.
	return z.object(schemaMap).passthrough()
}

export const settingsSchema = buildSettingsSchema(settingsMetadata)

export type SettingsSchema = z.infer<typeof settingsSchema>
