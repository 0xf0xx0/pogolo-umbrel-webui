package main

import (
	_ "embed"
	"encoding/json"
	"html/template"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"sync"
	"time"

	pogoloApi "git.0xf0xx0.eth.limo/0xf0xx0/pogolo/api"
	pogoloConf "git.0xf0xx0.eth.limo/0xf0xx0/pogolo/config"
	"github.com/pelletier/go-toml/v2"
)

const confPath = "./pogolo.toml"

var API_URL = `http://10.42.0.1:5662`

// var API_URL = `http://pogolo_pogolo_1:5662`
var ctxLock sync.RWMutex

// const confPath = "/data/pogolo.toml"

// embedded files
var (
	//go:embed http/root.gotmpl
	rootPage string
	//go:embed http/root.css
	rootStyle []byte
)

type TemplateCtx struct {
	GopherCount int
	Hashrate    string
	BestDiff    string
	Uptime      string

	Sv1Password         string  `toml:"password,omitempty"`
	Tag                 string  `toml:"tag,omitempty"`
	PoolAddress         string  `toml:"pool_address,omitempty"`
	DefaultDifficulty   float64 `toml:"default_difficulty,omitempty"`
	JobInterval         uint64  `toml:"job_interval,omitempty"`
	TargetShareInterval uint64  `toml:"target_share_interval,omitempty"`
	Extranonce2Size     uint16  `toml:"extranonce2_size,omitempty"`
	BIPVersionBits      int32   `toml:"bip_version_bits,omitempty"`
	IgnoreSuggDiff      bool    `toml:"ignore_suggested_difficulty,omitempty"`
	DisableVarDiff      bool    `toml:"disable_vardiff,omitempty"`

	Result   string
	Injected template.HTML
}

func main() {
	/*
	* TODO:
	* - write pogolo config
	* -
	 */
	tmpl, err := template.New("root").Parse(rootPage)
	if err != nil {
		panic(err.Error())
	}

	var wg sync.WaitGroup

	conf := &pogoloConf.Config{}
	pogoloConf.DeepCopyConfig(conf, &pogoloConf.DEFAULT_CONFIG)
	ctx := TemplateCtx{}
	/// simple poll loop to update our view of the config file
	wg.Go(func() {
		for {
			err := pogoloConf.LoadConfig(confPath, conf)
			if err != nil {
				println(err.Error())
				time.Sleep(time.Second * 5)
				continue
			}
			ctxLock.Lock()
			updateContextConfig(&ctx, conf)
			ctxLock.Unlock()
			time.Sleep(time.Minute)
		}
	})

	http.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		ctxLock.RLock()
		defer ctxLock.RUnlock()

		path, _ := url.JoinPath(API_URL, "/api/v1/info")
		res, err := http.Get(path)

		if err == nil {
			b, err := io.ReadAll(res.Body)
			/// TODO: no nesting!
			if err == nil {
				body := &pogoloApi.GetInfoRes{}
				json.Unmarshal(b, body)
				ctx.GopherCount = int(body.TotalWorkers)
				/// TODO: stringify into days and beyond
				ctx.Uptime = time.Duration(body.Uptime * uint64(time.Second)).String()
				ctx.Hashrate = formatHashrate(body.TotalHashrate)
				ctx.BestDiff = formatDifficulty(body.BestDiff)
			} else {
				println(err.Error())
			}
		} else {
			println(err.Error())
		}
		render(tmpl, w, ctx)
	})
	http.HandleFunc("GET /root.css", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/css")
		w.Write(rootStyle)
	})
	/// update handler
	http.HandleFunc("POST /", func(w http.ResponseWriter, r *http.Request) {
		ctxLock.RLock()
		defer ctxLock.RUnlock()
		/// TODO: restart pogolo
		/// inject script to break history and avoid re-post on refresh
		// Source - https://stackoverflow.com/a/47247434
		// Posted by Eugen Konkov, modified by community. See post 'Timeline' for change history
		// Retrieved 2026-08-27, License - CC BY-SA 3.0
		ctx.Injected = `<script>window.onload = function() { history.replaceState("", "", "/"); }</script>`
		ctx.Result = "Config updated!"
		err := r.ParseForm()
		if err != nil {
			println(err.Error())
			/// TODO/FIXME: non-200 makes firefox append response to page, figure out workaround?
			// w.WriteHeader(http.StatusBadRequest)
			ctx.Result = "Failed to parse form."
			render(tmpl, w, ctx)
			return
		}

		conf.Sv1Password = r.Form.Get("sv1Password")
		conf.Tag = r.Form.Get("tag")
		conf.PoolAddress = r.Form.Get("poolAddr")

		defaultDiff, err := strconv.ParseFloat(r.Form.Get("defaultDiff"), 64)
		conf.DefaultDifficulty = float64(defaultDiff)
		jobInterval, err := strconv.Atoi(r.Form.Get("jobInterval"))
		conf.JobInterval = uint64(jobInterval)
		targetInterval, err := strconv.Atoi(r.Form.Get("targetShareInterval"))
		conf.TargetShareInterval = uint64(targetInterval)
		en2size, err := strconv.Atoi(r.Form.Get("en2Size"))
		conf.ExtraNonce2Size = uint16(en2size)
		versionBits, err := strconv.Atoi(r.Form.Get("versionBits"))
		conf.BIPVersionBits = int32(versionBits)
		conf.IgnoreSuggDiff = r.Form.Get("ignoreSuggDiff") == "on"
		conf.DisableVarDiff = r.Form.Get("disableVarDiff") == "on"

		/// TODO: put error messages in page
		b, err := toml.Marshal(conf)
		if err != nil {
			println(err.Error())
			ctx.Result = "Failed to marshal config."
			// w.WriteHeader(http.StatusInternalServerError)
			render(tmpl, w, ctx)
			return
		}

		confFile, err := os.OpenFile(confPath, os.O_RDWR, 0666)
		if err != nil {
			println(err.Error())
			ctx.Result = "Failed to open config."
			// w.WriteHeader(http.StatusInternalServerError)
			render(tmpl, w, ctx)
			return
		}
		_, err = confFile.WriteAt(b, 0)
		if err != nil {
			println(err.Error())
			ctx.Result = "Failed to write config."
			// w.WriteHeader(http.StatusInternalServerError)
			render(tmpl, w, ctx)
		}

		updateContextConfig(&ctx, conf)
		render(tmpl, w, ctx)
	})
	http.ListenAndServe("0.0.0.0:5663", nil)
}

func updateContextConfig(ctx *TemplateCtx, conf *pogoloConf.Config) {
	ctx.Sv1Password = conf.Sv1Password
	ctx.Tag = conf.Tag
	ctx.PoolAddress = conf.PoolAddress
	ctx.DefaultDifficulty = conf.DefaultDifficulty
	ctx.JobInterval = conf.JobInterval
	ctx.TargetShareInterval = conf.TargetShareInterval
	ctx.Extranonce2Size = conf.ExtraNonce2Size
	ctx.BIPVersionBits = conf.BIPVersionBits
	ctx.IgnoreSuggDiff = conf.IgnoreSuggDiff
	ctx.DisableVarDiff = conf.DisableVarDiff
}

func render(tmpl *template.Template, w http.ResponseWriter, ctx TemplateCtx) {
	err := tmpl.Execute(w, ctx)
	if err != nil {
		println(err.Error())
	}
}
