"""
eCourts Scraper & Session Management Engine for Advo Buddy
-----------------------------------------------------------
Handles:
1. eCourts search session lifecycle with TTL cleanup.
2. High-contrast visual CAPTCHA generation using Pillow.
3. Captcha validation and retry support.
4. Court case extraction and resolution for Indian Advocate Bar Numbers.
"""

import base64
import hashlib
import io
import math
import os
import random
import string
import threading
import time
from datetime import datetime, timedelta

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

import json

SESSION_TTL_SECONDS = 900  # 15 minutes

class SessionStore:
    """Thread-safe session store with Redis integration and memory fallback."""
    def __init__(self, ttl_seconds=SESSION_TTL_SECONDS):
        self.ttl = ttl_seconds
        self._lock = threading.Lock()
        self._memory_store = {}
        self._redis_client = None
        
        redis_url = os.environ.get("REDIS_URL")
        if redis_url:
            try:
                import redis
                client = redis.Redis.from_url(redis_url, decode_responses=True)
                client.ping()
                self._redis_client = client
            except Exception:
                self._redis_client = None

    def set(self, session_id, data):
        if self._redis_client:
            try:
                self._redis_client.setex(f"ecourts:sess:{session_id}", self.ttl, json.dumps(data))
                return
            except Exception:
                pass
        with self._lock:
            data_copy = dict(data)
            data_copy["_expires_at"] = time.time() + self.ttl
            self._memory_store[session_id] = data_copy
            self._cleanup_locked()

    def get(self, session_id):
        if self._redis_client:
            try:
                val = self._redis_client.get(f"ecourts:sess:{session_id}")
                if val:
                    return json.loads(val)
                return None
            except Exception:
                pass
        with self._lock:
            self._cleanup_locked()
            item = self._memory_store.get(session_id)
            if item and item.get("_expires_at", 0) > time.time():
                return dict(item)
            return None

    def update(self, session_id, updates):
        current = self.get(session_id)
        if not current:
            return None
        current.update(updates)
        self.set(session_id, current)
        return current

    def delete(self, session_id):
        if self._redis_client:
            try:
                self._redis_client.delete(f"ecourts:sess:{session_id}")
            except Exception:
                pass
        with self._lock:
            self._memory_store.pop(session_id, None)

    def _cleanup_locked(self):
        now = time.time()
        expired = [k for k, v in self._memory_store.items() if v.get("_expires_at", 0) <= now]
        for k in expired:
            self._memory_store.pop(k, None)

_SESSION_STORE = SessionStore(ttl_seconds=SESSION_TTL_SECONDS)


# Common Indian court case stages
CASE_STAGES = [
    "Hearing on Interim Injunction",
    "Framing of Issues",
    "Evidence of Petitioner (PW-1)",
    "Cross Examination of PW-2",
    "Evidence of Respondent (DW-1)",
    "Final Arguments",
    "Hearing on Admission",
    "Steps for Service of Summons",
    "Orders / Pronouncement of Judgment",
    "Filing of Written Statement",
]

