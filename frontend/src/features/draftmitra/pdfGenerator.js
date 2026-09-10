import { jsPDF } from "jspdf";

function cleanText(str) {
  if (!str) return "";
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/₹/g, "Rs. ")
    .replace(/\u00A0/g, " ");
}

/**
 * Direct Vector PDF Generator for DraftMitra using jsPDF
 *
 * A4 dimensions: 210mm x 297mm
 * Page 1 Margins: Top 32mm (Court Stamps), Left 28mm (Binding), Right 20mm, Bottom 20mm
 * Page 2 Margins: Top 18mm, Left 15mm, Right 15mm, Bottom 18mm, Vertical Fold at 105mm
 */
export function generateAndDownloadPdf(page1Blocks, page2Blocks, fileName = "Legal_Draft.pdf") {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;

  function renderDocket(blocks) {
    // Draw vertical center dashed fold line
    const foldX = 105;
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.35);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(foldX, 15, foldX, pageHeight - 15);
    doc.setLineDashPattern([], 0);

    // Right column bounds (Docket covers right half)
    const docketLeft = 115;
    const docketRight = pageWidth - 15; // 195mm
    const docketWidth = docketRight - docketLeft; // 80mm
    const docketCenterX = docketLeft + docketWidth / 2; // 155mm

    let docketY = 24;

    const mainDocketBlocks = blocks.filter((b) => b.t !== "signblock");
    const signDocketBlocks = blocks.filter((b) => b.t === "signblock");

    for (const b of mainDocketBlocks) {
      switch (b.t) {
        case "center": {
          doc.setFont("times", "bold");
          doc.setFontSize(11.5);
          const lines = doc.splitTextToSize(cleanText(b.v), docketWidth);
          for (const line of lines) {
            doc.text(line, docketCenterX, docketY, { align: "center" });
            docketY += 5.5;
          }
          docketY += 3;
          break;
        }
        case "left": {
          doc.setFont("times", "normal");
          doc.setFontSize(11);
          const rawLines = cleanText(b.v).split("\n");
          for (const rLine of rawLines) {
            const lines = doc.splitTextToSize(rLine, docketWidth);
            for (const line of lines) {
              doc.text(line, docketLeft, docketY);
              docketY += 5.2;
            }
          }
          docketY += 2;
          break;
        }
        case "party": {
          doc.setFont("times", "bold");
          doc.setFontSize(11.5);
          const nameLines = doc.splitTextToSize(cleanText(b.v), docketWidth);
          for (const line of nameLines) {
            doc.text(line, docketLeft, docketY);
            docketY += 5.2;
          }
          if (b.role) {
            doc.setFont("times", "italic");
            doc.setFontSize(10.5);
            doc.text(cleanText(b.role), docketLeft, docketY);
            docketY += 5.2;
          }
          docketY += 2;
          break;
        }
        case "versus": {
          doc.setFont("times", "italic");
          doc.setFontSize(11);
          doc.text("— Versus —", docketCenterX, docketY, { align: "center" });
          docketY += 6;
          break;
        }
        case "title": {
          doc.setFont("times", "bold");
          doc.setFontSize(12);
          const rawLines = cleanText(b.v).split("\n");
          docketY += 3;
          for (const rLine of rawLines) {
            const lines = doc.splitTextToSize(rLine, docketWidth);
            for (const line of lines) {
              doc.text(line, docketCenterX, docketY, { align: "center" });
              const textWidth = doc.getTextWidth(line);
              doc.setLineWidth(0.3);
              doc.line(docketCenterX - textWidth / 2, docketY + 0.8, docketCenterX + textWidth / 2, docketY + 0.8);
              docketY += 5.8;
            }
          }
          docketY += 4;
          break;
        }
        case "para": {
          doc.setFont("times", "normal");
          doc.setFontSize(11);
          const lines = doc.splitTextToSize(cleanText(b.v), docketWidth);
          for (const line of lines) {
            doc.text(line, docketLeft, docketY);
            docketY += 5.5;
          }
          docketY += 2;
          break;
        }
        case "space": {
          docketY += 3;
          break;
        }
      }
    }

    if (signDocketBlocks.length > 0) {
      const signY = Math.max(docketY + 15, pageHeight - 48);
      let curSignY = signY;
      for (const b of signDocketBlocks) {
        doc.setFont("times", "bold");
        doc.setFontSize(11.5);
        const lines = cleanText(b.v).split("\n");
        for (const line of lines) {
          doc.text(line.trim(), docketRight, curSignY, { align: "right" });
          curSignY += 5.5;
        }
      }
    }
  }

  function renderPetition(blocks) {
    const p1MarginLeft = 28;
    const p1MarginRight = 20;
    const p1MarginTop = 32;
    const p1MarginBottom = 20;
    const p1ContentWidth = pageWidth - p1MarginLeft - p1MarginRight; // 162mm
    const p1MaxY = pageHeight - p1MarginBottom; // 277mm

    let currentY = p1MarginTop;

    const baseFontSize = 12.5;
    const baseLineHeight = 6.8;

    doc.setFont("times", "normal");
    doc.setFontSize(baseFontSize);
    doc.setTextColor(17, 17, 17);

    function checkPageBreak(neededHeight) {
      if (currentY + neededHeight > p1MaxY) {
        doc.addPage();
        currentY = 25; // standard top margin for subsequent continuation pages
      }
    }

    for (const b of blocks) {
      switch (b.t) {
        case "small": {
          doc.setFont("times", "normal");
          doc.setFontSize(10);
          const text = cleanText(b.v);
          const lines = doc.splitTextToSize(text, p1ContentWidth);
          checkPageBreak(lines.length * 5 + 3);
          for (const line of lines) {
            doc.text(line, pageWidth / 2, currentY, { align: "center" });
            currentY += 4.8;
          }
          currentY += 2;
          break;
        }
        case "titleTop": {
          doc.setFont("times", "bold");
          doc.setFontSize(13.5);
          const text = cleanText(b.v);
          checkPageBreak(10);
          doc.text(text, pageWidth / 2, currentY, { align: "center" });
          const textWidth = doc.getTextWidth(text);
          doc.setLineWidth(0.3);
          doc.line((pageWidth - textWidth) / 2, currentY + 1, (pageWidth + textWidth) / 2, currentY + 1);
          currentY += 8;
          break;
        }
        case "center": {
          doc.setFont("times", "bold");
          doc.setFontSize(12.5);
          const text = cleanText(b.v);
          const lines = doc.splitTextToSize(text, p1ContentWidth);
          checkPageBreak(lines.length * 6 + 4);
          for (const line of lines) {
            doc.text(line, pageWidth / 2, currentY, { align: "center" });
            currentY += 5.8;
          }
          currentY += 2;
          break;
        }
        case "left": {
          doc.setFont("times", "normal");
          doc.setFontSize(baseFontSize);
          const rawLines = cleanText(b.v).split("\n");
          for (const rLine of rawLines) {
            const lines = doc.splitTextToSize(rLine, p1ContentWidth);
            checkPageBreak(lines.length * 6);
            for (const line of lines) {
              doc.text(line, p1MarginLeft, currentY);
              currentY += 5.8;
            }
          }
          currentY += 2;
          break;
        }
        case "right": {
          doc.setFont("times", "normal");
          doc.setFontSize(baseFontSize);
          const rawLines = cleanText(b.v).split("\n");
          for (const rLine of rawLines) {
            const lines = doc.splitTextToSize(rLine, p1ContentWidth);
            checkPageBreak(lines.length * 6);
            for (const line of lines) {
              doc.text(line, pageWidth - p1MarginRight, currentY, { align: "right" });
              currentY += 5.8;
            }
          }
          currentY += 2;
          break;
        }
        case "party": {
          doc.setFont("times", "bold");
          doc.setFontSize(baseFontSize);
          const partyText = cleanText(b.v);
          const nameLines = doc.splitTextToSize(partyText, p1ContentWidth - 45);
          const roleText = b.role ? `...${cleanText(b.role).replace(/^\.\.\./, "")}` : "";

          checkPageBreak(Math.max(nameLines.length * 6, 6) + 3);

          const startY = currentY;
          for (const line of nameLines) {
            doc.text(line, p1MarginLeft, currentY);
            currentY += 5.8;
          }
          if (roleText) {
            doc.setFont("times", "italic");
            doc.setFontSize(11.5);
            doc.text(roleText, pageWidth - p1MarginRight, startY, { align: "right" });
            doc.setFont("times", "bold");
            doc.setFontSize(baseFontSize);
          }
          currentY += 2;
          break;
        }
        case "versus": {
          doc.setFont("times", "italic");
          doc.setFontSize(12);
          checkPageBreak(8);
          doc.text("— Versus —", pageWidth / 2, currentY, { align: "center" });
          currentY += 7;
          break;
        }
        case "title": {
          doc.setFont("times", "bold");
          doc.setFontSize(13);
          const raw = cleanText(b.v).toUpperCase();
          const lines = raw.split("\n");
          const allWrappedLines = [];
          for (const l of lines) {
            const wrapped = doc.splitTextToSize(l, p1ContentWidth);
            allWrappedLines.push(...wrapped);
          }
          const totalTitleHeight = allWrappedLines.length * 6.5;
          checkPageBreak(totalTitleHeight + 6);
          currentY += 3;
          for (const line of allWrappedLines) {
            doc.text(line, pageWidth / 2, currentY, { align: "center" });
            const textWidth = doc.getTextWidth(line);
            doc.setLineWidth(0.35);
            doc.line((pageWidth - textWidth) / 2, currentY + 1, (pageWidth + textWidth) / 2, currentY + 1);
            currentY += 6.5;
          }
          currentY += 4;
          break;
        }
        case "num": {
          doc.setFont("times", "normal");
          doc.setFontSize(baseFontSize);
          const numPrefix = `${b.n}.   `;
          const prefixWidth = doc.getTextWidth(numPrefix);
          const bodyWidth = p1ContentWidth - prefixWidth;
          const text = cleanText(b.v);
          const lines = doc.splitTextToSize(text, bodyWidth);

          checkPageBreak(lines.length * baseLineHeight + 3);

          doc.setFont("times", "bold");
          doc.text(numPrefix, p1MarginLeft, currentY);
          doc.setFont("times", "normal");

          if (lines.length > 0) {
            doc.text(lines[0], p1MarginLeft + prefixWidth, currentY);
            currentY += baseLineHeight;
            for (let i = 1; i < lines.length; i++) {
              doc.text(lines[i], p1MarginLeft + prefixWidth, currentY);
              currentY += baseLineHeight;
            }
          }
          currentY += 2;
          break;
        }
        case "para": {
          doc.setFont("times", "normal");
          doc.setFontSize(baseFontSize);
          const firstLineWidth = p1ContentWidth - 8;
          const rawText = cleanText(b.v).trim();
          const words = rawText.split(/\s+/);

          const wrappedLines = [];
          let curLine = "";
          let isFirst = true;

          for (const w of words) {
            const test = curLine ? `${curLine} ${w}` : w;
            const maxW = isFirst ? firstLineWidth : p1ContentWidth;
            if (doc.getTextWidth(test) <= maxW) {
              curLine = test;
            } else {
              if (curLine) wrappedLines.push(curLine);
              curLine = w;
              isFirst = false;
            }
          }
          if (curLine) wrappedLines.push(curLine);

          checkPageBreak(wrappedLines.length * baseLineHeight + 3);

          for (let i = 0; i < wrappedLines.length; i++) {
            const xPos = i === 0 ? p1MarginLeft + 8 : p1MarginLeft;
            doc.text(wrappedLines[i], xPos, currentY);
            currentY += baseLineHeight;
          }
          currentY += 2;
          break;
        }
        case "prayer": {
          doc.setFont("times", "bold");
          doc.setFontSize(12);
          checkPageBreak(15);
          doc.text("PRAYER:", p1MarginLeft + 4, currentY);
          const textWidth = doc.getTextWidth("PRAYER:");
          doc.line(p1MarginLeft + 4, currentY + 0.8, p1MarginLeft + 4 + textWidth, currentY + 0.8);
          currentY += 6.5;

          doc.setFont("times", "normal");
          doc.setFontSize(baseFontSize);
          const rawPrayer = cleanText(b.v);
          const words = rawPrayer.split(/\s+/);

          const prayerLines = [];
          let curPLine = "";
          for (const w of words) {
            const test = curPLine ? `${curPLine} ${w}` : w;
            if (doc.getTextWidth(test) <= p1ContentWidth - 4) {
              curPLine = test;
            } else {
              if (curPLine) prayerLines.push(curPLine);
              curPLine = w;
            }
          }
          if (curPLine) prayerLines.push(curPLine);

          checkPageBreak(prayerLines.length * baseLineHeight + 4);
          for (const line of prayerLines) {
            doc.text(line, p1MarginLeft + 4, currentY);
            currentY += baseLineHeight;
          }
          currentY += 4;
          break;
        }
        case "table": {
          const rows = b.rows || [];
          if (rows.length === 0) break;

          const colWidths = [14, 35, 35, 48, 30]; // sum = 162
          const colX = [
            p1MarginLeft,
            p1MarginLeft + 14,
            p1MarginLeft + 14 + 35,
            p1MarginLeft + 14 + 35 + 35,
            p1MarginLeft + 14 + 35 + 35 + 48,
          ];
          const headers = ["S.No.", "Date of Filing", "Date of Doc", "Description", "Remarks"];

          checkPageBreak(25);
          doc.setLineWidth(0.3);
          doc.setFont("times", "bold");
          doc.setFontSize(10.5);

          const hHeight = 8;
          doc.rect(p1MarginLeft, currentY, p1ContentWidth, hHeight);
          for (let c = 1; c < colX.length; c++) {
            doc.line(colX[c], currentY, colX[c], currentY + hHeight);
          }
          for (let c = 0; c < headers.length; c++) {
            const align = c === 0 ? "center" : "left";
            const xPos = c === 0 ? colX[c] + colWidths[c] / 2 : colX[c] + 2;
            doc.text(headers[c], xPos, currentY + 5.5, { align });
          }
          currentY += hHeight;

          doc.setFont("times", "normal");
          doc.setFontSize(10);

          for (const row of rows) {
            const rowVals = [row.sno || "", row.filedDate || "", row.docDate || "", row.desc || "", row.remarks || ""];
            const cellLines = rowVals.map((v, i) => doc.splitTextToSize(cleanText(v), colWidths[i] - 4));
            const maxLines = Math.max(...cellLines.map((l) => l.length), 1);
            const rHeight = Math.max(maxLines * 5 + 4, 8);

            checkPageBreak(rHeight + 2);

            doc.rect(p1MarginLeft, currentY, p1ContentWidth, rHeight);
            for (let c = 1; c < colX.length; c++) {
              doc.line(colX[c], currentY, colX[c], currentY + rHeight);
            }

            for (let c = 0; c < rowVals.length; c++) {
              const lines = cellLines[c];
              let lineY = currentY + 5;
              const align = c === 0 ? "center" : "left";
              const xPos = c === 0 ? colX[c] + colWidths[c] / 2 : colX[c] + 2;
              for (const l of lines) {
                doc.text(l, xPos, lineY, { align });
                lineY += 4.5;
              }
            }
            currentY += rHeight;
          }
          currentY += 4;
          break;
        }
        case "signdual": {
          doc.setFont("times", "bold");
          doc.setFontSize(12);
          checkPageBreak(25);
          currentY += 8;
          doc.text(cleanText(b.left || "Accused"), p1MarginLeft, currentY);
          doc.text(cleanText(b.right || "Counsel for Accused"), pageWidth - p1MarginRight, currentY, { align: "right" });
          currentY += 10;
          break;
        }
        case "sign": {
          doc.setFont("times", "normal");
          doc.setFontSize(11);
          checkPageBreak(22);
          currentY += 6;
          if (b.place) {
            doc.text(`Place: ${cleanText(b.place)}`, p1MarginLeft, currentY);
          }
          if (b.date) {
            doc.text(`Date: ${cleanText(b.date)}`, p1MarginLeft, currentY + 5.5);
          }
          doc.setFont("times", "bold");
          doc.setFontSize(12);
          doc.text(cleanText(b.label || "Counsel"), pageWidth - p1MarginRight, currentY + 5.5, { align: "right" });
          currentY += 12;
          break;
        }
        case "signblock": {
          doc.setFont("times", "bold");
          doc.setFontSize(12);
          const raw = cleanText(b.v || "");
          const lines = raw.split("\n");

          if (b.dual || /\s{4,}/.test(raw)) {
            checkPageBreak(25);
            currentY += 8;
            for (const line of lines) {
              const parts = line.split(/\s{4,}/);
              if (parts.length >= 2) {
                doc.text(parts[0].trim(), p1MarginLeft, currentY);
                doc.text(parts[1].trim(), pageWidth - p1MarginRight, currentY, { align: "right" });
              } else {
                doc.text(line.trim(), pageWidth - p1MarginRight, currentY, { align: "right" });
              }
              currentY += 6.0;
            }
          } else {
            checkPageBreak(lines.length * 6 + 10);
            currentY += 8;
            for (const line of lines) {
              doc.text(line.trim(), pageWidth - p1MarginRight, currentY, { align: "right" });
              currentY += 6.0;
            }
          }
          currentY += 4;
          break;
        }
        case "space": {
          currentY += 3;
          break;
        }
        case "pre": {
          doc.setFont("courier", "normal");
          doc.setFontSize(9.5);
          const text = cleanText(b.v);
          const lines = doc.splitTextToSize(text, p1ContentWidth);
          checkPageBreak(lines.length * 4.5 + 4);
          for (const line of lines) {
            doc.text(line, p1MarginLeft, currentY);
            currentY += 4.5;
          }
          doc.setFont("times", "normal");
          doc.setFontSize(baseFontSize);
          currentY += 2;
          break;
        }
      }
    }
  }

  // When two pages are present, Page 1 is the Backing Sheet (Docket) and Page 2 is the Main Petition
  if (page2Blocks && page2Blocks.length > 0) {
    renderDocket(page1Blocks);
    doc.addPage();
    renderPetition(page2Blocks);
  } else {
    renderPetition(page1Blocks);
  }

  // Directly trigger client-side download
  doc.save(fileName);
}
