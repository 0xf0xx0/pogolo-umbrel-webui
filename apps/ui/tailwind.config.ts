import type {Config} from 'tailwindcss'

export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		extend: {
			fontFamily: {
                iosevka: ['Iosevka Variable', 'sans-serif'],
				firaCode: ['Fira Code Variable', 'monospace'],
			},
			backgroundImage: {
				'card-gradient': 'linear-gradient(to bottom, oklch(0.18 0.005 60), oklch(0.14 0.004 60))',
				'text-gradient': 'linear-gradient(to bottom, oklch(0.97 0.003 60), oklch(0.97 0.003 60 / 0.64))',
				'button-gradient': 'linear-gradient(to bottom, oklch(0.26 0.006 60), oklch(0.22 0.005 60))',
				'dock-gradient': 'linear-gradient(to bottom, oklch(0.24 0.006 60), oklch(0.17 0.005 60))',
			},
		},
	},
	plugins: [],
} satisfies Config
