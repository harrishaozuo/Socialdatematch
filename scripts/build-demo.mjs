import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Export this dependency-free prototype into one HTML file for easy review.
// The source uses only relative, named ES module imports. No browser data is read.
const root = fileURLToPath(new URL('../', import.meta.url));
const modules = [];
const compiled = new Map();
const compiling = new Set();
async function compile(file) {
  if (compiled.has(file)) return compiled.get(file);
  if (compiling.has(file)) throw new Error(`Circular module import: ${file}`);
  if (!file.startsWith(root)) throw new Error('Only project source may be exported');
  compiling.add(file);
  let source = await readFile(file, 'utf8');
  const imports = [...source.matchAll(/^import\s+\{([\s\S]*?)\}\s+from\s+(['"])([^'"]+)\2;?\s*$/gm)];
  const bindings = [];
  for (const match of imports) {
    if (!match[3].startsWith('.')) throw new Error('External imports are not supported in the standalone prototype');
    const dependency = await compile(path.resolve(path.dirname(file), match[3]));
    const names = match[1].split(',').map(name => name.trim().replace(/\s+as\s+/g, ': ')).filter(Boolean);
    bindings.push(`const { ${names.join(', ')} } = __demoModules[${dependency}];`);
    source = source.replace(match[0], '');
  }
  const exports = [...source.matchAll(/^export\s+(?:(?:async\s+)?function|const|let|class)\s+(\w+)/gm)].map(match => match[1]);
  source = source.replace(/^export\s+(?=(?:async\s+)?function|const|let|class)/gm, '');
  source = source.replaceAll('import.meta.url', "new URL('src/app.js', document.baseURI).href");
  if (file === path.join(root, 'src/photos.js')) {
    const assets = [...source.matchAll(/(['"])(\.\/assets\/people\/person-\d{2}\.(?:jpg|png))\1/g)];
    for (const asset of assets) {
      const bytes = await readFile(path.join(root, asset[2]));
      const mime = asset[2].endsWith('.png') ? 'image/png' : 'image/jpeg';
      source = source.replace(asset[0], JSON.stringify(`data:${mime};base64,${bytes.toString('base64')}`));
    }
  }
  if (file === path.join(root, 'src/app.js')) {
    // Standalone export carries all resources; installation uses the normal hosted app.
    source = source.replace("if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol))", 'if (false)');
  }
  const index = modules.length;
  modules.push(`__demoModules[${index}] = (() => {\n${bindings.join('\n')}\n${source}\nreturn { ${exports.join(', ')} };\n})();`);
  compiled.set(file, index);
  compiling.delete(file);
  return index;
}
await compile(path.join(root, 'src/app.js'));
const css = (await Promise.all(['src/style.css', 'src/community.css'].map(file => readFile(path.join(root, file), 'utf8')))).join('\n');
const script = ['const __demoModules = {};', ...modules].join('\n').replace(/<\/script/gi, '<\\/script');
// Keep source and license notices with the photographs when this file is shared alone.
const credits = (await readFile(path.join(root, 'docs/PHOTO_CREDITS.md'), 'utf8')).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#173c32"><title>碰个面 · 可交互手机原型</title><style>${css}</style></head><body><div id="app"></div><noscript>请开启 JavaScript 体验交互原型。</noscript><template id="photo-credits"><pre>${credits}</pre></template><script>${script}</script></body></html>`;
await writeFile(path.join(root, 'demo.html'), html);
console.log(`Exported demo.html: ${modules.length} modules, ${Buffer.byteLength(html)} bytes, no external runtime resources`);
