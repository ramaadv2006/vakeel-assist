"""
Static reference data: Tamil Nadu districts + common court types.
This is NOT scraped from eCourts — it's a maintained static list for
populating dropdowns in Advo Buddy. Update manually every few months
if new districts/court complexes are notified.

Structure:
    TN_DISTRICTS -> list of district names
    COURT_TYPES  -> generic court types found in most districts
                    (advocate can further pick the exact court complex
                    name manually if it's not in this generic list)
"""

TN_DISTRICTS = [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
    "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
    "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
    "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
    "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
    "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
    "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
    "Vellore", "Viluppuram", "Virudhunagar",
]

# Generic court types that typically exist under most district judiciaries.
# For district-specific exact complex names/addresses, keep this editable
# so the advocate can add/correct entries from the app itself.
COURT_TYPES = [
    "Principal District Court",
    "District Court",
    "Sub Court (Subordinate Court)",
    "Munsif Court",
    "Munsif Magistrate Court",
    "Judicial Magistrate Court - I",
    "Judicial Magistrate Court - II",
    "Chief Judicial Magistrate Court",
    "Family Court",
    "Mahila Court (Fast Track Mahila Court)",
    "Labour Court",
    "Motor Accident Claims Tribunal (MACT)",
    "Consumer Disputes Redressal Commission",
    "Special Court (POCSO / NDPS / etc.)",
]

# A few districts have well-known high-volume court complexes worth
# listing explicitly so advocates don't have to type them out.
# NOTE: keep this list conservative -- only include names you have
# independently verified, and let advocates add missing ones manually.
KNOWN_COURT_COMPLEXES = {
    "Chennai": [
        "Madras High Court",
        "City Civil Court, Chennai",
        "Chennai District Court (Poonamallee)",
    ],
    "Coimbatore": [
        "Coimbatore District Court",
    ],
    "Madurai": [
        "Madras High Court Bench, Madurai",
        "Madurai District Court",
    ],
}
