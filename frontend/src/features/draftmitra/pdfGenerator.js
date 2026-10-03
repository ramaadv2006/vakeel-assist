import { jsPDF } from "jspdf";
import { partitionBlocks } from "./templates";

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
          const vText = b.v ? `— ${cleanText(b.v)} —` : "— Versus —";
          doc.text(vText, docketCenterX, docketY, { align: "center" });
          docketY += 6;
          break;
        }
        case "small": {
          doc.setFont("times", "normal");
          doc.setFontSize(9.5);
          const rawLines = cleanText(b.v).split("\n");
          for (const rLine of rawLines) {
            const lines = doc.splitTextToSize(rLine, docketWidth);
            for (const line of lines) {
              doc.text(line, docketCenterX, docketY, { align: "center" });
              docketY += 4.5;
            }
          }
          docketY += 2;
          break;
        }
        case "right": {
          doc.setFont("times", "bold");
          doc.setFontSize(10.5);
          const rawLines = cleanText(b.v).split("\n");
          for (const rLine of rawLines) {
            doc.text(rLine, docketRight, docketY, { align: "right" });
            docketY += 4.8;
          }
          docketY += 2;
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
    const { main, footer } = partitionBlocks(blocks);

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

    function renderBlock(b) {
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
          const vText = b.v ? `— ${cleanText(b.v)} —` : "— Versus —";
          doc.text(vText, pageWidth / 2, currentY, { align: "center" });
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
        case "caForm14Table": {
          const rows = b.rows || [];
          if (rows.length === 0) break;

          const colWidths = [12, 28, 28, 48, 46];
          const colX = [
            p1MarginLeft,
            p1MarginLeft + colWidths[0],
            p1MarginLeft + colWidths[0] + colWidths[1],
            p1MarginLeft + colWidths[0] + colWidths[1] + colWidths[2],
            p1MarginLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
          ];
          const headers = [
            "S.No.",
            "Date of Filing",
            "Date of Doc",
            "Description of Document",
            "Order / Purpose Details",
          ];

          const headerHeight = 8;
          checkPageBreak(headerHeight + 20);

          doc.setLineWidth(0.3);
          doc.rect(p1MarginLeft, currentY, p1ContentWidth, headerHeight);
          for (let c = 1; c < colX.length; c++) {
            doc.line(colX[c], currentY, colX[c], currentY + headerHeight);
          }

          doc.setFont("times", "bold");
          doc.setFontSize(9);

          for (let c = 0; c < headers.length; c++) {
            const align = c === 0 ? "center" : "left";
            const xPos = c === 0 ? colX[c] + colWidths[c] / 2 : colX[c] + 2;
            doc.text(headers[c], xPos, currentY + 5.5, { align });
          }
          currentY += headerHeight;

          doc.setFont("times", "normal");
          doc.setFontSize(9);

          for (const row of rows) {
            const rowVals = [
              row.sno || "",
              row.filedDate || "",
              row.docDate || "",
              row.desc || "",
              row.purpose || row.remarks || "",
            ];
            const cellLines = rowVals.map((v, i) => doc.splitTextToSize(cleanText(v), colWidths[i] - 4));
            const maxLines = Math.max(...cellLines.map((l) => l.length), 1);
            const rHeight = Math.max(maxLines * 4.8 + 3.5, 7.5);

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
        case "form46ParticularsTable": {
          const items = b.items || [];
          const wLeft = 86;
          const wRight = p1ContentWidth - wLeft;
          const x0 = p1MarginLeft;
          const x1 = x0 + wLeft;

          doc.setLineWidth(0.3);

          for (const it of items) {
            if (it.isHeader) {
              const hHeight = 7.5;
              checkPageBreak(hHeight + 16);
              doc.setFont("times", "bold");
              doc.setFontSize(9.5);
              doc.rect(x0, currentY, p1ContentWidth, hHeight);
              doc.text(cleanText(it.section || ""), x0 + 3, currentY + 5.2);
              currentY += hHeight;
              continue;
            }

            const qLines = doc.splitTextToSize(cleanText(it.q || ""), wLeft - 4);
            const aLines = doc.splitTextToSize(`: ${cleanText(it.a || "")}`, wRight - 4);
            const maxL = Math.max(qLines.length, aLines.length, 1);
            const rHeight = Math.max(maxL * 4.4 + 3, 6.8);

            checkPageBreak(rHeight + 2);

            doc.rect(x0, currentY, p1ContentWidth, rHeight);
            doc.line(x1, currentY, x1, currentY + rHeight);

            doc.setFont("times", "bold");
            doc.setFontSize(8.5);
            let yQ = currentY + 4.5;
            for (const l of qLines) {
              doc.text(l, x0 + 2, yQ);
              yQ += 4.2;
            }

            doc.setFont("times", "normal");
            doc.setFontSize(8.5);
            let yA = currentY + 4.5;
            for (const l of aLines) {
              doc.text(l, x1 + 2, yA);
              yA += 4.2;
            }

            currentY += rHeight;
          }
          currentY += 4;
          break;
        }
        case "lodgmentTable": {
          const rows = b.rows || [];
          const totals = b.totals || {};

          const wPart = 54;
          const wPerson = 44;
          const wCashRs = 22;
          const wCashP = 10;
          const wSecRs = 22;
          const wSecP = 10;

          const x0 = p1MarginLeft;
          const x1 = x0 + wPart;
          const x2 = x1 + wPerson;
          const x3 = x2 + wCashRs;
          const x4 = x3 + wCashP;
          const x5 = x4 + wSecRs;
          const x6 = x5 + wSecP;

          const headerHeight = 18;
          checkPageBreak(headerHeight + 20);

          doc.setLineWidth(0.3);
          doc.rect(x0, currentY, p1ContentWidth, headerHeight);

          doc.line(x1, currentY, x1, currentY + headerHeight);
          doc.line(x2, currentY, x2, currentY + headerHeight);
          doc.line(x2, currentY + 6, x6, currentY + 6);
          doc.line(x4, currentY + 6, x4, currentY + headerHeight);
          doc.line(x2, currentY + 12, x6, currentY + 12);
          doc.line(x3, currentY + 12, x3, currentY + headerHeight);
          doc.line(x5, currentY + 12, x5, currentY + headerHeight);

          doc.setFont("times", "bold");
          doc.setFontSize(9.5);

          const p1Lines = ["Particulars of funds", "to be lodged"];
          doc.text(p1Lines[0], x0 + wPart / 2, currentY + 7.5, { align: "center" });
          doc.text(p1Lines[1], x0 + wPart / 2, currentY + 12.5, { align: "center" });

          const p2Lines = ["Person to make", "the lodgment"];
          doc.text(p2Lines[0], x1 + wPerson / 2, currentY + 7.5, { align: "center" });
          doc.text(p2Lines[1], x1 + wPerson / 2, currentY + 12.5, { align: "center" });

          doc.text("Amount", x2 + (x6 - x2) / 2, currentY + 4.5, { align: "center" });
          doc.text("Cash", x2 + (x4 - x2) / 2, currentY + 10.2, { align: "center" });
          doc.text("Securities", x4 + (x6 - x4) / 2, currentY + 10.2, { align: "center" });

          doc.setFontSize(9);
          doc.text("Rs.", x2 + wCashRs / 2, currentY + 16.2, { align: "center" });
          doc.text("P.", x3 + wCashP / 2, currentY + 16.2, { align: "center" });
          doc.text("Rs.", x4 + wSecRs / 2, currentY + 16.2, { align: "center" });
          doc.text("P.", x5 + wSecP / 2, currentY + 16.2, { align: "center" });

          currentY += headerHeight;

          doc.setFont("times", "normal");
          doc.setFontSize(9.5);

          for (const row of rows) {
            const partLines = doc.splitTextToSize(cleanText(row.particulars || ""), wPart - 4);
            const lodgLines = doc.splitTextToSize(cleanText(row.lodger || ""), wPerson - 4);
            const maxL = Math.max(partLines.length, lodgLines.length, 1);
            const rHeight = Math.max(maxL * 5 + 4, 8.5);

            checkPageBreak(rHeight + 2);

            doc.rect(x0, currentY, p1ContentWidth, rHeight);
            doc.line(x1, currentY, x1, currentY + rHeight);
            doc.line(x2, currentY, x2, currentY + rHeight);
            doc.line(x3, currentY, x3, currentY + rHeight);
            doc.line(x4, currentY, x4, currentY + rHeight);
            doc.line(x5, currentY, x5, currentY + rHeight);

            let yCursor = currentY + 5;
            for (const line of partLines) {
              doc.text(line, x0 + 2, yCursor);
              yCursor += 4.5;
            }

            yCursor = currentY + 5;
            for (const line of lodgLines) {
              doc.text(line, x1 + 2, yCursor);
              yCursor += 4.5;
            }

            doc.text(cleanText(row.cashRs || "—"), x3 - 2, currentY + 5.5, { align: "right" });
            doc.text(cleanText(row.cashP || "—"), x3 + wCashP / 2, currentY + 5.5, { align: "center" });
            doc.text(cleanText(row.secRs || "—"), x5 - 2, currentY + 5.5, { align: "right" });
            doc.text(cleanText(row.secP || "—"), x5 + wSecP / 2, currentY + 5.5, { align: "center" });

            currentY += rHeight;
          }

          const totHeight = 8;
          checkPageBreak(totHeight + 4);

          doc.setFont("times", "bold");
          doc.setFontSize(10);
          doc.rect(x0, currentY, p1ContentWidth, totHeight);
          doc.line(x2, currentY, x2, currentY + totHeight);
          doc.line(x3, currentY, x3, currentY + totHeight);
          doc.line(x4, currentY, x4, currentY + totHeight);
          doc.line(x5, currentY, x5, currentY + totHeight);

          doc.text("Total", x2 - 4, currentY + 5.5, { align: "right" });
          doc.text(cleanText(totals.cashRs || "—"), x3 - 2, currentY + 5.5, { align: "right" });
          doc.text(cleanText(totals.cashP || "—"), x3 + wCashP / 2, currentY + 5.5, { align: "center" });
          doc.text(cleanText(totals.secRs || "—"), x5 - 2, currentY + 5.5, { align: "right" });
          doc.text(cleanText(totals.secP || "—"), x5 + wSecP / 2, currentY + 5.5, { align: "center" });

          currentY += totHeight + 4;
          break;
        }
        case "epTable": {
          const rows = b.rows || [];
          const wLeft = 72;
          const wRight = p1ContentWidth - wLeft;
          const x0 = p1MarginLeft;
          const x1 = x0 + wLeft;

          doc.setLineWidth(0.3);

          for (const row of rows) {
            let leftLines = [];
            let rightLines = [];

            if (row.subTitle) {
              const t1 = doc.splitTextToSize(cleanText(`${row.no}. ${row.title}`), wLeft - 4);
              const t2 = doc.splitTextToSize(cleanText(row.subTitle), wLeft - 4);
              leftLines = [...t1, "", ...t2];

              const v1 = doc.splitTextToSize(cleanText(row.val || ""), wRight - 4);
              const v2 = doc.splitTextToSize(cleanText(row.subVal || ""), wRight - 4);
              rightLines = [...v1, "", ...v2];
            } else if (row.costs) {
              leftLines = doc.splitTextToSize(cleanText(`${row.no}. ${row.title}`), wLeft - 4);
              const v1 = doc.splitTextToSize(cleanText(row.val || ""), wRight - 4);
              const c = row.costs;
              const costLines = [
                `Stamp: Rs. ${cleanText(c.stamp)}`,
                `Advocate Fee: Rs. ${cleanText(c.advocate)}`,
                `Process: Rs. ${cleanText(c.process)}`,
                `Typing: Rs. ${cleanText(c.typing)}`,
                `Total: Rs. ${cleanText(c.total)}`,
              ];
              rightLines = [...v1, ...costLines];
            } else {
              leftLines = doc.splitTextToSize(cleanText(`${row.no}. ${row.title}`), wLeft - 4);
              rightLines = doc.splitTextToSize(cleanText(row.val || ""), wRight - 4);
            }

            const maxL = Math.max(leftLines.length, rightLines.length, 1);
            const rHeight = Math.max(maxL * 5 + 4, 8.5);

            checkPageBreak(rHeight + 2);

            doc.rect(x0, currentY, p1ContentWidth, rHeight);
            doc.line(x1, currentY, x1, currentY + rHeight);

            doc.setFont("times", "bold");
            doc.setFontSize(9.5);
            let yL = currentY + 5;
            for (const l of leftLines) {
              doc.text(l, x0 + 2, yL);
              yL += 4.5;
            }

            doc.setFont("times", "normal");
            doc.setFontSize(9.5);
            let yR = currentY + 5;
            for (const l of rightLines) {
              doc.text(l, x1 + 2, yR);
              yR += 4.5;
            }

            currentY += rHeight;
          }
          currentY += 4;
          break;
        }
        case "propValuationTable": {
          const rows = b.rows || [];
          const wSec = 30;
          const wNat = 42;
          const wRev = 26;
          const wMkt = 26;
          const wFee = 26;
          const x0 = p1MarginLeft;
          const x1 = x0 + wSec;
          const x2 = x1 + wNat;
          const x3 = x2 + wRev;
          const x4 = x3 + wMkt;
          const x5 = x4 + wFee;

          const headerHeight = 14;
          checkPageBreak(headerHeight + 20);

          doc.setLineWidth(0.3);
          doc.rect(x0, currentY, p1ContentWidth, headerHeight);
          doc.line(x1, currentY, x1, currentY + headerHeight);
          doc.line(x2, currentY, x2, currentY + headerHeight);
          doc.line(x3, currentY, x3, currentY + headerHeight);
          doc.line(x4, currentY, x4, currentY + headerHeight);

          doc.setFont("times", "bold");
          doc.setFontSize(8.5);

          doc.text("Section and sub", x0 + wSec / 2, currentY + 5.5, { align: "center" });
          doc.text("section of Act", x0 + wSec / 2, currentY + 10, { align: "center" });

          doc.text("Nature of suit", x1 + wNat / 2, currentY + 8, { align: "center" });

          doc.text("Annual revenue", x2 + wRev / 2, currentY + 5.5, { align: "center" });
          doc.text("or rent payable", x2 + wRev / 2, currentY + 10, { align: "center" });

          doc.text("Market Value", x3 + wMkt / 2, currentY + 8, { align: "center" });

          doc.text("Value for Purposes", x4 + wFee / 2, currentY + 5.5, { align: "center" });
          doc.text("of Court fees", x4 + wFee / 2, currentY + 10, { align: "center" });

          currentY += headerHeight;

          doc.setFont("times", "normal");
          doc.setFontSize(9);

          for (const row of rows) {
            const secLines = doc.splitTextToSize(cleanText(row.section || ""), wSec - 4);
            const natLines = doc.splitTextToSize(cleanText(row.nature || ""), wNat - 4);
            const revLines = doc.splitTextToSize(cleanText(row.revenue || ""), wRev - 4);
            const mktLines = doc.splitTextToSize(cleanText(row.marketVal || ""), wMkt - 4);
            const feeLines = doc.splitTextToSize(cleanText(row.courtFeeVal || ""), wFee - 4);

            const maxL = Math.max(secLines.length, natLines.length, revLines.length, mktLines.length, feeLines.length, 1);
            const rHeight = Math.max(maxL * 4.6 + 4, 8);

            checkPageBreak(rHeight + 2);

            doc.rect(x0, currentY, p1ContentWidth, rHeight);
            doc.line(x1, currentY, x1, currentY + rHeight);
            doc.line(x2, currentY, x2, currentY + rHeight);
            doc.line(x3, currentY, x3, currentY + rHeight);
            doc.line(x4, currentY, x4, currentY + rHeight);

            let yCursor = currentY + 5;
            for (const l of secLines) {
              doc.text(l, x0 + 2, yCursor);
              yCursor += 4.2;
            }

            yCursor = currentY + 5;
            for (const l of natLines) {
              doc.text(l, x1 + 2, yCursor);
              yCursor += 4.2;
            }

            yCursor = currentY + 5;
            for (const l of revLines) {
              doc.text(l, x3 - 2, yCursor, { align: "right" });
              yCursor += 4.2;
            }

            yCursor = currentY + 5;
            for (const l of mktLines) {
              doc.text(l, x4 - 2, yCursor, { align: "right" });
              yCursor += 4.2;
            }

            yCursor = currentY + 5;
            for (const l of feeLines) {
              doc.text(l, x5 - 2, yCursor, { align: "right" });
              yCursor += 4.2;
            }

            currentY += rHeight;
          }
          currentY += 4;
          break;
        }
        case "billOfCostsTable": {
          const items = b.items || [];
          const wNo = 12;
          const wAmt = 35;
          const wDesc = p1ContentWidth - wNo - wAmt;
          const x0 = p1MarginLeft;
          const x1 = x0 + wNo;
          const x2 = x1 + wDesc;
          const x3 = x0 + p1ContentWidth;

          const headerHeight = 8;
          checkPageBreak(headerHeight + 20);

          doc.setLineWidth(0.3);
          doc.rect(x0, currentY, p1ContentWidth, headerHeight);
          doc.line(x1, currentY, x1, currentY + headerHeight);
          doc.line(x2, currentY, x2, currentY + headerHeight);

          doc.setFont("times", "bold");
          doc.setFontSize(9.5);
          doc.text("S.No.", x0 + wNo / 2, currentY + 5.5, { align: "center" });
          doc.text("Particulars / Description", x1 + 3, currentY + 5.5);
          doc.text("Amount (Rs.)", x3 - 3, currentY + 5.5, { align: "right" });

          currentY += headerHeight;

          doc.setFont("times", "normal");
          doc.setFontSize(9);

          for (const it of items) {
            const descLines = doc.splitTextToSize(cleanText(it.title || ""), wDesc - 4);
            const rHeight = Math.max(descLines.length * 4.5 + 2.5, 6.5);

            checkPageBreak(rHeight + 2);

            doc.rect(x0, currentY, p1ContentWidth, rHeight);
            doc.line(x1, currentY, x1, currentY + rHeight);
            doc.line(x2, currentY, x2, currentY + rHeight);

            doc.text(String(it.no), x0 + wNo / 2, currentY + 4.8, { align: "center" });

            let yDesc = currentY + 4.8;
            for (const l of descLines) {
              doc.text(l, x1 + 2, yDesc);
              yDesc += 4.2;
            }

            const amtVal = it.val === "0" || it.val === "—" ? "—" : cleanText(it.val);
            doc.text(amtVal, x3 - 3, currentY + 4.8, { align: "right" });

            currentY += rHeight;
          }

          const totH = 7.5;
          checkPageBreak(totH * 3 + 35);

          doc.setFont("times", "bold");
          doc.setFontSize(9.5);

          doc.rect(x0, currentY, p1ContentWidth, totH);
          doc.line(x2, currentY, x2, currentY + totH);
          doc.text("Total Costs :-", x2 - 4, currentY + 5.2, { align: "right" });
          doc.text(`Rs. ${cleanText(b.totalCosts || "0")}`, x3 - 3, currentY + 5.2, { align: "right" });
          currentY += totH;

          doc.setFont("times", "normal");
          doc.setFontSize(8.5);
          doc.rect(x0, currentY, p1ContentWidth, totH);
          doc.line(x2, currentY, x2, currentY + totH);
          doc.text("Credit the Costs allowed to the opponents:", x2 - 4, currentY + 5.2, { align: "right" });
          doc.text(b.creditCosts === "0" ? "—" : `Rs. ${cleanText(b.creditCosts || "0")}`, x3 - 3, currentY + 5.2, { align: "right" });
          currentY += totH;

          doc.setFont("times", "bold");
          doc.setFontSize(9.5);
          doc.rect(x0, currentY, p1ContentWidth, totH);
          doc.line(x2, currentY, x2, currentY + totH);
          doc.text("Balance Claimed:", x2 - 4, currentY + 5.2, { align: "right" });
          doc.text(`Rs. ${cleanText(b.balanceClaimed || "0")}`, x3 - 3, currentY + 5.2, { align: "right" });
          currentY += totH + 4;

          const boxH = 34;
          checkPageBreak(boxH + 18);

          doc.setLineWidth(0.3);
          doc.rect(x0, currentY, p1ContentWidth, boxH);

          doc.setFont("times", "italic");
          doc.setFontSize(8.5);
          const certLines = doc.splitTextToSize(cleanText(b.advocateCert || ""), p1ContentWidth - 8);
          let yCert = currentY + 5;
          for (const l of certLines) {
            doc.text(l, x0 + 4, yCert);
            yCert += 4.2;
          }

          doc.setFont("times", "bold");
          doc.setFontSize(9);
          doc.text(`Date :- ${cleanText(b.date || "")}`, x0 + 4, currentY + 22);
          doc.text(`Advocate for ${cleanText(b.filedBy || "Plaintiff")}`, x3 - 4, currentY + 22, { align: "right" });

          doc.setFont("times", "normal");
          doc.setFontSize(8.5);
          doc.text("Sum if any disallow: ____________", x0 + 4, currentY + 30);
          doc.text("Amount allowed: ____________", x3 - 4, currentY + 30, { align: "right" });

          currentY += boxH + 8;

          doc.setFont("times", "bold");
          doc.setFontSize(10);
          doc.text("Checked", x0, currentY);
          doc.text("District Judge / Munsif.", x3, currentY, { align: "right" });
          currentY += 8;
          break;
        }
        case "signdual": {
          doc.setFont("times", "normal");
          doc.setFontSize(10.5);
          const rawLeft = cleanText(b.left || "Accused");
          const rawRight = cleanText(b.right || "Counsel for Accused");
          const leftLines = rawLeft.split("\n").flatMap((l) => doc.splitTextToSize(l, 85));
          const rightLines = rawRight.split("\n").flatMap((l) => doc.splitTextToSize(l, 60));
          const maxLines = Math.max(leftLines.length, rightLines.length, 1);

          checkPageBreak(maxLines * 5 + 12);
          currentY += 6;

          const startY = currentY;
          let yL = startY;
          for (const l of leftLines) {
            doc.text(l, p1MarginLeft, yL);
            yL += 4.8;
          }

          let yR = startY;
          for (const l of rightLines) {
            doc.text(l, pageWidth - p1MarginRight, yR, { align: "right" });
            yR += 4.8;
          }

          currentY = Math.max(yL, yR) + 4;
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

    for (const b of main) {
      renderBlock(b);
    }

    if (footer.length > 0) {
      if (currentY < 235) {
        currentY = Math.max(currentY + 12, 235);
      }
      for (const b of footer) {
        renderBlock(b);
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
