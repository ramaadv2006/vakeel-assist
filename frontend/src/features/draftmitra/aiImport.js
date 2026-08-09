/* ---------------------------------------------------------------
   "Add your own draft" — AI import client.
   Calls the secure application API client to query /api/draftmitra/import.
 ----------------------------------------------------------------*/

import { api } from "../../api/client";

export const IMPORT_SYSTEM_PROMPT = `You convert Indian court petition/draft documents into fillable templates.
Given the raw text of a legal draft, do this:
1. Identify every variable part that changes per client/case — names, case numbers, dates, court name, addresses, offence sections, case-specific facts. Do NOT treat fixed legal boilerplate language as variable.
2. Replace each variable part in the text with a placeholder token like {{field_id}} using short snake_case ids (e.g. {{petitioner_name}}, {{crime_no}}, {{court_name}}).
3. Keep every other word of the original document EXACTLY as written — do not paraphrase, shorten, or reword the legal language.
4. Preserve paragraph breaks (use \\n\\n between paragraphs/lines) and numbered clauses as in the original.
5. Produce a short human-readable label for each field, and a 2-4 word document title and a one-line subtitle (e.g. "u/s 480 B.N.S.S." or "Civil — rent dispute").
6. Also pick ONE category/group for this document from: "Bail & Sureties", "Appearance & Vakalat", "Petitions", "Agreements", "Notices", "Affidavits", "Other".

Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{"name":"...","sub":"...","group":"...","template":"...text with {{field_id}} tokens and \\n\\n paragraph breaks...","fields":[{"id":"field_id","label":"Human label"}]}`;

/**
 * @param {string} rawText - full text of the pasted petition/draft
 * @returns {Promise<{name:string, sub:string, group:string, template:string, fields:{id:string,label:string}[]}>}
 */
export async function importDraftWithAI(rawText) {
  return await api.post("/draftmitra/import", { text: rawText });
}
