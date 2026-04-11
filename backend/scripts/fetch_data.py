#!/usr/bin/env python3
"""
One-time data ingestion script.

Fetches Calgary Open Data:
  - Building Footprints (cchr-krqg): real polygon geometry + rooftop elevation for height
  - Property Assessments (4bsw-nn7w): address, assessed value, zoning, land use

Join strategy: centroid-proximity match between footprint centroids and
assessment parcel centroids. Each footprint is matched to the nearest
assessment within MAX_JOIN_DIST_DEG degrees (~70m at Calgary's latitude).

Unmatched footprints get synthetic address/zoning/value based on Beltline
neighborhood statistics. This is documented in the README as a known
data limitation.

Usage: python scripts/fetch_data.py
"""
import json
import hashlib
import math
import os
import re
import sys
import requests

# Dataset IDs (verified 2026-04-11)
FOOTPRINTS_URL = "https://data.calgary.ca/resource/cchr-krqg.geojson"
ASSESSMENTS_URL = "https://data.calgary.ca/resource/4bsw-nn7w.json"

# 17 Ave SW corridor — ~3-4 blocks, targets 40-80 buildings
BOUNDS = {
    "ne_lat": 51.045,
    "sw_lng": -114.075,
    "sw_lat": 51.040,
    "ne_lng": -114.062,
}

# Max centroid distance for join (~70m at Calgary's latitude)
MAX_JOIN_DIST_DEG = 0.0007

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "buildings.json")

# Fallback zoning pool for Beltline unmatched buildings
BELTLINE_ZONINGS = ["CC-X", "CC-MH", "CC-MHX", "CC-COR", "C-COR1", "DC"]
BELTLINE_LAND_USE = ["COMMERCIAL", "RESIDENTIAL", "MIXED USE"]


# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------

