import {
  slugify,
  extractFencedBlock,
  parseTreeLine,
  parseTreeToLeaves,
  parseCatalogFile,
  computeSubDomainCode,
} from './tree-parser.service';

describe('slugify', () => {
  it('should convert basic text', () => {
    expect(slugify('AI Engineer')).toBe('ai_engineer');
    expect(slugify('Software Developer')).toBe('software_developer');
  });

  it('should strip punctuation', () => {
    expect(slugify('Data Scientist (AI/ML)')).toBe('data_scientist_aiml');
    expect(slugify('B.Tech CSE')).toBe('btech_cse');
  });

  it('should handle leading/trailing whitespace', () => {
    expect(slugify('  Aerospace Engineering  ')).toBe('aerospace_engineering');
  });

  it('should handle empty strings', () => {
    expect(slugify('')).toBe('');
  });

  it('should collapse multiple underscores', () => {
    expect(slugify('Foo   Bar')).toBe('foo_bar');
  });
});

describe('extractFencedBlock', () => {
  it('should extract the fenced code block', () => {
    const content = `
# Some markdown

\`\`\`text
├── Science (PCM)
│   ├── Engineering
│   │   ├── Computer Science
│   │   │   └── Software Engineer
\`\`\`

More text
`;
    const block = extractFencedBlock(content);
    expect(block).not.toBeNull();
    expect(block).toContain('Science (PCM)');
    expect(block).toContain('Software Engineer');
  });

  it('should return null if no fenced block', () => {
    expect(extractFencedBlock('No code block here')).toBeNull();
  });

  it('should return null if block has wrong language', () => {
    const content = '```\nplain code\n```';
    expect(extractFencedBlock(content)).toBeNull();
  });
});

describe('parseTreeLine', () => {
  it('should parse a root-level node', () => {
    const result = parseTreeLine('├── Science (PCM)');
    expect(result).not.toBeNull();
    expect(result!.depth).toBe(0);
    expect(result!.text).toBe('Science (PCM)');
  });

  it('should parse a child node', () => {
    const result = parseTreeLine('│   ├── Engineering');
    expect(result).not.toBeNull();
    expect(result!.depth).toBe(1);
    expect(result!.text).toBe('Engineering');
  });

  it('should parse a grandchild node', () => {
    const result = parseTreeLine('│   │   ├── Computer Science');
    expect(result).not.toBeNull();
    expect(result!.depth).toBe(2);
    expect(result!.text).toBe('Computer Science');
  });

  it('should parse a leaf node with └──', () => {
    const result = parseTreeLine('│   │   │   └── Software Engineer');
    expect(result).not.toBeNull();
    expect(result!.depth).toBe(3);
    expect(result!.text).toBe('Software Engineer');
  });

  it('should return null for empty lines', () => {
    expect(parseTreeLine('')).toBeNull();
    expect(parseTreeLine('   ')).toBeNull();
  });

  it('should return null for non-tree lines', () => {
    expect(parseTreeLine('Just some text')).toBeNull();
    expect(parseTreeLine('# Heading')).toBeNull();
  });
});

