import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
	plugins: [svgr(), react(), tailwindcss()],
	server: {
		proxy: {
			// Match the backend's default listener; Docker overrides this with VITE_API_BASE.
			'/api': {
				target: process.env['VITE_API_BASE'] || 'http://localhost:5663',
				changeOrigin: true,
				ws: true,
			},
		},
	},
	// Shadcn requirement
	// https://ui.shadcn.com/docs/installation/vite
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src'),
			'#settings': path.resolve(import.meta.dirname, '../../libs/settings/index.ts'),
			'#types': path.resolve(import.meta.dirname, '../../libs/shared-types/index.d.ts'),
		},
	},
})
