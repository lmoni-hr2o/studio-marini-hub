export function togglePresenterMode() {
    if (window.presenterWin && !window.presenterWin.closed) {
        window.presenterWin.close();
        window.presenterWin = null;
        if (window.presentationWin) {
            window.presentationWin.close();
            window.presentationWin = null;
        }
        return;
    }
    
    window.presentationWin = window.open('', 'Presentation', 'width=1024,height=768');
    
    const presentationHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Presentazione</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #1a1a1a; color: white; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
            .slide { display: none; flex-direction: column; justify-content: center; align-items: center; height: 100vh; padding: 60px; text-align: center; }
            .slide.active { display: flex; }
            .slide h1 { font-size: 56px; color: #4285f4; margin-bottom: 30px; }
            .slide h2 { font-size: 48px; color: #4285f4; margin-bottom: 20px; }
            .slide p { font-size: 28px; color: #9aa0a6; }
            .slide ul { font-size: 24px; color: #bdc1c6; text-align: left; max-width: 800px; margin: 20px auto; }
            .slide li { margin: 15px 0; }
            .badge { background: #e8f0fe; color: #4285f4; padding: 10px 25px; border-radius: 50px; font-size: 18px; font-weight: 700; }
            .badge-lab { background: #e8f5e9; color: #34a853; }
            .header { position: fixed; top: 30px; left: 30px; background: rgba(66,133,244,0.2); padding: 10px 20px; border-radius: 8px; }
            .footer { position: fixed; bottom: 30px; right: 30px; color: #666; }
            .progress { position: fixed; bottom: 0; left: 0; right: 0; height: 6px; background: #333; }
            .progress-bar { height: 100%; background: #4285f4; transition: width 0.3s; }
        </style>
    </head>
    <body>
        <div class="header" id="headerLabel">Modulo</div>
        <div class="progress"><div class="progress-bar" id="progressBar" style="width: 5%"></div></div>
        
        <div class="slide active" data-type="intro">
            <span class="badge">Studio Marini</span>
            <h1>L'Ufficio Automatico</h1>
            <p>Google Workspace per PMI</p>
        </div>
        
        <div class="slide" data-type="presentation">
            <h2 id="slideTitle">Presentazione</h2>
            <ul id="slideContent"><li>Contenuto della lezione</li></ul>
        </div>
        
        <div class="slide" data-type="lab">
            <span class="badge badge-lab"><i class="fas fa-flask"></i> Laboratorio Pratico</span>
            <h2 id="labTitle">Esercitazione</h2>
            <p>Segui le istruzioni del docente</p>
        </div>
        
        <div class="slide" data-type="tool">
            <h2 id="toolTitle">Strumento</h2>
            <p>Utilizza lo strumento indicato</p>
        </div>
        
        <div class="footer">Studio Marini Formazione</div>
        
        <script>
            const channel = new BroadcastChannel('studio_marini_presentation');
            const slides = document.querySelectorAll('.slide');
            
            function showSlide(index) {
                slides.forEach((s, i) => s.classList.toggle('active', i === index));
                document.getElementById('progressBar').style.width = ((index + 1) / slides.length * 100) + '%';
            }
            
            channel.onmessage = (e) => {
                const { type, title, content, label, index } = e.data;
                if (type === 'intro') {
                    showSlide(0);
                    document.getElementById('headerLabel').textContent = label || 'Introduzione';
                } else if (type === 'presentation') {
                    showSlide(1);
                    document.getElementById('slideTitle').textContent = title || 'Presentazione';
                    document.getElementById('slideContent').innerHTML = content || '';
                    document.getElementById('headerLabel').textContent = label || 'Lezione';
                } else if (type === 'lab') {
                    showSlide(2);
                    document.getElementById('labTitle').textContent = title || 'Laboratorio';
                    document.getElementById('headerLabel').textContent = label || 'Laboratorio';
                } else if (type === 'tool') {
                    showSlide(3);
                    document.getElementById('toolTitle').textContent = title || 'Strumento';
                    document.getElementById('headerLabel').textContent = label || 'Strumento';
                }
                if (index !== undefined) showSlide(index);
            };
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'f' && !document.fullscreenElement) document.documentElement.requestFullscreen();
            });
            
            showSlide(0);
        </script>
    </body>
    </html>
    `;
    
    window.presentationWin.document.write(presentationHTML);
    window.presentationWin.document.close();
    
    setTimeout(() => { try { window.presentationWin.focus(); } catch(e) {} }, 1000);
}

export function startPresentation() {
    togglePresenterMode();
}

export function changeSlide(dir) {
    console.log('Slide change:', dir);
}

export function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

export function loadChecklist() {}
export function loadWall() {}

export async function generateAiText() {
    const prompt = document.getElementById('aiPrompt')?.value;
    const output = document.getElementById('aiOutput');
    if (!prompt || !output) return;
    output.style.display = 'block';
    output.innerText = "Gemini sta generando...";
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBFyBviMx7rTNOonSDoU4gsH4oTq5qJ2hQ`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        output.innerText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Errore";
    } catch (e) { output.innerText = "Errore di connessione"; }
}

export async function generateImage() {
    const prompt = document.getElementById('imagePrompt')?.value;
    const img = document.getElementById('imageResult');
    if (!prompt || !img) return;
    img.style.display = 'none';
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=AIzaSyBFyBviMx7rTNOonSDoU4gsH4oTq5qJ2hQ`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1 } })
        });
        const data = await res.json();
        if (data.predictions?.[0]) {
            img.src = `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
            img.style.display = 'block';
        }
    } catch (e) { alert("Errore"); }
}