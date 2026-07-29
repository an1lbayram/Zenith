/**
 * Utility functions for Zenith
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

    // Web Audio Synthesized Chime sound
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
            } else if (type === 'purchase') {
                playNote(659.25, 0.15, 0);
                playNote(880, 0.3, 100);
            }
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    },

    // Procedural Ambient Sound Generator (Rain, White Noise, 432Hz Focus)
    ambientAudioCtx: null,
    ambientNodes: [],

    stopAmbientSound: () => {
        if (Utils.ambientNodes && Utils.ambientNodes.length) {
            Utils.ambientNodes.forEach(node => {
                try { node.stop(); } catch (e) {}
                try { node.disconnect(); } catch (e) {}
            });
            Utils.ambientNodes = [];
        }
        if (Utils.ambientAudioCtx) {
            try { Utils.ambientAudioCtx.close(); } catch (e) {}
            Utils.ambientAudioCtx = null;
        }
    },

    playAmbientSound: (type) => {
        Utils.stopAmbientSound();
        if (!type || type === 'none') return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            Utils.ambientAudioCtx = ctx;

            if (type === 'rain') {
                // Pink noise rain simulation
                const bufferSize = 2 * ctx.sampleRate;
                const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                    output[i] *= 0.04; // volume
                    b6 = white * 0.115926;
                }

                const whiteNoise = ctx.createBufferSource();
                whiteNoise.buffer = noiseBuffer;
                whiteNoise.loop = true;

                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1000, ctx.currentTime);

                whiteNoise.connect(filter);
                filter.connect(ctx.destination);
                whiteNoise.start();
                Utils.ambientNodes.push(whiteNoise);

            } else if (type === 'focus') {
                // 432Hz Deep Focus Sine Wave Oscillator
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(432, ctx.currentTime); // 432Hz frequency
                gain.gain.setValueAtTime(0.05, ctx.currentTime); // low volume
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                Utils.ambientNodes.push(osc);
            }
        } catch (e) {
            console.warn('Ambient sound error:', e);
        }
    },

    // Desktop Notification Helper
    sendNotification: (title, body) => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: 'assets/icons/icon-192.png' });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body, icon: 'assets/icons/icon-192.png' });
                }
            });
        }
    }
};
