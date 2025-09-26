// ----- Global variables -----
let audioContext, analyser;
let animationFrameId = null;

// ----- Microphone setup -----
async function setupMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);

        analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.fftSize = 32;
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access the microphone. Please ensure you have granted permission.');
    }
}

// ----- Circle animation -----
function animateCircle() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        analyser.getByteFrequencyData(dataArray);
        const averageVolume = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        const circle = document.getElementById('halo');
        const newSize = Math.max(175, averageVolume * 2);
        circle.style.width = `${newSize}px`;
        circle.style.height = `${newSize}px`;

        animationFrameId = requestAnimationFrame(draw);
    }

    draw();
}

function stopCircleAnimation() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    const circle = document.getElementById('halo');
    circle.style.width = '175px';
    circle.style.height = '175px';
}

// ----- Chat helpers -----
function addChatMessage(message, user = true) {
    const div = document.createElement('div');
    div.className = user ? 'chat' : 'ai-chat';
    div.innerText = message;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ----- Speech-to-text -----
function listenAndConvertToText() {
    return new Promise((resolve, reject) => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            reject(new Error("Speech recognition not supported"));
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => {
            animateCircle();
            document.getElementById("startListeningButton").classList.remove("not-recording");
            document.getElementById("startListeningButton").classList.add("recording");
            console.log("Listening...");
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            resolve(transcript);

            stopCircleAnimation();
            document.getElementById("startListeningButton").classList.remove("recording");

            addChatMessage(transcript);

            // Expand chat if on small screen
            if (window.innerWidth <= 1024) {
                document.querySelector("#panacea-chat").classList.remove('collapsed');
                document.querySelector('#chatarea-container').style.display = 'flex';
                document.querySelector('#panacea-attract').classList.remove('expanded');
                setTimeout(() => {
                    document.querySelector('#input-box-container').classList.remove('collapsed');
                }, 250);
                document.querySelector("#panacea-chat").classList.add('for-expanded');
            }

            chatArea.appendChild(spinner);
            sendPrompt(transcript);
        };

        recognition.onerror = (event) => {
            document.getElementById("startListeningButton").classList.remove("recording");
            document.getElementById("startListeningButton").classList.add("not-recording");
            console.error("Speech recognition error:", event.error);
            reject(new Error(event.error));
        };

        recognition.onend = () => {
            document.getElementById("startListeningButton").classList.remove("recording");
            document.getElementById("startListeningButton").classList.add("not-recording");
            console.log("Speech recognition ended.");
        };

        recognition.start();
    });
}

// ----- Send prompt to AI -----
async function sendPrompt(message) {
    try {
        const response = await fetch("http://api-panacea.hopto.org:16180/api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: message, model: "panacea" })
        });

        if (!response.ok) throw new Error("API error: " + response.status);

        const newChatDiv = document.createElement('div');
        newChatDiv.className = 'ai-chat';
        chatArea.appendChild(newChatDiv);
        chatArea.scrollTop = chatArea.scrollHeight;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";
        let firstChunk = true;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            if (firstChunk) {
                spinner.remove();
                firstChunk = false;
            }

            accumulatedText += chunk;
            newChatDiv.innerHTML = marked.parse(accumulatedText);
            chatArea.scrollTop = chatArea.scrollHeight;
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

// ----- Event listeners -----
document.getElementById("startListeningButton").addEventListener('click', () => {
    listenAndConvertToText()
        .then(transcript => console.log("You said:", transcript))
        .catch(err => console.error(err));
});

// ----- Initialize microphone -----
setupMicrophone();