const SVG_WIDTH = 900;
const SVG_HEIGHT = 690;

export type PngResolution = "low" | "medium" | "high";

const PNG_SCALES: Record<PngResolution, number> = {
  low: 1,
  medium: 2,
  high: 4,
};

const STANDALONE_STYLES = `
.canvas-paper { fill: #fbf9f2; }
.periodic-face { stroke: none; opacity: 0.92; }
.motif-edge { stroke: #3e4a4c; stroke-width: 2; opacity: 0.58; }
.motif-vertex { fill: #2d3839; stroke: #fbf9f2; stroke-width: 1.4; opacity: 0.65; }
`;

function exportStem(name: string): string {
  return name.replace(/\s+/g, "-").toLowerCase();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function serializeTilingSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(SVG_WIDTH));
  clone.setAttribute("height", String(SVG_HEIGHT));
  clone.setAttribute("viewBox", `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`);
  const style = window.document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = STANDALONE_STYLES;
  clone.prepend(style);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
}

export function exportTilingSvg(svg: SVGSVGElement, name: string): void {
  downloadBlob(
    new Blob([serializeTilingSvg(svg)], { type: "image/svg+xml;charset=utf-8" }),
    `${exportStem(name)}-tiling.svg`,
  );
}

function svgImage(contents: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([contents], { type: "image/svg+xml;charset=utf-8" }));
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The SVG tiling could not be rasterized."));
    };
    image.src = url;
  });
}

export async function exportTilingPng(
  svg: SVGSVGElement,
  name: string,
  resolution: PngResolution,
): Promise<void> {
  const scale = PNG_SCALES[resolution];
  const image = await svgImage(serializeTilingSvg(svg));
  const canvas = window.document.createElement("canvas");
  canvas.width = SVG_WIDTH * scale;
  canvas.height = SVG_HEIGHT * scale;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("PNG export is not available in this browser.");
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((entry) => {
      if (entry) {
        resolve(entry);
      } else {
        reject(new Error("PNG export failed."));
      }
    }, "image/png");
  });
  downloadBlob(blob, `${exportStem(name)}-tiling-${resolution}.png`);
}

export function pngDimensions(resolution: PngResolution): string {
  const scale = PNG_SCALES[resolution];
  return `${SVG_WIDTH * scale} x ${SVG_HEIGHT * scale}`;
}
