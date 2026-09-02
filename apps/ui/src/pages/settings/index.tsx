// Individual settings are rendered dynamically from the settings metadata (libs/settings/settings.meta.ts).
// The metadata file acts as a single source of truth for deriving this UI and validation schema.

import {useEffect, useMemo, useRef, useState} from 'react'
import {useSearchParams} from 'react-router-dom'
import {useForm, FormProvider, Controller, useFormState} from 'react-hook-form'
import {Search} from 'lucide-react'
import {zodResolver} from '@hookform/resolvers/zod'
import clsx from 'clsx'
import {toast} from 'sonner'

import {Card, CardHeader, CardContent, CardFooter, CardTitle} from '@/components/ui/card'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from '@/components/ui/alert-dialog'

import {GradientBorderFromTop} from '@/components/shared/GradientBorders'
import FadeScrollArea from '@/components/shared/FadeScrollArea'
import {Form} from './Form'
import Toggle from './Toggle'
import InputField from './InputField'
import {SettingsDisabledContext, useInputsDisabled} from './SettingsDisabledContext'
import DangerZoneAlert from './DangerZoneAlert'
import CustomConfigEditor from './CustomConfigEditor'
import SaveSettingsDialog from './SaveSettingsDialog'

import {defaultValues, settingsMetadata, settingsSchema, type SettingsSchema, type Tab, type Option} from '#settings'

import {useSettings, useUpdateSettings, useRestoreDefaults} from '@/hooks/useSettings'

type SettingName = string

// Shows the pogolo.toml key beside a setting's label
function TomlKeyBadge({option}: {option: Option}) {
	if (!option.tomlKey) return null

	return (
		<div className='flex flex-wrap gap-1 my-1'>
			<span className='text-[12px] font-[400] text-body-subtle bg-surface-input px-1 rounded-sm'>{option.tomlKey}</span>
		</div>
	)
}

// Trigger for each tab
function SettingsTabTrigger({
	value,
	children,
	control,
	names,
}: {
	value: Tab
	children: React.ReactNode
	control: any
	names: string[]
}) {
	// RHF/Zod validation errors for just the fields in this tab.
	const {errors} = useFormState({control, name: names})
	// true if any subscribed field in this tab currently has a validation error
	const hasError = names.some((n) => !!(errors as Record<string, unknown>)?.[n])

	return (
		<TabsTrigger
			value={value}
			className='relative text-[12px] bg-transparent border-none data-[state=active]:text-body data-[state=active]:bg-transparent data-[state=inactive]:text-body-muted focus-visible:outline-none focus:outline-none focus:ring-0 rounded-none hover:text-body transition-none pb-3 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-transparent data-[state=active]:after:bg-body'
		>
			{children}

			{/* We show a pulsating red error dot to indicate that there is a validation error(s) in this tab */}
			{hasError && (
				<span aria-hidden className='relative inline-flex h-2 w-2'>
					{/* outer expanding ring that pings */}
					<span className='absolute inline-flex h-full w-full rounded-full bg-bad opacity-75 animate-ping' />
					{/* solid center dot */}
					<span className='relative inline-flex h-2 w-2 rounded-full bg-bad' />
				</span>
			)}
		</TabsTrigger>
	)
}

// Content inside each tab
function SettingsTabContent({tab, form}: {tab: Tab; form: ReturnType<typeof useForm>}) {
	const fieldsForTab = (Object.keys(settingsMetadata) as string[]).filter(
		(k) => (settingsMetadata as Record<string, Option>)[k].tab === tab,
	)

	return (
		<>
			{fieldsForTab.map((k, index) => (
				<div key={String(k)} className={index < fieldsForTab.length - 1 ? 'border-b-[1px] border-line-strong pb-6' : ''}>
					<FieldRenderer name={k as SettingName} form={form} />
				</div>
			))}
		</>
	)
}