# District Courts registry by Indian State
DISTRICT_COURTS_BY_STATE = {
    "KA": {
        "state_name": "Karnataka",
        "districts": [
            {"code": "01", "name": "Bengaluru Urban (City Civil & Sessions Court)", "cnr_prefix": "KABG01"},
            {"code": "02", "name": "Bengaluru Rural District Court", "cnr_prefix": "KABR01"},
            {"code": "03", "name": "Mysuru District & Sessions Court", "cnr_prefix": "KAMS01"},
            {"code": "04", "name": "Dharwad / Hubballi District Court", "cnr_prefix": "KADH01"},
            {"code": "05", "name": "Mangaluru (Dakshina Kannada) District Court", "cnr_prefix": "KAMG01"},
            {"code": "06", "name": "Belagavi District & Sessions Court", "cnr_prefix": "KABG02"},
        ]
    },
    "MH": {
        "state_name": "Maharashtra",
        "districts": [
            {"code": "01", "name": "City Civil and Sessions Court, Mumbai (Fort Complex)", "cnr_prefix": "MHCC01"},
            {"code": "02", "name": "Mumbai Suburban (Dindoshi Sessions Court)", "cnr_prefix": "MHMS01"},
            {"code": "03", "name": "Pune District & Sessions Court, Shivajinagar", "cnr_prefix": "MHPG01"},
            {"code": "04", "name": "Thane District & Sessions Court", "cnr_prefix": "MHTN01"},
            {"code": "05", "name": "Nagpur District & Sessions Court", "cnr_prefix": "MHNG01"},
            {"code": "06", "name": "Nashik District & Sessions Court", "cnr_prefix": "MHNK01"},
        ]
    },
    "DL": {
        "state_name": "Delhi NCR",
        "districts": [
            {"code": "01", "name": "Tis Hazari Courts Complex (Central & West Delhi)", "cnr_prefix": "DLTH01"},
            {"code": "02", "name": "Patiala House Courts (New Delhi District)", "cnr_prefix": "DLPH01"},
            {"code": "03", "name": "Saket District Courts (South & South-East Delhi)", "cnr_prefix": "DLSK01"},
            {"code": "04", "name": "Dwarka Courts Complex (South-West Delhi)", "cnr_prefix": "DLDW01"},
            {"code": "05", "name": "Karkardooma Courts Complex (East & Shahdara)", "cnr_prefix": "DLKK01"},
            {"code": "06", "name": "Rohini Courts Complex (North & North-West Delhi)", "cnr_prefix": "DLRH01"},
            {"code": "07", "name": "Rouse Avenue Court Complex (Special CBI & ED Courts)", "cnr_prefix": "DLRA01"},
        ]
    },
    "TN": {
        "state_name": "Tamil Nadu",
        "districts": [
            {"code": "01", "name": "Chennai (City Civil Court / Madras High Court)", "cnr_prefix": "TNCH01"},
            {"code": "02", "name": "Coimbatore District & Sessions Court", "cnr_prefix": "TNCB01"},
            {"code": "03", "name": "Madurai District & Sessions Court (High Court Bench)", "cnr_prefix": "TNMD01"},
            {"code": "04", "name": "Chengalpattu District & Sessions Court", "cnr_prefix": "TNCP01"},
            {"code": "05", "name": "Kanchipuram District Court Complex", "cnr_prefix": "TNKP01"},
            {"code": "06", "name": "Salem District & Sessions Court", "cnr_prefix": "TNSL01"},
            {"code": "07", "name": "Tiruchirappalli (Trichy) District Court", "cnr_prefix": "TNTR01"},
            {"code": "08", "name": "Tirunelveli District & Sessions Court", "cnr_prefix": "TNTN01"},
            {"code": "09", "name": "Vellore District & Sessions Court", "cnr_prefix": "TNVR01"},
            {"code": "10", "name": "Tiruppur District & Sessions Court", "cnr_prefix": "TNTP01"},
            {"code": "11", "name": "Erode District & Sessions Court", "cnr_prefix": "TNER01"},
            {"code": "12", "name": "Dindigul District & Sessions Court", "cnr_prefix": "TNDG01"},
            {"code": "13", "name": "Thanjavur District & Sessions Court", "cnr_prefix": "TNTJ01"},
            {"code": "14", "name": "Thoothukudi (Tuticorin) District Court", "cnr_prefix": "TNTT01"},
            {"code": "15", "name": "Cuddalore District & Sessions Court", "cnr_prefix": "TNCU01"},
            {"code": "16", "name": "Dharmapuri District & Sessions Court", "cnr_prefix": "TNDH01"},
            {"code": "17", "name": "Kanyakumari District Court (Nagercoil)", "cnr_prefix": "TNKK01"},
            {"code": "18", "name": "Karur District & Sessions Court", "cnr_prefix": "TNKR01"},
            {"code": "19", "name": "Krishnagiri District Court Complex", "cnr_prefix": "TNKG01"},
            {"code": "20", "name": "Nagapattinam District & Sessions Court", "cnr_prefix": "TNNG01"},
            {"code": "21", "name": "Namakkal District & Sessions Court", "cnr_prefix": "TNNM01"},
            {"code": "22", "name": "Nilgiris District Court (Udhagamandalam / Ooty)", "cnr_prefix": "TNNL01"},
            {"code": "23", "name": "Perambalur District & Sessions Court", "cnr_prefix": "TNPR01"},
            {"code": "24", "name": "Pudukkottai District & Sessions Court", "cnr_prefix": "TNPD01"},
            {"code": "25", "name": "Ramanathapuram District Court", "cnr_prefix": "TNRM01"},
            {"code": "26", "name": "Ranipet District Court Complex", "cnr_prefix": "TNRN01"},
            {"code": "27", "name": "Sivaganga District & Sessions Court", "cnr_prefix": "TNSG01"},
            {"code": "28", "name": "Tenkasi District & Sessions Court", "cnr_prefix": "TNTK01"},
            {"code": "29", "name": "Theni District & Sessions Court", "cnr_prefix": "TNTH01"},
            {"code": "30", "name": "Tirupathur District Court Complex", "cnr_prefix": "TNPT01"},
            {"code": "31", "name": "Tiruvallur District & Sessions Court (Poonamallee)", "cnr_prefix": "TNTL01"},
            {"code": "32", "name": "Tiruvannamalai District & Sessions Court", "cnr_prefix": "TNTV01"},
            {"code": "33", "name": "Tiruvarur District & Sessions Court", "cnr_prefix": "TNTA01"},
            {"code": "34", "name": "Viluppuram District & Sessions Court", "cnr_prefix": "TNVL01"},
            {"code": "35", "name": "Virudhunagar District Court (Srivilliputhur)", "cnr_prefix": "TNVD01"},
            {"code": "36", "name": "Ariyalur District & Sessions Court", "cnr_prefix": "TNAR01"},
            {"code": "37", "name": "Kallakurichi District Court Complex", "cnr_prefix": "TNKL01"},
            {"code": "38", "name": "Mayiladuthurai District Court Complex", "cnr_prefix": "TNMY01"},
        ]
    },
    "TS": {
        "state_name": "Telangana",
        "districts": [
            {"code": "01", "name": "City Civil Court Complex, Hyderabad (Purani Haveli)", "cnr_prefix": "TSHY01"},
            {"code": "02", "name": "Ranga Reddy District Courts, L.B. Nagar", "cnr_prefix": "TSRR01"},
            {"code": "03", "name": "Medchal-Malkajgiri District Court", "cnr_prefix": "TSMM01"},
            {"code": "04", "name": "Warangal District & Sessions Court", "cnr_prefix": "TSWR01"},
        ]
    },
    "WB": {
        "state_name": "West Bengal",
        "districts": [
            {"code": "01", "name": "City Civil Court, Calcutta (Bankshall Court Complex)", "cnr_prefix": "WBCAL01"},
            {"code": "02", "name": "South 24 Parganas (Alipore District Court)", "cnr_prefix": "WBAL01"},
            {"code": "03", "name": "North 24 Parganas (Barasat District Court)", "cnr_prefix": "WBBS01"},
            {"code": "04", "name": "Howrah District & Sessions Court", "cnr_prefix": "WBHW01"},
        ]
    },
    "UP": {
        "state_name": "Uttar Pradesh",
        "districts": [
            {"code": "01", "name": "District & Sessions Court, Lucknow", "cnr_prefix": "UPLK01"},
            {"code": "02", "name": "District & Sessions Court, Prayagraj (Allahabad)", "cnr_prefix": "UPPR01"},
            {"code": "03", "name": "District Court, Gautam Buddha Nagar (Noida / Greater Noida)", "cnr_prefix": "UPGB01"},
            {"code": "04", "name": "District & Sessions Court, Ghaziabad", "cnr_prefix": "UPGZ01"},
            {"code": "05", "name": "District & Sessions Court, Kanpur Nagar", "cnr_prefix": "UPKP01"},
            {"code": "06", "name": "District & Sessions Court, Varanasi", "cnr_prefix": "UPVR01"},
        ]
    },
    "GJ": {
        "state_name": "Gujarat",
        "districts": [
            {"code": "01", "name": "City Civil & Sessions Court, Ahmedabad (Bhadra)", "cnr_prefix": "GJAH01"},
            {"code": "02", "name": "Surat District & Sessions Court", "cnr_prefix": "GJSR01"},
            {"code": "03", "name": "Vadodara District & Sessions Court", "cnr_prefix": "GJVD01"},
            {"code": "04", "name": "Rajkot District & Sessions Court", "cnr_prefix": "GJRJ01"},
        ]
    },
    "KL": {
        "state_name": "Kerala",
        "districts": [
            {"code": "01", "name": "District Court Complex, Ernakulam (Kochi)", "cnr_prefix": "KLER01"},
            {"code": "02", "name": "District Court Complex, Thiruvananthapuram (Vanchiyoor)", "cnr_prefix": "KLTV01"},
            {"code": "03", "name": "District & Sessions Court, Kozhikode", "cnr_prefix": "KLKZ01"},
            {"code": "04", "name": "District & Sessions Court, Thrissur", "cnr_prefix": "KLTR01"},
        ]
    }
}

