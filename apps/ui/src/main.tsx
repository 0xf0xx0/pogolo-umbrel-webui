import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import preloadFonts from './lib/preload-fonts'

import App from './App.tsx'
import './index.css'

import * as goimp from './wasm_exec.js'
import keygenWasmUrl from './keygen.wasm?url'
/// create sv2 keygen func for authority key
const initKeygen = async () => {
    /// force import
    goimp == goimp
    const go = new globalThis.Go();
    const responsePromise = fetch(keygenWasmUrl)
    const { instance } = await WebAssembly.instantiateStreaming(responsePromise, go.importObject)
    go.run(instance)
}

// Pre-load fonts so the very first paint uses them,
// eliminating the brief “fallback-font → actual-font” re-flow on page load.
preloadFonts()
initKeygen()
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
