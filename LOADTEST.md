# Load test report

`scripts/loadtest.mjs`, about 200 concurrent requests per step, run against a local production build (`next start`, in-memory store, single Node process).

| Step | Requests | Result | p50 | p95 |
| --- | --- | --- | --- | --- |
| Signup | 200 | 200 × 201 | 403ms | 559ms |
| Match | 200 | 200 × 200 | 426ms | 435ms |
| Match again at once | 200 | 200 × 429 (rate limit, expected) | 343ms | 347ms |
| Match again after 3s | 200 | 200 × 200 | 369ms | 377ms |
| Met list | 200 | 200 × 200 | 357ms | 377ms |
| Found | 200 | 200 × 200 | 254ms | 257ms |
| Stats | 200 | 200 × 200 | 263ms | 264ms |
| Junk input | 20 | 20 × 400 | 33ms | 33ms |

**0 server errors (5xx), 0 network failures.** Latency here is mostly one Node process working through 200 requests at once. On Vercel, requests spread across instances.

With everyone behind one IP (`SAME_IP=1`), 119 of 200 instant signups succeed and 81 get a 429. The client waits and retries these automatically, so attendees see "Finding your person…" rather than an error.

With OpenAI failing (fake key), a match still returns 200 in under 100ms, using a template icebreaker.

## Issues found and fixed
1. **Signup limit too tight for a shared venue IP.** At 40 per 10s per IP, a crowd behind one NAT would see errors. Raised it to 120 per 10s, and the client now retries 429s, timeouts and 5xx up to twice, waiting as long as `retryAfterMs` says.
2. **The stats route was prerendered at build time** (Next 16 with Cache Components), so `/live` would have shown frozen numbers. It now calls `connection()` to run at request time, and the CDN caches it with `s-maxage=5`.
3. **The `/live` page failed to build** because it read request headers outside `<Suspense>`. The QR block now streams inside a Suspense boundary.
4. **HTML in names** (`Ada <b>Fagbemi</b>`) turned into `Ada bFagbemib`. Tags are now stripped before the other cleaning.
5. **Profanity false positives:** substring matching would have blocked real names like *Fagbemi* and *Dickson*. Ambiguous words are now only matched as whole words.
6. **Race on duplicate pairs:** two concurrent match requests could pick the same person. The DB unique constraint catches it, and the route retries with the next-best candidate.

## Not covered locally
Supabase and OpenAI aren't reachable from the build environment, so this run used the in-memory store. After deploying, run `BASE=https://<app>.vercel.app npm run loadtest` to test the real database path. Supabase's free tier handles this request pattern comfortably: each match is 4 small indexed queries and 1 insert.
