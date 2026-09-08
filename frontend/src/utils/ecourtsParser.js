/**
 * eCourts CIS Export Parser
 * Parses official government exported case data from .txt or .json files.
 * Handles double-stringified JSON arrays, standard arrays, NDJSON, and code-block wrapped formats.
 */

export const SAMPLE_ECOURTS_EXPORT_TXT = `["{\\"cino\\":\\"TNSA040001182025\\",\\"type_name\\":\\"CC\\",\\"fil_type_name\\":\\"CC\\",\\"case_no\\":\\"230400000562025\\",\\"reg_year\\":2025,\\"reg_no\\":56,\\"petparty_name\\":\\"Sub Inspector of police, Ammapet P.S, Salem\\",\\"resparty_name\\":\\"LENIN KUMAR\\",\\"fil_year\\":2025,\\"fil_no\\":114,\\"establishment_name\\":\\"CJM Establishment\\",\\"establishment_code\\":5,\\"state_code\\":10,\\"district_code\\":12,\\"state_name\\":\\"Tamil Nadu\\",\\"district_name\\":\\"Salem\\",\\"date_next_list\\":\\"2026-06-29\\",\\"date_of_decision\\":\\"2026-06-29\\",\\"date_last_list\\":\\"2026-06-29\\",\\"updated\\":true,\\"court_no_desg_name\\":\\"Judicial Magistrate No. V\\",\\"ltype_name\\":\\"சி.சி\\",\\"lpetparty_name\\":\\"நிறுவனத்தின்\\",\\"lresparty_name\\":\\"லெனின் குமார்\\",\\"lestablishment_name\\":\\"தலைமை குற்றவியல் நீதிமன்றம், சேலம்\\",\\"lstate_name\\":\\"தமிழ்நாடு\\",\\"ldistrict_name\\":\\"சேலம்\\",\\"lcourt_no_desg_name\\":\\"நீதித்துறை நடுவர் -05\\",\\"note\\":\\"\\",\\"disp_name\\":\\"Acquitted\\",\\"ldisp_name\\":\\"விடுதலை\\",\\"purpose_name\\":\\"Questioning\\",\\"lpurpose_name\\":\\"கேள்வி\\"}","{\\"cino\\":\\"TNSA040012642019\\",\\"type_name\\":\\"CC\\",\\"fil_type_name\\":\\"CC\\",\\"case_no\\":\\"230400005692026\\",\\"reg_year\\":2026,\\"reg_no\\":569,\\"petparty_name\\":\\"Inspector of Police, CCB (Cyber Crime )P.S\\",\\"resparty_name\\":\\"Mohammed Safi and two others\\",\\"fil_year\\":2019,\\"fil_no\\":1116,\\"establishment_name\\":\\"CJM Establishment\\",\\"establishment_code\\":5,\\"state_code\\":10,\\"district_code\\":12,\\"state_name\\":\\"Tamil Nadu\\",\\"district_name\\":\\"Salem\\",\\"date_next_list\\":\\"2026-09-03\\",\\"date_of_decision\\":null,\\"date_last_list\\":\\"2026-07-30\\",\\"updated\\":true,\\"court_no_desg_name\\":\\"Judicial Magistrate No. III\\",\\"ltype_name\\":\\"சி.சி\\",\\"lpetparty_name\\":\\"காவல் ஆய்வாளர்,\\",\\"lresparty_name\\":\\"முகம்மது சபி\\",\\"lestablishment_name\\":\\"தலைமை குற்றவியல் நீதிமன்றம், சேலம்\\",\\"lstate_name\\":\\"தமிழ்நாடு\\",\\"ldistrict_name\\":\\"சேலம்\\",\\"lcourt_no_desg_name\\":\\"நீதித்துறை நடுவர் -03\\",\\"note\\":\\"Hhhh\\",\\"purpose_name\\":\\"For further Proceedings\\",\\"lpurpose_name\\":\\"மேல் நடவடிக்கைக்காக\\"}","{\\"cino\\":\\"TNTI170022972025\\",\\"type_name\\":\\"STC\\",\\"fil_type_name\\":\\"STC\\",\\"case_no\\":\\"232300009732025\\",\\"reg_year\\":2025,\\"reg_no\\":973,\\"petparty_name\\":\\"SUB INSPECTOR OF POLICE, UDUMALPET PS\\",\\"resparty_name\\":\\"SARAVANAKUMAR\\",\\"fil_year\\":2025,\\"fil_no\\":2296,\\"establishment_name\\":\\"Judicial Magistrate Court No.I, Udumalpet\\",\\"establishment_code\\":23,\\"state_code\\":10,\\"district_code\\":33,\\"state_name\\":\\"Tamil Nadu\\",\\"district_name\\":\\"Tiruppur\\",\\"date_next_list\\":\\"2026-06-13\\",\\"date_of_decision\\":\\"2026-06-13\\",\\"date_last_list\\":\\"2026-06-13\\",\\"updated\\":true,\\"court_no_desg_name\\":\\"Judicial Magistrate No. I, Udumalpet\\",\\"ltype_name\\":\\"சி.ஆ.வ\\",\\"lpetparty_name\\":\\"குற்ற வழக்கு\\",\\"lresparty_name\\":\\"சரவணக்குமார்\\",\\"lestablishment_name\\":\\"நீதித்துறை நடுவர் நீதிமன்றம் எண் - 1, உடுமலைப்பேட்டை\\",\\"lstate_name\\":\\"தமிழ்நாடு\\",\\"ldistrict_name\\":\\"திருப்பூர்\\",\\"lcourt_no_desg_name\\":\\"நீதித்துறை நடுவர் நீதிமன்றம் எண் - 1, உடுமலைப்பேட்டை\\",\\"note\\":\\"\\",\\"disp_name\\":\\"Judgement on admission\\",\\"ldisp_name\\":\\"NULL\\",\\"purpose_name\\":\\"Trial\\",\\"lpurpose_name\\":\\"விசாரணை\\"}"]`;

