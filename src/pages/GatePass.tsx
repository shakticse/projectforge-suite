import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Camera, X, Upload, Eye, Download, Search, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bomService } from "@/services/bomService";
import { projectService } from "@/services/projectService";
import { gatePassService, type GatePassApiPhoto, type GatePassApiRecord } from "@/services/gatePassService";
import { storeService } from "@/services/storeService";

interface ProjectOption {
  id: string;
  projectName: string;
}

interface ProjectBomOption {
  id: string;
  name: string;
}

interface StoreOption {
  id: string;
  name: string;
}

interface GatePassBomItem {
  id: string;
  itemName: string;
  unit: string;
  allocatedQty: number;
  qty: number;
  allocateQty: string;
  returnOfGatePassItemId?: number;
}

interface GatePassFormValues {
  passType: "Outward" | "Return";
  projectId: string;
  bomId: string;
  storeId: string;
  returnSourceGatePassId: string;
  projectLocation: string;
  eWayBillNumber: string;
  dcNumber: string;
  dcDate: string;
  totalGoodsValue: string;
  remarks: string;
  fromAddress: string;
  fromCity: string;
  fromState: string;
  fromZipCode: string;
  toAddress: string;
  toCity: string;
  toState: string;
  toZipCode: string;
  vehicleType: string;
  vehicleNumber: string;
  driverName: string;
  phoneNumber: string;
}

const initialFormValues: GatePassFormValues = {
  passType: "Outward",
  projectId: "",
  bomId: "",
  storeId: "",
  returnSourceGatePassId: "",
  projectLocation: "",
  eWayBillNumber: "",
  dcNumber: "",
  dcDate: "",
  totalGoodsValue: "",
  remarks: "",
  fromAddress: "",
  fromCity: "",
  fromState: "",
  fromZipCode: "",
  toAddress: "",
  toCity: "",
  toState: "",
  toZipCode: "",
  vehicleType: "",
  vehicleNumber: "",
  driverName: "",
  phoneNumber: "",
};

