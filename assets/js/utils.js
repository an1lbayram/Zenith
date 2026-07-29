/**
 * Utility functions for Zenith OS
 */
export const Utils = {
    // XSS Protection Input Sanitization
    sanitize: (str) => {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // Unique ID Generator
    generateId: () => {
        return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    },

    // Format Date with Relative Labels (Bugün, Yarın, Dün)
    formatDate: (dateInput) => {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const isSameDay = (d1, d2) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        if (isSameDay(d, today)) return 'Bugün';
        if (isSameDay(d, tomorrow)) return 'Yarın';
        if (isSameDay(d, yesterday)) return 'Dün';

        const options = { month: 'short', day: 'numeric' };
        return d.toLocaleDateString('tr-TR', options);
    },

    // Format ISO Date String (YYYY-MM-DD)
    toISODateString: (dateObj = new Date()) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Debounce
    debounce: (func, wait = 250) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Web Audio Synthesized Chime sound (No external file needed)
    playChime: (type = 'success') => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            const playNote = (freq, duration, delay, vol = 0.15) => {
                setTimeout(() => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(vol, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + duration);
                }, delay);
            };

            if (type === 'success') {
                playNote(523.25, 0.2, 0);   // C5
                playNote(659.25, 0.2, 100); // E5
                playNote(783.99, 0.4, 200); // G5
            } else if (type === 'levelUp') {
                playNote(440, 0.15, 0);    // A4
                playNote(554.37, 0.15, 100); // C#5
                playNote(659.25, 0.15, 200); // E5
                playNote(880, 0.5, 300);    // A5
            } else if (type === 'timerEnd') {
                playNote(587.33, 0.25, 0);   // D5
                playNote(880, 0.25, 250);    // A5
                playNote(1174.66, 0.5, 500); // D6
            }
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }
};
