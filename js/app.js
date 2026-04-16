import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { apiKey, appId, firebaseConfig } from './firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;

export function initAuth(callback) {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            signInWithCustomToken(auth, __initial_auth_token).then(() => callback());
        } else {
            signInAnonymously(auth).then(() => callback());
        }
    } catch (e) {
        console.log('Modalità demo - nessun Firebase');
        document.getElementById('loadingOverlay').style.display = 'none';
        callback();
    }

    onAuthStateChanged(auth, (u) => {
        user = u;
        if (user) {
            document.getElementById('loadingOverlay').style.display = 'none';
        }
    });
}

export function getUser() {
    return user;
}

export function getDb() {
    return db;
}

export function getAppId() {
    return appId;
}

export function getApiKey() {
    return apiKey;
}

let currentSlide = 0;
const slides = document.querySelectorAll('.slide-content');
const counter = document.getElementById('slideCounter');

export function changeSlide(dir) {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + dir + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    counter.innerText = `Slide ${currentSlide + 1} / ${slides.length}`;
}

export function openTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    const clickedBtn = document.querySelector(`[onclick="openTab('${tabId}')"]`);
    if (clickedBtn) clickedBtn.classList.add('active');
    
    document.getElementById(tabId).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function copyPrompt(btn) {
    const promptCard = btn.closest('.prompt-card');
    const promptText = promptCard.querySelector('code').innerText;
    
    navigator.clipboard.writeText(promptText).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copiato!';
        btn.classList.remove('btn-blue');
        btn.classList.add('btn-green');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-green');
            btn.classList.add('btn-blue');
        }, 2000);
    });
}

const checklistItems = [
    { id: 'm1-lab1', label: 'Completa Lab 1: Configura Agenda' },
    { id: 'm1-lab2', label: 'Completa Lab 2: Crea Listino Servizi' },
    { id: 'm1-lab3', label: 'Completa Lab 3: Collega Stripe' },
    { id: 'm2-lab1', label: 'Completa Lab 4: Prompt Reclamo' },
    { id: 'm2-lab2', label: 'Completa Lab 5: Prompt Preventivo' },
    { id: 'm2-lab3', label: 'Completa Lab 6: Estrai Decisioni' },
    { id: 'm3-lab1', label: 'Completa Lab 7: Analisi PDF' },
    { id: 'm3-lab2', label: 'Completa Lab 8: Genera Documento' }
];

export function loadChecklist() {
    if (!user) {
        renderChecklistDemo();
        return;
    }
    const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'roadmap', 'checklist');
    onSnapshot(ref, (snap) => {
        const data = snap.exists() ? snap.data() : {};
        renderChecklist(data);
    }, err => console.error(err));
}

function renderChecklistDemo() {
    const container = document.getElementById('checklistContainer');
    container.innerHTML = '';
    checklistItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'checklist-item';
        div.innerHTML = `
            <input type="checkbox" id="${item.id}" onchange="window.syncCheck('${item.id}', this.checked)">
            <label for="${item.id}">${item.label}</label>
        `;
        container.appendChild(div);
    });
}

function renderChecklist(data) {
    const container = document.getElementById('checklistContainer');
    container.innerHTML = '';
    checklistItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'checklist-item';
        const checked = data[item.id] ? 'checked' : '';
        div.innerHTML = `
            <input type="checkbox" id="${item.id}" ${checked} onchange="window.syncCheck('${item.id}', this.checked)">
            <label for="${item.id}">${item.label}</label>
        `;
        container.appendChild(div);
    });
}

export async function syncCheck(id, status) {
    if (!user) return;
    const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'roadmap', 'checklist');
    await setDoc(ref, { [id]: status }, { merge: true });
}

export function loadWall() {
    if (!user) {
        renderWallDemo();
        return;
    }
    const ref = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
    onSnapshot(ref, (snap) => {
        const wall = document.getElementById('publicWall');
        wall.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            const card = document.createElement('div');
            card.className = 'card';
            card.style.padding = '20px';
            card.innerHTML = `
                <div class="badge badge-ai" style="margin-bottom:10px;">${d.type}</div>
                <p style="font-size:13px; font-weight:bold;">"${d.prompt.substring(0, 50)}..."</p>
                <div style="font-size:12px; color:var(--subtext); background:var(--bg); padding:10px; border-radius:10px;">${d.result.substring(0, 150)}...</div>
            `;
            wall.appendChild(card);
        });
    }, err => console.error(err));
}

function renderWallDemo() {
    const wall = document.getElementById('publicWall');
    wall.innerHTML = '<p style="color:var(--subtext); grid-column: 1/-1; text-align:center;">I tuoi prompt appariranno qui dopo aver usato i laboratori AI.</p>';
}

export async function generateAiText() {
    const prompt = document.getElementById('aiPrompt').value;
    const btn = document.getElementById('btnAi');
    const output = document.getElementById('aiOutput');

    if (!prompt) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Elaborazione...';
    output.style.display = 'block';
    output.innerText = "Gemini sta scrivendo per te...";

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: "Sei l'assistente dello Studio Marini. Scrivi testi brevi, professionali e orientati alle PMI." }] }
            })
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Errore.";
        output.innerText = text;

        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
            type: 'Testo AI',
            prompt: prompt,
            result: text,
            ts: Date.now()
        });
    } catch (e) {
        output.innerText = "Errore connessione.";
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Genera Bozza';
    }
}

export async function generateImage() {
    const prompt = document.getElementById('imagePrompt').value;
    const btn = document.getElementById('btnImage');
    const img = document.getElementById('imageResult');

    if (!prompt) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generazione...';
    img.style.display = 'none';

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1 } })
        });
        const data = await res.json();
        if (data.predictions?.[0]) {
            const b64 = `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
            img.src = b64;
            img.style.display = 'block';

            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
                type: 'Immagine AI',
                prompt: prompt,
                result: 'Immagine generata correttamente.',
                ts: Date.now()
            });
        }
    } catch (e) {
        alert("Errore generazione immagine.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> Genera Asset';
    }
}

window.changeSlide = changeSlide;
window.openTab = openTab;
window.copyPrompt = copyPrompt;
window.syncCheck = syncCheck;
window.generateAiText = generateAiText;
window.generateImage = generateImage;

export function initApp() {
    loadChecklist();
    loadWall();
}
