import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Scale, FileText, ChevronRight, Printer, Download, Save, Copy,
  Trash2, X, Check, FolderOpen, ArrowLeft, AlertCircle, Loader2, Sparkles,
  Search, Filter
} from "lucide-react";

import {
  TEMPLATES, F, blocksToPlainText, buildDocumentHtml,
  paramsFromCustomTemplate, generateFromCustomTemplate,
} from "./templates";
import { storageGet, storageSet, storageDelete, storageList } from "./storage";
import { importDraftWithAI } from "./aiImport";
import { useAuth } from "../../context/AuthContext";

const STORAGE_PREFIX = "draft:";
const CUSTOM_TPL_PREFIX = "customtpl:";

/* Page 1 + (optional) folded backing sheet as one printable document. */
const pagesToHtml = buildDocumentHtml;

/* ---------------------------------------------------------------
   Main component — usage:
     import DraftMitra from "./features/draftmitra/DraftMitra";
     <Route path="/templates" element={<DraftMitra />} />
 ----------------------------------------------------------------*/

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

  const [customTemplates, setCustomTemplates] = useState([]);
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

  const page1Blocks = useMemo(() => (activeTemplate ? activeTemplate.generate(data) : []), [activeTemplate, data]);
  const page2Blocks = useMemo(
    () => (activeTemplate && activeTemplate.generateCover ? activeTemplate.generateCover(data) : null),
    [activeTemplate, data]
  );

  const handlePrint = () => {
    const html = pagesToHtml(page1Blocks, page2Blocks, activeTemplate?.name || "Draft");
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    const cleanup = () => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    };
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch {
        flashToast("Could not open print dialog — try the Word download instead");
      }
      setTimeout(cleanup, 1500);
    };
  };

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

  const handleCopy = async () => {
    const text =
      blocksToPlainText(page1Blocks) +
      (page2Blocks ? `\n\n----- PAGE 2 — BACKING SHEET -----\n\n${blocksToPlainText(page2Blocks)}` : "");
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
          mobileTab={mobileTab}
          setMobileTab={setMobileTab}
          onPrint={handlePrint}
          onDownload={handleDownloadWord}
          onCopy={handleCopy}
          onSaveClick={() => setShowSaveBox(true)}
          onDrafts={() => setShowDrafts(true)}
          onBack={() => setScreen("library")}
        />
      )}

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
      <div style={styles.libraryIntro}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={styles.eyebrow}>COURT DRAFTING SUITE</div>
            <h1 style={styles.libTitle}>Legal Document Library</h1>
            <p style={styles.libSub}>Fill client and case particulars — DraftMitra formats it with exact court alignment, margins, and Backing Sheets ready for print or filing.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button style={styles.btnGhostHeader} className="drafts-nav-btn" onClick={onDrafts}>
              <FolderOpen size={16} />
              <span>My Saved Drafts</span>
            </button>
            <button className="import-tile-btn" style={styles.importTileBtn} onClick={onImportClick}>
              <Sparkles size={17} color="var(--on-brand)" />
              <span>AI Draft Importer</span>
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
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Try clearing your search query or switching categories.</div>
          <button style={{ ...styles.btnGhostSm, marginTop: 14 }} onClick={() => { setSearchQuery(""); setSelectedGroup("All"); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        Object.entries(groups).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 32 }}>
            <div style={styles.groupHeader}>
              <span style={styles.groupLabel}>{group}</span>
              <span style={styles.groupBadge}>{items.length} {items.length === 1 ? 'template' : 'templates'}</span>
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

