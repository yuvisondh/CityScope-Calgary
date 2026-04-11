# backend/llm.py
import json
import re
import logging
import requests
from config import LLM_PROVIDER, HF_API_TOKEN, HF_MODEL, GROQ_API_KEY, GROQ_MODEL

logger = logging.getLogger(__name__)

HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

SYSTEM_PROMPT = """You are a building data filter assistant. Given a natural language query about city buildings, extract structured filters as JSON.

AVAILABLE ATTRIBUTES (use these exact names):
- height_m: Building height in meters (float). Note: 1 foot = 0.3048 meters.
- assessed_value: Property value in CAD dollars (integer).
- zoning: Zoning code string (e.g., "CC-X", "CC-MH", "DC", "C-COR1")
- land_use: One of "COMMERCIAL", "RESIDENTIAL", "MIXED USE"
- num_floors: Number of floors (integer)
- address: Street address (string)

VALID OPERATORS: ">", "<", ">=", "<=", "==", "!="

RULES:
- Convert feet to meters by multiplying by 0.3048
- Convert "million" to numeric (e.g., "$2 million" -> 2000000)
- For zoning codes, use exact uppercase match with "==" operator
- For land_use, map: "commercial" -> "COMMERCIAL", "residential" -> "RESIDENTIAL"
- Multiple conditions = multiple filter objects in the array
- Return ONLY the JSON object, no explanation text"""

FEW_SHOT_EXAMPLES = [
    ('highlight buildings over 100 feet',
     '{"filters": [{"attribute": "height_m", "operator": ">", "value": 30.48}]}'),
    ('show commercial buildings',
     '{"filters": [{"attribute": "land_use", "operator": "==", "value": "COMMERCIAL"}]}'),
    ('show buildings in CC-X zoning',
     '{"filters": [{"attribute": "zoning", "operator": "==", "value": "CC-X"}]}'),
    ('buildings less than $500,000',
     '{"filters": [{"attribute": "assessed_value", "operator": "<", "value": 500000}]}'),
    ('tall residential buildings over 50 meters',
     '{"filters": [{"attribute": "height_m", "operator": ">", "value": 50}, {"attribute": "land_use", "operator": "==", "value": "RESIDENTIAL"}]}'),
]


def _build_prompt_body(user_query):
    examples_text = "\n".join(
        f'Query: "{q}"\n{a}' for q, a in FEW_SHOT_EXAMPLES
    )
    return (
        f"{SYSTEM_PROMPT}\n\nEXAMPLES:\n{examples_text}\n\n"
        f"Now extract the filter for this query: {user_query}"
    )


# ─── Superlative preprocessor ─────────────────────────────────────────────────
# LLMs cannot rank — "tallest" becomes "height > 0" (everything matches) and
# "shortest" returns nothing. We intercept these queries before the LLM call,
# return a synthetic top_n filter, and let apply_filters do the actual ranking
# against the live dataset.

_TOP_N = 5  # how many buildings to return for superlative queries

_SUPERLATIVE_PATTERNS = [
    # Tallest / highest / biggest / largest → height descending
    (re.compile(r'\b(tallest|highest|biggest|largest)\b', re.IGNORECASE),
     "height_m", "desc"),
    # Shortest / smallest / lowest → height ascending
    (re.compile(r'\b(shortest|smallest|lowest)\b', re.IGNORECASE),
     "height_m", "asc"),
    # Most expensive / priciest / highest value → assessed_value descending
    (re.compile(r'\b(most\s+expensive|priciest|highest[- ]value)\b', re.IGNORECASE),
     "assessed_value", "desc"),
    # Cheapest / least expensive / lowest value → assessed_value ascending
    (re.compile(r'\b(cheapest|least\s+expensive|lowest[- ]value)\b', re.IGNORECASE),
     "assessed_value", "asc"),
]


def _detect_superlative(query):
    """
    Return a top_n filter dict if the query contains a superlative keyword,
    otherwise return None.

    This runs before the LLM so that ranking queries never reach the model.
    LLMs trained on filter-extraction tasks interpret "tallest" as an open-ended
    comparison (height > 0) and "shortest" often as nothing — both wrong.
    The top_n operator is not part of the normal filter grammar; apply_filters
    handles it as a sort-and-slice operation rather than a per-building predicate.

    @param query: raw user query string
    @returns: dict with operator="top_n" or None
    """
    for pattern, attribute, direction in _SUPERLATIVE_PATTERNS:
        if pattern.search(query):
            return {
                "attribute": attribute,
                "operator": "top_n",
                "value": _TOP_N,
                "direction": direction,
            }
    return None


