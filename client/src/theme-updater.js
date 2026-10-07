import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/darsh/enterprise-network-design/client/src';

const replacements = [
  { from: /rounded-xl/g, to: 'rounded-sm' },
  { from: /rounded-lg/g, to: 'rounded-sm' },
  { from: /rounded-2xl/g, to: 'rounded-sm' },
  { from: /rounded-md/g, to: 'rounded-sm' },
  { from: /cyan-/g, to: 'blue-' },
  { from: /slate-/g, to: 'zinc-' },
  { from: /rose-/g, to: 'red-' },
  { from: /shadow-glowCyan/g, to: 'shadow-sm border-blue-500/50' },
  { from: /shadow-glowRose/g, to: 'shadow-sm border-red-500/50' },
  { from: /shadow-glowAmber/g, to: 'shadow-sm border-amber-500/50' },
  { from: /glass-panel/g, to: 'surface-panel' }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      for (const r of replacements) {
        newContent = newContent.replace(r.from, r.to);
      }
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
