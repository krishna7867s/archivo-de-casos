import { mkdir, writeFile } from 'node:fs/promises';
import { trialCases } from '../src/lib/miniTrial.js';

const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const terminal = new Set(['mensaje', 'electricidad', 'envios', 'edicion', 'acceso']);

function illustration(id) {
  if (id === 'plano') return '<path d="M65 330h180v-87h205v87h245 M65 375h225v-86h115v86h290" fill="none" stroke="#5582a8" stroke-width="8"/><path d="M120 351h100m85-84h80m90 85h150" fill="none" stroke="#ba3974" stroke-width="7" stroke-dasharray="12 8"/>';
  if (id === 'sello') return '<path d="M200 271h360v103H200z" fill="#ad794b"/><path d="M210 323h340" stroke="#f5cb68" stroke-width="27"/><text x="350" y="330" font-size="22" font-family="monospace" fill="#2d1a1c">S-44</text>';
  if (id === 'etiquetas') return '<path d="M80 270h268v104H80zM410 270h268v104H410z" fill="#ab794d"/><path d="M111 295h145v55H111zM440 295h145v55H440z" fill="#efe3d3"/><text x="130" y="330" font-size="27" font-family="monospace">G-81</text><text x="459" y="330" font-size="27" font-family="monospace">G-18</text>';
  if (id === 'camara') return '<path d="M90 390V265h282v125 M410 390V265h260v125" fill="#292d3b" stroke="#5e667a" stroke-width="4"/><circle cx="465" cy="303" r="22" fill="#b4a8a6"/><path d="M422 390v-23c0-49 88-49 88 0v23" fill="#697281"/><rect x="507" y="351" width="70" height="26" fill="#ffcd65"/><text x="514" y="369" font-size="15" font-family="monospace">AP-04</text>';
  if (id === 'electricidad') return '<path d="M65 298h632M65 350h632M100 265v119M270 265v119M440 265v119M610 265v119" stroke="#46607a"/><path d="M66 296h55v54h575" fill="none" stroke="#77e9ba" stroke-width="6"/>';
  return '<path d="M65 284h630m-630 32h630m-630 32h400" stroke="currentColor" opacity=".24" stroke-width="4"/>';
}

for (const trial of trialCases) {
  const directory = new URL('../assets/trial-evidence/' + trial.id + '/', import.meta.url);
  await mkdir(directory, { recursive: true });
  for (const [id, title, lines] of trial.evidence) {
    const dark = terminal.has(id) || id === 'camara';
    const paper = dark ? '#1b2638' : '#f3e8d7';
    const ink = dark ? '#e2edf9' : '#332436';
    const accent = dark ? '#ffa3c8' : '#972658';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="420" viewBox="0 0 760 420" role="img" aria-label="${escape(title)}">
  <rect width="760" height="420" rx="18" fill="${paper}"/>
  <rect width="760" height="85" rx="18" fill="${dark ? '#101929' : '#e1d0ba'}"/>
  <text x="35" y="54" font-family="system-ui,sans-serif" font-size="29" font-weight="700" fill="${ink}">${escape(title)}</text>
  ${lines.map((line, index) => `<text x="35" y="${131 + index * 48}" font-family="monospace" font-size="22" fill="${index === 0 ? accent : ink}">${escape(line)}</text>`).join('\n  ')}
  <g color="${ink}">${illustration(id)}</g>
  <text x="35" y="404" fill="${accent}" font-family="monospace" font-size="13">RECREACIÓN PARA EL EXPEDIENTE FICTICIO</text>
</svg>\n`;
    await writeFile(new URL(id + '.svg', directory), svg);
  }
}
