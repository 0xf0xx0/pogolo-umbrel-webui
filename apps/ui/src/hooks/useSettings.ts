import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {SettingsSchema} from '#settings'

export function useSettings() {
	return useQuery({
		queryKey: ['config', 'settings'],
		queryFn: () => api<SettingsSchema>('/config/settings'),
		staleTime: 30_000,
		refetchInterval: 30_000,
	})
}

// Settings changes alter how the pool serves work, so refresh pool data after a save.
function invalidatePoolData(qc: ReturnType<typeof useQueryClient>) {
	qc.invalidateQueries({queryKey: ['pool']})
}

export function useUpdateSettings() {
	const qc = useQueryClient()

	return useMutation({
		// `data` is the *partial* diff from the settings form
		mutationFn: (data: Partial<SettingsSchema>) =>
			api<SettingsSchema>('/config/settings', {method: 'PATCH', body: data}),

		onSuccess: (fresh: SettingsSchema) => {
			qc.setQueryData(['config', 'settings'], fresh)
			invalidatePoolData(qc)
		},
	})
}

export function useRestoreDefaults() {
	const qc = useQueryClient()

	return useMutation({
		// No payload – just POST with empty body
		mutationFn: () => api<SettingsSchema>('/config/restore-defaults', {method: 'POST', body: {}}),

		onSuccess: (fresh: SettingsSchema) => {
			qc.setQueryData(['config', 'settings'], fresh)
			invalidatePoolData(qc)
		},
	})
}

// Raw config.toml, for the advanced editor
export function useRawConfig() {
	return useQuery({
		queryKey: ['config', 'raw'],
		queryFn: () => api<{contents: string}>('/config/raw'),
		staleTime: 30_000,
	})
}

export function useUpdateRawConfig() {
	const qc = useQueryClient()

	return useMutation({
		mutationFn: (contents: string) =>
			api<{contents: string}>('/config/raw', {method: 'PATCH', body: {contents}}),

		onSuccess: (fresh) => {
			qc.setQueryData(['config', 'raw'], fresh)
			// The file may now disagree with the form, so refetch both
			qc.invalidateQueries({queryKey: ['config', 'settings']})
			invalidatePoolData(qc)
		},
	})
}
