const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend/src');
const outputFile = path.join(__dirname, 'colour_analysis.md');

let analysis = '# Frontend Colour Analysis\n\n';
analysis += 'This document provides an exhaustive, inch-by-inch analysis of all colours used across the frontend, including Tailwind classes, CSS variables, and hardcoded values.\n\n';

analysis += '## 1. Global Theme Variables (frontend/src/index.css)\n\n';
analysis += 'These are the core custom colors defined in Tailwind v4 `@theme` block:\n\n';
analysis += '| Variable | Hex Code | Description/Usage |\n';
analysis += '| :--- | :--- | :--- |\n';
analysis += '| `--color-bg` | `#150E22` | Main background color (Very Dark Purple) |\n';
analysis += '| `--color-surface` | `#201735` | Surface/Card background color (Dark Purple) |\n';
analysis += '| `--color-text` | `#FFFFFF` | Primary text color (White) |\n';
analysis += '| `--color-text-muted` | `#C3B8D9` | Muted text color (Light grayish purple) |\n';
analysis += '| `--color-accent` | `#B583F0` | Primary accent color (Light Purple) |\n';
analysis += '| `--color-accent-2` | `#4FE0B0` | Secondary accent color (Teal/Mint) |\n';
analysis += '| `--color-muted` | `#9686B5` | Muted elements (Grayish purple) |\n';
analysis += '| `--color-cta` | `#F0A83E` | Call to Action color (Orange/Yellow) |\n';
analysis += '| `--color-cta-text` | `#1A1330` | Text on CTA buttons (Dark Purple/Black) |\n';
analysis += '| `--color-destructive` | `#EF4444` | Error/Destructive actions (Red) |\n\n';

const colorClassRegex = /\b(bg|text|border|ring|fill|stroke|outline|shadow)-([a-zA-Z0-9-]+(?:-\[[^\]]+\])?)/g;
const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;
const rgbaRegex = /rgba?\([^)]+\)/g;
const cssVarRegex = /var\(--[^)]+\)/g;

const colorUsage = {};
const fileDetails = {};

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDir(fullPath);
        } else if (/\.(tsx|ts|css|html)$/.test(file)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const relativePath = path.relative(__dirname, fullPath).replace(/\\/g, '/');
            
            let matches = [];
            let m;
            
            // Re-initialize regex index
            colorClassRegex.lastIndex = 0;
            hexRegex.lastIndex = 0;
            rgbaRegex.lastIndex = 0;
            cssVarRegex.lastIndex = 0;

            while ((m = colorClassRegex.exec(content)) !== null) matches.push(m[0]);
            while ((m = hexRegex.exec(content)) !== null) matches.push(m[0]);
            while ((m = rgbaRegex.exec(content)) !== null) matches.push(m[0]);
            while ((m = cssVarRegex.exec(content)) !== null) matches.push(m[0]);
            
            const validColors = matches.filter(c => {
                if (c.startsWith('bg-') || c.startsWith('text-')) {
                   const keywords = ['transparent', 'black', 'white', 'accent', 'surface', 'bg', 'cta', 'muted', 'destructive', 'gradient', 'gray', 'purple', 'red', 'green', 'blue', 'pink', 'yellow', 'indigo', 'transparent'];
                   return keywords.some(k => c.includes(k)) || c.match(/-\[[^\]]+\]/);
                }
                if (c.startsWith('border-') || c.startsWith('ring-') || c.startsWith('fill-') || c.startsWith('stroke-') || c.startsWith('outline-') || c.startsWith('shadow-')) return true;
                if (c.startsWith('#') || c.startsWith('rgba') || c.startsWith('rgb') || c.startsWith('var(')) return true;
                return false;
            });
            
            if (validColors.length > 0) {
                const uniqueColors = [...new Set(validColors)].sort();
                fileDetails[relativePath] = uniqueColors;
                
                for (const color of uniqueColors) {
                    if (!colorUsage[color]) colorUsage[color] = [];
                    if (!colorUsage[color].includes(relativePath)) {
                        colorUsage[color].push(relativePath);
                    }
                }
            }
        }
    }
}

scanDir(srcDir);

analysis += '## 2. Color Usage Summary (By Color/Class)\n\n';
analysis += 'This section lists every color-related class, hex code, or CSS variable found and the files they appear in.\n\n';

const sortedColors = Object.keys(colorUsage).sort();

for (const color of sortedColors) {
    analysis += `### \`${color}\`\n`;
    analysis += `Used in:\n`;
    for (const file of colorUsage[color]) {
        analysis += `- \`${file}\`\n`;
    }
    analysis += '\n';
}

analysis += '## 3. Directory & File Breakdown\n\n';
analysis += 'This section goes folder by folder, file by file, listing exactly which colors are used inside them.\n\n';

const sortedFiles = Object.keys(fileDetails).sort();

for (const file of sortedFiles) {
    analysis += `### \`${file}\`\n`;
    analysis += `**Colors/Classes used:**\n`;
    const cols = fileDetails[file];
    
    const bgClasses = cols.filter(c => c.startsWith('bg-'));
    const textClasses = cols.filter(c => c.startsWith('text-'));
    const borderClasses = cols.filter(c => c.startsWith('border-') || c.startsWith('ring-') || c.startsWith('outline-'));
    const otherClasses = cols.filter(c => !c.startsWith('bg-') && !c.startsWith('text-') && !c.startsWith('border-') && !c.startsWith('ring-') && !c.startsWith('outline-'));
    
    if (bgClasses.length > 0) analysis += `- **Backgrounds**: ${bgClasses.map(c => '`' + c + '`').join(', ')}\n`;
    if (textClasses.length > 0) analysis += `- **Text**: ${textClasses.map(c => '`' + c + '`').join(', ')}\n`;
    if (borderClasses.length > 0) analysis += `- **Borders/Rings/Outlines**: ${borderClasses.map(c => '`' + c + '`').join(', ')}\n`;
    if (otherClasses.length > 0) analysis += `- **Other/Hex/Variables**: ${otherClasses.map(c => '`' + c + '`').join(', ')}\n`;
    analysis += '\n';
}

analysis += '## 4. Recommendations for Theming\n\n';
analysis += '1. **Update `frontend/src/index.css`**: The easiest way to re-theme the entire app is to change the CSS variables in the `@theme` block. Tailwind classes like `bg-bg`, `text-accent`, etc. will automatically adapt.\n';
analysis += '2. **Audit Hardcoded Opacities**: Classes like `bg-white/[0.06]` and `bg-white/[0.02]` are used for the glassmorphism effects. If you change the primary background to a lighter theme, these white overlays might need to become dark (e.g., `bg-black/[0.06]`).\n';
analysis += '3. **Arbitrary Values**: Look out for arbitrary classes like `bg-[#2A1F45]`, `border-[#3A2A60]`, etc. in specific components (e.g., in `Hero.tsx` or `CounselingSession.tsx`). These won\'t change when you update `index.css`. You should replace them with theme variables if possible.\n';

fs.writeFileSync(outputFile, analysis, 'utf-8');
console.log('colour_analysis.md created successfully.');