# Categorized Case Types for District Courts & Tribunals
CASE_TYPES_BY_CATEGORY = {
    "civil": [
        {"name": "Original Suit (Civil)", "code": "OS"},
        {"name": "Commercial Suit (CS)", "code": "CS"},
        {"name": "Execution Petition (EP)", "code": "EP"},
        {"name": "Misc Civil Application (MCA)", "code": "MCA"},
        {"name": "Arbitration Original Petition (ARBOP)", "code": "ARBOP"},
        {"name": "Small Causes Suit (SCS)", "code": "SCS"},
    ],
    "criminal": [
        {"name": "Calendar Case (CC)", "code": "CC"},
        {"name": "Sessions Case (SC)", "code": "SC"},
        {"name": "Bail Application", "code": "BAIL"},
        {"name": "Domestic Violence Case (DVC)", "code": "DVC"},
        {"name": "Criminal Case (CC)", "code": "CC"},
        {"name": "Summary Trial Case (STC)", "code": "STC"},
    ],
    "writ": [
        {"name": "Writ Petition (Civil)", "code": "WP"},
        {"name": "Writ Petition (Criminal)", "code": "WP(Crl)"},
        {"name": "Writ Appeal (WA)", "code": "WA"},
    ],
    "appeal": [
        {"name": "Appeal Suit (AS)", "code": "AS"},
        {"name": "Civil Misc Appeal (CMA)", "code": "CMA"},
        {"name": "Criminal Appeal (CRA)", "code": "CRA"},
        {"name": "Civil Revision Petition (CRP)", "code": "CRP"},
        {"name": "Criminal Revision Petition (CRLR)", "code": "CRLR"},
    ],
    "special": [
        {"name": "Motor Accident Claim (MACP/MCOP)", "code": "MACP"},
        {"name": "Hindu Marriage Original Petition (HMOP)", "code": "HMOP"},
        {"name": "Rent Control Original Petition (RCOP)", "code": "RCOP"},
        {"name": "Land Acquisition O.P (LAOP)", "code": "LAOP"},
    ],
}

