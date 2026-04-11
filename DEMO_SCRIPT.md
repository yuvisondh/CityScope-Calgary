# Loom Demo Script (~2-3 minutes)

## 1. Open with the live site (15s)
- Show the 3D view with all buildings loaded
- "This is a 3D dashboard of Calgary's Beltline district, rendered with Three.js using real city data"

## 2. Building interaction (20s)
- Click 2-3 different buildings (pick varied heights)
- Show popup: address, height, zoning, assessed value
- "Every building has real data from Calgary's Open Data API — footprints joined with property assessments"

## 3. LLM Query — Height (30s)
- Type: "show buildings over 100 feet"
- Point out orange highlights + result badge showing match count
- "The query goes to a Mistral LLM via Hugging Face, which extracts structured filters from natural language"
- Point to the method badge: "You can see it used AI — if the LLM is down, a regex parser takes over seamlessly"

## 4. LLM Query — Zoning (20s)
- Clear, then type: "show buildings in CC-X zoning"
- "This works for any attribute — zoning codes, land use types, property values, floor counts"

## 5. LLM Query — Value (20s)
- Clear, then type: "buildings worth less than $500,000"
- Show the filtered results

## 6. Save & Load Project (30s)
- Enter a username
- Run a query (e.g., "tall commercial buildings")
- Save as "High Value Towers"
- Clear the query — highlights disappear
- Click the saved project — filters re-apply, buildings highlight again
- "Projects persist in SQLite — each user can save and reload their map analyses"

## 7. Design decisions to call out (20s)
- "Data ingestion is decoupled from runtime — a script pre-fetches and caches Calgary data, so the demo never depends on a third-party API being up"
- "The LLM has a three-tier fallback: AI → regex pattern matching → friendly error message"
- "Height is calculated from floor count times 3.5 meters, since the open data doesn't include direct height measurements"

## 8. Close (10s)
- "Built with Flask, React, Three.js, and Hugging Face. Full source, UML diagrams, and setup instructions are in the repo."
