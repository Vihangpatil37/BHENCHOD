/**
 * Tree parser for ASCII career catalog files.
 *
 * Parses fenced ```text blocks containing ASCII trees with
 * │, ├──, └── markers and extracts career leaf nodes.
 */

export interface ParsedCareerLeaf {
  name: string;
  /** Slugified name used as career_code */
  career_code: string;
  /** The immediate parent (depth-1) node text — used to derive sub_domain_code */
  sub_domain_source: string;
  /** Breadcrumb tags between depth-1 and leaf's immediate parent */
  pathway_tags: string[];
  /** Full raw text of the leaf line (for debugging) */
  raw_line: string;
}

export interface CatalogParseResult {
  /** The catalog identifier e.g. "part_1_science" */
  catalogPart: string;
  /** All career leaves found */
  leaves: ParsedCareerLeaf[];
  /** Number of leaves skipped due to being inside an "Overview" subtree */
  overview_skipped: number;
  /** Any anomalies encountered during parsing */
  anomalies: string[];
}

/**
 * Slugify a string: lowercase, spaces→underscores, strip punctuation.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_ ]/g, '') // strip punctuation but keep spaces and underscores
    .replace(/\s+/g, '_') // spaces to underscores
    .replace(/_+/g, '_') // collapse multiple underscores
    .replace(/^_|_$/g, ''); // trim leading/trailing underscores
}

/**
 * Extract the fenced code block (```text ... ```) from catalog markdown.
 */
export function extractFencedBlock(content: string): string | null {
  // Match ```text or ``` text (with/without space)
  const match = content.match(/```\s*text\s*\n([\s\S]*?)\n```/);
  return match ? match[1] : null;
}

/**
 * Parse a single line of an ASCII tree into its text content and depth.
 *
 * ASCII tree markers: │, ├──, └──
 *
 * Depth is determined by the column position of the ├──/└── marker:
 * - Depth 0: marker is at column 0 (e.g. `├── Science (PCM)`)
 * - Depth 1: marker is at column ~4 (e.g. `│   ├── Engineering`)
 * - Depth 2: marker is at column ~8 (e.g. `│   │   ├── Computer Science`)
 * Each indent level is 4 characters wide.
 */
export function parseTreeLine(
  line: string,
): { depth: number; text: string } | null {
  const trimmed = line.trimEnd();
  if (!trimmed) return null;

  // Match: any leading indent (spaces and │ chars), then the ├──/└── marker, then text
  const treeMatch = trimmed.match(/^([ │]*?)([├└]──)\s+(.+)$/);

  if (!treeMatch) {
    return null;
  }

  const indent = treeMatch[1];
  const text = treeMatch[3].trim();

  if (!text) return null;

  // Depth = column position of the marker divided by indent width (4 chars per level)
  const markerColumn = indent.length;
  const depth = Math.round(markerColumn / 4);

  return { depth, text };
}

/**
 * Parse a full ASCII tree into a list of career leaves.
 *
 * Algorithm per Section 3 of the spec:
 * 1. Parse all lines into tree nodes with depth
 * 2. A node is a career leaf if it has no children
 * 3. Skip subtrees rooted at "Overview" (case-insensitive)
 * 4. Extract hierarchy info for each leaf
 */
