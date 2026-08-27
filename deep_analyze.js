const fs = require('fs');
const path = require('path');

const projectRoot = 'd:\\parul project';
const ignoreFolders = ['.agents', 'blog', '.mimocode', '.opencode', 'node_modules', 'dist', '.git', '.claude'];

function shouldIgnore(p) {
    return ignoreFolders.some(folder => p.includes(folder));
}

function traverseDir(dir, fileList = []) {
    if (shouldIgnore(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (shouldIgnore(fullPath)) continue;
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath, fileList);
        } else {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

const allFiles = traverseDir(projectRoot);
let deepAnalysis = '\n\n## 21. Deep Module-Level Inspection & Mermaid Flows\n\n';

const backendModules = ['auth', 'ai-service', 'analytics', 'careers', 'common', 'counselor', 'dashboard', 'health', 'history', 'onboarding', 'recommendation', 'reports'];

for (const mod of backendModules) {
    const modFiles = allFiles.filter(f => f.includes(`\\backend\\src\\${mod}\\`));
    if (modFiles.length === 0) continue;

    deepAnalysis += `### 21.${backendModules.indexOf(mod) + 1} Backend Module: ${mod.toUpperCase()}\n\n`;
    
    let controllers = [];
    let services = [];
    let schemas = [];
    let dtos = [];

    for (const file of modFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const fileName = path.basename(file);
        const relative = path.relative(projectRoot, file);

        if (fileName.includes('.controller.')) controllers.push({ file: relative, content });
        else if (fileName.includes('.service.')) services.push({ file: relative, content });
        else if (fileName.includes('.schema.')) schemas.push({ file: relative, content });
        else if (fileName.includes('.dto.')) dtos.push({ file: relative, content });
    }

    deepAnalysis += `#### Sub-Flow (Mermaid)\n`;
    deepAnalysis += `\`\`\`mermaid\nflowchart LR\n`;
    deepAnalysis += `    Client([Client])\n`;
    deepAnalysis += `    Module[${mod} Module]\n`;
    
    if (controllers.length > 0) {
        deepAnalysis += `    Controllers[Controllers]\n`;
        deepAnalysis += `    Client --> Controllers\n`;
        deepAnalysis += `    Controllers --> Module\n`;
    }
    if (services.length > 0) {
        deepAnalysis += `    Services[Services]\n`;
        deepAnalysis += `    Module --> Services\n`;
    }
    if (schemas.length > 0) {
        deepAnalysis += `    Database[(MongoDB)]\n`;
        deepAnalysis += `    Services --> Database\n`;
    }
    deepAnalysis += `\`\`\`\n\n`;

    deepAnalysis += `#### Files & Methods in ${mod}\n\n`;
    for (const item of [...controllers, ...services, ...schemas, ...dtos]) {
        deepAnalysis += `**File:** \`${item.file}\`\n`;
        const lines = item.content.split('\n');
        const methods = lines.filter(l => l.match(/(async )?[a-zA-Z0-9_]+\s*\(/) && !l.includes('constructor') && !l.includes('if') && !l.includes('for') && !l.includes('return') && !l.includes('catch')).map(l => l.trim().split('{')[0]);
        if (methods.length > 0) {
            deepAnalysis += `- **Methods / Signatures:**\n`;
            methods.forEach(m => {
                if(m.length > 3 && m.length < 100) deepAnalysis += `  - \`${m.trim()}\`\n`;
            });
        }
        deepAnalysis += '\n';
    }
}

deepAnalysis += `### 21.${backendModules.length + 1} Frontend Components & Pages\n\n`;
const frontendSrc = allFiles.filter(f => f.includes('\\frontend\\src\\'));

deepAnalysis += `#### Frontend Flow (Mermaid)\n`;
deepAnalysis += `\`\`\`mermaid\nflowchart TD\n`;
deepAnalysis += `    App[App.tsx]\n`;
deepAnalysis += `    Pages[Pages/Routes]\n`;
deepAnalysis += `    App --> Pages\n`;
const pages = frontendSrc.filter(f => f.includes('\\pages\\'));
pages.forEach(p => {
    deepAnalysis += `    Pages --> ${path.parse(p).name}\n`;
});
deepAnalysis += `\`\`\`\n\n`;

for (const file of frontendSrc) {
    const relative = path.relative(projectRoot, file);
    if (!relative.endsWith('.tsx') && !relative.endsWith('.ts')) continue;
    
    deepAnalysis += `**File:** \`${relative}\`\n`;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const hooks = lines.filter(l => l.includes('use')).map(l => l.trim());
    if (hooks.length > 0) {
        deepAnalysis += `- **Hooks Detected:**\n`;
        const uniqueHooks = [...new Set(hooks.map(h => h.match(/use[A-Z][a-zA-Z0-9_]*/)?.[0]).filter(Boolean))];
        uniqueHooks.forEach(h => deepAnalysis += `  - \`${h}\`\n`);
    }
    deepAnalysis += '\n';
}

fs.appendFileSync(path.join(projectRoot, 'PROJECT_ANALYSIS.md'), deepAnalysis);
console.log('Deep module analysis appended.');
