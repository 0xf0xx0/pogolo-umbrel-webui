package main

import (
	"encoding/hex"
	"fmt"
	"syscall/js"

	"git.0xf0xx0.eth.limo/0xf0xx0/stratumv2"
)

func main() {
	js.Global().Set("Keygen", js.FuncOf(func(this js.Value, args []js.Value) any {
		b, _ := stratumv2.NewKeypair().Encode()
		return hex.EncodeToString(b)
	}))
	fmt.Println("test log from wasm go")
	select {}
}