function Editor({ template, data, setField, page1Blocks, page2Blocks, mobileTab, setMobileTab, onPrint, onDownload, onCopy, onSaveClick, onDrafts, onBack }) {
  return (
    <main style={styles.editorMain}>
      <div style={styles.editorHead}>
        <div>
          <button style={styles.backLink} onClick={onBack} title="Back to Library">
            <ArrowLeft size={15} /> <span>Back to Templates</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 4 }}>
            <span style={styles.eyebrow}>{template.group.toUpperCase()}</span>
            {template.custom && <span style={styles.customBadge}><Sparkles size={11} /> AI Custom</span>}
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
          <button style={styles.btnGhost} onClick={onDownload} title="Export to Microsoft Word">
            <Download size={15} /> <span>Word</span>
          </button>
          <button style={styles.btnPrimary} onClick={onPrint} title="Print or save as PDF">
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
                    rows={3}
                    placeholder={f.ph || `Enter ${f.label.toLowerCase()}...`}
                    value={data[f.id] ?? ""}
                    onChange={(e) => setField(f.id, e.target.value)}
                  />
                ) : (
                  <input
                    style={styles.input}
                    placeholder={f.ph || `Enter ${f.label.toLowerCase()}...`}
                    value={data[f.id] ?? ""}
                    onChange={(e) => setField(f.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          <div style={styles.hintBox}>
            <AlertCircle size={15} color="var(--gold-ink)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Review all court names, crime numbers, and section references before printing. This draft serves as an aid for advocate verification.</span>
          </div>
        </div>

        <div style={styles.previewPane} className={`preview-pane ${mobileTab === "preview" ? "mobile-active" : ""}`}>
          <div style={styles.pageLabel}>Page 1 — Petition</div>
          <div style={styles.paper} className="paper">
            <div style={styles.paperRedLine} />
            <div style={styles.paperContent}>
              {page1Blocks.map((b, i) => (
                <Block key={i} b={b} />
              ))}
            </div>
          </div>

          {page2Blocks && (
            <>
              <div style={{ ...styles.pageLabel, marginTop: 24 }}>
                Page 2 — Backing sheet / docket (folds to face out)
              </div>
              <div style={styles.paper} className="paper">
                <div style={styles.foldLine} />
                <div style={styles.foldRow}>
                  <div style={styles.foldSpacer} />
                  <div style={styles.foldContent}>
                    {page2Blocks.map((b, i) => (
                      <Block key={i} b={b} folded />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Block({ b, folded }) {
  switch (b.t) {
    case "small":
      return <p style={{ textAlign: "center", fontSize: 11, margin: "0 0 4px", color: "#555", whiteSpace: "pre-line" }}>{b.v}</p>;
    case "titleTop":
      return <p style={{ textAlign: "center", fontWeight: 700, textDecoration: "underline", letterSpacing: 2, margin: "0 0 10px", whiteSpace: "pre-line" }}>{b.v}</p>;
    case "center":
      return <p style={{ textAlign: "center", fontWeight: 700, margin: "0 0 6px", whiteSpace: "pre-line" }}>{b.v}</p>;
    case "left":
      return <p style={{ margin: "0 0 2px", whiteSpace: "pre-line" }}>{b.v}</p>;
    case "right":
      return <p style={{ textAlign: "right", margin: "0 0 2px", whiteSpace: "pre-line" }}>{b.v}</p>;
    case "party":
      return folded ? (
        <p style={{ margin: "0 0 6px" }}>
          <span style={{ display: "block", whiteSpace: "pre-line" }}>{b.v}</span>
          <span style={{ display: "block", fontSize: 12, color: "#444" }}>{b.role}</span>
        </p>
      ) : (
        <p style={{ margin: "0 0 2px", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span style={{ whiteSpace: "pre-line" }}>{b.v}</span><span style={{ whiteSpace: "nowrap", color: "#444" }}>{b.role}</span>
        </p>
      );
    case "versus":
      return <p style={{ textAlign: "center", fontStyle: "italic", margin: "4px 0" }}>Versus</p>;
    case "title":
      return <p style={{ textAlign: "center", fontWeight: 700, textDecoration: "underline", margin: "14px 0", whiteSpace: "pre-line" }}>{b.v}</p>;
    case "num":
      return <p style={{ margin: "0 0 10px", textAlign: folded ? "left" : "justify", whiteSpace: "pre-line" }}><b>{b.n}.</b> {b.v}</p>;
    case "para":
      return <p style={{ margin: "0 0 10px", textAlign: folded ? "left" : "justify", whiteSpace: "pre-line" }}>{b.v}</p>;
    case "signblock":
      return <p style={{ margin: "24px 0 0", textAlign: "right", whiteSpace: "pre-line" }}>{b.v}</p>;
    case "space":
      return <div style={{ height: 8 }} />;
    case "pre":
      return <pre style={{ fontFamily: "monospace", fontSize: 11, whiteSpace: "pre-wrap", overflowX: "auto", margin: "10px 0", background: "#f9f9f9", padding: 8, border: "1px solid #eee", color: "#333" }}>{b.v}</pre>;
    default:
      return null;
  }
}

function Modal({ children, onClose, title, wide }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose} className="draftmitra-modal-overlay">
      <div style={{ ...styles.modalBox, maxWidth: wide ? 520 : 420 }} onClick={(e) => e.stopPropagation()} className="draftmitra-modal-box">
        <div style={styles.modalHead}>
          <div style={styles.modalTitle}>{title}</div>
          <button style={styles.iconBtn} onClick={onClose}><X size={17} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Styles
----------------------------------------------------------------*/

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');

/* ------------------------------------------------------------------
   Palette. Two rules keep this readable in both themes:

   1. A brand colour used as a SOLID FILL and the same brand colour used
      as TEXT/ICON on a surface cannot be the same value. --brand stays
      deep enough for white text to sit on it; --brand-ink is the tint
      that reads against a card. Collapsing the two is what made the
      maroon card icons vanish.
   2. Anything that pairs a background with a foreground declares both.
      --toast-bg/--toast-fg exist because the toast used to take its
      background from --ink, which flips to near-white in dark mode and
      left white text on a white pill.
   ------------------------------------------------------------------ */
:root {
  --ink: #1C2B39;
  --paper-white: #ffffff;
  --surface-2: #f8fafc;
  --text: #2B2725;
  --muted: #64748b;
  --border: #e2e8f0;

  --brand: #7A2E2E;
  --on-brand: #ffffff;
  --brand-ink: #7A2E2E;
  --brand-wash: rgba(122,46,46,0.10);
  --brand-shadow: rgba(122,46,46,0.25);

  --gold: #A9812F;
  --gold-ink: #7d6023;
  --gold-wash: rgba(169,129,47,0.14);

  --danger-ink: #B5433D;
  --danger-wash: rgba(181,67,61,0.08);
  --danger-border: rgba(181,67,61,0.22);

  --hint-bg: #F7EFD9;
  --hint-border: #E9D9B0;
  --hint-text: #6b5a33;

  --toast-bg: #1C2B39;
  --toast-fg: #ffffff;

  --overlay: rgba(28,43,57,0.5);
  --card-shadow: rgba(28,43,57,0.08);

  /* The preview sheet is deliberately paper-coloured in both themes —
     it stands in for the printed page, so it does not invert. */
  --line-red: #B5433D;
}

body.dark {
  --ink: #f5f7fa;
  --paper-white: #0e1524;
  --surface-2: #131c2c;
  --text: #a7b2c4;
  --muted: #94a3b8;
  --border: #1e2a3e;

  --brand: #8f3a3a;
  --brand-ink: #e79a92;
  --brand-wash: rgba(231,154,146,0.12);
  --brand-shadow: rgba(0,0,0,0.45);

  --gold: #c9a145;
  --gold-ink: #d8b163;
  --gold-wash: rgba(201,161,69,0.16);

  --danger-ink: #ef8079;
  --danger-wash: rgba(239,128,121,0.12);
  --danger-border: rgba(239,128,121,0.30);

  --hint-bg: rgba(201,161,69,0.10);
  --hint-border: rgba(201,161,69,0.28);
  --hint-text: #cbb27a;

  --toast-bg: #24324a;
  --toast-fg: #ffffff;

  --overlay: rgba(3,7,15,0.66);
  --card-shadow: rgba(0,0,0,0.45);
}

* { box-sizing: border-box; }
input, textarea, button { font-family: 'Inter', sans-serif; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Micro-animations & card hover.

   lucide-react v1 renders the \`color\` prop as the SVG's stroke
   ATTRIBUTE, so recolouring an icon from CSS has to target \`stroke\`.
   The old rules set \`color\`, which the stroke attribute ignores — the
   icon kept its maroon strokes while the tile behind it turned solid
   maroon on hover, so the document icon disappeared into the fill. */
.draftmitra-card {
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.draftmitra-card:hover {
  transform: translateY(-2px) !important;
  border-color: var(--gold) !important;
  box-shadow: 0 6px 20px var(--card-shadow) !important;
}
.draftmitra-card:hover .card-icon {
  background: var(--brand) !important;
}
.draftmitra-card:hover .card-icon svg {
  stroke: var(--on-brand) !important;
}
.draftmitra-card:hover .card-arrow {
  stroke: var(--brand-ink) !important;
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

/* Dark mode. Surfaces come from the tokens above; only the printed-page
   preview needs pinning, since it must stay paper-coloured. */
/* The fields carry inline styles, so the dark surface needs !important
   to win. Placeholders can't be set inline at all. */
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
  libraryMain: { maxWidth: 1080, margin: "0 auto", padding: "32px 24px 60px" },
  libraryIntro: { marginBottom: 28 },
  eyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: "var(--brand-ink)", textTransform: "uppercase" },
  libTitle: { fontFamily: "'Source Serif 4', serif", fontSize: 32, fontWeight: 700, margin: "6px 0 8px", color: "var(--ink)" },
  libSub: { fontSize: 14.5, color: "var(--muted)", maxWidth: 620, lineHeight: 1.55 },
  importTileBtn: { display: "flex", alignItems: "center", gap: 8, background: "var(--brand)", color: "var(--on-brand)", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px var(--brand-shadow)" },
  btnGhostHeader: { display: "flex", alignItems: "center", gap: 8, background: "var(--paper-white)", color: "var(--ink)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 16px", fontSize: 13.5, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" },

  filterSection: { marginTop: 24, display: "flex", flexDirection: "column", gap: 14 },
  searchBox: { position: "relative", width: "100%" },
  searchIcon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },
  searchInput: { width: "100%", padding: "12px 38px 12px 42px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--paper-white)", color: "var(--text)", fontSize: 14, outline: "none", boxShadow: "0 2px 6px rgba(0,0,0,0.02)", transition: "all 0.2s" },
  clearSearchBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: 4, borderRadius: 4, display: "flex" },
  
  pillContainer: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  pill: { background: "var(--paper-white)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 20, padding: "6px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" },
  pillActive: { background: "var(--brand)", border: "1px solid var(--brand)", color: "var(--on-brand)", borderRadius: 20, padding: "6px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },

  groupHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  groupLabel: { fontSize: 13, fontWeight: 700, color: "var(--ink)", letterSpacing: 0.3, textTransform: "uppercase" },
  groupBadge: { fontSize: 11, fontWeight: 600, background: "var(--gold-wash)", color: "var(--gold-ink)", borderRadius: 12, padding: "2px 8px" },

  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 },
  card: { display: "flex", alignItems: "center", gap: 14, background: "var(--paper-white)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px", cursor: "pointer", textAlign: "left" },
  cardIcon: { width: 38, height: 38, borderRadius: 10, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.22s" },
  cardTitle: { fontSize: 14.5, fontWeight: 600, color: "var(--ink)" },
  cardSub: { fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.3 },
  
  customBadge: { display: "inline-flex", alignItems: "center", gap: 4, background: "var(--brand-wash)", color: "var(--brand-ink)", borderRadius: 6, padding: "2px 7px", fontSize: 10.5, fontWeight: 600 },
  
  emptyState: { padding: "48px 24px", textAlign: "center", background: "var(--paper-white)", border: "1px dashed var(--border)", borderRadius: 14, margin: "20px 0" },

  editorMain: { maxWidth: 1240, margin: "0 auto", padding: "24px 24px 60px" },
  editorHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 18 },
  backLink: { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--brand-ink)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 6 },
  editorTitle: { fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, margin: "4px 0 2px", color: "var(--ink)" },
  editorSub: { fontSize: 13.5, color: "var(--muted)" },
  actionRow: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  btnPrimary: { display: "flex", alignItems: "center", gap: 7, background: "var(--brand)", color: "var(--on-brand)", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px var(--brand-shadow)" },
  btnGhost: { display: "flex", alignItems: "center", gap: 7, background: "var(--paper-white)", color: "var(--ink)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 15px", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" },
  btnGhostSm: { display: "inline-flex", alignItems: "center", gap: 5, background: "var(--paper-white)", color: "var(--ink)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  btnDangerSm: { display: "inline-flex", alignItems: "center", gap: 5, background: "var(--danger-wash)", color: "var(--danger-ink)", border: "1px solid var(--danger-border)", borderRadius: 6, padding: "6px 10px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  
  mobileTabs: { gap: 8, marginBottom: 16 },
  mtab: { flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--border)", background: "var(--paper-white)", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  mtabActive: { flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--brand)", background: "var(--brand)", color: "var(--on-brand)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  
  editorGrid: { display: "grid", gridTemplateColumns: "400px 1fr", gap: 20, alignItems: "start" },
  formPane: { background: "var(--paper-white)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, position: "sticky", top: 20, transition: "all 0.3s ease" },
  formPaneHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--border)" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 12px" },
  label: { display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 6, letterSpacing: 0.2 },
  input: { width: "100%", padding: "9.5px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13.5, background: "var(--paper-white)", color: "var(--text)", outline: "none", transition: "all 0.2s" },
  textarea: { width: "100%", padding: "9.5px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13.5, background: "var(--paper-white)", color: "var(--text)", outline: "none", resize: "vertical", fontFamily: "inherit", transition: "all 0.2s" },
  hintBox: { marginTop: 18, display: "flex", gap: 9, fontSize: 12, lineHeight: 1.5, color: "var(--hint-text)", background: "var(--hint-bg)", border: "1px solid var(--hint-border)", borderRadius: 10, padding: "11px 13px" },
  
  previewPane: { minWidth: 0 },
  pageLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: "var(--muted)", marginBottom: 7, textTransform: "uppercase" },
  paper: { background: "#FBF8F1", borderRadius: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 10px 30px var(--card-shadow)", position: "relative", padding: "44px 36px 44px 60px", minHeight: 560, transition: "box-shadow 0.3s ease" },
  paperRedLine: { position: "absolute", left: 36, top: 0, bottom: 0, width: 1.5, background: "var(--line-red)", opacity: 0.6 },
  paperContent: { fontFamily: "'Source Serif 4', serif", fontSize: 14, lineHeight: 1.65, color: "#241f1a" },
  foldLine: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 0, borderLeft: "1.5px dashed #B8AA8A" },
  foldRow: { display: "flex", minHeight: 460 },
  foldSpacer: { flex: "0 0 53%" },
  foldContent: { flex: "0 0 44%", minWidth: 0, fontFamily: "'Source Serif 4', serif", fontSize: 13.5, lineHeight: 1.6, color: "#241f1a" },
  
  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--toast-bg)", color: "var(--toast-fg)", padding: "11px 18px", borderRadius: 10, fontSize: 13.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 9, zIndex: 60, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" },
  modalOverlay: { position: "fixed", inset: 0, background: "var(--overlay)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 },
  modalBox: { background: "var(--paper-white)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.3)", transition: "all 0.3s ease" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid var(--border)" },
  modalTitle: { fontFamily: "'Source Serif 4', serif", fontSize: 19, fontWeight: 700, color: "var(--ink)" },
  iconBtn: { background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", transition: "all 0.2s" },
  draftRow: { display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", background: "var(--paper-white)", transition: "all 0.2s" },
};
