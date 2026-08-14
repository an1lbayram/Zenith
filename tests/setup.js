// Shared jsdom polyfills for APIs the app touches that jsdom doesn't implement.
// Without these, importing app.js / calling gamification.fireConfetti() etc.
// throws "Not implemented" errors that have nothing to do with the code under test.

if (!window.matchMedia) {
    window.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() { return false; },
    });
}

// jsdom has no real canvas backend; stub just the 2D methods Zenith's
// confetti effect calls so it can run without throwing.
HTMLCanvasElement.prototype.getContext = function () {
    return {
        clearRect() {},
        beginPath() {},
        arc() {},
        fill() {},
        fillStyle: '#000',
    };
};

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
}

// jsdom doesn't implement the Blob URL registry; the export-backup feature
// only needs a stand-in string, it never dereferences the URL in tests.
if (!URL.createObjectURL) {
    URL.createObjectURL = () => 'blob:mock-url';
}
if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = () => {};
}

// jsdom attempts a real page navigation for <a href>.click() (used by the
// export-backup download link), which it doesn't support and logs as an
// "Not implemented: navigation" error. No test depends on real navigation.
HTMLAnchorElement.prototype.click = function () {};

if (!('Notification' in window)) {
    window.Notification = class {
        static permission = 'denied';
        static requestPermission() { return Promise.resolve('denied'); }
        constructor() {}
    };
}