def fetch_footprints():
    """Fetch CONSTRUCTED building footprints within the bounding box."""
    print("Fetching building footprints (cchr-krqg)...")
    params = {
        "$limit": 300,
        "$where": (
            f"within_box(polygon, {BOUNDS['ne_lat']}, {BOUNDS['sw_lng']}, "
            f"{BOUNDS['sw_lat']}, {BOUNDS['ne_lng']}) AND stage='CONSTRUCTED'"
        ),
    }
    resp = requests.get(FOOTPRINTS_URL, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    features = data.get("features", [])
    print(f"  Got {len(features)} footprints")
    return features


def fetch_assessments():
    """Fetch assessment parcels within the bounding box."""
    print("Fetching property assessments (4bsw-nn7w)...")
    params = {
        "$limit": 1000,
        "$where": (
            f"within_box(multipolygon, {BOUNDS['ne_lat']}, {BOUNDS['sw_lng']}, "
            f"{BOUNDS['sw_lat']}, {BOUNDS['ne_lng']})"
        ),
        "$select": "address,assessed_value,land_use_designation,assessment_class_description,multipolygon,comm_name",
    }
    resp = requests.get(ASSESSMENTS_URL, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if isinstance(data, dict) and data.get("error"):
        print(f"  Assessment API error: {data}")
        return []
    print(f"  Got {len(data)} assessment records")
    return data


# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------

def extract_ring(geometry):
    """Return the outer ring coordinate list from GeoJSON geometry."""
    if not geometry:
        return []
    gtype = geometry.get("type", "")
    coords = geometry.get("coordinates", [])
    if gtype == "Polygon":
        return coords[0] if coords else []
    if gtype == "MultiPolygon":
        if not coords:
            return []
        # Take the polygon with the most vertices
        largest = max(coords, key=lambda p: len(p[0]) if p else 0)
        return largest[0] if largest else []
    return []


def centroid(ring):
    """Compute (lat, lng) centroid of a coordinate ring [[lng, lat], ...]."""
    if not ring:
        return (0.0, 0.0)
    lngs = [c[0] for c in ring]
    lats = [c[1] for c in ring]
    return (sum(lats) / len(lats), sum(lngs) / len(lngs))


def dist(a, b):
    """Euclidean distance between (lat, lng) pairs (degrees)."""
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


# ---------------------------------------------------------------------------
# Assessment deduplication
# ---------------------------------------------------------------------------

def strip_unit(address):
    """
    Strip unit prefix from Calgary condo addresses like '711 303 13 AV SW'
    to get the building address '303 13 AV SW'.
    """
    if not address:
        return ""
    address = address.strip().upper()
    # Pattern: two consecutive number groups at start → first is unit number
    m = re.match(r"^\d+\s+(\d+\s+.+)$", address)
    if m:
        return m.group(1).strip()
    return address


def build_assessment_index(assessments):
    """
    Deduplicate assessments by building address. Where multiple unit records
    share a building, sum assessed values and pick first zoning/class.

    Returns list of dicts with centroid, address, sum_value, zoning, land_use.
    """
    buildings = {}
    for a in assessments:
        raw_addr = a.get("address", "")
        bldg_addr = strip_unit(raw_addr)
        if not bldg_addr:
            continue

        poly_geom = a.get("multipolygon")
        ring = extract_ring(poly_geom) if poly_geom else []
        ctr = centroid(ring) if ring else None

        if bldg_addr not in buildings:
            buildings[bldg_addr] = {
                "address": bldg_addr,
                "assessed_value": 0,
                "zoning": a.get("land_use_designation", "UNKNOWN").upper(),
                "land_use": map_land_use(a.get("assessment_class_description", "")),
                "centroid": ctr,
                "unit_count": 0,
            }
        entry = buildings[bldg_addr]
        entry["unit_count"] += 1
        try:
            entry["assessed_value"] += float(a.get("assessed_value") or 0)
        except (ValueError, TypeError):
            pass
        if ctr and not entry["centroid"]:
            entry["centroid"] = ctr

    # Filter out entries without spatial info
    result = [v for v in buildings.values() if v["centroid"]]
    print(f"  Deduplicated to {len(result)} unique buildings")
    return result


def map_land_use(raw):
    """Map assessment class description to standard land use label."""
    raw = (raw or "").upper()
    if "NON-RESID" in raw or "NON RESID" in raw:
        return "COMMERCIAL"
    if "RESID" in raw:
        return "RESIDENTIAL"
    return "MIXED USE"


# ---------------------------------------------------------------------------
# Join & build final dataset
# ---------------------------------------------------------------------------

def join_and_build(footprints, assessment_index):
    """
    For each building footprint, find the nearest assessment record.
    Populate building dict with real or synthetic attribute data.
    """
    import random
    random.seed(42)

    matched = 0
    unmatched = 0
    buildings = []

    for i, feat in enumerate(footprints):
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})

        ring = extract_ring(geom)
        if not ring:
            continue

        fp_centroid = centroid(ring)

        # Height from elevation data (the real data win)
        try:
            roof_z = float(props.get("rooftop_elev_z") or 0)
            grd_z = float(props.get("grd_elev_min_z") or 0)
            height_m = max(round(roof_z - grd_z, 1), 3.0)  # min 3m
        except (ValueError, TypeError):
            height_m = 10.5  # fallback ~3 floors
        num_floors = max(1, round(height_m / 3.5))

        # Find nearest assessment within threshold
        best = None
        best_d = float("inf")
        for assess in assessment_index:
            d = dist(fp_centroid, assess["centroid"])
            if d < best_d:
                best_d = d
                best = assess

        if best and best_d <= MAX_JOIN_DIST_DEG:
            address = best["address"]
            assessed_value = int(best["assessed_value"])
            zoning = best["zoning"] or "CC-X"
            land_use = best["land_use"]
            matched += 1
        else:
            # Synthetic fallback: realistic Beltline values
            streets = [
                "17 AV SW", "16 AV SW", "15 AV SW", "14 AV SW",
                "1 ST SW", "2 ST SW", "3 ST SW", "4 ST SW",
            ]
            address = f"{random.randint(100, 999)} {random.choice(streets)}"
            zoning = random.choice(BELTLINE_ZONINGS)
            land_use = random.choice(BELTLINE_LAND_USE)
            assessed_value = int(num_floors * random.randint(60000, 200000))
            unmatched += 1

        struct_key = props.get("struct_id") or str(i)
        bldg_id = f"bldg_{hashlib.md5(struct_key.encode()).hexdigest()[:8]}"

        buildings.append({
            "id": bldg_id,
            "address": address,
            "latitude": round(fp_centroid[0], 6),
            "longitude": round(fp_centroid[1], 6),
            "height_m": height_m,
            "num_floors": num_floors,
            "zoning": zoning,
            "land_use": land_use,
            "assessed_value": assessed_value,
            "footprint": ring,
        })

    print(f"  Joined: {matched} matched, {unmatched} synthetic attributes")
    return buildings


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    footprints = fetch_footprints()
    assessments = fetch_assessments()
    assessment_index = build_assessment_index(assessments)
    buildings = join_and_build(footprints, assessment_index)

    if len(buildings) < 10:
        print(f"\nWARNING: Only {len(buildings)} buildings. Check API responses.")
        sys.exit(1)

    all_lats = [b["latitude"] for b in buildings]
    all_lngs = [b["longitude"] for b in buildings]

    output = {
        "buildings": buildings,
        "metadata": {
            "count": len(buildings),
            "center": [
                round(sum(all_lats) / len(all_lats), 6),
                round(sum(all_lngs) / len(all_lngs), 6),
            ],
            "bounds": {
                "sw": [min(all_lats), min(all_lngs)],
                "ne": [max(all_lats), max(all_lngs)],
            },
            "area": "17 Ave SW corridor, Beltline, Calgary AB",
            "data_sources": [
                "Calgary Open Data – Building Footprints (cchr-krqg): geometry, height from rooftop elevation",
                "Calgary Open Data – Current Year Property Assessments (4bsw-nn7w): address, assessed value, zoning",
            ],
            "height_method": "rooftop_elev_z - grd_elev_min_z (real elevation data from Calgary 3D model)",
            "join_method": "Centroid-proximity match between footprint and assessment parcel centroids (<70m threshold)",
        },
    }

    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_PATH)), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nSaved to {OUTPUT_PATH}")
    print(f"Total buildings: {len(buildings)}")
    h_vals = [b["height_m"] for b in buildings]
    print(f"Height range: {min(h_vals):.1f}m – {max(h_vals):.1f}m")
    print(f"Zoning types: {sorted(set(b['zoning'] for b in buildings))}")
    print(f"Land use types: {sorted(set(b['land_use'] for b in buildings))}")


if __name__ == "__main__":
    main()
