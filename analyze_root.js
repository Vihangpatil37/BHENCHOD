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

let detailedAnalysis = '### 19.3 Root Files Analysis\n\n';
const rootFiles = allFiles.filter(f => !f.includes('\\backend\\') && !f.includes('\\frontend\\') && !f.includes('package-lock.json') && !f.includes('skills-lock.json') && !f.includes('PROJECT_ANALYSIS.md'));

for (const file of rootFiles) {
    const relativePath = path.relative(projectRoot, file);
    detailedAnalysis += `#### \`${relativePath}\`\n`;
    try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        detailedAnalysis += `- **Size:** ${content.length} bytes\n`;
        detailedAnalysis += `- **Lines:** ${lines.length}\n`;
        
        if (file.endsWith('.yml') || file.endsWith('.yaml')) {
            const services = lines.filter(l => l.trim().match(/^[a-zA-Z0-9_-]+:$/)).map(l => l.trim().replace(':', ''));
            if (services.length > 0) detailedAnalysis += `- **Services:** ${services.join(', ')}\n`;
        }
    } catch (e) {
        detailedAnalysis += `- *Could not read file contents*\n`;
    }
    detailedAnalysis += '\n';
}

fs.appendFileSync(path.join(projectRoot, 'PROJECT_ANALYSIS.md'), detailedAnalysis);
console.log('Root files analysis appended to PROJECT_ANALYSIS.md');
