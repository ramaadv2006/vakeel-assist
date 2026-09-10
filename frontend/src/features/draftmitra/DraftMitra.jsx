import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Scale, FileText, ChevronRight, Printer, Download, Save, Copy,
  Trash2, X, Check, FolderOpen, ArrowLeft, AlertCircle, Loader2, Sparkles,
  Search, Filter, Plus, BookOpen
} from "lucide-react";

import {
  TEMPLATES, F, blocksToPlainText, buildDocumentHtml, renderBlocks, foldedPageFragment,
  paramsFromCustomTemplate, generateFromCustomTemplate, partitionBlocks,
} from "./templates";
import { generateAndDownloadPdf } from "./pdfGenerator";
import { storageGet, storageSet, storageDelete, storageList } from "./storage";
import { importDraftWithAI } from "./aiImport";
import { useAuth } from "../../context/AuthContext";

const STORAGE_PREFIX = "draft:";
const CUSTOM_TPL_PREFIX = "customtpl:";

/* Page 1 + (optional) folded backing sheet as one printable document. */
const pagesToHtml = buildDocumentHtml;

const DRAFT_STARTER_PRESETS = [
  {
    label: "Blank Court Petition / Application",
    name: "General Court Petition",
    group: "Petitions",
    sub: "Standard miscellaneous petition template",
    text: `IN THE COURT OF {{court}}

CASE / M.P. NO. {{caseNo}}

BETWEEN:
{{client}}
...Petitioner / Applicant

AND

{{opponent}}
...Respondent

PETITION UNDER SECTION {{section}}

The Petitioner above named states as follows:

1. That the Petitioner has filed the main proceedings before this Hon'ble Court.

2. {{facts}}

3. That in the interest of justice, it is just and necessary that this Hon'ble Court may be pleased to grant the relief prayed for herein.

PRAYER

Wherefore, the Petitioner respectfully prays that this Hon'ble Court may be pleased to:
{{prayer}}

Advocate for Petitioner:
{{advocate}}`
  },
  {
    label: "Bail Petition (BNSS / CrPC)",
    name: "Bail Application",
    group: "Bail Petitions",
    sub: "Petition for Grant of Regular Bail",
    text: `IN THE COURT OF {{court}}

CRIME NO. {{crimeNo}} OF {{year}}
ON THE FILE OF {{policeStation}}

BETWEEN:
{{client}}
...Petitioner / Accused

AND

State represented by
The Inspector of Police,
{{policeStation}}
...Respondent / Complainant

PETITION FOR GRANT OF REGULAR BAIL UNDER SECTION 483 B.N.S.S. / 437 Cr.P.C.

The Petitioner respectfully submits as follows:

1. That the Petitioner was arrested on {{arrestDate}} in connection with Crime No. {{crimeNo}} registered for alleged offences under Section {{section}} {{act}}.

2. That the Petitioner is innocent and has been falsely implicated in this case due to previous enmity.

3. {{facts}}

4. That the Petitioner is a permanent resident of {{address}} and has deep roots in society. There is no risk of the Petitioner absconding or tampering with evidence.

PRAYER

Wherefore, the Petitioner respectfully prays that this Hon'ble Court may be pleased to enlarge the Petitioner on bail, and thus render justice.

Advocate for Petitioner:
{{advocate}}`
  },
  {
    label: "Legal Notice (Civil / Commercial / NI Act)",
    name: "Legal Notice",
    group: "Notices",
    sub: "Statutory Demand / Legal Representation Notice",
    text: `REGISTERED A.D. / SPEED POST

LEGAL NOTICE

To:
{{opponent}}
{{opponentAddr}}

Under instructions from and on behalf of my client {{client}}, resident of {{clientAddr}}, I hereby serve upon you this Legal Notice as under:

1. That my client is {{clientProfile}}.

2. {{facts}}

3. That in spite of repeated requests and demands, you have neglected and failed to discharge your liability.

4. I therefore call upon you to comply with the demand within 15 days of receipt of this notice, failing which my client shall be constrained to institute appropriate civil and criminal proceedings against you in the competent court of law at your entire cost and consequences.

Advocate:
{{advocate}}
{{advocateAddress}}`
  },
  {
    label: "Vakalatnama / Memo of Appearance",
    name: "Vakalatnama",
    group: "Vakalatnama",
    sub: "Power of Attorney / Authority in Court",
    text: `IN THE COURT OF {{court}}

{{caseType}} NO. {{caseNo}}

BETWEEN:
{{client}}
...Petitioner / Plaintiff

AND

{{opponent}}
...Respondent / Defendant

VAKALATNAMA / MEMO OF APPEARANCE

I/We, the undersigned {{client}}, do hereby nominate, constitute and appoint {{advocate}}, Advocate(s), to appear, act and plead on my/our behalf in the above matter.

In witness whereof, I/we have signed this Vakalatnama on this {{date}}.

Signature of Client:
{{client}}

Accepted:
{{advocate}}
Advocate (Enrolment No: {{enrolNo}})`
  }
];