export function parseTreeToLeaves(treeContent: string): ParsedCareerLeaf[] {
  const lines = treeContent.split('\n');
  // Store nodes as { text, depth }
  const nodes: { text: string; depth: number }[] = [];
  const overviewIndices: Set<number> = new Set();

  // First pass: parse all lines into nodes with depth
  for (const line of lines) {
    const parsed = parseTreeLine(line);
    if (parsed) {
      nodes.push(parsed);
    }
  }

  if (nodes.length === 0) {
    return [];
  }

  // Build a stack-based tree to track parent-child relationships
  const parentStack: number[] = [];
  const nodeParents: number[] = []; // parent index for each node (-1 = root)

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    // Pop stack until we find a node at a shallower depth
    while (
      parentStack.length > 0 &&
      nodes[parentStack[parentStack.length - 1]].depth >= node.depth
    ) {
      parentStack.pop();
    }

    if (parentStack.length > 0) {
      nodeParents[i] = parentStack[parentStack.length - 1];
    } else {
      nodeParents[i] = -1; // root
    }

    parentStack.push(i);
  }

  // Mark nodes that are part of "Overview" subtrees
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].text.toLowerCase() === 'overview') {
      // Mark this node and all its descendants
      for (let j = i; j < nodes.length; j++) {
        let ancestor = nodeParents[j];
        let isDescendant = j === i;
        while (ancestor >= 0) {
          if (ancestor === i) {
            isDescendant = true;
            break;
          }
          ancestor = nodeParents[ancestor];
        }
        if (isDescendant) {
          overviewIndices.add(j);
        }
      }
    }
  }

  // Determine which nodes are leaves (have no children at a deeper depth)
  const isLeaf: boolean[] = new Array(nodes.length).fill(true);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodeParents[j] === i) {
        isLeaf[i] = false;
        break;
      }
    }
  }

  // Extract leaves with hierarchy info
  const leaves: ParsedCareerLeaf[] = [];

  for (let i = 0; i < nodes.length; i++) {
    if (!isLeaf[i]) continue;
    if (overviewIndices.has(i)) continue;

    const node = nodes[i];

    // Find the depth-1 ancestor (for sub_domain_code)
    let subDomainAncestor = -1;
    let parentIdx = nodeParents[i];
    while (parentIdx >= 0) {
      if (nodes[parentIdx].depth === 1) {
        subDomainAncestor = parentIdx;
        break;
      }
      parentIdx = nodeParents[parentIdx];
    }

    // Collect pathway tags: ancestors between depth-1 and leaf's immediate parent
    const pathwayTags: string[] = [];
    let pathIdx = nodeParents[i];
    while (pathIdx >= 0 && pathIdx !== subDomainAncestor) {
      pathwayTags.unshift(nodes[pathIdx].text);
      pathIdx = nodeParents[pathIdx];
    }

    const subDomainSource =
      subDomainAncestor >= 0 ? nodes[subDomainAncestor].text : '';

    leaves.push({
      name: node.text,
      career_code: slugify(node.text),
      sub_domain_source: subDomainSource,
      pathway_tags: pathwayTags,
      raw_line: node.text,
    });
  }

  return leaves;
}

/**
 * Parse a complete catalog file (markdown with fenced ASCII tree).
 */
export function parseCatalogFile(
  content: string,
  catalogPart: string,
): {
  leaves: ParsedCareerLeaf[];
  anomalies: string[];
  overview_skipped: number;
} {
  const treeBlock = extractFencedBlock(content);

  if (!treeBlock) {
    return {
      leaves: [],
      anomalies: [`No fenced code block found in ${catalogPart}`],
      overview_skipped: 0,
    };
  }

  const leaves = parseTreeToLeaves(treeBlock);

  // Count overview-skipped nodes by re-parsing with Overview tracking
  let overviewSkipped = 0;
  const lines = treeBlock.split('\n');
  let inOverview = false;
  let overviewDepth = -1;
  for (const line of lines) {
    const parsed = parseTreeLine(line);
    if (!parsed) continue;

    if (parsed.text.toLowerCase() === 'overview') {
      inOverview = true;
      overviewDepth = parsed.depth;
      continue;
    }

    if (inOverview && parsed.depth > overviewDepth) {
      overviewSkipped++;
      continue;
    }

    if (inOverview && parsed.depth <= overviewDepth) {
      inOverview = false;
      overviewDepth = -1;
    }
  }

  return {
    leaves,
    anomalies: [],
    overview_skipped: overviewSkipped,
  };
}

/**
 * Compute a sub_domain_code from a human-readable sub-domain source text.
 * This converts e.g. "Science (PCM)" -> "science_pcm", "Commerce (B.Com)" -> "b_com"
 *
 * Note: The mapping is approximate since the catalog files use varied naming conventions.
 * The actual sub_domain_code should be validated against the taxonomy config.
 */
export function computeSubDomainCode(subDomainSource: string): string {
  // First, try to extract a parenthetical code if present
  const parenMatch = subDomainSource.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const inner = parenMatch[1].trim();
    // e.g. "Science (PCM)" -> "science_pcm"
    const prefix = slugify(subDomainSource.replace(/\(.*\)/, '').trim());
    // Convert dots to underscores BEFORE slugifying (e.g. "B.Com" -> "b_com")
    const suffix = slugify(inner.replace(/\./g, '_'));
    if (prefix && suffix) {
      return `${prefix}_${suffix}`;
    }
    return suffix;
  }

  // No parentheses — convert dots to underscores before slugifying
  return slugify(subDomainSource.replace(/\./g, '_'));
}