export function parseEcourtsExport(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    throw new Error('Please provide text or upload a valid eCourts export file.');
  }

  let text = rawInput.trim();
  if (!text) {
    throw new Error('File or content is empty.');
  }

  // Remove code block backticks if present
  if (text.startsWith('```')) {
    const lines = text.split('\n');
    text = lines.slice(1, lines[lines.length - 1].startsWith('```') ? -1 : undefined).join('\n').trim();
  }

  let rawItems = [];
  // 1. Direct JSON parse
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      rawItems = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      rawItems = [parsed];
    }
  } catch (_) {
    // 2. Fallback: try parsing line by line (NDJSON)
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const obj = JSON.parse(trimmed);
        rawItems.push(obj);
      } catch (__) {
        // ignore malformed line
      }
    }
  }

  if (!rawItems.length) {
    throw new Error('Could not parse eCourts file. Please make sure it is a valid government eCourts .txt or .json export.');
  }

  // Double-stringified elements unwrap
  const unwrapped = [];
  for (const item of rawItems) {
    if (typeof item === 'string') {
      try {
        const parsed = JSON.parse(item);
        if (typeof parsed === 'object' && parsed !== null) {
          if (Array.isArray(parsed)) {
            unwrapped.push(...parsed.filter((p) => typeof p === 'object' && p !== null));
          } else {
            unwrapped.push(parsed);
          }
        }
      } catch (_) {
        // ignore unparseable string element
      }
    } else if (typeof item === 'object' && item !== null) {
      unwrapped.push(item);
    }
  }

  if (!unwrapped.length) {
    throw new Error('No valid case records found in this file.');
  }

  return unwrapped.map((raw) => {
    const cino = (raw.cino || '').trim();
    const typeName = (raw.type_name || raw.fil_type_name || '').trim();
    const regNo = raw.reg_no;
    const regYear = raw.reg_year;
    const rawCaseNo = String(raw.case_no || '').trim();

    let caseNumber = '';
    if (typeName && regNo && regYear) {
      caseNumber = `${typeName}/${regNo}/${regYear}`;
    } else if (typeName && regNo) {
      caseNumber = `${typeName}/${regNo}`;
    } else if (rawCaseNo) {
      caseNumber = rawCaseNo;
    } else {
      caseNumber = cino || 'UNKNOWN';
    }

    const petName = (raw.petparty_name || '').trim();
    const resName = (raw.resparty_name || '').trim();
    const parties = petName && resName ? `${petName} vs. ${resName}` : (petName || resName || 'Unknown Parties');

    const estName = (raw.establishment_name || '').trim();
    const courtDesg = (raw.court_no_desg_name || '').trim();
    const district = (raw.district_name || '').trim();
    const state = (raw.state_name || '').trim();

    const courtParts = [courtDesg, estName, district, state].filter(Boolean);
    const courtName = courtParts.length > 0 ? courtParts.join(', ') : (estName || 'District Court');

    const nextHearingDate = raw.date_next_list || null;
    const decisionDate = raw.date_of_decision || null;
    const lastHearingDate = raw.date_last_list || null;
    const dispName = (raw.disp_name || '').trim();

    const isDisposed = Boolean(decisionDate || (dispName && !['null', 'none', ''].includes(dispName.toLowerCase())));
    let purposeName = (raw.purpose_name || '').trim();
    if (!purposeName) {
      purposeName = isDisposed ? 'Disposed' : 'Hearing / Proceedings';
    }

    const regional = {
      type_name: raw.ltype_name,
      petparty_name: raw.lpetparty_name,
      resparty_name: raw.lresparty_name,
      establishment_name: raw.lestablishment_name,
      district_name: raw.ldistrict_name,
      court_no_desg_name: raw.lcourt_no_desg_name,
      disp_name: raw.ldisp_name,
      purpose_name: raw.lpurpose_name,
      state_name: raw.lstate_name,
    };

    // Filter out null/undefined/NULL
    const cleanRegional = {};
    for (const [k, v] of Object.entries(regional)) {
      if (v && String(v).trim().toLowerCase() !== 'null') {
        cleanRegional[k] = v;
      }
    }

    return {
      case_number: caseNumber,
      cnr_number: cino,
      raw_case_no: rawCaseNo,
      parties,
      petitioner: petName,
      respondent: resName,
      court_name: courtName,
      court_hall: courtDesg,
      establishment_name: estName,
      district,
      state,
      case_type: typeName || 'General',
      next_hearing_date: nextHearingDate,
      last_hearing_date: lastHearingDate,
      decision_date: decisionDate,
      case_stage: purposeName,
      disp_name: isDisposed ? dispName : null,
      is_disposed: isDisposed,
      status: isDisposed ? 'Disposed' : 'Pending / Active',
      notes: (raw.note || '').trim(),
      filing_number: [raw.fil_type_name, raw.fil_no, raw.fil_year].filter(Boolean).join('/'),
      registration_number: [raw.type_name, raw.reg_no, raw.reg_year].filter(Boolean).join('/'),
      regional: cleanRegional,
      raw_metadata: raw,
    };
  });
}
