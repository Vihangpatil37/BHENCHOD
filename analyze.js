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

let detailedAnalysis = '## 19. Detailed File-by-File Analysis\n\n';

detailedAnalysis += '### 19.1 Backend Files\n\n';
const backendFiles = allFiles.filter(f => f.includes('\\backend\\') && !f.includes('package-lock.json'));
for (const file of backendFiles) {
    const relativePath = path.relative(projectRoot, file);
    detailedAnalysis += `#### \`${relativePath}\`\n`;
    try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        detailedAnalysis += `- **Size:** ${content.length} bytes\n`;
        detailedAnalysis += `- **Lines:** ${lines.length}\n`;
        
        // Extract basic info like classes, functions, or exports
        const classes = lines.filter(l => l.includes('export class ')).map(l => l.trim().substring(0, 50));
        if (classes.length > 0) detailedAnalysis += `- **Classes:** ${classes.join(', ')}\n`;
        
        const interfaces = lines.filter(l => l.includes('export interface ')).map(l => l.trim().substring(0, 50));
        if (interfaces.length > 0) detailedAnalysis += `- **Interfaces:** ${interfaces.join(', ')}\n`;
        
        const imports = lines.filter(l => l.startsWith('import ')).length;
        if (imports > 0) detailedAnalysis += `- **Imports Count:** ${imports}\n`;
        
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const endpoints = lines.filter(l => l.includes('@Get(') || l.includes('@Post(') || l.includes('@Put(') || l.includes('@Delete(') || l.includes('@Patch('));
            if (endpoints.length > 0) {
                detailedAnalysis += `- **Endpoints:**\n`;
                endpoints.forEach(e => detailedAnalysis += `  - \`${e.trim()}\`\n`);
            }
        }
    } catch (e) {
        detailedAnalysis += `- *Could not read file contents*\n`;
    }
    detailedAnalysis += '\n';
}

detailedAnalysis += '### 19.2 Frontend Files\n\n';
const frontendFiles = allFiles.filter(f => f.includes('\\frontend\\') && !f.includes('package-lock.json'));
for (const file of frontendFiles) {
    const relativePath = path.relative(projectRoot, file);
    detailedAnalysis += `#### \`${relativePath}\`\n`;
    try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        detailedAnalysis += `- **Size:** ${content.length} bytes\n`;
        detailedAnalysis += `- **Lines:** ${lines.length}\n`;
        
        const components = lines.filter(l => l.includes('const ') && l.includes(' = () =>') && l.includes('return')).map(l => l.trim().substring(0, 50));
        if (components.length > 0) detailedAnalysis += `- **Components:** ${components.join(', ')}\n`;
        
        const imports = lines.filter(l => l.startsWith('import ')).length;
        if (imports > 0) detailedAnalysis += `- **Imports Count:** ${imports}\n`;
    } catch (e) {
        detailedAnalysis += `- *Could not read file contents*\n`;
    }
    detailedAnalysis += '\n';
}

detailedAnalysis += `## 20. Backflow Architecture (Mermaid)\n\n`;
detailedAnalysis += `\`\`\`mermaid
flowchart TD
    %% Comprehensive Backflow Diagram
    Client([Client Application]) -->|HTTP Requests| API_Gateway[NestJS API /]
    
    subgraph Core_Modules [Core Backend Modules]
        API_Gateway --> Auth[Auth Module]
        API_Gateway --> User[User/Onboarding Module]
        API_Gateway --> Careers[Careers Catalog]
        API_Gateway --> Recommender[Recommendation Engine]
        API_Gateway --> Chat[Counselor Chat]
    end
    
    subgraph Data_Layer [Data Persistence]
        Auth --> DB[(MongoDB Atlas)]
        User --> DB
        Careers --> DB
        Recommender --> DB
        Chat --> DB
    end
    
    subgraph AI_Orchestration [AI Service Layer]
        Recommender --> AIService[AI Service Client]
        Chat --> AIService
        Careers --> AIService
        
        AIService --> Router[Model Router]
        Router --> Pool[Key Pool Manager]
        Pool --> Retry[Retry Strategy]
        
        Retry --> Gemini[Gemini 2.5 Flash]
        Retry --> Groq[Groq LLaMA]
        Retry --> Mistral[Mistral Large]
        Retry --> DeepSeek[DeepSeek Chat]
    end
    
    DB --> |Eligibility Filtering| Recommender
    DB --> |Trait Vectors| Recommender
\`\`\`\n\n`;

fs.appendFileSync(path.join(projectRoot, 'PROJECT_ANALYSIS.md'), detailedAnalysis);
console.log('Analysis appended to PROJECT_ANALYSIS.md');
