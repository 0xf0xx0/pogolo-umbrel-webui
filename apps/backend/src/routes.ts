import {randomBytes} from 'node:crypto'

import fp from 'fastify-plugin'
import type {FastifyError, FastifyInstance} from 'fastify'
import PQueue from 'p-queue'
import {ZodError} from 'zod'

import * as pogolo from './modules/pogolo/pogolo.js'
import {wsLogStream} from './modules/pogolo/logs.js'
import * as connect from './modules/connect/connect.js'
import * as config from './modules/config/config.js'
import * as widgets from './modules/widgets/widgets.js'

import {type SettingsSchema} from '#settings'

const WS_TOKEN = randomBytes(16).toString('hex')

// Config mutations write a shared file, so run each complete operation sequentially.
const configMutationQueue = new PQueue({concurrency: 1})

// We attach a global error handler for all routes (see bottom of this file)
export default fp(async (app: FastifyInstance) => {
	const BASE = '/api'

	// pool routes
	const poolBase = `${BASE}/pool`

	app.get(`${poolBase}/status`, pogolo.status)
	app.get(`${poolBase}/info`, pogolo.info)

	app.get<{Params: {idOrNickname: string}}>(`${poolBase}/gopher/:idOrNickname`, (req) =>
		pogolo.gopher(req.params.idOrNickname),
	)

	// connect routes
	const connectBase = `${BASE}/connect`
	app.get(`${connectBase}/details`, connect.getConnectionDetails)

	// config routes
	const configBase = `${BASE}/config`

	app.get(`${configBase}/settings`, config.getSettings)

	app.patch(`${configBase}/settings`, async (req) => {
		// Validation is handled in config.updateSettings(). Zod errors become 400 via the global handler.
		const patch = req.body as Partial<SettingsSchema>
		return configMutationQueue.add(() => config.updateSettings(patch))
	})

	app.post(`${configBase}/restore-defaults`, () => configMutationQueue.add(() => config.restoreDefaults()))

	app.get(`${configBase}/raw`, async () => ({contents: await config.getRawConfig()}))

	app.patch(`${configBase}/raw`, async (req) => {
		const {contents = ''} = req.body as {contents?: string}
		return configMutationQueue.add(async () => ({contents: await config.updateRawConfig(contents)}))
	})

	// umbrelOS widget routes
	const widgetBase = `${BASE}/widget`

	app.get(`${widgetBase}/pool`, widgets.stats)

	// websocket routes
	// Note: Fastify-Websocket plugin must already be registered via app.register(fastifyWs)
	const wsBase = `${BASE}/ws`

	// Return the CSRF token (this will be unreadable cross origin due to CORS)
	app.get(`${wsBase}/token`, (request, reply) => reply.send({token: WS_TOKEN}))

	// Check CSRF token for websocket requests
	app.addHook('preValidation', async (request, reply) => {
		// Skip if not a websocket upgrade
		if (request.headers.upgrade?.toLowerCase() !== 'websocket') return

		// Check token
		if ((request.query as {token?: string})?.token !== WS_TOKEN) return reply.code(401).send('Unauthorized')
	})

	// live pogolo log output
	app.get(`${wsBase}/logs`, {websocket: true}, wsLogStream)

	// Global error handler
	// Catches *all* uncaught errors from any route / hook
	// Normalises the response to `{ error: "...msg..." }`
	// – Zod → 400
	// – everything else → 500 (unless Fastify set its own status)
	app.setErrorHandler((err: FastifyError | ZodError, _req, reply): void => {
		const status =
			err instanceof ZodError
				? 400 // bad request / validation
				: (err.statusCode ?? 500) // Fastify may have set one

		let message: string

		if (err instanceof ZodError) {
			// Surface only the first validation error to keep the response concise for the tooltip
			message = err.issues[0]?.message ?? err.message
		} else {
			message = err.message || 'Internal Server Error'
		}

		reply.status(status).send({error: message})
	})
})