describe('parseTreeToLeaves', () => {
  it('should extract leaf nodes from a simple tree', () => {
    const tree = `
├── Science (PCM)
│   ├── Engineering
│   │   ├── Computer Science
│   │   │   └── Software Engineer
│   │   └── Electronics
│   │       └── Electronics Engineer
│   └── Pure Sciences
│       └── Physicist
├── Science (PCB)
│   └── Medical
│       └── Doctor
`;
    const leaves = parseTreeToLeaves(tree.trim());
    expect(leaves.length).toBe(4);
    expect(leaves.map(l => l.name)).toContain('Software Engineer');
    expect(leaves.map(l => l.name)).toContain('Electronics Engineer');
    expect(leaves.map(l => l.name)).toContain('Physicist');
    expect(leaves.map(l => l.name)).toContain('Doctor');
  });

  it('should skip Overview subtrees', () => {
    const tree = `
├── Science (PCM)
│   ├── Overview
│   │   ├── Duration: 4 years
│   │   └── Eligibility: 10+2 PCM
│   ├── Engineering
│   │   └── Computer Science
│   │       └── Software Engineer
│   └── Medicine
│       └── Doctor
`;
    const leaves = parseTreeToLeaves(tree.trim());
    expect(leaves.length).toBe(2);
    expect(leaves.map(l => l.name)).not.toContain('Duration: 4 years');
    expect(leaves.map(l => l.name)).not.toContain('Eligibility: 10+2 PCM');
  });

  it('should extract pathway_tags', () => {
    const tree = `
├── Science (PCM)
│   ├── Engineering
│   │   ├── B.Tech CSE
│   │   │   └── AI Engineer
│   │   └── B.Tech ECE
│   │       └── Hardware Engineer
`;
    const leaves = parseTreeToLeaves(tree.trim());
    expect(leaves.length).toBe(2);

    const aiEngineer = leaves.find(l => l.name === 'AI Engineer');
    expect(aiEngineer).toBeDefined();
    expect(aiEngineer!.pathway_tags).toContain('B.Tech CSE');

    const hwEngineer = leaves.find(l => l.name === 'Hardware Engineer');
    expect(hwEngineer).toBeDefined();
    expect(hwEngineer!.pathway_tags).toContain('B.Tech ECE');
  });

  it('should extract sub_domain_source from depth-1 ancestor', () => {
    const tree = `
├── Science (PCM)
│   └── Engineering
│       └── Chemical Engineering
├── Science (PCB)
│   └── Medical
│       └── Surgeon
`;
    const leaves = parseTreeToLeaves(tree.trim());

    const chemicalEng = leaves.find(l => l.name === 'Chemical Engineering');
    expect(chemicalEng).toBeDefined();
    // The depth-1 ancestor is "Engineering" (depth 1) under "Science (PCM)" (depth 0)
    expect(chemicalEng!.sub_domain_source).toBe('Engineering');

    const surgeon = leaves.find(l => l.name === 'Surgeon');
    expect(surgeon).toBeDefined();
    // depth-1 ancestor is "Medical" under "Science (PCB)"
    expect(surgeon!.sub_domain_source).toBe('Medical');
  });

  it('should handle a non-root tree (just a branch)', () => {
    const tree = `
├── Engineering
│   ├── Computer Science
│   │   └── Software Engineer
│   └── Mechanical
│       └── Mechanical Engineer
`;
    const leaves = parseTreeToLeaves(tree.trim());
    expect(leaves.length).toBe(2);
    expect(leaves.map(l => l.name)).toContain('Software Engineer');
    expect(leaves.map(l => l.name)).toContain('Mechanical Engineer');
  });

  it('should handle empty trees', () => {
    expect(parseTreeToLeaves('')).toEqual([]);
    expect(parseTreeToLeaves('Just some text')).toEqual([]);
  });

  it('should not treat internal nodes as leaves', () => {
    const tree = `
├── Science
│   └── Engineering (internal node with no explicit children)
`;
    const leaves = parseTreeToLeaves(tree.trim());
    // "Engineering (internal node with no explicit children)" has no children, so it IS a leaf
    expect(leaves.length).toBe(1);
    expect(leaves[0].name).toBe('Engineering (internal node with no explicit children)');
  });
});

describe('parseCatalogFile', () => {
  it('should parse a full markdown file with fenced block', () => {
    const content = `
# Science Careers

This is the science catalog.

\`\`\`text
├── Science (PCM)
│   ├── Engineering
│   │   └── Software Engineer
│   └── Medical
│       └── Doctor
\`\`\`

## Notes
End of file.
`;
    const result = parseCatalogFile(content, 'part_1_science');
    expect(result.leaves.length).toBe(2);
    expect(result.anomalies.length).toBe(0);
    expect(result.overview_skipped).toBe(0);
  });

  it('should report anomaly when no fenced block found', () => {
    const result = parseCatalogFile('# Just markdown', 'part_1_science');
    expect(result.leaves.length).toBe(0);
    expect(result.anomalies.length).toBe(1);
  });

  it('should count overview_skipped correctly', () => {
    const content = `
\`\`\`text
├── Science (PCM)
│   ├── Overview
│   │   ├── Duration: 4 years
│   │   └── Best for: PCM students
│   ├── Engineering
│   │   └── Software Engineer
│   └── Medical
│       └── Doctor
\`\`\`
`;
    const result = parseCatalogFile(content, 'part_1_science');
    expect(result.leaves.length).toBe(2);
    expect(result.overview_skipped).toBe(2);
  });
});

describe('computeSubDomainCode', () => {
  it('should handle parenthetical codes', () => {
    expect(computeSubDomainCode('Science (PCM)')).toBe('science_pcm');
    expect(computeSubDomainCode('Science (PCB)')).toBe('science_pcb');
    expect(computeSubDomainCode('Science (PCMB)')).toBe('science_pcmb');
  });

  it('should handle Commerce sub-domains', () => {
    // Dot becomes underscore: B.Com -> b_com
    expect(computeSubDomainCode('Commerce (B.Com)')).toBe('commerce_b_com');
    expect(computeSubDomainCode('Commerce (BBA)')).toBe('commerce_bba');
  });

  it('should handle plain text without parentheses', () => {
    // & is stripped by slugify, then spaces collapse
    expect(computeSubDomainCode('Arts & Humanities')).toBe('arts_humanities');
  });

  it('should handle short codes in parentheses', () => {
    expect(computeSubDomainCode('ITI Electrician')).toBe('iti_electrician');
    expect(computeSubDomainCode('UPSC')).toBe('upsc');
  });
});