def query_llm(user_query):
    """
    Try LLM (provider from LLM_PROVIDER env), then regex fallback.
    Superlative queries are intercepted before the LLM — see _detect_superlative.
    Returns: (filters_list, method_used, raw_response_or_None)
    """
    # Superlative intercept — must run first; LLM cannot rank buildings
    superlative = _detect_superlative(user_query)
    if superlative is not None:
        logger.info("Superlative detected in query — bypassing LLM")
        return [superlative], "superlative", None

    if LLM_PROVIDER == "groq":
        filters, raw = _call_groq(user_query)
    else:
        filters, raw = _call_huggingface(user_query)

    if filters is not None:
        return filters, "llm", raw

    logger.info("LLM (%s) failed — trying regex fallback", LLM_PROVIDER)

    filters = _regex_parse(user_query)
    if filters is not None:
        return filters, "fallback", None

    return None, "none", None


def _call_groq(user_query):
    if not GROQ_API_KEY:
        logger.warning("No GROQ_API_KEY set")
        return None, None
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)
        # _build_prompt_body includes SYSTEM_PROMPT + few-shot examples so the
        # output format matches what _extract_json_filters expects — same as HF.
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "user", "content": _build_prompt_body(user_query)},
            ],
            temperature=0.1,
            max_tokens=200,
        )
        raw_text = response.choices[0].message.content
        return _extract_json_filters(raw_text), raw_text
    except Exception as e:
        logger.warning("Groq error: %s", e)
        return None, None


def _call_huggingface(user_query):
    if not HF_API_TOKEN:
        logger.warning("No HF_API_TOKEN set")
        return None, None
    prompt = f"<s>[INST] {_build_prompt_body(user_query)} [/INST]"
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 200, "temperature": 0.1, "return_full_text": False},
    }
    try:
        resp = requests.post(HF_API_URL, headers=headers, json=payload, timeout=15)
        if resp.status_code == 503:
            logger.warning("HF model loading (503)")
            return None, None
        resp.raise_for_status()
        result = resp.json()
        if isinstance(result, list) and result:
            raw_text = result[0].get("generated_text", "")
        elif isinstance(result, dict):
            raw_text = result.get("generated_text", "")
        else:
            return None, None
        return _extract_json_filters(raw_text), raw_text
    except requests.exceptions.Timeout:
        logger.warning("HF API timeout")
        return None, None
    except requests.exceptions.RequestException as e:
        logger.warning("HF API error: %s", e)
        return None, None


def _extract_json_filters(text):
    """Pull the filters JSON object out of LLM response text."""
    match = re.search(r'\{[^{}]*"filters"\s*:\s*\[.*?\]\s*\}', text, re.DOTALL)
    if not match:
        return None
    try:
        parsed = json.loads(match.group())
        filters = parsed.get("filters", [])
        valid_attrs = {"height_m", "assessed_value", "zoning", "land_use", "num_floors", "address"}
        valid_ops = {">", "<", ">=", "<=", "==", "!="}
        valid = [
            f for f in filters
            if isinstance(f, dict)
            and f.get("attribute") in valid_attrs
            and f.get("operator") in valid_ops
            and "value" in f
        ]
        return valid if valid else None
    except (json.JSONDecodeError, KeyError):
        return None


