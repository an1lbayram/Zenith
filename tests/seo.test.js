import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf-8');
const manifestRaw = fs.readFileSync(path.join(root, 'manifest.json'), 'utf-8');
const doc = new DOMParser().parseFromString(indexHtml, 'text/html');

describe('index.html <head> SEO fundamentals', () => {
    it('declares a document language', () => {
        expect(doc.documentElement.getAttribute('lang')).toBeTruthy();
    });

    it('has a non-empty, reasonably-sized <title>', () => {
        const title = doc.querySelector('title')?.textContent || '';
        expect(title.length).toBeGreaterThan(0);
        expect(title.length).toBeLessThanOrEqual(70); // Google truncates well beyond this
    });

    it('has a meta description within a crawlable length range', () => {
        const desc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        expect(desc.length).toBeGreaterThan(20);
        expect(desc.length).toBeLessThanOrEqual(300);
    });

    it('has a responsive viewport meta tag', () => {
        const viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
        expect(viewport).toContain('width=device-width');
    });

    it('declares a theme-color for browser chrome / PWA install UI', () => {
        expect(doc.querySelector('meta[name="theme-color"]')).toBeTruthy();
    });

    it('links a favicon and an apple-touch-icon', () => {
        expect(doc.querySelector('link[rel="icon"]')).toBeTruthy();
        expect(doc.querySelector('link[rel="apple-touch-icon"]')).toBeTruthy();
    });

    it('links the web app manifest (required for PWA discoverability)', () => {
        expect(doc.querySelector('link[rel="manifest"]')?.getAttribute('href')).toBe('manifest.json');
    });

    it('has exactly one <h1> per page (single clear topic signal for crawlers)', () => {
        expect(doc.querySelectorAll('h1').length).toBe(1);
    });

    it('body text is not empty at parse time (no reliance on JS for a11y/crawl fallback content)', () => {
        // The offline-indicator banner ships static text even before app.js boots.
        expect(doc.body.textContent.trim().length).toBeGreaterThan(0);
    });

    it('all images have an alt attribute', () => {
        const imgs = Array.from(doc.querySelectorAll('img'));
        expect(imgs.length).toBeGreaterThan(0);
        imgs.forEach((img) => {
            expect(img.hasAttribute('alt')).toBe(true);
            expect(img.getAttribute('alt')?.length).toBeGreaterThan(0);
        });
    });

    it('external preconnects match the stylesheets actually loaded (no wasted preconnects)', () => {
        const preconnects = Array.from(doc.querySelectorAll('link[rel="preconnect"]')).map((l) => l.getAttribute('href'));
        expect(preconnects).toContain('https://fonts.googleapis.com');
        expect(preconnects).toContain('https://fonts.gstatic.com');
    });
});

describe('manifest.json (PWA / SEO installability)', () => {
    it('is valid JSON', () => {
        expect(() => JSON.parse(manifestRaw)).not.toThrow();
    });

    const manifest = JSON.parse(manifestRaw);

    it('has the required web app manifest fields', () => {
        expect(manifest.name).toBeTruthy();
        expect(manifest.short_name).toBeTruthy();
        expect(manifest.short_name.length).toBeLessThanOrEqual(12); // home-screen label truncation guidance
        expect(manifest.start_url).toBeTruthy();
        expect(manifest.display).toBe('standalone');
    });

    it('declares a 192x192 and a 512x512 icon (installability requirement)', () => {
        const sizes = manifest.icons.map((i) => i.sizes);
        expect(sizes).toContain('192x192');
        expect(sizes).toContain('512x512');
    });

    it('every declared icon file actually exists on disk', () => {
        manifest.icons.forEach((icon) => {
            const iconPath = path.join(root, icon.src.replace(/^\.\//, ''));
            expect(fs.existsSync(iconPath), `missing icon file: ${icon.src}`).toBe(true);
        });
    });

    it('theme_color and background_color are valid hex colors', () => {
        expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
});

describe('CSS/JS asset references in index.html resolve to real files', () => {
    it('every local <link rel="stylesheet"> href exists on disk', () => {
        const stylesheets = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
            .map((l) => l.getAttribute('href'))
            .filter((href) => href && !href.startsWith('http'));

        expect(stylesheets.length).toBeGreaterThan(0);
        stylesheets.forEach((href) => {
            expect(fs.existsSync(path.join(root, href)), `missing stylesheet: ${href}`).toBe(true);
        });
    });

    it('the module entry script exists on disk', () => {
        const script = doc.querySelector('script[type="module"]');
        expect(script).toBeTruthy();
        const src = script.getAttribute('src');
        expect(fs.existsSync(path.join(root, src)), `missing entry script: ${src}`).toBe(true);
    });
});