export default function DraftMitra() {
  const { advocate } = useAuth();
  const [screen, setScreen] = useState("library"); // library | editor
  const [activeId, setActiveId] = useState(null);
  const [data, setData] = useState({});
  const [mobileTab, setMobileTab] = useState("form"); // form | preview
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [toast, setToast] = useState(null);
  const [saveTitle, setSaveTitle] = useState("");
  const [showSaveBox, setShowSaveBox] = useState(false);

  // Search & Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");

  // Custom Templates & Creation State
  const [customTemplates, setCustomTemplates] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createGroup, setCreateGroup] = useState("Petitions");
  const [createSub, setCreateSub] = useState("");
  const [createContent, setCreateContent] = useState("");

  // AI Import State
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const allTemplates = useMemo(() => [...customTemplates, ...TEMPLATES], [customTemplates]);
  const activeTemplate = useMemo(() => allTemplates.find((t) => t.id === activeId) || null, [activeId, allTemplates]);

  const flashToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const loadCustomTemplates = useCallback(async () => {
    const res = await storageList(CUSTOM_TPL_PREFIX);
    if (res && res.keys) {
      const items = await Promise.all(
        res.keys.map(async (k) => {
          const r = await storageGet(k);
          if (!r) return null;
          try {
            const parsed = JSON.parse(r.value);
            return {
              ...parsed,
              key: k,
              custom: true,
              fields: paramsFromCustomTemplate(parsed),
              generate: (d) => generateFromCustomTemplate(parsed, d),
            };
          } catch {
            return null;
          }
        })
      );
      setCustomTemplates(items.filter(Boolean));
    }
  }, []);

  useEffect(() => {
    loadCustomTemplates();
  }, [loadCustomTemplates]);

  const applyPreset = (preset) => {
    setCreateName(preset.name);
    setCreateGroup(preset.group);
    setCreateSub(preset.sub);
    setCreateContent(preset.text);
  };

  const handleCreateCustomDraft = async () => {
    if (!createName.trim()) {
      flashToast("Please enter a title for your draft template");
      return;
    }

    const id = `custom_${Date.now()}`;
    const key = `${CUSTOM_TPL_PREFIX}${id}`;
    const templateText = createContent.trim() || `IN THE COURT OF {{court}}\n\nCASE NO. {{caseNo}}\n\nBETWEEN:\n{{client}}\n...Petitioner\n\nAND\n\n{{opponent}}\n...Respondent\n\nPETITION UNDER SECTION {{section}}\n\n1. {{facts}}\n\nPRAYER\n\n{{prayer}}\n\nAdvocate: {{advocate}}`;

    // Auto-detect {{variable}} placeholders
    const matches = templateText.match(/\{\{(\w+)\}\}/g) || [];
    const uniqueFieldIds = Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, ""))));
    const fields = uniqueFieldIds.length > 0
      ? uniqueFieldIds.map((fId) => ({
        id: fId,
        label: fId.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
      }))
      : [
        { id: "court", label: "Court Name" },
        { id: "caseNo", label: "Case / Crime Number" },
        { id: "client", label: "Petitioner / Client Name" },
        { id: "opponent", label: "Respondent Name" },
        { id: "section", label: "Section & Act" },
        { id: "facts", label: "Statement of Facts" },
        { id: "advocate", label: "Advocate Name" },
      ];

    const payload = {
      id,
      name: createName.trim(),
      sub: createSub.trim() || "Advocate Custom Draft",
      group: createGroup.trim() || "Custom Templates",
      template: templateText,
      fields,
    };

    const res = await storageSet(key, JSON.stringify(payload));
    if (res) {
      await loadCustomTemplates();
      flashToast(`Added "${createName.trim()}" to your library!`);
      setShowCreateModal(false);
      setCreateName("");
      setCreateSub("");
      setCreateContent("");

      const newTmpl = {
        ...payload,
        key,
        custom: true,
        fields: paramsFromCustomTemplate(payload),
        generate: (d) => generateFromCustomTemplate(payload, d),
      };
      openTemplate(newTmpl);
    } else {
      flashToast("Could not save template. Please try again.");
    }
  };

  const runImport = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    setImportError("");
    try {
      const parsed = await importDraftWithAI(importText.trim());
      const id = `custom_${Date.now()}`;
      const key = `${CUSTOM_TPL_PREFIX}${id}`;
      const payload = {
        id,
        name: parsed.name,
        sub: parsed.sub,
        group: parsed.group || "Other",
        template: parsed.template,
        fields: parsed.fields,
      };
      const res = await storageSet(key, JSON.stringify(payload));
      if (!res) throw new Error("Could not save template");
      await loadCustomTemplates();
      flashToast(`Added "${parsed.name}" to your library`);
      setShowImport(false);
      setImportText("");
    } catch (e) {
      setImportError(
        "Couldn't read that draft into a template. Check your backend /api/draftmitra/import route is set up, or try pasting cleaner text."
      );
    }
    setImporting(false);
  };

  const getFieldDefault = useCallback((field, advocateProfile) => {
    if (field.id === "advocate" || field.id === "advocateName") {
      return advocateProfile?.name || field.def || "";
    }
    if (field.id === "bar_no" || field.id === "enrolNo" || field.id === "barNo") {
      return advocateProfile?.bar_council_number || field.def || "";
    }
    if (field.id === "phone") {
      return advocateProfile?.phone || field.def || "";
    }
    if (field.id === "email") {
      return advocateProfile?.email || field.def || "";
    }
    if (field.id === "office_addr" || field.id === "advocateAddress" || field.id === "advocateAddr" || field.id === "officeAddr") {
      return advocateProfile?.office_address || field.def || "";
    }
    return field.def || "";
  }, []);

  const openTemplate = (tmpl) => {
    const init = {};
    tmpl.fields.forEach((f) => (init[f.id] = getFieldDefault(f, advocate)));
    setData(init);
    setActiveId(tmpl.id);
    setScreen("editor");
    setMobileTab("form");
  };

  const loadDraftsList = useCallback(async () => {
    setLoadingDrafts(true);
    const res = await storageList(STORAGE_PREFIX);
    if (res && res.keys) {
      const items = await Promise.all(
        res.keys.map(async (k) => {
          const r = await storageGet(k);
          if (!r) return null;
          try {
            return { key: k, ...JSON.parse(r.value) };
          } catch {
            return null;
          }
        })
      );
      setSavedDrafts(items.filter(Boolean).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)));
    } else {
      setSavedDrafts([]);
    }
    setLoadingDrafts(false);
  }, []);

  useEffect(() => {
    if (showDrafts) loadDraftsList();
  }, [showDrafts, loadDraftsList]);

  const saveDraft = async () => {
    if (!activeTemplate) return;
    const id = `${activeTemplate.id}_${Date.now()}`;
    const key = `${STORAGE_PREFIX}${id}`;
    const title =
      saveTitle.trim() ||
      `${activeTemplate.name} — ${data.petitioner || data.client || data.accused || "Untitled"}`;
    const payload = { templateId: activeTemplate.id, data, title, savedAt: Date.now() };
    const res = await storageSet(key, JSON.stringify(payload));
    if (res) {
      flashToast("Draft saved to your library");
      setShowSaveBox(false);
      setSaveTitle("");
    } else {
      flashToast("Could not save — try again");
    }
  };

  const loadDraft = (draft) => {
    const tmpl = allTemplates.find((t) => t.id === draft.templateId);
    if (!tmpl) return;
    setData(draft.data);
    setActiveId(tmpl.id);
    setScreen("editor");
    setShowDrafts(false);
    setMobileTab("form");
    flashToast("Draft loaded — edit freely");
  };

  const deleteDraft = async (key) => {
    await storageDelete(key);
    loadDraftsList();
    flashToast("Draft deleted");
  };

  const setField = (id, val) => setData((d) => ({ ...d, [id]: val }));

  const coverBlocks = useMemo(
    () => (activeTemplate && activeTemplate.generateCover ? activeTemplate.generateCover(data) : null),
    [activeTemplate, data]
  );
  const petitionBlocks = useMemo(() => (activeTemplate ? activeTemplate.generate(data) : []), [activeTemplate, data]);

  // When a backing sheet/docket exists, Page 1 has the Folded Backing Sheet (Docket) and Page 2 has the Main Petition
  const page1Blocks = useMemo(() => (coverBlocks ? coverBlocks : petitionBlocks), [coverBlocks, petitionBlocks]);
  const page2Blocks = useMemo(() => (coverBlocks ? petitionBlocks : null), [coverBlocks, petitionBlocks]);

  const handlePrint = () => {
    const rawTitle = activeTemplate?.name || "Draft";
    const clientName = (data.client || data.accused || data.petitioner || "").trim();
    const safeClient = clientName ? `_${clientName.replace(/[^a-zA-Z0-9_-]/g, "_")}` : "";
    const docTitle = `${rawTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}${safeClient}`;

    const html = pagesToHtml(page1Blocks, page2Blocks, docTitle);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const cleanup = () => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    };
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error("Print error:", e);
        flashToast("Could not open print dialog");
      }
      setTimeout(cleanup, 2000);
    };
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
  };

  /* Word format downloading option (commented out)
  const handleDownloadWord = () => {
    const html = pagesToHtml(page1Blocks, page2Blocks, activeTemplate?.name || "Draft");
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(activeTemplate?.name || "draft").replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    flashToast("Word file downloaded");
  };
  */

  const handleCopy = async () => {
    let text = "";
    if (page2Blocks) {
      text =
        `----- PAGE 1 — FOLDED BACKING SHEET (DOCKET) -----\n\n${blocksToPlainText(page1Blocks)}\n\n` +
        `----- PAGE 2 — MAIN PETITION -----\n\n${blocksToPlainText(page2Blocks)}`;
    } else {
      text = blocksToPlainText(page1Blocks);
    }
    try {
      await navigator.clipboard.writeText(text);
      flashToast("Copied text to clipboard");
    } catch {
      flashToast("Could not copy");
    }
  };

  // Group & Filter templates
  const availableGroups = useMemo(() => {
    const set = new Set(["All"]);
    allTemplates.forEach((t) => set.add(t.group));
    return Array.from(set);
  }, [allTemplates]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchesGroup = selectedGroup === "All" || t.group === selectedGroup;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.sub.toLowerCase().includes(q) ||
        t.group.toLowerCase().includes(q);
      return matchesGroup && matchesQuery;
    });
  }, [allTemplates, selectedGroup, searchQuery]);

  const groupedFiltered = useMemo(() => {
    const g = {};
    filteredTemplates.forEach((t) => {
      g[t.group] = g[t.group] || [];
      g[t.group].push(t);
    });
    return g;
  }, [filteredTemplates]);

  return (
    <div style={styles.app} className="draftmitra-app-wrapper">
      <style>{FONT_IMPORT}</style>

      {screen === "library" && (
        <Library
          groups={groupedFiltered}
          allCount={allTemplates.length}
          filteredCount={filteredTemplates.length}
          onPick={openTemplate}
          onCreateClick={() => {
            setCreateName("");
            setCreateSub("");
            setCreateContent("");
            setShowCreateModal(true);
          }}
          onImportClick={() => setShowImport(true)}
          onDrafts={() => setShowDrafts(true)}
          savedCount={savedDrafts.length}
          customCount={customTemplates.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          availableGroups={availableGroups}
        />
      )}

      {screen === "editor" && activeTemplate && (
        <Editor
          template={activeTemplate}
          data={data}
          setField={setField}
          page1Blocks={page1Blocks}
          page2Blocks={page2Blocks}
          hasCover={Boolean(coverBlocks)}
          mobileTab={mobileTab}
          setMobileTab={setMobileTab}
          onPrint={handlePrint}
          onCopy={handleCopy}
          onSaveClick={() => setShowSaveBox(true)}
          onDrafts={() => setShowDrafts(true)}
          onBack={() => setScreen("library")}
        />
      )}

      {/* CREATE CUSTOM DRAFT MODAL */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="Create New Legal Draft / Petition" wide>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Create a custom legal draft template. Use <code>{"{{variable}}"}</code> tags (e.g. <code>{"{{court}}"}</code>, <code>{"{{client}}"}</code>, <code>{"{{opponent}}"}</code>, <code>{"{{facts}}"}</code>, <code>{"{{prayer}}"}</code>) to automatically generate input fields!
          </p>

          {/* Quick Presets */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Quick Starters:
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DRAFT_STARTER_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  style={styles.btnGhostSm}
                  onClick={() => applyPreset(p)}
                >
                  ⚡ {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={styles.label}>Draft / Petition Title *</label>
              <input
                className="draftmitra-modal-input"
                style={styles.input}
                placeholder="e.g. Criminal Revision Petition"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div>
              <label style={styles.label}>Category / Group</label>
              <input
                className="draftmitra-modal-input"
                style={styles.input}
                placeholder="e.g. Petitions, Notices, Civil, Criminal"
                value={createGroup}
                onChange={(e) => setCreateGroup(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={styles.label}>Court / Jurisdiction Subtitle</label>
            <input
              className="draftmitra-modal-input"
              style={styles.input}
              placeholder="e.g. In the High Court of Judicature at Madras"
              value={createSub}
              onChange={(e) => setCreateSub(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={styles.label}>Draft Template Body *</label>
            <textarea
              className="draftmitra-modal-input"
              style={{ ...styles.textarea, minHeight: 200, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}
              placeholder="Type or paste draft body. Use {{client}}, {{opponent}}, {{court}}, {{caseNo}}, {{facts}}, {{prayer}} for auto-fields..."
              value={createContent}
              onChange={(e) => setCreateContent(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={styles.btnGhost} onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button style={styles.btnPrimaryGold} onClick={handleCreateCustomDraft} disabled={!createName.trim()}>
              <Plus size={15} /> Save & Open Draft
            </button>
          </div>
        </Modal>
      )}

      {/* SAVE DRAFT MODAL */}
      {showSaveBox && (
        <Modal onClose={() => setShowSaveBox(false)} title="Save this draft">
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Saved drafts stay securely in your browser storage. Enter a label to identify this case draft later.
          </p>
          <input
            autoFocus
            className="draftmitra-modal-input"
            style={styles.input}
            placeholder="e.g. Bail Application — Ravi Kumar (Cr. 45/2025)"
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
            <button style={styles.btnGhost} onClick={() => setShowSaveBox(false)}>Cancel</button>
            <button style={styles.btnPrimary} onClick={saveDraft}><Save size={15} /> Save draft</button>
          </div>
        </Modal>
      )}

      {/* SAVED DRAFTS DRAWER */}
      {showDrafts && (
        <Modal onClose={() => setShowDrafts(false)} title="My Saved Drafts" wide>
          {loadingDrafts ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--muted)", padding: "30px 0" }}>
              <Loader2 size={18} className="spin" /> Loading saved drafts…
            </div>
          ) : savedDrafts.length === 0 ? (
            <div style={{ padding: "32px 12px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
              <FolderOpen size={36} color="var(--gold-ink)" style={{ opacity: 0.8, marginBottom: 10 }} />
              <div>No saved drafts yet.</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Select any court template, fill in the details, and hit <b>Save</b> to store it here.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 440, overflowY: "auto", paddingRight: 4 }}>
              {savedDrafts.map((dr) => {
                const tmpl = allTemplates.find((t) => t.id === dr.templateId);
                return (
                  <div key={dr.key} style={styles.draftRow} className="draft-row">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600, fontSize: 14, color: "var(--ink)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}
                      >
                        {dr.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3, display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontWeight: 500, color: "var(--brand-ink)" }}>{tmpl?.name || dr.templateId}</span>
                        <span>•</span>
                        <span>{new Date(dr.savedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={styles.btnGhostSm} title="Load and edit draft" onClick={() => loadDraft(dr)}>
                        <Copy size={14} /> Open
                      </button>
                      <button style={styles.btnDangerSm} title="Delete draft" onClick={() => deleteDraft(dr.key)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {/* AI IMPORT MODAL */}
      {showImport && (
        <Modal onClose={() => !importing && setShowImport(false)} title="AI Draft Importer" wide>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Paste the raw text of any Indian court draft/petition below. Gemini AI automatically detects the variable case details (names, dates, case numbers, offences) and turns the rest into a reusable template.
          </p>
          <textarea
            className="draftmitra-modal-input"
            style={{ ...styles.textarea, minHeight: 220, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}
            placeholder="Paste raw petition text here..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            disabled={importing}
          />
          {importError && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, fontSize: 12.5, color: "var(--brand-ink)", background: "var(--brand-wash)", padding: "10px 12px", borderRadius: 8 }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {importError}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button style={styles.btnGhost} onClick={() => setShowImport(false)} disabled={importing}>Cancel</button>
            <button style={styles.btnPrimary} onClick={runImport} disabled={importing || !importText.trim()}>
              {importing ? <><Loader2 size={15} className="spin" /> Converting draft…</> : <><Sparkles size={15} /> Build AI Template</>}
            </button>
          </div>
        </Modal>
      )}

      {toast && <div style={styles.toast} className="draftmitra-toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------
   Sub-components
----------------------------------------------------------------*/

function Library({
  groups,
  allCount,
  filteredCount,
  onPick,
  onCreateClick,
  onImportClick,
  onDrafts,
  savedCount,
  customCount,
  searchQuery,
  setSearchQuery,
  selectedGroup,
  setSelectedGroup,
  availableGroups,
}) {
  return (
    <main style={styles.libraryMain}>
      {/* Top Hero Navigation */}
      <div className="page-hero-nav">
        <Link to="/" className="btn-back-dashboard">
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          <Link to="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Dashboard</Link>
          <span style={{ margin: "0 8px", color: "var(--muted)" }}>/</span>
          <span style={{ color: "var(--gold-ink)", fontWeight: 600 }}>Legal Drafts Library</span>
        </div>
      </div>

      <div style={styles.libraryIntro}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={styles.eyebrow}>COURT DRAFTING SUITE</div>
            <h1 style={styles.libTitle}>Legal Document Library</h1>
            <p style={styles.libSub}>Fill client and case particulars — DraftMitra formats it with exact court alignment, margins, and Backing Sheets ready for print or filing.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button style={styles.btnPrimaryGold} onClick={onCreateClick}>
              <Plus size={16} />
              <span>+ Add Custom Draft</span>
            </button>
            <button style={styles.btnGhostHeader} className="drafts-nav-btn" onClick={onDrafts}>
              <FolderOpen size={16} />
              <span>My Saved Drafts ({savedCount})</span>
            </button>
            <button className="import-tile-btn" style={styles.importTileBtn} onClick={onImportClick}>
              <Sparkles size={17} color="var(--on-brand)" />
              <span>AI Importer</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Category Filters */}
        <div style={styles.filterSection}>
          <div style={styles.searchBox}>
            <Search size={17} color="var(--muted)" style={styles.searchIcon} />
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Search templates by title, court, section or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button style={styles.clearSearchBtn} onClick={() => setSearchQuery("")}>
                <X size={15} />
              </button>
            )}
          </div>

          <div style={styles.pillContainer}>
            {availableGroups.map((grp) => (
              <button
                key={grp}
                style={selectedGroup === grp ? styles.pillActive : styles.pill}
                onClick={() => setSelectedGroup(grp)}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {Object.keys(groups).length === 0 ? (
        <div style={styles.emptyState}>
          <AlertCircle size={32} color="var(--gold-ink)" style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>No matching templates found</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Try clearing your search query, creating a new draft, or switching categories.</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
            <button style={styles.btnPrimaryGold} onClick={onCreateClick}>
              <Plus size={15} /> Create Custom Draft
            </button>
            <button style={styles.btnGhostSm} onClick={() => { setSearchQuery(""); setSelectedGroup("All"); }}>
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        Object.entries(groups).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 32 }}>
            <div style={styles.groupHeader}>
              <span style={styles.groupLabel}>{group}</span>
              <span style={styles.groupBadge}>{items.length} {items.length === 1 ? "template" : "templates"}</span>
            </div>
            <div style={styles.cardGrid}>
              {items.map((t) => (
                <button key={t.id} style={styles.card} className="draftmitra-card" onClick={() => onPick(t)}>
                  <div className="card-icon" style={styles.cardIcon}>
                    {t.custom ? <Sparkles size={18} color="var(--brand-ink)" /> : <FileText size={19} color="var(--brand-ink)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.cardTitle}>{t.name}</div>
                    <div style={styles.cardSub}>{t.sub}</div>
                  </div>
                  <ChevronRight size={18} color="var(--muted)" className="card-arrow" />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </main>
  );
}

function Editor({ template, data, setField, page1Blocks, page2Blocks, hasCover, mobileTab, setMobileTab, onPrint, onCopy, onSaveClick, onDrafts, onBack }) {
  const page1Parts = useMemo(() => partitionBlocks(page1Blocks), [page1Blocks]);
  const page2Parts = useMemo(() => (page2Blocks ? partitionBlocks(page2Blocks) : null), [page2Blocks]);

  return (
    <main style={styles.editorMain}>
      <div style={styles.editorHead}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <button style={styles.backLink} onClick={onBack} title="Back to Library">
              <ArrowLeft size={15} /> <span>Back to Templates</span>
            </button>
            <span style={{ color: "var(--border)" }}>|</span>
            <Link to="/" style={{ ...styles.backLink, textDecoration: "none" }} title="Return to Dashboard">
              <span>🏠 Dashboard</span>
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 4 }}>
            <span style={styles.eyebrow}>{template.group.toUpperCase()}</span>
            {template.custom && <span style={styles.customBadge}><Sparkles size={11} /> Custom Draft</span>}
          </div>
          <h2 style={styles.editorTitle}>{template.name}</h2>
          <div style={styles.editorSub}>{template.sub}</div>
        </div>
        <div style={styles.actionRow}>
          <button style={styles.btnGhost} onClick={onDrafts} title="View saved drafts">
            <FolderOpen size={15} /> <span>My Drafts</span>
          </button>
          <button style={styles.btnGhost} onClick={onSaveClick} title="Save draft locally">
            <Save size={15} /> <span>Save</span>
          </button>
          <button style={styles.btnGhost} onClick={onCopy} title="Copy plain text">
            <Copy size={15} /> <span>Copy</span>
          </button>
          {/* Word format downloading option (commented out as requested)
          <button style={styles.btnGhost} onClick={onDownloadWord} title="Export to Microsoft Word">
            <Download size={15} /> <span>Word</span>
          </button>
          */}
          <button style={styles.btnPrimaryGold} onClick={onPrint} title="Print or save as PDF">
            <Printer size={15} /> <span>Print / PDF</span>
          </button>
        </div>
      </div>

      <div className="mobile-tabs" style={styles.mobileTabs}>
        <button style={mobileTab === "form" ? styles.mtabActive : styles.mtab} onClick={() => setMobileTab("form")}>Fill Details</button>
        <button style={mobileTab === "preview" ? styles.mtabActive : styles.mtab} onClick={() => setMobileTab("preview")}>Court Preview</button>
      </div>

      <div style={styles.editorGrid} className="editor-grid">
        <div style={styles.formPane} className={`form-pane ${mobileTab === "form" ? "mobile-active" : ""}`}>
          <div style={styles.formPaneHeader}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>Case & Party Particulars</span>
            <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{template.fields.length} Fields</span>
          </div>

          <div style={styles.formGrid}>
            {template.fields.map((f) => (
              <div key={f.id} style={{ gridColumn: f.w === "half" ? "span 1" : "span 2" }}>
                <label style={styles.label}>{f.label}</label>
                {f.area ? (
                  <textarea
                    style={styles.textarea}
                    rows={4}
                    placeholder={f.ph || `Enter ${f.label.toLowerCase()}`}
                    value={data[f.id] || ""}
                    onChange={(e) => setField(f.id, e.target.value)}
                  />
                ) : (
                  <input
                    style={styles.input}
                    placeholder={f.ph || `Enter ${f.label.toLowerCase()}`}
                    value={data[f.id] || ""}
                    onChange={(e) => setField(f.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          <div style={styles.hintBox}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1, color: "var(--gold-ink)" }} />
            <span>Changes reflect live in the official court paper view on the right. Export cleanly to PDF or Print anytime.</span>
          </div>
        </div>

        <div style={styles.previewPane} className={`preview-pane ${mobileTab === "preview" ? "mobile-active" : ""}`}>
          {hasCover ? (
            <>
              {/* PAGE 1: Folded Backing Sheet (Docket) */}
              <div style={styles.pageLabel}>PAGE 1 — FOLDED BACKING SHEET (DOCKET)</div>
              <div style={styles.paper} className="paper">
                <div style={styles.paperRedLine} />
                <div style={styles.foldLine} />
                <div style={styles.foldRow}>
                  <div style={styles.foldSpacer} />
                  <div style={styles.foldContent}>
                    {page1Blocks.map((b, i) => (
                      <RenderBlock key={i} block={b} folded />
                    ))}
                  </div>
                </div>
              </div>

              {/* PAGE 2: Main Petition */}
              <div style={{ marginTop: 28 }}>
                <div style={styles.pageLabel}>PAGE 2 — MAIN PETITION</div>
                <div style={styles.paper} className="paper">
                  <div style={styles.paperRedLine} />
                  <div style={styles.petitionWrapper}>
                    <div style={styles.paperContent}>
                      {page2Parts.main.map((b, i) => (
                        <RenderBlock key={i} block={b} />
                      ))}
                    </div>
                    {page2Parts.footer.length > 0 && (
                      <div style={styles.petitionFooter}>
                        {page2Parts.footer.map((b, i) => (
                          <RenderBlock key={i} block={b} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Single page draft without backing sheet */}
              <div style={styles.pageLabel}>PAGE 1 — MAIN PETITION</div>
              <div style={styles.paper} className="paper">
                <div style={styles.paperRedLine} />
                <div style={styles.petitionWrapper}>
                  <div style={styles.paperContent}>
                    {page1Parts.main.map((b, i) => (
                      <RenderBlock key={i} block={b} />
                    ))}
                  </div>
                  {page1Parts.footer.length > 0 && (
                    <div style={styles.petitionFooter}>
                      {page1Parts.footer.map((b, i) => (
                        <RenderBlock key={i} block={b} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function RenderBlock({ block, folded }) {
  if (block.t === "small") {
    return <div style={{ textAlign: "center", fontSize: 11.5, color: "#666", margin: "2px 0 6px" }}>{block.v}</div>;
  }
  if (block.t === "titleTop") {
    return <div style={{ textAlign: "center", fontWeight: 700, fontSize: 16, textDecoration: "underline", letterSpacing: 2, margin: "0 0 12px", textTransform: "uppercase" }}>{block.v}</div>;
  }
  if (block.t === "center") {
    return <div style={{ textAlign: "center", fontWeight: 700, margin: "8px 0", letterSpacing: 0.3, whiteSpace: "pre-line", fontSize: 14.5 }}>{block.v}</div>;
  }
  if (block.t === "title") {
    return <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15.5, textDecoration: "underline", margin: "16px 0 12px", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "pre-line" }}>{block.v}</div>;
  }
  if (block.t === "versus" || block.t === "vs") {
    return <div style={{ textAlign: "center", fontStyle: "italic", margin: "6px 0", color: "#666", fontSize: 13.5 }}>— Versus —</div>;
  }
  if (block.t === "party") {
    return folded ? (
      <div style={{ margin: "6px 0", lineHeight: 1.5 }}>
        <strong>{block.v}</strong>
        {block.role && <div style={{ fontSize: 12.5, fontStyle: "italic", color: "#555" }}>...{block.role.replace(/^\.\.\./, "")}</div>}
      </div>
    ) : (
      <div style={{ margin: "4px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <strong style={{ whiteSpace: "pre-line" }}>{block.v}</strong>
        {block.role && <div style={{ fontSize: 13, fontStyle: "italic", color: "#555", whiteSpace: "nowrap" }}>...{block.role.replace(/^\.\.\./, "")}</div>}
      </div>
    );
  }
  if (block.t === "left") {
    return <div style={{ margin: "4px 0", whiteSpace: "pre-line" }}>{block.v}</div>;
  }
  if (block.t === "right") {
    return <div style={{ textAlign: "right", margin: "4px 0", whiteSpace: "pre-line" }}>{block.v}</div>;
  }
  if (block.t === "num") {
    return (
      <p style={{ margin: "10px 0", textAlign: "justify", textIndent: 24, lineHeight: 1.75 }}>
        <strong>{block.n}.</strong>&nbsp;&nbsp;{block.v}
      </p>
    );
  }
  if (block.t === "para") {
    return <p style={{ margin: "10px 0", textAlign: "justify", textIndent: folded ? 0 : 28, lineHeight: 1.75 }}>{block.v}</p>;
  }
  if (block.t === "prayer") {
    return (
      <div style={{ margin: "16px 0", padding: "12px 16px", background: "rgba(0,0,0,0.02)", borderLeft: "3.5px solid #b8935e" }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>PRAYER:</div>
        <p style={{ margin: 0, textAlign: "justify", lineHeight: 1.75 }}>{block.v}</p>
      </div>
    );
  }
  if (block.t === "table") {
    const rows = block.rows || [];
    return (
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1.5px solid #222", margin: "14px 0", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f2f2f2" }}>
            <th style={{ border: "1px solid #222", padding: "6px 4px", textAlign: "center", width: "8%" }}>S. No.</th>
            <th style={{ border: "1px solid #222", padding: "6px 4px", textAlign: "left", width: "22%" }}>Date of Filing</th>
            <th style={{ border: "1px solid #222", padding: "6px 4px", textAlign: "left", width: "22%" }}>Date of Doc</th>
            <th style={{ border: "1px solid #222", padding: "6px 4px", textAlign: "left", width: "30%" }}>Description of Documents</th>
            <th style={{ border: "1px solid #222", padding: "6px 4px", textAlign: "left", width: "18%" }}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ border: "1px solid #222", padding: "6px 4px", textAlign: "center" }}>{r.sno}</td>
              <td style={{ border: "1px solid #222", padding: "6px 4px" }}>{r.filedDate}</td>
              <td style={{ border: "1px solid #222", padding: "6px 4px" }}>{r.docDate}</td>
              <td style={{ border: "1px solid #222", padding: "6px 4px" }}>{r.desc}</td>
              <td style={{ border: "1px solid #222", padding: "6px 4px" }}>{r.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (block.t === "signdual") {
    return (
      <div style={{ marginTop: 36, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontWeight: 700, fontSize: 14 }}>
        <div>{block.left || "Accused"}</div>
        <div style={{ textAlign: "right" }}>{block.right || "Counsel for Accused"}</div>
      </div>
    );
  }
  if (block.t === "signblock") {
    const raw = block.v || "";
    if (raw.includes("\t") || /\s{4,}/.test(raw)) {
      const parts = raw.split(/\t|\s{4,}/);
      const leftPart = parts[0] || "";
      const rightPart = parts[1] || "";
      return (
        <div style={{ marginTop: 36, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontWeight: 700, fontSize: 14 }}>
          <div>{leftPart.trim()}</div>
          <div style={{ textAlign: "right" }}>{rightPart.trim()}</div>
        </div>
      );
    }
    return <div style={{ marginTop: 20, textAlign: "right", whiteSpace: "pre-line", lineHeight: 1.6, fontSize: 14 }}>{raw}</div>;
  }
  if (block.t === "sign") {
    return (
      <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          {block.place && <div>Place: {block.place}</div>}
          {block.date && <div>Date: {block.date}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ borderTop: "1px solid #333", paddingTop: 4, width: 160, textAlign: "center", marginLeft: "auto" }}>
            {block.label || "Advocate for Petitioner"}
          </div>
        </div>
      </div>
    );
  }
  if (block.t === "space") {
    return <div style={{ height: 10 }} />;
  }
  if (block.t === "pre") {
    return <pre style={{ fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.4, whiteSpace: "pre-wrap", margin: "10px 0", padding: 8, background: "#f9f9f9", border: "1px solid #ddd" }}>{block.v}</pre>;
  }
  return <div style={{ margin: "6px 0", whiteSpace: "pre-line" }}>{block.v}</div>;
}

function Modal({ children, onClose, title, wide }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={{ ...styles.modalBox, maxWidth: wide ? 700 : 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.modalHead}>
          <h3 style={styles.modalTitle}>{title}</h3>
          <button style={styles.iconBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap');

:root {
  --paper-white: #ffffff;
  --surface-2: #f8fafc;
  --border: #e2e8f0;
  --ink: #0f172a;
  --text: #334155;
  --muted: #64748b;
  --brand: #0f172a;
  --on-brand: #ffffff;
  --brand-ink: #0f172a;
  --brand-wash: #f1f5f9;
  --brand-shadow: rgba(15, 23, 42, 0.15);
  --gold: #b8935e;
  --gold-ink: #b8935e;
  --gold-wash: rgba(184, 147, 94, 0.12);
  --danger-wash: #fef2f2;
  --danger-ink: #dc2626;
  --danger-border: #fecaca;
  --hint-bg: #fffbeb;
  --hint-text: #92400e;
  --hint-border: #fef3c7;
  --line-red: #f87171;
  --toast-bg: #0f172a;
  --toast-fg: #ffffff;
  --overlay: rgba(15, 23, 42, 0.55);
  --card-shadow: rgba(0, 0, 0, 0.06);
}

body.dark, [data-theme='dark'] {
  --paper-white: #0e1524;
  --surface-2: #131c2c;
  --border: #1e2a3e;
  --ink: #f8fafc;
  --text: #cbd5e1;
  --muted: #94a3b8;
  --brand: #b8935e;
  --on-brand: #0b1526;
  --brand-ink: #b8935e;
  --brand-wash: rgba(184, 147, 94, 0.15);
  --gold: #b8935e;
  --gold-ink: #d4af37;
  --gold-wash: rgba(212, 175, 55, 0.15);
  --danger-wash: rgba(239, 68, 68, 0.15);
  --danger-ink: #f87171;
  --danger-border: rgba(239, 68, 68, 0.3);
  --hint-bg: rgba(245, 158, 11, 0.12);
  --hint-text: #fbbf24;
  --hint-border: rgba(245, 158, 11, 0.25);
  --toast-bg: #1e293b;
  --toast-fg: #f8fafc;
  --overlay: rgba(3, 7, 15, 0.75);
  --card-shadow: rgba(0, 0, 0, 0.5);
}

.draftmitra-card {
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.draftmitra-card:hover {
  transform: translateY(-2px) !important;
  border-color: var(--gold) !important;
  box-shadow: 0 6px 20px var(--card-shadow) !important;
}
.draftmitra-card:hover .card-icon {
  background: var(--gold) !important;
}
.draftmitra-card:hover .card-icon svg {
  stroke: #0b1526 !important;
}
.draftmitra-card:hover .card-arrow {
  stroke: var(--gold-ink) !important;
  transform: translateX(2px);
}

.import-tile-btn {
  transition: all 0.22s ease !important;
}
.import-tile-btn:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 14px var(--brand-shadow) !important;
}

.drafts-nav-btn:hover, .draft-row:hover {
  border-color: var(--gold) !important;
}

.mobile-tabs { display: none; }
@media (max-width: 860px) {
  .mobile-tabs { display: flex !important; }
  .editor-grid { grid-template-columns: 1fr !important; }
  .form-pane, .preview-pane { display: none !important; }
  .form-pane.mobile-active, .preview-pane.mobile-active { display: block !important; }
  .form-pane { position: static !important; }
}

.draftmitra-app-wrapper input::placeholder,
.draftmitra-app-wrapper textarea::placeholder {
  color: var(--muted);
  opacity: 1;
}
body.dark .draftmitra-app-wrapper input,
body.dark .draftmitra-app-wrapper textarea,
body.dark .draftmitra-modal-input {
  background: var(--surface-2) !important;
}
body.dark .preview-pane .paper {
  background: #FBF8F1 !important;
  color: #241f1a !important;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5) !important;
}
body.dark .preview-pane .paper * {
  color: #241f1a !important;
}
body.dark .preview-pane .paper svg {
  stroke: #241f1a !important;
}
`;

const styles = {
  app: { minHeight: "100vh", background: "transparent", fontFamily: "'Inter', sans-serif", color: "var(--text)", transition: "background 0.3s ease" },
  libraryMain: { maxWidth: 1120, margin: "0 auto", padding: "16px 20px 60px" },
  libraryIntro: { marginBottom: 28 },
  eyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: "var(--gold-ink)", textTransform: "uppercase" },
  libTitle: { fontFamily: "'Source Serif 4', serif", fontSize: 32, fontWeight: 700, margin: "6px 0 8px", color: "var(--ink)" },
  libSub: { fontSize: 14, color: "var(--muted)", maxWidth: 660, lineHeight: 1.55 },
  importTileBtn: { display: "flex", alignItems: "center", gap: 8, background: "var(--brand)", color: "var(--on-brand)", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px var(--brand-shadow)" },
  btnGhostHeader: { display: "flex", alignItems: "center", gap: 8, background: "var(--paper-white)", color: "var(--ink)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" },
  btnPrimaryGold: { display: "inline-flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg, #d4af37 0%, #b8860b 50%, #996515 100%)", color: "#0b1526", border: "1px solid rgba(212, 175, 55, 0.6)", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(184, 147, 94, 0.35)", transition: "all 0.2s" },

  filterSection: { marginTop: 22, display: "flex", flexDirection: "column", gap: 14 },
  searchBox: { position: "relative", width: "100%" },
  searchIcon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },
  searchInput: { width: "100%", padding: "12px 38px 12px 42px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--paper-white)", color: "var(--text)", fontSize: 13.5, outline: "none", boxShadow: "0 2px 6px rgba(0,0,0,0.02)", transition: "all 0.2s" },
  clearSearchBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: 4, borderRadius: 4, display: "flex" },

  pillContainer: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  pill: { background: "var(--paper-white)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 20, padding: "6px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" },
  pillActive: { background: "var(--brand)", border: "1px solid var(--brand)", color: "var(--on-brand)", borderRadius: 20, padding: "6px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },

  groupHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  groupLabel: { fontSize: 13, fontWeight: 700, color: "var(--ink)", letterSpacing: 0.3, textTransform: "uppercase" },
  groupBadge: { fontSize: 11, fontWeight: 600, background: "var(--gold-wash)", color: "var(--gold-ink)", borderRadius: 12, padding: "2px 8px" },

  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 },
  card: { display: "flex", alignItems: "center", gap: 14, background: "var(--paper-white)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "16px", cursor: "pointer", textAlign: "left" },
  cardIcon: { width: 38, height: 38, borderRadius: 10, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.22s" },
  cardTitle: { fontSize: 14.5, fontWeight: 600, color: "var(--ink)" },
  cardSub: { fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.3 },

  customBadge: { display: "inline-flex", alignItems: "center", gap: 4, background: "var(--gold-wash)", color: "var(--gold-ink)", borderRadius: 6, padding: "2px 7px", fontSize: 10.5, fontWeight: 600 },

  emptyState: { padding: "48px 24px", textAlign: "center", background: "var(--paper-white)", border: "1px dashed var(--border)", borderRadius: 14, margin: "20px 0" },

  editorMain: { maxWidth: 1240, margin: "0 auto", padding: "16px 20px 60px" },
  editorHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 18 },
  backLink: { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--gold-ink)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 },
  editorTitle: { fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, margin: "4px 0 2px", color: "var(--ink)" },
  editorSub: { fontSize: 13.5, color: "var(--muted)" },
  actionRow: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  btnPrimary: { display: "flex", alignItems: "center", gap: 7, background: "var(--brand)", color: "var(--on-brand)", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px var(--brand-shadow)" },
  btnGhost: { display: "flex", alignItems: "center", gap: 7, background: "var(--paper-white)", color: "var(--ink)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" },
  btnGhostSm: { display: "inline-flex", alignItems: "center", gap: 5, background: "var(--paper-white)", color: "var(--ink)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  btnDangerSm: { display: "inline-flex", alignItems: "center", gap: 5, background: "var(--danger-wash)", color: "var(--danger-ink)", border: "1px solid var(--danger-border)", borderRadius: 6, padding: "6px 10px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" },

  mobileTabs: { gap: 8, marginBottom: 16 },
  mtab: { flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--border)", background: "var(--paper-white)", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  mtabActive: { flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--brand)", background: "var(--brand)", color: "var(--on-brand)", fontSize: 13, fontWeight: 600, cursor: "pointer" },

  editorGrid: { display: "grid", gridTemplateColumns: "400px 1fr", gap: 20, alignItems: "start" },
  formPane: { background: "var(--paper-white)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 20, position: "sticky", top: 20, transition: "all 0.3s ease" },
  formPaneHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--border)" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 12px" },
  label: { display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 6, letterSpacing: 0.2 },
  input: { width: "100%", padding: "9.5px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 13.5, background: "var(--paper-white)", color: "var(--text)", outline: "none", transition: "all 0.2s" },
  textarea: { width: "100%", padding: "9.5px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 13.5, background: "var(--paper-white)", color: "var(--text)", outline: "none", resize: "vertical", fontFamily: "inherit", transition: "all 0.2s" },
  hintBox: { marginTop: 18, display: "flex", gap: 9, fontSize: 12, lineHeight: 1.5, color: "var(--hint-text)", background: "var(--hint-bg)", border: "1px solid var(--hint-border)", borderRadius: 10, padding: "11px 13px" },

  previewPane: { minWidth: 0 },
  pageLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: "var(--muted)", marginBottom: 7, textTransform: "uppercase" },
  paper: { background: "#FBF8F1", borderRadius: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 10px 30px var(--card-shadow)", position: "relative", padding: "54px 36px 44px 60px", minHeight: 600, transition: "box-shadow 0.3s ease" },
  paperRedLine: { position: "absolute", left: 36, top: 0, bottom: 0, width: 1.5, background: "var(--line-red)", opacity: 0.6 },
  paperContent: { fontFamily: "'Source Serif 4', serif", fontSize: 14.5, lineHeight: 1.75, color: "#241f1a" },
  foldLine: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 0, borderLeft: "1.5px dashed #B8AA8A" },
  foldRow: { display: "flex", minHeight: 520 },
  foldSpacer: { flex: "0 0 50%" },
  foldContent: { flex: "0 0 48%", minWidth: 0, fontFamily: "'Source Serif 4', serif", fontSize: 14, lineHeight: 1.7, color: "#241f1a", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  petitionWrapper: { minHeight: 520, display: "flex", flexDirection: "column", justifyContent: "space-between" },
  petitionFooter: { marginTop: "auto", paddingTop: 32 },

  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--toast-bg)", color: "var(--toast-fg)", padding: "11px 18px", borderRadius: 10, fontSize: 13.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 9, zIndex: 60, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" },
  modalOverlay: { position: "fixed", inset: 0, background: "var(--overlay)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 },
  modalBox: { background: "var(--paper-white)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 22, width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.3)", transition: "all 0.3s ease" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid var(--border)" },
  modalTitle: { fontFamily: "'Source Serif 4', serif", fontSize: 19, fontWeight: 700, color: "var(--ink)" },
  iconBtn: { background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", transition: "all 0.2s" },
  draftRow: { display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", background: "var(--paper-white)", transition: "all 0.2s" },
};