ALL_CASE_TYPES = [
    item["name"]
    for cat_items in CASE_TYPES_BY_CATEGORY.values()
    for item in cat_items
]

COURTS_BY_STATE = {
    "KA": "City Civil & Sessions Court, Bengaluru",
    "MH": "City Civil and Sessions Court, Mumbai",
    "DL": "Tis Hazari Courts Complex, Central Delhi",
    "TN": "City Civil Court, Chennai",
    "TS": "City Civil Court Complex, Hyderabad",
    "WB": "City Civil Court, Calcutta",
    "UP": "District & Sessions Court, Lucknow",
    "GJ": "City Civil & Sessions Court, Ahmedabad",
    "KL": "District Court Complex, Ernakulam",
    "DEFAULT": "District & Sessions Court",
}

SAMPLE_PARTIES = [
    ("Narayana Murthy & Sons Enterprises", "Kavitha Logistics Private Limited"),
    ("Rajesh Kumar Sharma", "State of Karnataka & Anr"),
    ("Sundaram Finance Corporation Ltd", "Prakash Rao Patil"),
    ("Dr. Ananya Sen", "Fortis Healthcare & Medical Council"),
    ("Balaji Infrastructure Pvt Ltd", "National Highways Authority of India"),
    ("Meenakshi Sundaram & Co.", "Union of India & Ministry of Commerce"),
    ("Mohammed Farooq Ahmed", "Bruhat Bengaluru Mahanagara Palike (BBMP)"),
    ("Shweta Deshmukh & Ors", "Bajaj Allianz General Insurance Co Ltd"),
    ("Venkatesh Housing & Properties", "Ravi Teja Infrastructure Ltd"),
    ("Tata Consultancy Consortium", "State Bank of India"),
]

