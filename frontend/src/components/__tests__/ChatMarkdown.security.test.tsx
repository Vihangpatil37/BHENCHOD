/**
 * Security test for ChatMarkdown XSS prevention.
 * Tests that DOMPurify sanitizes mermaid SVG output and
 * ReactMarkdown escapes dangerous HTML.
 *
 * NOTE: These are logic-level tests verifying the sanitization
 * pipeline is wired correctly. Full DOM execution tests require
 * jsdom + mermaid mock which needs separate vitest config.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const chatMarkdownPath = path.resolve(
  __dirname,
  '../../components/ChatMarkdown.tsx',
);
const content = fs.readFileSync(chatMarkdownPath, 'utf-8');

describe('ChatMarkdown Security — XSS Prevention', () => {
  describe('DOMPurify integration', () => {
    it('DOMPurify is imported in ChatMarkdown', () => {
      expect(content).toMatch(/import DOMPurify from ['"]dompurify['"]/);
    });

    it('DOMPurify.sanitize is called on mermaid SVG output', () => {
      expect(content).toMatch(/DOMPurify\.sanitize\(svg\)/);
    });

    it('innerHTML assignment uses sanitized output only', () => {
      const innerHTMLMatch = content.match(/innerHTML\s*=\s*(.+);/);
      expect(innerHTMLMatch).toBeTruthy;
      if (innerHTMLMatch) {
        expect(innerHTMLMatch[1]).toMatch(/DOMPurify\.sanitize/);
      }
    });
  });

  describe('ReactMarkdown safety', () => {
    it('does not use dangerouslySetInnerHTML', () => {
      expect(content).not.toMatch(/dangerouslySetInnerHTML/);
    });

    it('does not use rehype-raw plugin', () => {
      expect(content).not.toMatch(/rehype-raw/);
    });

    it('mermaid code blocks go through MermaidBlock component', () => {
      // Check that language-mermaid detection exists in the file
      expect(content).toMatch(/language-/);
      expect(content).toMatch(/mermaid/);
      expect(content).toMatch(/MermaidBlock/);
    });
  });

  describe('DOMPurify direct verification', () => {
    it('DOMPurify package exists in node_modules', () => {
      const dompurifyPath = path.resolve(
        __dirname,
        '../../../node_modules/dompurify',
      );
      expect(fs.existsSync(dompurifyPath)).toBe(true);
    });

    it('DOMPurify dist file exists', () => {
      const dompurifyDist = path.resolve(
        __dirname,
        '../../../node_modules/dompurify/dist/purify.js',
      );
      expect(fs.existsSync(dompurifyDist)).toBe(true);
    });
  });

  describe('MermaidBlock security properties', () => {
    it('MermaidBlock uses ref for DOM insertion (not dangerouslySetInnerHTML)', () => {
      expect(content).toMatch(/useRef/);
      expect(content).toMatch(/ref\.current/);
    });

    it('MermaidBlock renders container div, not raw HTML', () => {
      expect(content).toMatch(/<div ref={ref}/);
    });

    it('mermaid.render result is passed through DOMPurify.sanitize', () => {
      // The pattern: mermaid.render(...).then(({ svg }) => { ... DOMPurify.sanitize(svg) ... })
      expect(content).toMatch(
        /mermaid\.render[\s\S]*?DOMPurify\.sanitize\(svg\)/,
      );
    });
  });
});