// Render each individual setting depending on its kind (e.g., number, toggle, text, select)
function FieldRenderer({name, form}: {name: SettingName; form: ReturnType<typeof useForm>}) {
	const option = (settingsMetadata as Record<string, Option>)[name] as Option
	const disabled = useInputsDisabled()

	// Number fields (e.g., job_interval)
	if (option.kind === 'number') {
		return (
			<div className='relative flex flex-col gap-1'>
				<div className='flex flex-row justify-between items-center'>
					<div>
						{form.formState.errors[name] && (
							<p className='absolute top-10 right-1 text-xs text-bad'>
								{form.formState.errors[name]?.message as string}
							</p>
						)}
						<label className='text-[14px] font-[400] text-body'>{option.label}</label>
						<TomlKeyBadge option={option} />
					</div>
					<InputField
						className='w-32'
						id={option.tomlKey ?? name}
						type='number'
						step={option.step ?? 1}
						min={option.min as number | undefined}
						max={option.max as number | undefined}
						{...form.register(name, {valueAsNumber: true})}
						unit={option.unit}
						disabled={disabled}
					/>
				</div>
				<p className='text-[13px] font-[400] text-body-muted'>{option.description}</p>
				{option.subDescription && <p className='text-[12px] font-[400] text-body-muted mt-1'>{option.subDescription}</p>}
				<p className='text-[12px] font-[400] text-body-subtle  mt-2'>
					default: {option.default} {option.unit}
				</p>
			</div>
		)
	}

	// Text fields (e.g., tag, pool_address)
	if (option.kind === 'text') {
		return (
			<div className='relative flex flex-col gap-1'>
				<div className='flex flex-col gap-2'>
					<div>
						{form.formState.errors[name] && (
							<p className='absolute top-10 right-1 text-xs text-bad'>
								{form.formState.errors[name]?.message as string}
							</p>
						)}
						<label className='text-[14px] font-[400] text-body'>{option.label}</label>
						<TomlKeyBadge option={option} />
					</div>
					<InputField
						className='w-full'
						id={option.tomlKey ?? name}
						type={option.secret ? 'password' : 'text'}
						placeholder={option.placeholder}
						maxLength={option.maxLength}
						{...form.register(name)}
						disabled={disabled}
					/>
				</div>
				<p className='text-[13px] font-[400] text-body-muted'>{option.description}</p>
				{option.subDescription && <p className='text-[12px] font-[400] text-body-muted mt-1'>{option.subDescription}</p>}
				{option.default !== '' && (
					<p className='text-[12px] font-[400] text-body-subtle mt-2'>default: {option.default}</p>
				)}
			</div>
		)
	}

	// Boolean Toggle fields (e.g., disable_vardiff)
	if (option.kind === 'toggle') {
		const disabledByOtherSetting =
			option.disabledWhen &&
			Object.entries(option.disabledWhen).some(([other, fn]) =>
				(fn as (v: unknown) => boolean)(form.watch(other as string)),
			)

		return (
			<Controller
				name={name}
				control={form.control}
				render={({field, fieldState}) => (
					<div className='relative flex flex-col gap-1'>
						<div className='flex flex-row justify-between sm:items-center'>
							<div>
								<label className='text-[14px] font-[400] text-body'>{option.label}</label>
								<TomlKeyBadge option={option} />
							</div>
							<div className='max-sm:mt-2'>
								<Toggle
									name={name}
									// current RHF value
									checked={!!field.value}
									onToggle={field.onChange}
									disabled={disabled || disabledByOtherSetting}
									disabledMessage={option.disabledMessage}
								/>
							</div>
						</div>
						<p className='text-[13px] font-[400] text-body-muted'>{option.description}</p>
						{option.subDescription && (
							<p className='text-[12px] font-[400] text-body-muted mt-1'>{option.subDescription}</p>
						)}
						<p className='text-[12px] font-[400] text-body-subtle mt-2'>
							default: {option.default ? 'enabled' : 'disabled'}
						</p>
						{fieldState.error && (
							<p className='absolute -bottom-4 left-0 text-xs text-bad'>{fieldState.error.message}</p>
						)}
					</div>
				)}
			/>
		)
	}

	// Select fields
	if (option.kind === 'select') {
		return (
			<Controller
				name={name}
				control={form.control}
				render={({field, fieldState}) => (
					<div className='relative flex flex-col gap-1'>
						<div className='flex flex-row justify-between items-center'>
							<div>
								{fieldState.error && (
									<p className='absolute top-10 right-1 text-xs text-bad'>{fieldState.error.message}</p>
								)}
								<label className='text-[14px] font-[400] text-body'>{option.label}</label>
								<TomlKeyBadge option={option} />
							</div>
							<Select
								value={field.value}
								defaultValue={option.default?.toString()}
								onValueChange={field.onChange}
								disabled={disabled}
							>
								<SelectTrigger
									className={`rounded bg-surface-input shadow-[inset_0_-1px_1px_0_rgba(255,255,255,0.2),_inset_0_1px_1px_0_rgba(0,0,0,0.36)] p-3 text-body focus:ring-0 ring-offset-0 border-none max-sm:text-[12px]`}
								>
									<SelectValue placeholder='Select…' />
								</SelectTrigger>

								<SelectContent className='bg-surface-input shadow-[inset_0_-1px_1px_0_rgba(255,255,255,0.2),_inset_0_1px_1px_0_rgba(0,0,0,0.36)] text-body border-none'>
									{option.options.map((opt) => (
										<SelectItem key={opt.value} value={opt.value} className='cursor-pointer'>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<p className='text-[13px] font-[400] text-body-muted'>{option.description}</p>
						{option.subDescription && (
							<p className='text-[12px] font-[400] text-body-muted mt-1'>{option.subDescription}</p>
						)}
						<p className='text-[12px] font-[400] text-body-subtle mt-2'>default: {option.default}</p>
					</div>
				)}
			/>
		)
	}

	// If for some reason the field is not found, return null
	return null
}

// This array drives both the tab triggers (navigation) and tab content rendering
const tabs = [
	{value: 'pool', label: 'Pool'},
	{value: 'webui', label: 'Web UI'},
	{value: 'advanced', label: 'Advanced'},
] as const

const DEFAULT_TAB = tabs[0].value

// MAIN COMPONENT
export default function SettingsCard() {
	// Tab routing state
	const [searchParams, setSearchParams] = useSearchParams()
	const initialTab = searchParams.get('tab') ?? DEFAULT_TAB
	const [currentTab, setCurrentTab] = useState(initialTab)

	// Form data state
	const {data: initialSettings, isLoading} = useSettings()
	const updateSettings = useUpdateSettings()
	const restoreDefaults = useRestoreDefaults()
	// Save dialog controlled state to avoid any double-open edge cases
	const [isSaveOpen, setIsSaveOpen] = useState(false)

	const form = useForm<SettingsSchema>({
		resolver: zodResolver(settingsSchema) as any,
		mode: 'onChange',
		reValidateMode: 'onChange',
		defaultValues: defaultValues() as any,
		shouldUnregister: false,
	})

	// reset form with initial settings when they are available
	useEffect(() => {
		if (initialSettings) form.reset(initialSettings)
	}, [initialSettings, form])

	const {isDirty, isValid, isSubmitting} = form.formState

	// Disable all inputs while loading the initial settings or while submitting
	const isInputsDisabled = isLoading || isSubmitting

	// Only send the fields the user actually changed, so untouched values keep
	// whatever is already in pogolo.toml.
	const onUpdateSettings = (data: SettingsSchema) => {
		const dirtyFields = form.formState.dirtyFields as Record<string, unknown>
		const patch: Record<string, unknown> = {}
		for (const key of Object.keys(dirtyFields)) {
			patch[key] = (data as Record<string, unknown>)[key]
		}

		updateSettings.mutate(patch, {
			onSuccess: () => toast.success('Settings saved'),
			onError: (err) => toast.error(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`),
		})
	}

	const onRestoreDefaults = () => {
		restoreDefaults.mutate(undefined, {
			onSuccess: () => toast.success('Defaults restored'),
			onError: (err) =>
				toast.error(`Failed to restore defaults: ${err instanceof Error ? err.message : 'Unknown error'}`),
		})
	}

	// Search state
	const [query, setQuery] = useState('')

	// normalize once here so we don't toLowerCase inside a loop
	const search = query.trim().toLowerCase()

	// We filter settings entirely in-memory, so each key-press only
	// re-runs a cheap O(settings) array filter that isn't worth debouncing.
	const matchingFields = useMemo(() => {
		if (!search) return []
		const m = settingsMetadata as Record<string, Option>
		return (Object.keys(m) as string[]).filter((name) => {
			const {label, tomlKey} = m[name]
			return label.toLowerCase().includes(search) || (tomlKey ?? '').toLowerCase().includes(search)
		})
	}, [search])

	const isSearching = search.length > 0

	// Ref to the main settings content scroll viewport
	const settingsViewportRef = useRef<HTMLDivElement | null>(null)

	return (
		<SettingsDisabledContext.Provider value={isInputsDisabled}>
			<FormProvider {...form}>
				<Form onSubmit={onUpdateSettings}>
					<Card className='bg-card-gradient backdrop-blur-2xl border-none rounded-3xl py-4'>
						<GradientBorderFromTop />
						<CardHeader>
							<div className='flex items-center justify-between'>
								<CardTitle className='font-bold text-body text-[20px] font-[400] pt-2'>Settings</CardTitle>
								<div className='relative max-w-xs mt-2'>
									<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-body' />
									<Input
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										placeholder='Search'
										className='pl-10 border-none bg-surface-input shadow-[inset_0_-1px_1px_0_rgba(255,255,255,0.2),_inset_0_1px_1px_0_rgba(0,0,0,0.36)] text-body placeholder:text-body-subtle focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-line'
									/>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<Tabs
								value={currentTab}
								onValueChange={(val: string) => {
									setCurrentTab(val)
									setSearchParams(val === DEFAULT_TAB ? {} : {tab: val})
								}}
							>
								{/* TabsList */}
								<div
									className={clsx(
										'relative w-full after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-white/20',
										// hide the tabs list when searching without removing it from the DOM (prevents layout shift)
										isSearching && 'opacity-0 pointer-events-none select-none',
									)}
								>
									<FadeScrollArea className='w-full'>
										<TabsList className='relative flex bg-transparent rounded-none h-auto p-0 gap-1 z-10 w-max'>
											{/* Render tab triggers dynamically from the tabs configuration */}
											{tabs.map((tab) => (
												<SettingsTabTrigger
													key={tab.value}
													value={tab.value}
													control={form.control}
													names={Object.keys(settingsMetadata).filter(
														(k) => (settingsMetadata as Record<string, Option>)[k].tab === tab.value,
													)}
												>
													{tab.label}
												</SettingsTabTrigger>
											))}
										</TabsList>
									</FadeScrollArea>
								</div>

								{/* TabsContent for each category */}
								{/* The main header height increases below md breakpoint, so we account for that here to keep the main settings card above the Dock */}
								<FadeScrollArea
									// We use a key to reset scroll position when switching tabs or search
									key={isSearching ? 'search' : currentTab}
									className='h-[calc(100dvh-425px)] md:h-[calc(100dvh-390px)] [--fade-top:hsla(0,0%,6%,1)][--fade-bottom:hsla(0,0%,3%,1)]'
									viewportRef={(el) => {
										settingsViewportRef.current = el
									}}
								>
									{isSearching ? (
										matchingFields.length === 0 ? (
											<p className='text-body-muted text-center text-[14px] font-[400]'>No results found for "{query}"</p>
										) : (
											matchingFields.map((name, i) => (
												<div
													key={name}
													// styling to exactly match when rendered inside tabs
													className={i < matchingFields.length - 1 ? 'border-b-[1px] border-line-strong pb-6 mb-6' : ''}
												>
													<FieldRenderer name={name} form={form} />
												</div>
											))
										)
									) : (
										<>
											{/* Render tab content dynamically from the tabs configuration */}
											{tabs.map((tab) => (
												<TabsContent key={tab.value} value={tab.value} className='space-y-6 pt-6'>
													<SettingsTabContent tab={tab.value} form={form} />

													{/* The advanced tab also exposes the raw config file */}
													{tab.value === 'advanced' && (
														<div className='space-y-6 pt-2'>
															<DangerZoneAlert />
															<CustomConfigEditor />
														</div>
													)}
												</TabsContent>
											))}
										</>
									)}
								</FadeScrollArea>
							</Tabs>
						</CardContent>
						<CardFooter className='justify-between sm:justify-end flex gap-2'>
							{/* RESTORE DEFAULTS BUTTON */}
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										type='button'
										// We don't allow restoring defaults if the form is submitting, if the updated settings are pending, or if the restore defaults mutation is pending
										disabled={isSubmitting || updateSettings.isPending || restoreDefaults.isPending}
									>
										Restore Defaults
									</Button>
								</AlertDialogTrigger>

								<AlertDialogContent className='bg-card-gradient backdrop-blur-2xl border-line border-[0.5px] rounded-2xl'>
									<AlertDialogHeader>
										<AlertDialogTitle className='font-bold text-body text-[20px] font-[400] text-left'>
											Restore default settings?
										</AlertDialogTitle>
										<AlertDialogDescription className='text-body-muted text-left text-[13px] space-y-3'>
											<span className='block'>
												This will restore every setting on this page to its default value. You cannot undo this action.
												Any options in pogolo.toml that this page does not manage are left alone.
											</span>
										</AlertDialogDescription>
									</AlertDialogHeader>

									<AlertDialogFooter>
										<AlertDialogCancel className='bg-white/90 hover:bg-white'>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={onRestoreDefaults} className='hover:bg-white/10'>
											Yes
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>

							{/* SAVE BUTTON */}
							<Button
								type='button'
								// We don't allow saving if the form is not dirty (meaning it is unchanged), is invalid, if we're still loading initial settings, if the form is submitting, or if the updated settings are pending
								disabled={!isDirty || !isValid || isLoading || isSubmitting || updateSettings.isPending}
								onClick={() => setIsSaveOpen(true)}
							>
								Save changes
							</Button>
							<SaveSettingsDialog
								open={isSaveOpen}
								onOpenChange={setIsSaveOpen}
								onSave={() => {
									const submit = form.handleSubmit(onUpdateSettings)
									submit()
								}}
							/>
						</CardFooter>
					</Card>
				</Form>
			</FormProvider>
		</SettingsDisabledContext.Provider>
	)
}
