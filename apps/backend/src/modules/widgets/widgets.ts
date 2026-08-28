import {syncStatus} from '../sync/sync.js'
import {summary} from '../stats/stats.js'
import {rpcClient} from '../bitcoind/rpc-client.js'
import prettyBytes from 'pretty-bytes'
import type {SyncStatus} from '#types'

// Helper functions for formatting widget data
function formatBytes(bytes: number): {value: string; unit: string} {
	const [value, unit] = prettyBytes(bytes, {space: true}).split(' ')
	return {value, unit}
}

function formatHashrate(hashesPerSecond: number): {value: string; unit: string} {
	// Keeping this repetative but immediately understandable
	if (hashesPerSecond === 0) return {value: '0', unit: 'H/s'}
	if (hashesPerSecond < 1000) return {value: Math.round(hashesPerSecond).toString(), unit: 'H/s'}
	if (hashesPerSecond < 1e6) return {value: Math.round(hashesPerSecond / 1000).toString(), unit: 'kH/s'}
	if (hashesPerSecond < 1e9) return {value: Math.round(hashesPerSecond / 1e6).toString(), unit: 'MH/s'}
	if (hashesPerSecond < 1e12) return {value: Math.round(hashesPerSecond / 1e9).toString(), unit: 'GH/s'}
	if (hashesPerSecond < 1e15) return {value: Math.round(hashesPerSecond / 1e12).toString(), unit: 'TH/s'}
	if (hashesPerSecond < 1e18) return {value: Math.round(hashesPerSecond / 1e15).toString(), unit: 'PH/s'}
	if (hashesPerSecond < 1e21) return {value: Math.round(hashesPerSecond / 1e18).toString(), unit: 'EH/s'}
	return {value: Math.round(hashesPerSecond / 1e21).toString(), unit: 'ZH/s'}
}

function calcSyncPercent(syncStatus: SyncStatus | undefined): number {
	if (!syncStatus) return 0

	const {blockHeight, validatedHeaderHeight, syncProgress} = syncStatus

	// If no headers yet, we show 0%
	if (validatedHeaderHeight === 0) return 0

	// If we're synced to the tip, we show 100%
	if (blockHeight === validatedHeaderHeight) return 100

	// Otherwise use bitcoind's verificationprogress, rounded to 2 decimals
	// We floor it to ensure we don't show 100% until we're actually at the tip
	return Math.floor(syncProgress * 10000) / 100
}

/// TODO(claude): make stats widget follow this code
	/*
	// Validate environment variable at startup
	if (!process.env.POGOLO_API_URL) {
   throw new Error("POGOLO_API_URL environment variable is not set");
	}

	const POGOLO_API_URL = process.env.POGOLO_API_URL + "/api/v1/info";

	Bun.serve({
   async fetch(request) {
       // Check if the request is for the correct endpoint
       const url = new URL(request.url);
       if (url.pathname !== "/widgets/pool") {
           return Response.json(
               { error: "Invalid endpoint. Please use /widgets/pool" },
               { status: 404 },
           );
       }

       const locale =
           request.headers.get("Accept-Language")?.split(",")[0].trim() ||
           "en";
       const heightfmt = new Intl.NumberFormat(locale);

       const fmt = new Intl.NumberFormat(locale, {
           maximumSignificantDigits: 3,
       });
       try {
           // Get current pool stats from /api/v1/info
           const response = await fetch(POGOLO_API_URL);
           const { totalHashrate, totalGophers, bestDifficulty, blockHeight } =
               await response.json();

           // Format hashrate
           let formattedHashrate = "";
           let unit = "";
           if (totalHashrate > 1e9) {
               formattedHashrate = `${fmt.format(totalHashrate / 1e9)}`;
               unit = "Ph/s";
           } else if (totalHashrate > 1e6) {
               formattedHashrate = `${fmt.format(totalHashrate / 1e6)}`;
               unit = "Th/s";
           } else if (totalHashrate > 1000) {
               formattedHashrate = `${fmt.format(totalHashrate / 1000)}`;
               unit = "Gh/s";
           } else {
               formattedHashrate = `${fmt.format(totalHashrate)}`;
               unit = "Mh/s";
           }

           // format best diff
           let formattedBestDiff = "";
           let diffUnit = "";
           if (bestDifficulty >= 1e15) {
               diffUnit = "Peta";
           }  else if (bestDifficulty >= 1e12) {
               formattedBestDiff = `${fmt.format(bestDifficulty / 1e12)}`;
               diffUnit = "Tera";
           } else if (bestDifficulty >= 1e9) {
               formattedBestDiff = `${fmt.format(bestDifficulty / 1e9)}`;
               diffUnit = "Giga";
           } else if (bestDifficulty >= 1e6) {
               formattedBestDiff = `${fmt.format(bestDifficulty / 1e6)}`;
               diffUnit = "Mega";
           } else if (bestDifficulty >= 1000) {
               formattedBestDiff = `${fmt.format(bestDifficulty / 1000)}`;
               diffUnit = "Kilo";
           } else {
               formattedBestDiff = `${fmt.format(bestDifficulty)}`;
           }

           // Return widget data
           // umbrelOS expects strings for all fields of four-stats
           return Response.json({
               type: "four-stats",
               refresh: "5s",
               items: [
                   {
                       title: "Hashrate",
                       text: formattedHashrate,
                       subtext: unit,
                   },
                   { title: "Gophers", text: fmt.format(totalGophers) },
                   {
                       title: "Height",
                       text: heightfmt.format(blockHeight),
                   },
                   {
                       title: "Best Share",
                       text: formattedBestDiff,
                       subtext: diffUnit,
                   },
               ],
           });
       } catch (error) {
           // Log the full error details for server-side debugging
           console.error("Error handling request:", error);

           // Return a formatted response with placeholders, otherwise the widget will show without any titles
           return Response.json({
               type: "four-stats",
               refresh: "5s",
               items: [
                   { title: "Hashrate", text: "?" },
                   { title: "Gophers", text: "?" },
                   { title: "Height", text: "?" },
                   { title: "Best Share", text: "?" },
               ],
           });
       }
   },
	});
	*/

export async function stats() {
	const [statsData, miningInfo] = await Promise.all([summary(), rpcClient.command<{networkhashps: number}>('getmininginfo')])

	const mempoolFormatted = formatBytes(statsData.mempoolBytes)
	const chainFormatted = formatBytes(statsData.chainBytes)
	const hashrateFormatted = formatHashrate(miningInfo.networkhashps)

	const data = {
		type: 'four-stats',
		refresh: '5s',
		link: '',
		items: [
			{title: 'Connections', text: statsData.peers.toString(), subtext: 'peers'},
			{title: 'Mempool', text: mempoolFormatted.value, subtext: mempoolFormatted.unit},
			{title: 'Hashrate', text: hashrateFormatted.value, subtext: hashrateFormatted.unit},
			{title: 'Blockchain size', text: chainFormatted.value, subtext: chainFormatted.unit},
		],
	}

	return data
}