def _regex_parse(query):
    """Regex fallback — handles the most common natural language patterns."""
    q = query.lower().strip()
    filters = []

    # Height over
    m = re.search(
        r'(?:over|above|greater than|more than|taller than|exceeding)\s+(\d+(?:\.\d+)?)\s*(feet|ft|foot|meters?|m)?\b',
        q,
    )
    if m:
        val = float(m.group(1))
        if m.group(2) and re.match(r'feet|ft|foot', m.group(2)):
            val *= 0.3048
        elif val > 100:
            val *= 0.3048  # large number without unit → likely feet
        filters.append({"attribute": "height_m", "operator": ">", "value": round(val, 2)})

    # Height under
    m = re.search(
        r'(?:under|below|less than|shorter than)\s+(\d+(?:\.\d+)?)\s*(feet|ft|foot|meters?|m)?\b',
        q,
    )
    if m and not any(f["attribute"] == "height_m" for f in filters):
        val = float(m.group(1))
        if m.group(2) and re.match(r'feet|ft|foot', m.group(2)):
            val *= 0.3048
        elif val > 100:
            val *= 0.3048
        filters.append({"attribute": "height_m", "operator": "<", "value": round(val, 2)})

    # Value over
    m = re.search(
        r'(?:over|above|more than|greater than|worth more than|exceeding)\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(million|mil\b)?',
        q,
    )
    if m:
        val = float(m.group(1).replace(",", ""))
        if m.group(2):
            val *= 1_000_000
        if val >= 1000:
            filters.append({"attribute": "assessed_value", "operator": ">", "value": int(val)})

    # Value under
    m = re.search(
        r'(?:under|below|less than|worth less than)\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(million|mil\b)?',
        q,
    )
    if m and not any(f["attribute"] == "assessed_value" for f in filters):
        val = float(m.group(1).replace(",", ""))
        if m.group(2):
            val *= 1_000_000
        if val >= 1000:
            filters.append({"attribute": "assessed_value", "operator": "<", "value": int(val)})

    # Zoning codes (Calgary-specific)
    m = re.search(
        r'\b(CC-MHX|CC-MH|CC-COR|CC-X|C-COR1|C-COR2|DC|CR-20|CR20|M-H1|M-C1|RC-G)\b',
        query, re.IGNORECASE,
    )
    if m:
        filters.append({"attribute": "zoning", "operator": "==", "value": m.group(1).upper()})

    # Land use
    m = re.search(r'\b(commercial|residential|mixed[\s-]?use)\b', q)
    if m:
        val = m.group(1).upper().replace("-", " ").replace("  ", " ")
        filters.append({"attribute": "land_use", "operator": "==", "value": val})

    # Floor count over
    m = re.search(r'(?:over|more than|above|greater than)\s+(\d+)\s*(?:floors?|stories?|storeys?|levels?)', q)
    if m:
        filters.append({"attribute": "num_floors", "operator": ">", "value": int(m.group(1))})

    return filters if filters else None


def apply_filters(buildings, filters):
    """
    Apply filter list to buildings list. Returns list of matched building IDs.

    Handles two filter classes:
    - Standard comparison filters (operators: >, <, >=, <=, ==, !=) — evaluated
      per-building as boolean predicates.
    - top_n filters (operator: "top_n") — sort the candidate pool by attribute
      and return the top N IDs. Comparison filters narrow the pool first so
      top_n can be combined with other criteria (e.g. "tallest commercial building").
      Only the first top_n filter is applied if multiple are present.
    """
    if not filters:
        return [b["id"] for b in buildings]

    top_n_filters = [f for f in filters if f.get("operator") == "top_n"]
    cmp_filters   = [f for f in filters if f.get("operator") != "top_n"]

    # Step 1: narrow pool with comparison filters
    if cmp_filters:
        pool = [b for b in buildings if all(_check_filter(b, f) for f in cmp_filters)]
    else:
        pool = buildings

    # Step 2: if a top_n filter exists, sort pool and slice
    if top_n_filters:
        f         = top_n_filters[0]
        attr      = f["attribute"]
        n         = f["value"]
        direction = f.get("direction", "desc")
        reverse   = direction == "desc"
        ranked = sorted(
            [b for b in pool if b.get(attr) is not None],
            key=lambda b: b[attr],
            reverse=reverse,
        )
        return [b["id"] for b in ranked[:n]]

    return [b["id"] for b in pool]


def _check_filter(building, filt):
    attr = filt["attribute"]
    op = filt["operator"]
    target = filt["value"]
    actual = building.get(attr)
    if actual is None:
        return False
    if isinstance(target, str):
        return _cmp(str(actual).upper().strip(), op, target.upper().strip())
    try:
        return _cmp(float(actual), op, float(target))
    except (ValueError, TypeError):
        return False


def _cmp(a, op, b):
    return {
        ">": a > b, "<": a < b,
        ">=": a >= b, "<=": a <= b,
        "==": a == b, "!=": a != b,
    }.get(op, False)
