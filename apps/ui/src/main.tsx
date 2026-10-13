import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import preloadFonts from './lib/preload-fonts'

import App from './App.tsx'
import './index.css'

import * as goimp from './wasm_exec.js'
import keygenWasmUrl from './keygen.wasm?url'

const initKeygen = async () => {
    console.log(goimp)
    console.log("init keygen")
    const go = new globalThis.Go();
    const responsePromise = fetch(keygenWasmUrl)
    const { instance } = await WebAssembly.instantiateStreaming(responsePromise, go.importObject)
    console.log("keygen start")
    go.run(instance)
}

// Pre-load fonts so the very first paint uses them,
// eliminating the brief “fallback-font → actual-font” re-flow on page load.
preloadFonts()
initKeygen() /// create sv2 keygen func for authority key
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
