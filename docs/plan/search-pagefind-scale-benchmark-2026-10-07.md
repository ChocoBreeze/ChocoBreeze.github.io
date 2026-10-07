# Synthetic Pagefind scale benchmark

- Generated: 2026-10-07 14:42 UTC
- Source corpus: 506 built posts, Node v24.19.0, Windows x64, Intel Core i7-1360P
- Pagefind: 1.5.2; Korean forced as the indexing language.
- Each scale copies the source pages’ HTML into unique routes, retains `.post-body` text and category filters, and appends one unique token per page so Pagefind keeps duplicate documents as separate records.
- Search fields are round-robin duplicates of the current corpus. The unique marker does not match the benchmark queries. These results measure scale cost, not future content quality or language distribution.
- Timings are single local runs without throttling; use them as exploratory comparisons, not p95 or user-facing service measurements.
- The JSON duration is resident in-memory ranking and snippet work. The Pagefind duration includes the Pagefind query plus fetching detail data for its first three results. These timing boundaries differ and are not directly comparable as engine-speed measurements.

## Index and startup cost

| Documents | Existing JSON indexes | Pagefind output | Pagefind initial transfer | Pagefind init | Init + first query |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | 16,327,386 B (15.57 MiB) | 7,715,626 B (7.36 MiB) | 118.56 KiB | 58.7 ms | 146.1 ms |
| 2,000 | 30,236,556 B (28.84 MiB) | 11,892,245 B (11.34 MiB) | 125.06 KiB | 66.4 ms | 167.7 ms |

## Query comparison

| Documents | Query | JSON hits | ETF JSON hits | Pagefind hits | Pagefind ETF hits | JSON in-memory | Pagefind query + top-three details | ETF Pagefind query + details | Pagefind query transfer | ETF transfer |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | ETF | 486 | 270 | 480 | 266 | 131.2 ms | 87.4 ms | 38.6 ms | 59,678 B | 1,997 B |
| 1,000 | 반도체 | 367 | 54 | 355 | 54 | 81.9 ms | 270.6 ms | 47.1 ms | 2,167,787 B | 6,325 B |
| 1,000 | IAU | 12 | 12 | 12 | 12 | 8.7 ms | 47.9 ms | 4.4 ms | 46,235 B | 0 B |
| 1,000 | `git diff --cached` | 4 | 0 | 6 | 0 | 4.0 ms | 79.5 ms | 14.3 ms | 100,866 B | 0 B |
| 1,000 | no match | 0 | 0 | 0 | 0 | 3.1 ms | 5.4 ms | 5.3 ms | 0 B | 0 B |
| 2,000 | ETF | 972 | 540 | 960 | 532 | 258.3 ms | 101.3 ms | 52.1 ms | 48,586 B | 4,075 B |
| 2,000 | 반도체 | 739 | 108 | 715 | 108 | 160.9 ms | 449.1 ms | 31.0 ms | 2,327,214 B | 6,595 B |
| 2,000 | IAU | 24 | 24 | 24 | 24 | 15.1 ms | 64.4 ms | 4.6 ms | 25,748 B | 0 B |
| 2,000 | `git diff --cached` | 8 | 0 | 12 | 0 | 6.0 ms | 58.5 ms | 12.2 ms | 62,042 B | 0 B |
| 2,000 | no match | 0 | 0 | 0 | 0 | 4.3 ms | 3.8 ms | 3.6 ms | 0 B | 0 B |

Pagefind returned slightly fewer Korean/general results than JSON for `ETF` and `반도체`, and more code phrase hits. At 2,000 documents, the recorded `반도체` durations were 449.1 ms for Pagefind and 160.9 ms for JSON in-memory ranking/snippet work; the ETF durations were 101.3 ms and 258.3 ms, respectively. Pagefind’s result fragments also incur query-dependent transfers. The current ranking/snippet behavior and separate code search remain different, so this scale experiment does not justify replacing JSON search.

**Timing boundary:** the JSON values above measure resident in-memory ranking and snippet work. The Pagefind values include the query and fetching detail data for the first three results. They describe different operation boundaries and are not a direct engine-speed comparison.