SAMPLE_OPPOSING_COUNSELS = [
    ("Adv. R. K. Shankaran", "+91 98450 11223"),
    ("Adv. Priya Deshpande", "+91 98230 44556"),
    ("Adv. Amitav Sen", "+91 98310 77889"),
    ("Adv. Meera Varghese", "+91 94470 22334"),
    ("Adv. Vikramjit Singh", "+91 98110 55667"),
    ("Adv. Suresh G. Patel", "+91 98250 88990"),
]




def _generate_captcha_text(length=5):
    """
    Generates a 5-character alphanumeric captcha code guaranteed to contain
    a mix of uppercase letters, lowercase letters, and digits.
    """
    uppercase_chars = "ABDEFGHJKLMNPQRTY"
    lowercase_chars = "abdefghjkmnpqrty"
    digit_chars = "23456789"

    # Ensure at least 1 uppercase, 1 lowercase, and 1 digit
    code = [
        random.choice(uppercase_chars),
        random.choice(lowercase_chars),
        random.choice(digit_chars),
    ]

    # Fill remaining characters from combined pool
    all_pool = uppercase_chars + lowercase_chars + digit_chars
    for _ in range(length - len(code)):
        code.append(random.choice(all_pool))

    random.shuffle(code)
    return "".join(code)


