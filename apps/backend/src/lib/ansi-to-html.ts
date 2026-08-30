// Converts ANSI SGR escape sequences into HTML spans.
//
// Log text is untrusted, so everything is HTML-escaped first and the only markup
// we emit is our own <span class="..."> wrappers. Colors are expressed as class
// names rather than inline styles so the UI keeps control of the palette.

const ANSI_PATTERN = /\x1b\[([0-9;]*)m/g

const FG_CLASSES: Record<number, string> = {
	30: 'ansi-black',
	31: 'ansi-red',
	32: 'ansi-green',
	33: 'ansi-yellow',
	34: 'ansi-blue',
	35: 'ansi-magenta',
	36: 'ansi-cyan',
	37: 'ansi-white',
	90: 'ansi-bright-black',
	91: 'ansi-bright-red',
	92: 'ansi-bright-green',
	93: 'ansi-bright-yellow',
	94: 'ansi-bright-blue',
	95: 'ansi-bright-magenta',
	96: 'ansi-bright-cyan',
	97: 'ansi-bright-white',
}

const BG_CLASSES: Record<number, string> = {
	40: 'ansi-bg-black',
	41: 'ansi-bg-red',
	42: 'ansi-bg-green',
	43: 'ansi-bg-yellow',
	44: 'ansi-bg-blue',
	45: 'ansi-bg-magenta',
	46: 'ansi-bg-cyan',
	47: 'ansi-bg-white',
	100: 'ansi-bg-bright-black',
	101: 'ansi-bg-bright-red',
	102: 'ansi-bg-bright-green',
	103: 'ansi-bg-bright-yellow',
	104: 'ansi-bg-bright-blue',
	105: 'ansi-bg-bright-magenta',
	106: 'ansi-bg-bright-cyan',
	107: 'ansi-bg-bright-white',
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

type Style = {
	fg?: string
	bg?: string
	bold: boolean
	dim: boolean
	italic: boolean
	underline: boolean
}

// fg/bg are explicitly undefined rather than absent so that Object.assign with
// this object clears a previously-set colour on reset.
function emptyStyle(): Style {
	return {fg: undefined, bg: undefined, bold: false, dim: false, italic: false, underline: false}
}

function classesFor(style: Style): string[] {
	const classes: string[] = []
	if (style.fg) classes.push(style.fg)
	if (style.bg) classes.push(style.bg)
	if (style.bold) classes.push('ansi-bold')
	if (style.dim) classes.push('ansi-dim')
	if (style.italic) classes.push('ansi-italic')
	if (style.underline) classes.push('ansi-underline')
	return classes
}

// Apply one SGR parameter list to the running style.
// Returns the index to continue from, so extended (38/48) sequences can consume
// their arguments.
function applyCode(style: Style, codes: number[], index: number): number {
	const code = codes[index]

	switch (code) {
		case 0:
			Object.assign(style, emptyStyle())
			break
		case 1:
			style.bold = true
			break
		case 2:
			style.dim = true
			break
		case 3:
			style.italic = true
			break
		case 4:
			style.underline = true
			break
		case 22:
			style.bold = false
			style.dim = false
			break
		case 23:
			style.italic = false
			break
		case 24:
			style.underline = false
			break
		case 39:
			style.fg = undefined
			break
		case 49:
			style.bg = undefined
			break
		// 256-color and truecolor: we do not map these to classes, but we must
		// still consume their arguments so they are not treated as separate codes.
		case 38:
		case 48: {
			const mode = codes[index + 1]
			if (mode === 5) return index + 2 // 5;<n>
			if (mode === 2) return index + 4 // 2;<r>;<g>;<b>
			break
		}
		default:
			if (FG_CLASSES[code]) style.fg = FG_CLASSES[code]
			else if (BG_CLASSES[code]) style.bg = BG_CLASSES[code]
			break
	}

	return index
}

export function ansiToHtml(input: string): string {
	const style = emptyStyle()
	let html = ''
	let lastIndex = 0

	const writeText = (text: string) => {
		if (!text) return
		const classes = classesFor(style)
		if (classes.length > 0) {
			html += `<span class="${classes.join(' ')}">${escapeHtml(text)}</span>`
		} else {
			html += escapeHtml(text)
		}
	}

	ANSI_PATTERN.lastIndex = 0
	let match: RegExpExecArray | null

	while ((match = ANSI_PATTERN.exec(input)) !== null) {
		writeText(input.slice(lastIndex, match.index))

		// An empty parameter list (ESC[m) means reset
		const params = match[1] === '' ? [0] : match[1].split(';').map((n) => Number.parseInt(n, 10) || 0)

		for (let i = 0; i < params.length; i++) {
			i = applyCode(style, params, i)
		}

		lastIndex = match.index + match[0].length
	}

	writeText(input.slice(lastIndex))

	// Strip any remaining escape sequences we do not handle (cursor moves, etc)
	return html.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
}
