import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { CONFIG } from './config.js';

let db, auth;

try {
    if (CONFIG.firebase.apiKey) {
        const firebaseApp = initializeApp(CONFIG.firebase);
        db = getFirestore(firebaseApp);
        auth = getAuth(firebaseApp);
        // Offline Persistence
        enableIndexedDbPersistence(db).catch(err => {
            if (err.code == 'failed-precondition') {
                console.warn('Persistence failed: Multiple tabs open');
            } else if (err.code == 'unimplemented') {
                console.warn('Persistence not supported by browser');
            }
        });
    } else {
        console.warn("Firebase config eksik. Demo modunda çalışıyor (LocalStorage).");
    }
} catch (e) {
    console.error("Firebase başlatma hatası:", e);
}

export { db, auth };
