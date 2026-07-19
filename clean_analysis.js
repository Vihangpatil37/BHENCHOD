const fs = require('fs');
const path = require('path');
const file = path.join('d:\\parul project', 'PROJECT_ANALYSIS.md');
const content = fs.readFileSync(file, 'utf8');
const index = content.indexOf('## 19. Detailed File-by-File Analysis');
if (index !== -1) {
    fs.writeFileSync(file, content.substring(0, index));
    console.log('Truncated previous appended analysis.');
} else {
    console.log('No previous appended analysis found.');
}
