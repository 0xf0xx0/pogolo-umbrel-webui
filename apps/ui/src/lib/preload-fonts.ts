// Pre-load fonts so the very first paint uses them,
// eliminating the brief fallback-font → actual-font re-flow on page load.

import fira from '@fontsource-variable/fira-code/files/fira-code-latin-wght-normal.woff2?url'
import iosevka from '@fontsource/iosevka/files/iosevka-latin-400-normal.woff2?url'

function preload(href: string) {
	const link = Object.assign(document.createElement('link'), {
		rel: 'preload',
		href,
		as: 'font',
		type: 'font/woff2',
		crossOrigin: 'anonymous',
	})
	document.head.appendChild(link)
}

export default function preloadFonts() {
	;[fira, iosevka].forEach(preload)
}
