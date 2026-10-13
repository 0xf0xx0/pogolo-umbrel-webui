/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

// Set by keygen.wasm (apps/backend/keygen.go) once it loads. Returns a hex-encoded
// stratumv2.Keypair. Undefined if the wasm hasn't loaded or failed to.
declare var Keygen: (() => string) | undefined

// declare module '*.svg?react' {
// 	import {FC, SVGProps} from 'react'
// 	const Component: FC<SVGProps<SVGSVGElement>>
// 	export default Component
// }
