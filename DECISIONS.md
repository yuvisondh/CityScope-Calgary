# My Decisions

A few choices I made and why, in case any of them look unusual.

- **I cached the Calgary data instead of fetching it live.** Calgary's API can be slow and I didn't want my demo breaking because of a third party. The script runs once, the JSON gets committed, the live app reads from disk.

- **The LLM has a fallback.** I tried Hugging Face first and the model was deprecated. So now Groq runs first, regex runs if Groq fails, and a friendly error if both die. The badge always shows which one worked. I'd rather be transparent than pretend.

- **Superlatives ("tallest", "smallest") get their own code path.** I noticed the LLM was extracting nonsense filters for these because it doesn't know my dataset's height distribution. So I detect them in the backend and just sort + take top 5. Marked as "via superlative" in the badge.

- **I built the zoning buckets from the actual data, not a generic template.** My slice of Beltline only has 6 unique zoning codes, all commercial variants plus DC. So the legend has 4 buckets that match what's in the scene, not a 5-bucket template where 3 buckets would render nothing.

- **No tests.** I had 36 hours with more time I'd add pytest for the regex parser and the superlative logic.

- **Designed it before styling it.** I designed DESIGN_SPEC.md (committed in this repo) before I let anyone style anything. Picked Calgary Flames red as the accent because Calgary, picked IBM Plex because it was made for engineering software. Every color in the codebase traces back to that spec.

— Yuvraj