package keygen

import (
	"encoding/hex"

	"git.0xf0xx0.eth.limo/0xf0xx0/stratumv2"
)

func keygen() string {
	b, _ := stratumv2.NewKeypair().Encode()
	return hex.EncodeToString(b)
}
