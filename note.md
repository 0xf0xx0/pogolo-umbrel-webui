# goal

strip this bitcoind webui down into one for pogolo
- remove multi-version support
- strip blockchain data
- use pogolo api
- replace insights page with a live client list
- remove globe from index page
- replace globe div with pogolo log stream
    - convert ansi codes to html
- replace latest blocks stream with pogolo found blocks
- use pogolo config in settings page, single tab or second tab for webui config
    - config updates MUST preserve unchanged/unknown fields

# do not
- touch the styling

comments intended for you start with `TODO(claude):`

# pogolo 

openapi at ./pogolo-openapi.yaml

config structure
type Pogolo struct {
	Sv1Password         string  `toml:"password" comment:"optional, required from sv1 clients if set"`
	Tag                 string  `toml:"tag" comment:"will be replaced by default tag if too long (about 86 chars)\ncustomize it! add your swarm stats, like\n'/pogolo on Umbrel - gamma x1 - decentralize or die/'"`
	PoolAddress         string  `toml:"pool_address" comment:"default on-chain address to mine to if not provided by client"`
	DefaultDifficulty   float64 `toml:"default_difficulty" comment:"minimum 0.16"`
	JobInterval         uint64  `toml:"job_interval" comment:"how often to send new work to clients, in seconds"`
	TargetShareInterval uint64  `toml:"target_share_interval" comment:"how often we want shares on average, in seconds"`

	ExtraNonce2Size uint16 `toml:"extranonce2_size" comment:"extranonce2 size in bytes, usually shouldnt be touched"`
	BIPVersionBits  int32  `toml:"bip_version_bits" comment:"version bits as int32, ORed with the template version"`
	IgnoreSuggDiff  bool   `toml:"ignore_suggested_difficulty" comment:"ignore the client-suggested difficulty"`
	DisableVarDiff  bool   `toml:"disable_vardiff" comment:"disable automatic difficulty adjustment"`
}
