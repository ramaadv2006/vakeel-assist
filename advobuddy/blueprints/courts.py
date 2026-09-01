"""
Flask blueprint: /api/courts endpoints for district -> court dropdown.

Design:
  - Purely static data (tn_courts_data.py). No live calls to eCourts,
    no session/app_token handling — avoids the captcha/session-bypass
    risk area entirely.
  - GET /api/courts/districts        -> list of TN districts
  - GET /api/courts/types            -> generic court types (used for
                                         every district as a starting
                                         dropdown list)
  - GET /api/courts/complexes/<dist> -> known named complexes for that
                                         district (if any), falls back
                                         to generic court types

Advocate flow in the UI:
  1. Select district (from /districts)
  2. Select court (from /complexes/<district> if populated,
     otherwise show generic /types list, plus an "Other - type manually"
     option so nothing is ever blocked by missing data)
"""

from flask import Blueprint, jsonify, abort
from advobuddy.data.tn_courts_data import TN_DISTRICTS, COURT_TYPES, KNOWN_COURT_COMPLEXES

courts_bp = Blueprint("courts", __name__, url_prefix="/api/courts")


@courts_bp.route("/districts", methods=["GET"])
def get_districts():
    return jsonify({"districts": TN_DISTRICTS})


@courts_bp.route("/types", methods=["GET"])
def get_court_types():
    return jsonify({"court_types": COURT_TYPES})


@courts_bp.route("/complexes/<district>", methods=["GET"])
def get_court_complexes(district):
    # Case-insensitive match against known districts
    match = next((d for d in TN_DISTRICTS if d.lower() == district.lower()), None)
    if not match:
        abort(404, description=f"Unknown district: {district}")

    complexes = KNOWN_COURT_COMPLEXES.get(match, [])
    return jsonify({
        "district": match,
        "known_complexes": complexes,   # explicit named complexes, if any
        "generic_types": COURT_TYPES,   # always show as fallback options
        "allow_manual_entry": True,     # UI should show "Other" input too
    })