const inputClassName = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const fileToGatePassPhoto = (file: File): Promise<GatePassApiPhoto> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Unable to read photo ${file.name}.`));
        return;
      }
      const base64 = reader.result.split(",", 2)[1];
      if (!base64) {
        reject(new Error(`Unable to encode photo ${file.name}.`));
        return;
      }
      resolve({ fileName: file.name, contentType: file.type, dataBase64: base64 });
    };
    reader.onerror = () => reject(reader.error ?? new Error(`Unable to read photo ${file.name}.`));
    reader.readAsDataURL(file);
  });

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data
  ) {
    return String(error.response.data.message);
  }
  return error instanceof Error ? error.message : fallback;
};

const createGatePassPdf = (gatePass: GatePassApiRecord): Blob => {
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
    return lines.length > 0 ? lines : [""];
  };
  const pages: string[][] = [];
  let commands: string[] = [];
  let cursorY = 748;
  const pageBottom = 54;
  const margin = 44;
  const contentWidth = 524;
  const beginPage = () => {
    commands = [];
    cursorY = 748;
    pages.push(commands);
  };
  const addText = (
    text: string,
    x: number,
    y: number,
    options: { size?: number; font?: "F1" | "F2"; color?: string } = {},
  ) => {
    const { size = 10, font = "F1", color = "0.12 0.16 0.22" } = options;
    commands.push(
      `${color} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`,
    );
  };
  const addLine = (x1: number, y1: number, x2: number, y2: number, color = "0.82 0.85 0.89") => {
    commands.push(`${color} RG 0.7 w ${x1} ${y1} m ${x2} ${y2} l S`);
  };
  const addFillRect = (x: number, y: number, width: number, height: number, color: string) => {
    commands.push(`${color} rg ${x} ${y} ${width} ${height} re f`);
  };
  const ensureSpace = (height: number) => {
    if (cursorY - height < pageBottom) beginPage();
  };
  const addSectionTitle = (title: string) => {
    ensureSpace(38);
    addFillRect(margin, cursorY - 22, contentWidth, 22, "0.93 0.95 0.97");
    addText(title, margin + 10, cursorY - 15, { size: 10, font: "F2", color: "0.12 0.22 0.35" });
    cursorY -= 34;
  };
  const addFieldsSection = (
    title: string,
    fields: Array<{ label: string; value: string; fullWidth?: boolean }>,
  ) => {
    addSectionTitle(title);
    let index = 0;
    while (index < fields.length) {
      const first = fields[index];
      const second = !first.fullWidth && fields[index + 1] && !fields[index + 1].fullWidth
        ? fields[index + 1]
        : undefined;
      const columnWidth = second ? (contentWidth - 24) / 2 : contentWidth;
      const firstLines = wrap(first.value || "-", first.fullWidth || !second ? 96 : 46);
      const secondLines = second ? wrap(second.value || "-", 46) : [];
      const lineCount = Math.max(firstLines.length, secondLines.length, 1);
      const rowHeight = 16 + lineCount * 12 + 10;
      ensureSpace(rowHeight);
      const rowTop = cursorY;
      const renderField = (field: typeof first, lines: string[], x: number, width: number) => {
        addText(field.label, x, rowTop, { size: 8, font: "F2", color: "0.39 0.44 0.5" });
        lines.forEach((line, lineIndex) => {
          addText(line, x, rowTop - 13 - lineIndex * 12, { size: 9 });
        });
        return width;
      };
      renderField(first, firstLines, margin, columnWidth);
      if (second) renderField(second, secondLines, margin + columnWidth + 24, columnWidth);
      cursorY -= rowHeight;
      addLine(margin, cursorY + 4, margin + contentWidth, cursorY + 4, "0.9 0.91 0.93");
      cursorY -= 8;
      index += second ? 2 : 1;
    }
    cursorY -= 6;
  };

  beginPage();
  addText(`GATE PASS GP-${gatePass.id}`, margin, cursorY, {
    size: 18,
    font: "F2",
    color: "0.08 0.2 0.34",
  });
  addText(gatePass.passType.toUpperCase(), 470, cursorY + 2, {
    size: 10,
    font: "F2",
    color: "0.12 0.38 0.62",
  });
  cursorY -= 14;
  addText(
    `Created ${gatePass.createdAt ? new Date(gatePass.createdAt).toLocaleString() : "-"}`,
    margin,
    cursorY,
    { size: 8, color: "0.39 0.44 0.5" },
  );
  cursorY -= 22;

  addFieldsSection("Project details", [
    { label: "Project", value: gatePass.projectName || `Project ${gatePass.projectId}` },
    { label: "BOM", value: gatePass.bomName || `BOM ${gatePass.bomId}` },
    { label: "Source store", value: gatePass.storeName || `Store ${gatePass.storeId}` },
    { label: "Project location", value: gatePass.projectLocation || "-" },
    { label: "EWay Bill No", value: gatePass.eWayBillNumber || "-" },
    { label: "DC No.", value: gatePass.dcNumber || "-" },
    { label: "DC Date", value: gatePass.dcDate ? new Date(gatePass.dcDate).toLocaleDateString() : "-" },
    { label: "Total Goods Value", value: gatePass.totalGoodsValue == null ? "-" : String(gatePass.totalGoodsValue) },
    { label: "Remarks", value: gatePass.remarks || "-", fullWidth: true },
  ]);
  const formatAddress = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(", ") || "-";
  addFieldsSection("From Address", [
    {
      label: "Address",
      value: formatAddress(gatePass.fromAddress, gatePass.fromCity, gatePass.fromState, gatePass.fromZipCode),
      fullWidth: true,
    },
  ]);
  addFieldsSection("To Address", [
    {
      label: "Address",
      value: formatAddress(gatePass.toAddress, gatePass.toCity, gatePass.toState, gatePass.toZipCode),
      fullWidth: true,
    },
  ]);
  addFieldsSection("Vehicle & driver", [
    { label: "Vehicle type", value: gatePass.vehicleType || "-" },
    { label: "Vehicle number", value: gatePass.vehicleNumber || "-" },
    { label: "Driver/Transporter Name", value: gatePass.driverName || "-" },
    { label: "Phone number", value: gatePass.phoneNumber || "-" },
  ]);

  const addItemsTableHeader = () => {
    addFillRect(margin, cursorY - 22, contentWidth, 22, "0.16 0.29 0.42");
    addText("Item name", margin + 8, cursorY - 15, { size: 8, font: "F2", color: "1 1 1" });
    addText("Unit of measurement", margin + 330, cursorY - 15, { size: 8, font: "F2", color: "1 1 1" });
    addText(gatePass.passType === "Return" ? "Qty returned" : "Qty sent", margin + 465, cursorY - 15, { size: 8, font: "F2", color: "1 1 1" });
    cursorY -= 22;
  };
  addSectionTitle("Allocated items");
  addItemsTableHeader();
  const items = gatePass.items ?? [];
  if (items.length === 0) {
    addText("No items allocated.", margin + 8, cursorY - 15, { size: 9 });
    cursorY -= 28;
  } else {
    items.forEach((item, index) => {
      const itemNameLines = wrap(item.itemName || `Item ${item.itemId}`, 56);
      const rowHeight = Math.max(26, itemNameLines.length * 11 + 12);
      if (cursorY - rowHeight < pageBottom) {
        beginPage();
        addText(`GATE PASS GP-${gatePass.id} - continued`, margin, cursorY, { size: 12, font: "F2" });
        cursorY -= 22;
        addSectionTitle("Allocated items (continued)");
        addItemsTableHeader();
      }
      if (index % 2 === 1) addFillRect(margin, cursorY - rowHeight + 3, contentWidth, rowHeight, "0.97 0.98 0.99");
      itemNameLines.forEach((line, lineIndex) => {
        addText(line, margin + 8, cursorY - 16 - lineIndex * 11, { size: 9 });
      });
      addText(item.unit || "-", margin + 330, cursorY - 16, { size: 9 });
      addText(String(item.qty), margin + 465, cursorY - 16, { size: 9 });
      cursorY -= rowHeight;
      addLine(margin, cursorY + 3, margin + contentWidth, cursorY + 3);
    });
  }

  pages.forEach((pageCommands, index) => {
    pageCommands.push(
      `0.45 0.49 0.54 rg BT /F1 8 Tf 1 0 0 1 ${margin} 28 Tm (Gate Pass GP-${gatePass.id}) Tj ET`,
      `0.45 0.49 0.54 rg BT /F1 8 Tf 1 0 0 1 520 28 Tm (Page ${index + 1} of ${pages.length}) Tj ET`,
    );
  });

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const pageObjectIds = pages.map((_, index) => 5 + index * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  pages.forEach((pageCommands, index) => {
    const pageId = pageObjectIds[index];
    const contentId = pageId + 1;
    const stream = pageCommands.join("\n");
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

export default function GatePass() {
  const [gatePasses, setGatePasses] = useState<GatePassApiRecord[]>([]);
  const [gatePassSearch, setGatePassSearch] = useState("");
  const [isLoadingGatePasses, setIsLoadingGatePasses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectBoms, setProjectBoms] = useState<ProjectBomOption[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [bomItems, setBomItems] = useState<GatePassBomItem[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingProjectBoms, setIsLoadingProjectBoms] = useState(false);
  const [isLoadingBomItems, setIsLoadingBomItems] = useState(false);
  const [allocationError, setAllocationError] = useState("");
  const [bomItemsTab, setBomItemsTab] = useState<"pending" | "completed">("pending");
  const [showForm, setShowForm] = useState(false);
  const [viewingGatePass, setViewingGatePass] = useState<GatePassApiRecord | null>(null);
  const [receivingGatePass, setReceivingGatePass] = useState<GatePassApiRecord | null>(null);
  const [receiptQuantities, setReceiptQuantities] = useState<Record<number, string>>({});
  const [isReceiving, setIsReceiving] = useState(false);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [photos, setPhotos] = useState<File[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const projectBomRequestId = useRef(0);
  const consolidatedBomRequestId = useRef(0);

  const loadGatePasses = useCallback(async () => {
    setIsLoadingGatePasses(true);
    try {
      const records = await gatePassService.getAll();
      setGatePasses(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error("Failed to load gate passes", error);
      toast.error("Unable to load gate passes.");
    } finally {
      setIsLoadingGatePasses(false);
    }
  }, []);

  const openReturnReceipt = (gatePass: GatePassApiRecord) => {
    setReceivingGatePass(gatePass);
    setReceiptQuantities(Object.fromEntries(
      (gatePass.items ?? [])
        .filter((item) => item.id !== undefined)
        .map((item) => [item.id!, String(Math.max(0, item.qty - (item.receivedQty ?? 0)))]),
    ));
  };

  const receiveReturnItem = async (item: GatePassApiRecord["items"][number]) => {
    if (!receivingGatePass || item.id === undefined) return;
    const quantity = Number(receiptQuantities[item.id]);
    const remaining = item.qty - (item.receivedQty ?? 0);
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > remaining) {
      toast.error(`Enter a whole quantity from 1 to ${remaining}.`);
      return;
    }

    setIsReceiving(true);
    try {
      await gatePassService.receiveReturn(receivingGatePass.id, {
        gatePassItemId: item.id,
        quantity,
      });
      setReceivingGatePass((current) => current && ({
        ...current,
        items: current.items.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, receivedQty: (currentItem.receivedQty ?? 0) + quantity }
            : currentItem,
        ),
      }));
      setReceiptQuantities((current) => ({ ...current, [item.id!]: "" }));
      await loadGatePasses();
      toast.success("Returned quantity received into store inventory.");
    } catch (error) {
      console.error("Failed to receive returned inventory", error);
      toast.error(getApiErrorMessage(error, "Unable to receive returned inventory."));
    } finally {
      setIsReceiving(false);
    }
  };

  useEffect(() => {
    void loadGatePasses();
  }, [loadGatePasses]);

  useEffect(() => {
    let isCurrent = true;
    const loadStores = async () => {
      try {
        const response = await storeService.getAllStores();
        const nestedData =
          typeof response === "object" && response !== null && "data" in response
            ? response.data
            : undefined;
        const storeList = Array.isArray(response)
          ? response
          : Array.isArray(nestedData)
            ? nestedData
            : [];
        if (isCurrent) {
          setStores(
            storeList
              .filter((store): store is Record<string, unknown> =>
                typeof store === "object" &&
                store !== null &&
                ("id" in store || "Id" in store),
              )
              .map((store) => ({
                id: String(store.id ?? store.Id),
                name: String(store.storeName ?? store.StoreName ?? store.name ?? `Store ${store.id ?? store.Id}`),
              })),
          );
        }
      } catch (error) {
        console.error("Failed to load stores for gate passes", error);
        if (isCurrent) toast.error("Unable to load stores.");
      }
    };
    void loadStores();
    return () => {
      isCurrent = false;
    };
  }, []);

  const photoPreviews = useMemo(
    () => photos.map((photo) => URL.createObjectURL(photo)),
    [photos],
  );
  const returnedQuantityBySourceItem = useMemo(() => {
    const quantities = new Map<number, number>();
    gatePasses
      .filter((gatePass) => gatePass.passType === "Return")
      .flatMap((gatePass) => gatePass.items ?? [])
      .forEach((item) => {
        if (item.returnOfGatePassItemId) {
          quantities.set(
            item.returnOfGatePassItemId,
            (quantities.get(item.returnOfGatePassItemId) ?? 0) + Number(item.qty || 0),
          );
        }
      });
    return quantities;
  }, [gatePasses]);

  useEffect(() => {
    return () => photoPreviews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [photoPreviews]);

  useEffect(() => {
    let isCurrent = true;

    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response = await projectService.getAllProjects();
        const nestedData =
          typeof response === "object" && response !== null && "data" in response
            ? response.data
            : undefined;
        const projectList = Array.isArray(response)
          ? response
          : Array.isArray(nestedData)
            ? nestedData
            : [];
        if (isCurrent) {
          setProjects(
            projectList
              .filter((project): project is Record<string, unknown> =>
                typeof project === "object" &&
                project !== null &&
                "id" in project &&
                (typeof project.id === "string" || typeof project.id === "number"),
              )
              .map((project) => ({
                id: String(project.id),
                projectName:
                  typeof project.projectName === "string"
                    ? project.projectName
                    : typeof project.name === "string"
                      ? project.name
                      : `Project ${project.id}`,
              })),
          );
        }
      } catch (error) {
        console.error("Failed to load projects for gate passes", error);
        if (isCurrent) toast.error("Unable to load projects.");
      } finally {
        if (isCurrent) setIsLoadingProjects(false);
      }
    };

    loadProjects();
    return () => {
      isCurrent = false;
    };
  }, []);

  const updateFormValue = <K extends keyof GatePassFormValues>(
    key: K,
    value: GatePassFormValues[K],
  ) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  const handlePassTypeChange = (passType: GatePassFormValues["passType"]) => {
    ++projectBomRequestId.current;
    ++consolidatedBomRequestId.current;
    setFormValues((current) => ({
      ...current,
      passType,
      projectId: "",
      bomId: "",
      storeId: "",
      returnSourceGatePassId: "",
    }));
    setProjectBoms([]);
    setBomItems([]);
    setIsLoadingProjectBoms(false);
    setIsLoadingBomItems(false);
    setAllocationError("");
  };

  const handleReturnSourceChange = (gatePassId: string) => {
    ++consolidatedBomRequestId.current;
    setIsLoadingBomItems(false);
    const source = gatePasses.find(
      (gatePass) => gatePass.id === Number(gatePassId) && gatePass.passType === "Outward",
    );
    setFormValues((current) => ({
      ...current,
      returnSourceGatePassId: gatePassId,
      projectId: source ? String(source.projectId) : "",
      bomId: source ? String(source.bomId) : "",
      storeId: source ? String(source.storeId) : "",
    }));
    setProjectBoms([]);
    setAllocationError("");
    if (!source) {
      setBomItems([]);
      return;
    }

    setBomItems(
      (source.items ?? [])
        .map((item) => {
          const itemId = Number(item.itemId);
          const sourceItemId = Number(item.id);
          const remainingQty = Math.max(
            0,
            Number(item.qty) - (returnedQuantityBySourceItem.get(sourceItemId) ?? 0),
          );
          return {
            id: String(itemId),
            itemName: item.itemName || `Item ${itemId}`,
            unit: item.unit || "",
            allocatedQty: Number(item.qty),
            qty: remainingQty,
            allocateQty: "",
            returnOfGatePassItemId: sourceItemId,
          };
        })
        .filter((item) => item.qty > 0),
    );
    setBomItemsTab("pending");
  };

  const handleStoreChange = (storeId: string) => {
    updateFormValue("storeId", storeId);
    setBomItems([]);
    if (formValues.bomId && storeId) void handleBomChange(formValues.bomId, storeId);
  };

  const handleProjectChange = async (projectId: string) => {
    updateFormValue("projectId", projectId);
    updateFormValue("bomId", "");
    setProjectBoms([]);
    setBomItems([]);
    setAllocationError("");
    const requestId = ++projectBomRequestId.current;
    ++consolidatedBomRequestId.current;
    if (!projectId) {
      setIsLoadingProjectBoms(false);
      setIsLoadingBomItems(false);
      return;
    }

    setIsLoadingProjectBoms(true);
    try {
      const response = await bomService.getProjectBom(projectId);
      if (requestId !== projectBomRequestId.current) return;
      const nestedData =
        typeof response === "object" && response !== null && "data" in response
          ? response.data
          : undefined;
      const bomList = Array.isArray(response)
        ? response
        : Array.isArray(nestedData)
          ? nestedData
          : [];
      setProjectBoms(
        bomList
          .filter((bom): bom is Record<string, unknown> =>
            typeof bom === "object" &&
            bom !== null &&
            ("bomId" in bom || "BomId" in bom || "id" in bom || "Id" in bom),
          )
          .map((bom) => ({
            id: String(bom.bomId ?? bom.BomId ?? bom.id ?? bom.Id),
            name: String(bom.bomName ?? bom.BomName ?? bom.name ?? bom.description ?? `BOM ${bom.bomId ?? bom.id}`),
          })),
      );
    } catch (error) {
      console.error("Failed to load BOMs for selected project", error);
      if (requestId === projectBomRequestId.current) {
        toast.error("Unable to load BOMs for the selected project.");
      }
    } finally {
      if (requestId === projectBomRequestId.current) setIsLoadingProjectBoms(false);
    }
  };

  const handleBomChange = async (bomId: string, storeId = formValues.storeId) => {
    updateFormValue("bomId", bomId);
    setBomItems([]);
    setAllocationError("");
    const requestId = ++consolidatedBomRequestId.current;
    if (!bomId || !storeId) {
      setIsLoadingBomItems(false);
      return;
    }

    setIsLoadingBomItems(true);
    try {
      const response = await gatePassService.getAvailableItems(bomId, storeId);
      if (requestId !== consolidatedBomRequestId.current) return;
      const raw =
        typeof response === "object" && response !== null && "data" in response
          ? response.data
          : response;
      const items = Array.isArray(raw)
        ? raw
        : typeof raw === "object" && raw !== null && "items" in raw && Array.isArray(raw.items)
          ? raw.items
            : [];
      const availableItems = items
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => {
          const itemId = Number(item.itemId ?? item.ItemId);
          const quantity = Number(item.qty ?? item.Qty ?? 0);
          return {
            id: String(itemId),
            itemName: String(item.itemName ?? item.ItemName ?? `Item ${itemId}`),
            unit: String(item.unit ?? item.Unit ?? ""),
            allocatedQty: 0,
            qty: quantity,
            allocateQty: "",
          };
        });
      setBomItems(availableItems.filter((item) => Number(item.id) > 0 && item.qty > 0));
      setBomItemsTab("pending");
    } catch (error) {
      console.error("Failed to load consolidated BOM items", error);
      if (requestId === consolidatedBomRequestId.current) {
        toast.error("Unable to load consolidated BOM items.");
      }
    } finally {
      if (requestId === consolidatedBomRequestId.current) setIsLoadingBomItems(false);
    }
  };

  const handleAllocationChange = (itemId: string, value: string) => {
    setAllocationError("");
    setBomItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item;
        if (value === "") return { ...item, allocateQty: "" };

        const quantity = Number(value);
        if (!Number.isFinite(quantity) || quantity < 0) return item;
        if (quantity > item.qty) {
          toast.error(`Allocate quantity cannot exceed ${item.qty} for ${item.itemName}.`);
          return { ...item, allocateQty: String(item.qty) };
        }
        return { ...item, allocateQty: value };
      }),
    );
  };

  const addPhotos = (files: FileList | null) => {
    if (!files?.length) return;

    const selectedFiles = Array.from(files);
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== selectedFiles.length) {
      toast.error("Only image files can be uploaded.");
    }
    const acceptedFiles = imageFiles.filter((file) => file.size > 0 && file.size <= 5 * 1024 * 1024);
    if (acceptedFiles.length !== imageFiles.length) {
      toast.error("Each photo must be smaller than 5 MB.");
    }

    const remainingSlots = 5 - photos.length;
    if (acceptedFiles.length > remainingSlots) {
      toast.error("You can upload a maximum of 5 photos.");
    }
    if (remainingSlots > 0) {
      setPhotos((current) => [...current, ...acceptedFiles.slice(0, remainingSlots)]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const allocatedItems = bomItems.filter((item) => Number(item.allocateQty) > 0);
    const hasInvalidAllocation = allocatedItems.some(
      (item) =>
        !Number.isInteger(Number(item.allocateQty)) ||
        Number(item.allocateQty) <= 0 ||
        Number(item.allocateQty) > item.qty,
    );
    if (!formValues.projectId || !formValues.bomId || !formValues.storeId) {
      setAllocationError("Select a project, BOM, and source store before creating a gate pass.");
      return;
    }
    if (formValues.passType === "Return" && !formValues.returnSourceGatePassId) {
      setAllocationError("Select the outward Gate Pass that this return belongs to.");
      return;
    }
    if (allocatedItems.length === 0) {
      setAllocationError("Allocate a quantity for at least one item.");
      return;
    }
    if (hasInvalidAllocation) {
      setAllocationError("Allocate quantities must be valid numbers and cannot exceed the BOM quantity.");
      return;
    }
    setAllocationError("");

    setIsSubmitting(true);
    try {
      const photosPayload = await Promise.all(photos.map(fileToGatePassPhoto));
      await gatePassService.create({
        projectId: Number(formValues.projectId),
        bomId: Number(formValues.bomId),
        storeId: Number(formValues.storeId),
        passType: formValues.passType,
        projectLocation: formValues.projectLocation,
        eWayBillNumber: formValues.eWayBillNumber,
        dcNumber: formValues.dcNumber,
        dcDate: formValues.dcDate,
        totalGoodsValue: Number(formValues.totalGoodsValue),
        remarks: formValues.remarks || undefined,
        fromAddress: formValues.fromAddress,
        fromCity: formValues.fromCity,
        fromState: formValues.fromState,
        fromZipCode: formValues.fromZipCode,
        toAddress: formValues.toAddress,
        toCity: formValues.toCity,
        toState: formValues.toState,
        toZipCode: formValues.toZipCode,
        vehicleType: formValues.vehicleType,
        vehicleNumber: formValues.vehicleNumber,
        driverName: formValues.driverName,
        phoneNumber: formValues.phoneNumber,
        items: allocatedItems.map((item) => ({
          itemId: Number(item.id),
          qty: Number(item.allocateQty),
          ...(item.returnOfGatePassItemId
            ? { returnOfGatePassItemId: item.returnOfGatePassItemId }
            : {}),
        })),
        photos: photosPayload,
      });
      toast.success("Gate pass created successfully.");
      closeForm();
      await loadGatePasses();
    } catch (error) {
      console.error("Failed to create gate pass", error);
      toast.error(getApiErrorMessage(error, "Unable to create gate pass."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setFormValues(initialFormValues);
    setProjectBoms([]);
    setBomItems([]);
    setAllocationError("");
    setPhotos([]);
  };

  const downloadGatePassPdf = (gatePass: GatePassApiRecord) => {
    try {
      const pdf = createGatePassPdf(gatePass);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gate-pass-GP-${gatePass.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate gate pass PDF", error);
      toast.error("Unable to download the gate pass PDF.");
    }
  };

  const renderField = (
    label: string,
    name: keyof GatePassFormValues,
    options: {
      placeholder?: string;
      type?: string;
      required?: boolean;
      inputMode?: "decimal" | "numeric" | "tel";
      min?: number;
      step?: number | "any";
    } = {},
  ) => (
    <div className="space-y-1">
      <label htmlFor={name} className="text-xs font-medium text-muted-foreground">
        {label}
        {options.required !== false && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      <Input
        id={name}
        name={name}
        type={options.type ?? "text"}
        inputMode={options.inputMode}
        placeholder={options.placeholder}
        required={options.required !== false}
        min={options.min}
        step={options.step}
        value={formValues[name]}
        onChange={(event) => updateFormValue(name, event.target.value)}
        className={inputClassName}
      />
    </div>
  );

  const pendingBomItems = bomItems.filter((item) => item.qty > 0);
  const completedBomItems = bomItems.filter((item) => item.qty <= 0);
  const filteredGatePasses = gatePasses.filter((gatePass) =>
    [
      gatePass.id,
      gatePass.passType,
      gatePass.projectName,
      gatePass.projectId,
      gatePass.vehicleNumber,
      gatePass.driverName,
      gatePass.eWayBillNumber,
      gatePass.dcNumber,
    ].some((value) => String(value ?? "").toLowerCase().includes(gatePassSearch.toLowerCase()))
  );
  const returnableGatePasses = gatePasses.filter(
    (gatePass) =>
      gatePass.passType === "Outward" &&
      (gatePass.items ?? []).some((item) => {
        const returnedQty = returnedQuantityBySourceItem.get(Number(item.id)) ?? 0;
        return Number(item.qty) > returnedQty;
      }),
  );

  const renderBomItemsTable = (items: GatePassBomItem[], completed = false) => (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item name</TableHead>
            <TableHead>Unit of measurement</TableHead>
            {completed ? (
              <TableHead className="text-right">Qty Allocated</TableHead>
            ) : (
              <>
                <TableHead className="text-right">Remaining Qty</TableHead>
                <TableHead className="w-40 text-right">Allocate Qty</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.itemName}</TableCell>
              <TableCell>{item.unit || "—"}</TableCell>
              {completed ? (
                <TableCell className="text-right tabular-nums">{item.allocatedQty}</TableCell>
              ) : (
                <>
                  <TableCell className="text-right tabular-nums">{item.qty}</TableCell>
                  <TableCell>
                    <Input
                      aria-label={`Allocate quantity for ${item.itemName}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={item.qty}
                      step={1}
                      value={item.allocateQty}
                      onChange={(event) => handleAllocationChange(item.id, event.target.value)}
                      className="ml-auto w-28 text-right"
                    />
                  </TableCell>
                </>
              )}
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={completed ? 3 : 4} className="h-20 text-center text-muted-foreground">
                No items in this category.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gate Pass</h1>
          <p className="text-muted-foreground">Manage inward and outward movement of goods</p>
        </div>
        <Button onClick={() => setShowForm((visible) => !visible)}>
          <Plus className="h-4 w-4" />
          {showForm ? "Close Form" : "Create Gate Pass"}
        </Button>
      </div>

      {showForm && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Create New Gate Pass</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Project details</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="passType" className="text-xs font-medium text-muted-foreground">
                    Pass type<span className="ml-0.5 text-destructive">*</span>
                  </label>
                  <select
                    id="passType"
                    required
                    value={formValues.passType}
                    onChange={(event) => handlePassTypeChange(event.target.value as GatePassFormValues["passType"])}
                    className={inputClassName}
                  >
                    <option value="Outward">Outward</option>
                    <option value="Return">Return</option>
                  </select>
                </div>
                {formValues.passType === "Return" ? (
                  <>
                    <div className="space-y-1 sm:col-span-2">
                      <label htmlFor="returnSourceGatePassId" className="text-xs font-medium text-muted-foreground">
                        Return from outward Gate Pass<span className="ml-0.5 text-destructive">*</span>
                      </label>
                      <select
                        id="returnSourceGatePassId"
                        required
                        value={formValues.returnSourceGatePassId}
                        onChange={(event) => handleReturnSourceChange(event.target.value)}
                        className={inputClassName}
                      >
                        <option value="">Select outward Gate Pass</option>
                        {returnableGatePasses.map((gatePass) => (
                          <option key={gatePass.id} value={gatePass.id}>
                            GP-{gatePass.id} · {gatePass.projectName || `Project ${gatePass.projectId}`} · {gatePass.storeName || `Store ${gatePass.storeId}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Project</label>
                      <Input readOnly value={gatePasses.find((item) => item.id === Number(formValues.returnSourceGatePassId))?.projectName ?? ""} className={inputClassName} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">BOM</label>
                      <Input readOnly value={gatePasses.find((item) => item.id === Number(formValues.returnSourceGatePassId))?.bomName ?? ""} className={inputClassName} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Returning to store</label>
                      <Input readOnly value={gatePasses.find((item) => item.id === Number(formValues.returnSourceGatePassId))?.storeName ?? ""} className={inputClassName} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="projectId" className="text-xs font-medium text-muted-foreground">
                        Project<span className="ml-0.5 text-destructive">*</span>
                      </label>
                      <select
                        id="projectId"
                        aria-label="Project"
                        required
                        value={formValues.projectId}
                        onChange={(event) => void handleProjectChange(event.target.value)}
                        disabled={isLoadingProjects}
                        className={inputClassName}
                      >
                        <option value="">
                          {isLoadingProjects ? "Loading projects..." : "Select project"}
                        </option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>{project.projectName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="bomId" className="text-xs font-medium text-muted-foreground">
                        BOM<span className="ml-0.5 text-destructive">*</span>
                      </label>
                      <select
                        id="bomId"
                        required
                        value={formValues.bomId}
                        onChange={(event) => void handleBomChange(event.target.value)}
                        disabled={!formValues.projectId || isLoadingProjectBoms || projectBoms.length === 0}
                        className={inputClassName}
                      >
                        <option value="">
                          {isLoadingProjectBoms
                            ? "Loading BOMs..."
                            : projectBoms.length > 0
                              ? "Select BOM"
                              : "Select project first"}
                        </option>
                        {projectBoms.map((bom) => (
                          <option key={bom.id} value={bom.id}>{bom.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="storeId" className="text-xs font-medium text-muted-foreground">
                        Source store<span className="ml-0.5 text-destructive">*</span>
                      </label>
                      <select
                        id="storeId"
                        required
                        value={formValues.storeId}
                        onChange={(event) => handleStoreChange(event.target.value)}
                        className={inputClassName}
                      >
                        <option value="">Select store</option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                {renderField("Project location", "projectLocation", { placeholder: "City / venue" })}
                {renderField("EWay Bill No", "eWayBillNumber", { placeholder: "EWay Bill Number" })}
                {renderField("DC No.", "dcNumber", { placeholder: "Delivery Challan No." })}
                {renderField("DC Date", "dcDate", { type: "date" })}
                {renderField("Total Goods Value", "totalGoodsValue", {
                  type: "number",
                  placeholder: "e.g. 50000",
                  inputMode: "decimal",
                  min: 0,
                  step: "any",
                })}
                <div className="sm:col-span-2">
                  {renderField("Remarks", "remarks", { placeholder: "Notes / remarks", required: false })}
                </div>
                {formValues.passType === "Outward" && isLoadingProjectBoms && (
                  <p className="text-xs text-muted-foreground sm:col-span-2">Loading project BOMs...</p>
                )}
              </div>
            </section>

            {(formValues.passType === "Outward"
              ? formValues.bomId && formValues.storeId
              : formValues.returnSourceGatePassId) && (
              <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {formValues.passType === "Return" ? "Items to return" : "Available allocated BOM items"}
                </h3>
                {isLoadingBomItems ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Loading available items...</p>
                ) : (
                  <Tabs
                    value={bomItemsTab}
                    onValueChange={(value) => setBomItemsTab(value as "pending" | "completed")}
                    className="space-y-3"
                  >
                    <TabsList>
                      <TabsTrigger value="pending">Pending ({pendingBomItems.length})</TabsTrigger>
                      <TabsTrigger value="completed">Completed ({completedBomItems.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending">
                      {renderBomItemsTable(pendingBomItems)}
                    </TabsContent>
                    <TabsContent value="completed">
                      {renderBomItemsTable(completedBomItems, true)}
                    </TabsContent>
                  </Tabs>
                )}
              </section>
            )}

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-foreground">From Address</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  {renderField("Address", "fromAddress", { placeholder: "Street / building" })}
                </div>
                {renderField("City", "fromCity")}
                {renderField("State", "fromState")}
                {renderField("Zip Code", "fromZipCode", { inputMode: "numeric" })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-foreground">To Address</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  {renderField("Address", "toAddress", { placeholder: "Street / building" })}
                </div>
                {renderField("City", "toCity")}
                {renderField("State", "toState")}
                {renderField("Zip Code", "toZipCode", { inputMode: "numeric" })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Vehicle &amp; driver</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="vehicleType" className="text-xs font-medium text-muted-foreground">
                    Vehicle type<span className="ml-0.5 text-destructive">*</span>
                  </label>
                  <select
                    id="vehicleType"
                    required
                    value={formValues.vehicleType}
                    onChange={(event) => updateFormValue("vehicleType", event.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Select…</option>
                    {["Tempo", "Pickup", "Mini Truck", "Truck", "Container", "Trailer", "Van", "Other"].map((vehicle) => (
                      <option key={vehicle} value={vehicle}>{vehicle}</option>
                    ))}
                  </select>
                </div>
                {renderField("Vehicle number", "vehicleNumber", {
                  placeholder: "e.g. MH12 AB 1234",
                  required: true,
                })}
                {renderField("Driver/Transporter Name", "driverName", {
                  placeholder: "Full name",
                  required: true,
                })}
                {renderField("Phone number", "phoneNumber", {
                  type: "tel",
                  inputMode: "tel",
                  placeholder: "10-digit mobile",
                  required: true,
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Photos<span className="ml-2 text-xs font-normal text-muted-foreground">{photos.length}/5</span>
                </h3>
              </div>
              <input
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                type="file"
                onChange={(event) => {
                  addPhotos(event.currentTarget.files);
                  event.currentTarget.value = "";
                }}
              />
              <input
                ref={uploadInputRef}
                accept="image/*"
                multiple
                className="hidden"
                type="file"
                onChange={(event) => {
                  addPhotos(event.currentTarget.files);
                  event.currentTarget.value = "";
                }}
              />
              <div className="flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <div key={`${photo.name}-${photo.lastModified}-${index}`} className="relative">
                    <img
                      src={photoPreviews[index]}
                      alt={`Gate pass photo ${index + 1}`}
                      className="h-20 w-20 rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))}
                      className="absolute -right-2 -top-2 rounded-full bg-background p-1 text-foreground shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex h-20 w-20 flex-col gap-1 rounded-lg border-dashed px-2 text-muted-foreground"
                    >
                      <Camera className="h-5 w-5" />
                      <span className="text-[10px] font-medium">Camera</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => uploadInputRef.current?.click()}
                      className="flex h-20 w-20 flex-col gap-1 rounded-lg border-dashed px-2 text-muted-foreground"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-[10px] font-medium">Upload</span>
                    </Button>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Add up to 5 photos to this gate pass.</p>
            </section>

            {allocationError && (
              <p role="alert" className="text-right text-sm text-destructive">{allocationError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || isLoadingBomItems}>
                {isSubmitting ? "Creating..." : "Create Gate Pass"}
              </Button>
            </div>
          </form>
        </section>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border bg-muted/40 px-5 py-4">
              <CardTitle>Gate Pass List</CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search gate passes..." value={gatePassSearch} onChange={(event) => setGatePassSearch(event.target.value)} className="h-9 pl-9" />
                  </div>
                </div>
              </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gate Pass ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Source Store</TableHead>
                  <TableHead>Vehicle Number</TableHead>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>EWay Bill No</TableHead>
                  <TableHead>DC No.</TableHead>
                  <TableHead>DC Date</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingGatePasses ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                      Loading gate passes...
                    </TableCell>
                  </TableRow>
                ) : filteredGatePasses.length > 0 ? filteredGatePasses.map((gatePass) => (
                  <TableRow key={gatePass.id}>
                    <TableCell className="font-medium">GP-{gatePass.id}</TableCell>
                    <TableCell>{gatePass.passType}</TableCell>
                    <TableCell>
                      {gatePass.passType === "Outward"
                        ? "Dispatched"
                        : (gatePass.items ?? []).every((item) => (item.receivedQty ?? 0) >= item.qty)
                          ? "Received"
                          : (gatePass.items ?? []).some((item) => (item.receivedQty ?? 0) > 0)
                            ? "Partially received"
                            : "In transit"}
                    </TableCell>
                    <TableCell>{gatePass.projectName || `Project ${gatePass.projectId}`}</TableCell>
                    <TableCell>{gatePass.storeName || `Store ${gatePass.storeId}`}</TableCell>
                    <TableCell>{gatePass.vehicleNumber}</TableCell>
                    <TableCell>{gatePass.driverName}</TableCell>
                    <TableCell>{gatePass.eWayBillNumber}</TableCell>
                    <TableCell>{gatePass.dcNumber}</TableCell>
                    <TableCell>{gatePass.dcDate ? new Date(gatePass.dcDate).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>{new Date(gatePass.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1 whitespace-nowrap">
                        {gatePass.passType === "Return" &&
                          (gatePass.items ?? []).some((item) => (item.receivedQty ?? 0) < item.qty) && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              aria-label={`Receive return from gate pass GP-${gatePass.id}`}
                              title="Receive returned items into store"
                              onClick={() => openReturnReceipt(gatePass)}
                            >
                              <PackageCheck className="h-4 w-4" />
                            </Button>
                          )}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`View gate pass GP-${gatePass.id}`}
                          title="View gate pass"
                          onClick={() => {
                            setViewingGatePass(gatePass);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Download PDF for gate pass GP-${gatePass.id}`}
                          title="Download PDF"
                          onClick={() => downloadGatePassPdf(gatePass)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                      No gate passes to display.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent> </Card>
      <Dialog
        open={viewingGatePass !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewingGatePass(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {viewingGatePass && (
            <>
              <DialogHeader>
                <DialogTitle>Gate Pass GP-{viewingGatePass.id}</DialogTitle>
                <DialogDescription>
                  {viewingGatePass.projectName || `Project ${viewingGatePass.projectId}`} · {viewingGatePass.passType}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <p><span className="font-medium">BOM:</span> {viewingGatePass.bomName || `BOM ${viewingGatePass.bomId}`}</p>
                <p><span className="font-medium">Source store:</span> {viewingGatePass.storeName || `Store ${viewingGatePass.storeId}`}</p>
                <p><span className="font-medium">Project location:</span> {viewingGatePass.projectLocation || "—"}</p>
                <p><span className="font-medium">EWay Bill No:</span> {viewingGatePass.eWayBillNumber || "—"}</p>
                <p><span className="font-medium">DC No.:</span> {viewingGatePass.dcNumber || "—"}</p>
                <p><span className="font-medium">DC Date:</span> {viewingGatePass.dcDate ? new Date(viewingGatePass.dcDate).toLocaleDateString() : "—"}</p>
                <p><span className="font-medium">Total Goods Value:</span> {viewingGatePass.totalGoodsValue ?? "—"}</p>
                <p><span className="font-medium">Vehicle:</span> {[viewingGatePass.vehicleType, viewingGatePass.vehicleNumber].filter(Boolean).join(" ") || "—"}</p>
                <p><span className="font-medium">Driver/Transporter:</span> {viewingGatePass.driverName || "—"}</p>
                <p><span className="font-medium">Phone:</span> {viewingGatePass.phoneNumber || "—"}</p>
                <p><span className="font-medium">Remarks:</span> {viewingGatePass.remarks || "—"}</p>
                <p className="sm:col-span-2">
                  <span className="font-medium">From address:</span>{" "}
                  {[viewingGatePass.fromAddress, viewingGatePass.fromCity, viewingGatePass.fromState, viewingGatePass.fromZipCode].filter(Boolean).join(", ") || "—"}
                </p>
                <p className="sm:col-span-2">
                  <span className="font-medium">To address:</span>{" "}
                  {[viewingGatePass.toAddress, viewingGatePass.toCity, viewingGatePass.toState, viewingGatePass.toZipCode].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">
                  {viewingGatePass.passType === "Return" ? "Returned items" : "Dispatched items"}
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item name</TableHead>
                        <TableHead>Unit of measurement</TableHead>
                        <TableHead className="text-right">
                          {viewingGatePass.passType === "Return" ? "Qty returned" : "Qty sent"}
                        </TableHead>
                        <TableHead className="text-right">Received at store</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(viewingGatePass.items ?? []).length > 0 ? (
                        (viewingGatePass.items ?? []).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.itemName || `Item ${item.itemId}`}</TableCell>
                            <TableCell>{item.unit || "—"}</TableCell>
                            <TableCell className="text-right tabular-nums">{item.qty}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {viewingGatePass.passType === "Return" ? item.receivedQty ?? 0 : "—"}
                            </TableCell>
                          </TableRow>
                        ))) : (
                          <TableRow>
                            <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                              No items recorded on this Gate Pass.
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={() => downloadGatePassPdf(viewingGatePass)}>
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={receivingGatePass !== null}
        onOpenChange={(open) => {
          if (!open && !isReceiving) setReceivingGatePass(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receive return — GP-{receivingGatePass?.id}</DialogTitle>
            <DialogDescription>
              Received quantities are added to store stock. Quantities not received remain in transit.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">In transit</TableHead>
                  <TableHead className="w-36 text-right">Receive now</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(receivingGatePass?.items ?? [])
                  .filter((item) => item.qty > (item.receivedQty ?? 0))
                  .map((item) => {
                    const remaining = item.qty - (item.receivedQty ?? 0);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.itemName || `Item ${item.itemId}`}</TableCell>
                        <TableCell className="text-right tabular-nums">{remaining}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            max={remaining}
                            step={1}
                            value={item.id === undefined ? "" : receiptQuantities[item.id] ?? ""}
                            onChange={(event) => {
                              if (item.id !== undefined) {
                                setReceiptQuantities((current) => ({
                                  ...current,
                                  [item.id!]: event.target.value,
                                }));
                              }
                            }}
                            aria-label={`Quantity received for ${item.itemName ?? `item ${item.itemId}`}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            disabled={isReceiving || item.id === undefined}
                            onClick={() => void receiveReturnItem(item)}
                          >
                            Receive
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {(receivingGatePass?.items ?? []).every((item) => item.qty <= (item.receivedQty ?? 0)) && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                      All items on this Return Gate Pass have been received.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
