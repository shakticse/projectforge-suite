import type { PurchaseOrderRecord } from "@/services/purchaseOrderService";

export const createPurchaseOrderPdf = (purchaseOrder: PurchaseOrderRecord): Blob => {
  const escapePdfText = (value: string) =>
    value.replace(/[^\x20-\x7E]/g, "?").replace(/[\\()]/g, "\\$&");
  const wrap = (value: string, width: number) => {
    const words = value.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    words.forEach((word) => {
      if (line && `${line} ${word}`.length > width) {
        lines.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    });
    if (line) lines.push(line);
    return lines.length ? lines : ["-"];
  };
  const pages: string[][] = [];
  let commands: string[] = [];
  let cursorY = 748;
  const margin = 44;
  const pageBottom = 54;
  const contentWidth = 524;
  const beginPage = () => {
    commands = [];
    cursorY = 748;
    pages.push(commands);
  };
  const addText = (
    value: string,
    x: number,
    y: number,
    options: { size?: number; font?: "F1" | "F2"; color?: string } = {},
  ) => {
    const { size = 9, font = "F1", color = "0.12 0.16 0.22" } = options;
    commands.push(`${color} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(value)}) Tj ET`);
  };
  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    commands.push(`0.84 0.87 0.9 RG 0.6 w ${x1} ${y1} m ${x2} ${y2} l S`);
  };
  const addFillRect = (x: number, y: number, width: number, height: number, color: string) => {
    commands.push(`${color} rg ${x} ${y} ${width} ${height} re f`);
  };
  const ensureSpace = (height: number) => {
    if (cursorY - height < pageBottom) {
      beginPage();
      addText(`PURCHASE ORDER ${purchaseOrder.name || `PO-${purchaseOrder.id}`} - CONTINUED`, margin, cursorY, {
        size: 11,
        font: "F2",
        color: "0.08 0.2 0.34",
      });
      cursorY -= 28;
    }
  };
  const addSectionTitle = (title: string) => {
    ensureSpace(34);
    addFillRect(margin, cursorY - 21, contentWidth, 21, "0.92 0.95 0.97");
    addText(title, margin + 9, cursorY - 14, { size: 9, font: "F2", color: "0.12 0.22 0.35" });
    cursorY -= 32;
  };
  const addFields = (fields: Array<{ label: string; value?: string | null }>) => {
    fields.forEach(({ label, value }) => {
      const lines = wrap(value?.trim() || "-", 86);
      const rowHeight = 14 + lines.length * 11;
      ensureSpace(rowHeight);
      addText(label, margin + 4, cursorY, { size: 8, font: "F2", color: "0.39 0.44 0.5" });
      lines.forEach((line, index) => addText(line, margin + 146, cursorY - index * 11));
      cursorY -= rowHeight;
      addLine(margin, cursorY + 4, margin + contentWidth, cursorY + 4);
    });
    cursorY -= 8;
  };
  const dateText = (value?: string | null) => {
    if (!value) return "-";
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toLocaleDateString();
  };
  const money = (value: number) => `INR ${Number(value || 0).toFixed(2)}`;
  const addItemsHeader = () => {
    addFillRect(margin, cursorY - 21, contentWidth, 21, "0.12 0.25 0.38");
    addText("Item", margin + 7, cursorY - 14, { size: 8, font: "F2", color: "1 1 1" });
    addText("Qty", margin + 326, cursorY - 14, { size: 8, font: "F2", color: "1 1 1" });
    addText("Unit price", margin + 370, cursorY - 14, { size: 8, font: "F2", color: "1 1 1" });
    addText("Total", margin + 462, cursorY - 14, { size: 8, font: "F2", color: "1 1 1" });
    cursorY -= 21;
  };

  beginPage();
  addText(`PURCHASE ORDER ${purchaseOrder.name || `PO-${purchaseOrder.id}`}`, margin, cursorY, {
    size: 18,
    font: "F2",
    color: "0.08 0.2 0.34",
  });
  cursorY -= 30;

  addSectionTitle("Purchase order details");
  addFields([
    { label: "PO number", value: purchaseOrder.name || `PO-${purchaseOrder.id}` },
    { label: "Purchase request", value: `PR-${purchaseOrder.purchaseRequestId}` },
    { label: "Project", value: purchaseOrder.projectName },
    { label: "BOM", value: purchaseOrder.bomName },
    { label: "Status", value: purchaseOrder.status },
    { label: "Order date", value: dateText(purchaseOrder.orderDate) },
    { label: "Due date", value: dateText(purchaseOrder.dueDate) },
    { label: "Delivery address", value: purchaseOrder.deliveryAddress },
  ]);

  addSectionTitle("Vendor details");
  addFields([
    { label: "Vendor", value: purchaseOrder.vendorName },
    { label: "Contact person", value: purchaseOrder.vendorContactPerson },
    {
      label: "Address",
      value: [
        purchaseOrder.vendorAddress,
        purchaseOrder.vendorCity,
        purchaseOrder.vendorState,
        purchaseOrder.vendorZip,
      ].filter(Boolean).join(", "),
    },
    { label: "Phone", value: purchaseOrder.vendorPhone },
    { label: "Email", value: purchaseOrder.vendorEmail },
    { label: "GST number", value: purchaseOrder.vendorGstNumber },
  ]);

  addSectionTitle(`Items (${purchaseOrder.itemCount})`);
  addItemsHeader();
  purchaseOrder.items.forEach((item, index) => {
    const itemLines = wrap(item.itemName || `Item ${item.itemId}`, 48);
    const rowHeight = Math.max(26, itemLines.length * 11 + 12);
    if (cursorY - rowHeight < pageBottom) {
      beginPage();
      addText(`PURCHASE ORDER ${purchaseOrder.name || `PO-${purchaseOrder.id}`} - CONTINUED`, margin, cursorY, {
        size: 11,
        font: "F2",
        color: "0.08 0.2 0.34",
      });
      cursorY -= 26;
      addItemsHeader();
    }
    if (index % 2 === 1) addFillRect(margin, cursorY - rowHeight + 3, contentWidth, rowHeight, "0.97 0.98 0.99");
    itemLines.forEach((line, lineIndex) => addText(line, margin + 7, cursorY - 15 - lineIndex * 11));
    addText(String(item.quantity), margin + 326, cursorY - 15);
    addText(money(item.vendorPrice), margin + 370, cursorY - 15);
    addText(money(item.totalPrice), margin + 462, cursorY - 15);
    cursorY -= rowHeight;
    addLine(margin, cursorY + 3, margin + contentWidth, cursorY + 3);
  });
  ensureSpace(30);
  addText("Total amount", margin + 340, cursorY - 13, { size: 10, font: "F2" });
  addText(money(purchaseOrder.totalAmount), margin + 462, cursorY - 13, { size: 10, font: "F2" });
  cursorY -= 30;

  addSectionTitle("Terms and Conditions");
  const termsLines = wrap(purchaseOrder.termsAndConditions?.trim() || "No terms and conditions recorded.", 96);
  termsLines.forEach((line) => {
    ensureSpace(14);
    addText(line, margin + 4, cursorY);
    cursorY -= 13;
  });

  pages.forEach((page, index) => {
    page.push(
      `0.45 0.49 0.54 rg BT /F1 8 Tf 1 0 0 1 ${margin} 28 Tm (PO-${purchaseOrder.id}) Tj ET`,
      `0.45 0.49 0.54 rg BT /F1 8 Tf 1 0 0 1 520 28 Tm (Page ${index + 1} of ${pages.length}) Tj ET`,
    );
  });

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const pageObjectIds = pages.map((_, index) => 5 + index * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  pages.forEach((page, index) => {
    const pageId = pageObjectIds[index];
    const contentId = pageId + 1;
    const stream = page.join("\n");
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let document = "%PDF-1.4\n";
  const offsets = [0];
  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    offsets[objectId] = document.length;
    document += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`;
  }
  const xrefOffset = document.length;
  document += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    document += `${String(offsets[objectId]).padStart(10, "0")} 00000 n \n`;
  }
  document += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([document], { type: "application/pdf" });
};