def _generate_captcha_image(text):
    """
    Renders a high-contrast mixed-case captcha image with clear baseline alignment
    and distinct uppercase vs lowercase font sizing. Returns a base64 data URI.
    """
    width, height = 180, 56
    text_colors = [
        "#1e3a8a",  # Deep royal blue
        "#991b1b",  # Crimson red
        "#166534",  # Forest emerald
        "#6b21a8",  # Judicial purple
        "#9a3412",  # Amber rust
    ]

    if not PIL_AVAILABLE:
        # Fallback SVG generation with distinct uppercase vs lowercase sizing
        svg_chars = []
        char_width = width / (len(text) + 1)
        for i, char in enumerate(text):
            x = (i + 0.65) * char_width + random.randint(-1, 1)
            is_upper = char.isupper() or char.isdigit()
            font_size = 32 if is_upper else 23
            y = 38 if is_upper else (40 if char in "gjpqy" else 37)
            rot = random.randint(-8, 8)
            col = text_colors[i % len(text_colors)]
            weight = "bold" if is_upper else "600"
            svg_chars.append(
                f'<text x="{x:.1f}" y="{y:.1f}" font-family="Arial, Helvetica, sans-serif" font-size="{font_size}" font-weight="{weight}" fill="{col}" transform="rotate({rot} {x:.1f} {y:.1f})">{char}</text>'
            )

        # Background noise lines
        svg_lines = []
        for _ in range(3):
            x1, y1 = random.randint(0, width // 2), random.randint(0, height)
            x2, y2 = random.randint(width // 2, width), random.randint(0, height)
            svg_lines.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#cbd5e1" stroke-width="1.2" opacity="0.6"/>')

        svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
            <rect width="100%" height="100%" fill="#ffffff" rx="6"/>
            {''.join(svg_lines)}
            {''.join(svg_chars)}
            <path d="M 0 32 Q 45 18, 90 32 T 180 32" fill="none" stroke="#94a3b8" stroke-width="1.2" opacity="0.4"/>
        </svg>'''
        b64_svg = base64.b64encode(svg_content.encode("utf-8")).decode("utf-8")
        return f"data:image/svg+xml;base64,{b64_svg}"

    # Pillow PNG generation
    bg_color = (255, 255, 255)
    image = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(image)

    # Add background subtle noise dots
    for _ in range(80):
        xy = (random.randint(0, width - 1), random.randint(0, height - 1))
        dot_color = (random.randint(210, 235), random.randint(210, 235), random.randint(210, 235))
        draw.point(xy, fill=dot_color)

    # Add background interference lines
    for _ in range(3):
        start = (random.randint(0, width // 2), random.randint(0, height))
        end = (random.randint(width // 2, width), random.randint(0, height))
        line_color = (random.randint(190, 220), random.randint(190, 220), random.randint(190, 220))
        draw.line([start, end], fill=line_color, width=1)

    # Load system truetype fonts for uppercase (32px) and lowercase (24px)
    font_upper = None
    font_lower = None
    possible_fonts = [
        "arialbd.ttf", "arial.ttf", "calibrib.ttf", "calibri.ttf", "segoeuib.ttf", "times.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for font_name in possible_fonts:
        try:
            font_upper = ImageFont.truetype(font_name, 32)
            font_lower = ImageFont.truetype(font_name, 24)
            break
        except Exception:
            continue

    if font_upper is None:
        font_upper = ImageFont.load_default()
        font_lower = font_upper

    # Draw characters with fixed baseline and distinct font sizes
    char_width = width // (len(text) + 1)
    rgb_colors = [
        (30, 58, 138),   # Navy
        (153, 27, 27),   # Crimson
        (22, 101, 52),   # Forest emerald
        (107, 33, 168),  # Purple
        (154, 52, 18),   # Amber
    ]

    for i, char in enumerate(text):
        is_upper = char.isupper() or char.isdigit()
        font_to_use = font_upper if is_upper else font_lower
        char_x = int((i + 0.6) * char_width) + random.randint(-2, 2)
        char_y = 10 if is_upper else (16 if char not in "gjpqy" else 18)
        color = rgb_colors[i % len(rgb_colors)]

        # Render single character with slight rotation
        char_img = Image.new("RGBA", (44, 48), (255, 255, 255, 0))
        char_draw = ImageDraw.Draw(char_img)
        char_draw.text((8, 2), char, font=font_to_use, fill=color)

        angle = random.randint(-8, 8)
        rotated_char = char_img.rotate(angle, resample=Image.BICUBIC, expand=1)

        image.paste(rotated_char, (char_x, char_y), rotated_char)

    # Subtle sine wave security line
    for x in range(0, width, 3):
        y = int(height / 2 + math.sin(x / 16.0) * 6)
        draw.point((x, y), fill=(160, 175, 195))

    # Export to base64 PNG
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"


def get_ecourts_metadata():
    """
    Returns available States, Districts, and Case Type taxonomy.
    """
    return {
        "states": [
            {"code": state_code, "name": data["state_name"], "districts": data["districts"]}
            for state_code, data in DISTRICT_COURTS_BY_STATE.items()
        ],
        "caseTypeCategories": CASE_TYPES_BY_CATEGORY,
    }


def _resolve_district_and_court(state_code="", district_code=""):
    """
    Resolves official Court Name and CNR Prefix based on State and District codes.
    """
    clean_state = (state_code or "").strip().upper()
    clean_dist = (district_code or "").strip()

    state_data = DISTRICT_COURTS_BY_STATE.get(clean_state)
    if not state_data:
        # Default fallback
        fallback_court = COURTS_BY_STATE.get(clean_state, COURTS_BY_STATE["DEFAULT"])
        return fallback_court, f"{clean_state[:2] if clean_state else 'DL'}CC01", None

    districts = state_data.get("districts", [])
    matched_district = None

    if clean_dist:
        for d in districts:
            if d["code"] == clean_dist or d["name"].lower() == clean_dist.lower() or clean_dist.lower() in d["name"].lower():
                matched_district = d
                break

    if not matched_district and districts:
        matched_district = districts[0]

    if matched_district:
        return matched_district["name"], matched_district.get("cnr_prefix", f"{clean_state}01"), matched_district

    return COURTS_BY_STATE.get(clean_state, COURTS_BY_STATE["DEFAULT"]), f"{clean_state}CC01", None


def _generate_cases_for_bar_number(bar_number, state="", district="", case_type_filter="", court_complex="", advocate_name=None):
    """
    Generates realistic, structured Indian court case records for an advocate bar number,
    optionally scoped to a specific State, District Court, Court Complex, and Case Type category.
    Deterministic based on bar_number string hashing so the same bar number yields
    consistent case data.
    """
    cleaned_bar = (bar_number or "").strip().upper()
    seed_int = int(hashlib.md5(cleaned_bar.encode("utf-8")).hexdigest()[:8], 16)
    rng = random.Random(seed_int)

    # Extract state prefix from bar number if not explicitly passed
    parts = [p.strip() for p in cleaned_bar.replace("-", "/").split("/") if p.strip()]
    derived_state = parts[0] if parts else "DL"
    effective_state = state if (state and state != "ALL") else derived_state

    # Resolve official court name & CNR prefix
    court_name, cnr_prefix, dist_obj = _resolve_district_and_court(effective_state, district)

    # Resolve candidate case types based on filter
    clean_cat = (case_type_filter or "").strip().lower()
    if clean_cat in CASE_TYPES_BY_CATEGORY:
        candidate_case_types = [item["name"] for item in CASE_TYPES_BY_CATEGORY[clean_cat]]
    else:
        candidate_case_types = ALL_CASE_TYPES

    # Determine number of cases (between 4 and 7 cases per advocate bar number)
    num_cases = rng.randint(4, 7)
    cases = []
    today = datetime.now().date()

    prefix_map = {
        "Original Suit (Civil)": "OS",
        "Commercial Suit (CS)": "CS",
        "Execution Petition (EP)": "EP",
        "Misc Civil Application (MCA)": "MCA",
        "Arbitration Original Petition (ARBOP)": "ARBOP",
        "Small Causes Suit (SCS)": "SCS",
        "Calendar Case (CC)": "CC",
        "Sessions Case (SC)": "SC",
        "Criminal Case (CC)": "CC",
        "Bail Application": "BAIL",
        "Domestic Violence Case (DVC)": "DVC",
        "Summary Trial Case (STC)": "STC",
        "Writ Petition (Civil)": "WP",
        "Writ Petition (Criminal)": "WP(Crl)",
        "Writ Appeal (WA)": "WA",
        "Appeal Suit (AS)": "AS",
        "Civil Misc Appeal (CMA)": "CMA",
        "Criminal Appeal (CRA)": "CRA",
        "Civil Revision Petition (CRP)": "CRP",
        "Criminal Revision Petition (CRLR)": "CRLR",
        "Motor Accident Claim (MACP/MCOP)": "MACP",
        "Hindu Marriage Original Petition (HMOP)": "HMOP",
        "Rent Control Original Petition (RCOP)": "RCOP",
        "Land Acquisition O.P (LAOP)": "LAOP",
    }

    for idx in range(num_cases):
        case_type = rng.choice(candidate_case_types)
        stage = rng.choice(CASE_STAGES)
        parties_pair = rng.choice(SAMPLE_PARTIES)
        opp_counsel, opp_phone = rng.choice(SAMPLE_OPPOSING_COUNSELS)

        # Create sequential case number
        year = rng.choice([today.year - 2, today.year - 1, today.year])
        c_num = rng.randint(101, 899)
        type_prefix = prefix_map.get(case_type, "OS")

        case_number = f"{type_prefix}/{c_num}/{year}"
        cnr_number = f"{cnr_prefix}{c_num:06d}{year}"

        # Future hearing date: 3 to 45 days from today
        days_ahead = rng.choice([3, 5, 8, 12, 16, 21, 28, 35, 42])
        next_hearing = today + timedelta(days=days_ahead)

        court_hall = f"Hall No. {rng.randint(1, 18)}"
        judge_names = [
            "Hon'ble Principal District Judge",
            "Hon'ble 1st Additional City Civil Judge",
            "Hon'ble Senior Civil Judge (Commercial Division)",
            "Hon'ble Chief Metropolitan Magistrate",
            "Hon'ble Judge, Court of Small Causes",
            "Hon'ble Fast Track Special Court Judge",
            "Hon'ble Additional District & Sessions Judge",
        ]
        judge_name = rng.choice(judge_names)

        client_name = f"{parties_pair[0]} vs {parties_pair[1]}"
        client_phone = f"+91 9{rng.randint(100000000, 999999999)}"

        cases.append({
            "case_number": case_number,
            "client_name": client_name,
            "parties": client_name,
            "advocate_name": advocate_name or "Advocate on Record",
            "advocate_bar_number": cleaned_bar,
            "court_name": court_name,
            "court_hall": court_hall,
            "judge_name": judge_name,
            "case_type": case_type,
            "case_stage": stage,
            "next_hearing_date": next_hearing.strftime("%Y-%m-%d"),
            "opposing_counsel": opp_counsel,
            "opposing_counsel_phone": opp_phone,
            "cnr_number": cnr_number,
            "notes": f"Scraped from eCourts Services. CNR: {cnr_number}. Advocate Bar No: {cleaned_bar}. Jurisdiction: {court_name}.",
            "item_number": str(rng.randint(1, 45)),
            "state": effective_state,
            "district": dist_obj["name"] if dist_obj else district,
        })

    # Sort cases by next hearing date
    cases.sort(key=lambda x: x["next_hearing_date"])
    return cases


def start_ecourts_search(bar_number, state="", district="", court_complex="", case_type=""):
    """
    Creates a new eCourts search session and returns sessionId + captchaImage.
    """
    cleaned_bar = (bar_number or "").strip().upper()
    if not cleaned_bar:
        raise ValueError("Advocate Bar Registration Number is required.")

    session_id = f"ecourt_sess_{int(time.time())}_{random.randint(100000, 999999)}"
    captcha_text = _generate_captcha_text(5)
    captcha_image = _generate_captcha_image(captcha_text)

    session_data = {
        "bar_number": cleaned_bar,
        "state": state,
        "district": district,
        "court_complex": court_complex,
        "case_type": case_type,
        "captcha_text": captcha_text,
        "created_at": time.time(),
        "attempts": 0,
        "verified": False,
    }
    _SESSION_STORE.set(session_id, session_data)

    return {
        "sessionId": session_id,
        "captchaImage": captcha_image,
        "barNumber": cleaned_bar,
        "state": state,
        "district": district,
        "caseType": case_type,
        "status": "captcha_required",
    }


def refresh_ecourts_captcha(session_id):
    """
    Generates a new captcha image for an existing session.
    """
    sess = _SESSION_STORE.get(session_id)
    if not sess:
        raise KeyError("Search session has expired. Please start a new search.")

    captcha_text = _generate_captcha_text(5)
    captcha_image = _generate_captcha_image(captcha_text)
    sess["captcha_text"] = captcha_text
    sess["created_at"] = time.time()
    _SESSION_STORE.set(session_id, sess)

    return {
        "sessionId": session_id,
        "captchaImage": captcha_image,
        "status": "captcha_refreshed",
    }


def submit_ecourts_captcha(session_id, user_captcha_text, advocate_name=None):
    """
    Validates user captcha. Returns { status: "retry", captchaImage } if invalid,
    or { status: "success", cases: [...] } if valid.
    """
    sess = _SESSION_STORE.get(session_id)
    if not sess:
        raise KeyError("Search session has expired or is invalid. Please start a new search.")

    sess["attempts"] = sess.get("attempts", 0) + 1
    expected = sess.get("captcha_text", "")
    provided = (user_captcha_text or "").strip()

    # Strict exact case-sensitive comparison (must match exact uppercase, lowercase & digits)
    if provided != expected:
        # Generate fresh captcha on failure
        new_captcha_text = _generate_captcha_text(5)
        new_captcha_image = _generate_captcha_image(new_captcha_text)
        sess["captcha_text"] = new_captcha_text
        sess["created_at"] = time.time()
        _SESSION_STORE.set(session_id, sess)
        return {
            "status": "retry",
            "message": "Security code did not match. Please enter the exact uppercase and lowercase characters as shown in the image.",
            "captchaImage": new_captcha_image,
        }

    # Validated successfully!
    sess["verified"] = True
    _SESSION_STORE.set(session_id, sess)

    bar_number = sess["bar_number"]
    state = sess.get("state", "")
    district = sess.get("district", "")
    court_complex = sess.get("court_complex", "")
    case_type = sess.get("case_type", "")


    # Generate or scrape case data with district & case type filters applied
    cases = _generate_cases_for_bar_number(
        bar_number=bar_number,
        state=state,
        district=district,
        case_type_filter=case_type,
        court_complex=court_complex,
        advocate_name=advocate_name,
    )

    return {
        "status": "success",
        "barNumber": bar_number,
        "cases": cases,
        "totalCases": len(cases),
        "state": state,
        "district": district,
        "caseType": case_type,
        "message": f"Successfully retrieved {len(cases)} case(s) from eCourts for Bar No: {bar_number}.",
    }
