# Browser search latency and memory benchmark

- Generated: 2026-10-07T14:53:28.426Z
- Browser: Chromium 151.0.7922.34; win32/x64; 13th Gen Intel(R) Core(TM) i7-1360P (16 logical cores)
- Warm samples: 30 per query; nearest-rank p50/p95; one untimed cache-warmup query; loopback server without network/CPU throttling.
- Cold is the first input from an empty page and includes JSON fetch, parse, ranking, and DOM creation. Warm samples are consecutive query-to-query edits with the selected index kept active. Input-to-DOM ends at the MutationObserver notification for the first non-empty result-list mutation.
- Memory is Chromium CDP JavaScript heap after forced GC; it excludes browser process and native allocations. Resident index is measured with results cleared; broad result memory uses the full `ETF` result list rendered by the current UI.
- Synthetic corpus entries repeat current search records with unique slugs. These are scale experiments, not a prediction of future corpus text or result distribution.

| Documents | JSON | Cold ETF | ETF results | ETF warm p50/p95 | 반도체 results | 반도체 warm p50/p95 | Index heap delta | ETF result heap delta | DOM nodes: empty / index / ETF |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 506 | 3,432,231 B | 147.80 ms | 243 | 30.30 / 33.80 ms (30) | 188 | 40.10 / 46.60 ms (30) | 14.16 MiB | 0.17 MiB | 484 / 485 / 3215 |
| 1,000 | 6,833,601 B | 407.80 ms | 486 | 90.90 / 134.70 ms (30) | 367 | 111.40 / 177.20 ms (30) | 27.61 MiB | 0.19 MiB | 484 / 485 / 5944 |
| 2,000 | 13,680,685 B | 752.20 ms | 972 | 195.60 / 298.40 ms (30) | 739 | 218.70 / 386.10 ms (30) | 54.69 MiB | 0.24 MiB | 484 / 485 / 11402 |

## Memory samples

| Documents | Baseline heap | Index resident heap | ETF results heap |
| ---: | ---: | ---: | ---: |
| 506 | 1.31 MiB | 15.47 MiB | 15.64 MiB |
| 1,000 | 1.31 MiB | 28.93 MiB | 29.12 MiB |
| 2,000 | 1.31 MiB | 56.00 MiB | 56.24 MiB |
