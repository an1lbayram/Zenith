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

    // ----------------------------------------------------
    // PROCEDURAL AMBIENT SOUND ENGINE (20 SOUND PROFILES)
    // ----------------------------------------------------
    ambientAudioCtx: null,
    ambientNodes: [],
    ambientIntervals: [],

    stopAmbientSound: () => {
        if (Utils.ambientIntervals && Utils.ambientIntervals.length) {
            Utils.ambientIntervals.forEach(id => clearInterval(id));
            Utils.ambientIntervals = [];
        }
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

    // Helper: Create White / Pink / Brown Noise Buffer
    createNoiseBuffer: (ctx, type = 'pink') => {
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === 'white') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.05;
            }
        } else if (type === 'brown') {
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 0.15;
            }
        } else {
            // Pink noise
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
                b6 = white * 0.115926;
            }
        }
        return buffer;
    },

    playAmbientSound: (type) => {
        Utils.stopAmbientSound();
        if (!type || type === 'none') return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            Utils.ambientAudioCtx = ctx;

            // Helper to start looping noise source
            const createNoiseSource = (noiseType, filterType = 'lowpass', filterFreq = 1000) => {
                const buffer = Utils.createNoiseBuffer(ctx, noiseType);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;

                const filter = ctx.createBiquadFilter();
                filter.type = filterType;
                filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);

                source.connect(filter);
                filter.connect(ctx.destination);
                source.start();
                Utils.ambientNodes.push(source);
                return { source, filter };
            };

            // Helper to create Binaural Beats (Stereo Left / Right)
            const createBinauralBeat = (freqLeft, freqRight, vol = 0.05) => {
                const merger = ctx.createChannelMerger(2);

                const oscL = ctx.createOscillator();
                const gainL = ctx.createGain();
                oscL.frequency.setValueAtTime(freqLeft, ctx.currentTime);
                gainL.gain.setValueAtTime(vol, ctx.currentTime);
                oscL.connect(gainL);
                gainL.connect(merger, 0, 0); // Left channel

                const oscR = ctx.createOscillator();
                const gainR = ctx.createGain();
                oscR.frequency.setValueAtTime(freqRight, ctx.currentTime);
                gainR.gain.setValueAtTime(vol, ctx.currentTime);
                oscR.connect(gainR);
                gainR.connect(merger, 0, 1); // Right channel

                merger.connect(ctx.destination);
                oscL.start();
                oscR.start();
                Utils.ambientNodes.push(oscL, oscR);
            };

            switch (type) {
                // 1. Hafif Yağmur
                case 'rain':
                    createNoiseSource('pink', 'lowpass', 1000);
                    break;

                // 2. Şiddetli Fırtına
                case 'storm': {
                    createNoiseSource('pink', 'lowpass', 450);
                    // Thunder Sub-bass rumble
                    const thunderOsc = ctx.createOscillator();
                    const thunderGain = ctx.createGain();
                    thunderOsc.type = 'sawtooth';
                    thunderOsc.frequency.setValueAtTime(55, ctx.currentTime);
                    thunderGain.gain.setValueAtTime(0.04, ctx.currentTime);
                    thunderOsc.connect(thunderGain);
                    thunderGain.connect(ctx.destination);
                    thunderOsc.start();
                    Utils.ambientNodes.push(thunderOsc);
                    break;
                }

                // 3. Okyanus Dalgaları
                case 'ocean': {
                    const { filter } = createNoiseSource('pink', 'lowpass', 600);
                    const lfo = ctx.createOscillator();
                    const lfoGain = ctx.createGain();
                    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 0.12Hz wave cycle
                    lfoGain.gain.setValueAtTime(350, ctx.currentTime);
                    lfo.connect(lfoGain);
                    lfoGain.connect(filter.frequency);
                    lfo.start();
                    Utils.ambientNodes.push(lfo);
                    break;
                }

                // 4. Rüzgar Esintisi
                case 'wind': {
                    const { filter } = createNoiseSource('pink', 'bandpass', 500);
                    filter.Q.setValueAtTime(3.0, ctx.currentTime);
                    const lfo = ctx.createOscillator();
                    const lfoGain = ctx.createGain();
                    lfo.frequency.setValueAtTime(0.25, ctx.currentTime);
                    lfoGain.gain.setValueAtTime(300, ctx.currentTime);
                    lfo.connect(lfoGain);
                    lfoGain.connect(filter.frequency);
                    lfo.start();
                    Utils.ambientNodes.push(lfo);
                    break;
                }

                // 5. Kamp Ateşi
                case 'campfire': {
                    createNoiseSource('brown', 'lowpass', 600);
                    // Random crackle pops
                    const crackleInterval = setInterval(() => {
                        if (Math.random() > 0.4) {
                            const popOsc = ctx.createOscillator();
                            const popGain = ctx.createGain();
                            popOsc.type = 'triangle';
                            popOsc.frequency.setValueAtTime(800 + Math.random() * 1200, ctx.currentTime);
                            popGain.gain.setValueAtTime(0.03, ctx.currentTime);
                            popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
                            popOsc.connect(popGain);
                            popGain.connect(ctx.destination);
                            popOsc.start();
                            popOsc.stop(ctx.currentTime + 0.03);
                        }
                    }, 120);
                    Utils.ambientIntervals.push(crackleInterval);
                    break;
                }

                // 6. Beyaz Gürültü
                case 'whitenoise':
                    createNoiseSource('white', 'lowpass', 8000);
                    break;

                // 7. Kahverengi Gürültü
                case 'brownnoise':
                    createNoiseSource('brown', 'lowpass', 400);
                    break;

                // 8. 432Hz Derin Odak
                case 'focus432': {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(432, ctx.currentTime);
                    gain.gain.setValueAtTime(0.05, ctx.currentTime);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    Utils.ambientNodes.push(osc);
                    break;
                }

                // 9. 528Hz Şifa & Netlik
                case 'solfeggio528': {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(528, ctx.currentTime);
                    gain.gain.setValueAtTime(0.05, ctx.currentTime);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    Utils.ambientNodes.push(osc);
                    break;
                }

                // 10. Binaural Alpha (10Hz)
                case 'binaural_alpha':
                    createBinauralBeat(200, 210, 0.05);
                    break;

                // 11. Binaural Theta (6Hz)
                case 'binaural_theta':
                    createBinauralBeat(150, 156, 0.05);
                    break;

                // 12. Binaural Beta (15Hz)
                case 'binaural_beta':
                    createBinauralBeat(250, 265, 0.05);
                    break;

                // 13. Sıcak Kafe Ambiyansı
                case 'cafe':
                    createNoiseSource('pink', 'bandpass', 1200);
                    createNoiseSource('white', 'bandpass', 3500);
                    break;

                // 14. Kozmik Uzay Uğultusu
                case 'space': {
                    const osc1 = ctx.createOscillator();
                    const osc2 = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc1.type = 'sine';
                    osc2.type = 'sine';
                    osc1.frequency.setValueAtTime(60, ctx.currentTime);
                    osc2.frequency.setValueAtTime(120.5, ctx.currentTime);
                    gain.gain.setValueAtTime(0.06, ctx.currentTime);
                    osc1.connect(gain);
                    osc2.connect(gain);
                    gain.connect(ctx.destination);
                    osc1.start();
                    osc2.start();
                    Utils.ambientNodes.push(osc1, osc2);
                    break;
                }

                // 15. Orman Hışırtısı
                case 'forest': {
                    createNoiseSource('pink', 'highpass', 1800);
                    break;
                }

                // 16. Tren Yolculuğu
                case 'train': {
                    const trainInterval = setInterval(() => {
                        const trainNoise = ctx.createBufferSource();
                        trainNoise.buffer = Utils.createNoiseBuffer(ctx, 'brown');
                        const filter = ctx.createBiquadFilter();
                        const gain = ctx.createGain();
                        filter.type = 'lowpass';
                        filter.frequency.setValueAtTime(300, ctx.currentTime);
                        gain.gain.setValueAtTime(0.08, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                        trainNoise.connect(filter);
                        filter.connect(gain);
                        gain.connect(ctx.destination);
                        trainNoise.start();
                        trainNoise.stop(ctx.currentTime + 0.25);
                    }, 650);
                    Utils.ambientIntervals.push(trainInterval);
                    break;
                }

                // 17. Ritmik Su Damlaları
                case 'drop': {
                    const dropInterval = setInterval(() => {
                        if (Math.random() > 0.3) {
                            const dropOsc = ctx.createOscillator();
                            const dropGain = ctx.createGain();
                            dropOsc.type = 'sine';
                            const startFreq = 800 + Math.random() * 600;
                            dropOsc.frequency.setValueAtTime(startFreq, ctx.currentTime);
                            dropOsc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, ctx.currentTime + 0.08);
                            dropGain.gain.setValueAtTime(0.04, ctx.currentTime);
                            dropGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
                            dropOsc.connect(dropGain);
                            dropGain.connect(ctx.destination);
                            dropOsc.start();
                            dropOsc.stop(ctx.currentTime + 0.08);
                        }
                    }, 500);
                    Utils.ambientIntervals.push(dropInterval);
                    break;
                }

                // 18. Zen Kuş Sesi İmpulsları
                case 'birds': {
                    const birdInterval = setInterval(() => {
                        if (Math.random() > 0.6) {
                            const birdOsc = ctx.createOscillator();
                            const birdGain = ctx.createGain();
                            birdOsc.type = 'sine';
                            const freq = 2400 + Math.random() * 1000;
                            birdOsc.frequency.setValueAtTime(freq, ctx.currentTime);
                            birdOsc.frequency.exponentialRampToValueAtTime(freq + 400, ctx.currentTime + 0.1);
                            birdGain.gain.setValueAtTime(0.03, ctx.currentTime);
                            birdGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
                            birdOsc.connect(birdGain);
                            birdGain.connect(ctx.destination);
                            birdOsc.start();
                            birdOsc.stop(ctx.currentTime + 0.12);
                        }
                    }, 1200);
                    Utils.ambientIntervals.push(birdInterval);
                    break;
                }

                // 19. Tibetan Zen Çanı
                case 'zenbowl': {
                    const bowlInterval = setInterval(() => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(216, ctx.currentTime);
                        gain.gain.setValueAtTime(0.08, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.0);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start();
                        osc.stop(ctx.currentTime + 4.0);
                    }, 5000);

                    // Initial ring
                    const osc0 = ctx.createOscillator();
                    const gain0 = ctx.createGain();
                    osc0.type = 'sine';
                    osc0.frequency.setValueAtTime(216, ctx.currentTime);
                    gain0.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain0.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.0);
                    osc0.connect(gain0);
                    gain0.connect(ctx.destination);
                    osc0.start();
                    osc0.stop(ctx.currentTime + 4.0);

                    Utils.ambientIntervals.push(bowlInterval);
                    break;
                }

                // 20. Odak Metronomu (60 BPM)
                case 'metronome': {
                    const metroInterval = setInterval(() => {
                        const tickOsc = ctx.createOscillator();
                        const tickGain = ctx.createGain();
                        tickOsc.type = 'square';
                        tickOsc.frequency.setValueAtTime(1000, ctx.currentTime);
                        tickGain.gain.setValueAtTime(0.03, ctx.currentTime);
                        tickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
                        tickOsc.connect(tickGain);
                        tickGain.connect(ctx.destination);
                        tickOsc.start();
                        tickOsc.stop(ctx.currentTime + 0.02);
                    }, 1000); // 60 BPM = 1 tick per second
                    Utils.ambientIntervals.push(metroInterval);
                    break;
                }

                default:
                    createNoiseSource('pink', 'lowpass', 1000);
                    break;
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
