async function updateModelName() {
    try {
        const modelName = await pywebview.api.get_model_name();
        document.getElementById("modelname").innerText = modelName;		// async function to constantly update model name from config.json
    } catch (error) {
        console.error("Error fetching model name:", error);
    }
}

async function setupMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);

        analyser.fftSize = 32;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function animateCircle() {							// async function to listen to the microphone and animate the circle accordingly
            analyser.getByteFrequencyData(dataArray);
            let sum = dataArray.reduce((a, b) => a + b, 0);
            let averageVolume = sum / bufferLength;

            const circle = document.getElementById('circle');
            let newSize = Math.max(175, averageVolume * 2); 			// Minimum size of 100px
            circle.style.width = `${newSize}px`;
            circle.style.height = `${newSize}px`;

            requestAnimationFrame(animateCircle);
        }

        animateCircle();
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access the microphone. Please ensure you have granted permission.');
    }
}

function addChatMessage(message) {
    var chatArea = document.getElementById('chatarea');
    var newChatDiv = document.createElement('div');
    newChatDiv.className = 'chat';				// simple function to append a new div in the chat area with the message content
    newChatDiv.innerText = message;
    chatArea.appendChild(newChatDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function typeTextAnimation(message, container) {
    return new Promise((resolve) => {
        let index = 0;
        const speed = 30;

        function typeChar() {
            if (index < message.length) {
                if (message.charAt(index) === '\n') {
                    container.appendChild(document.createElement('br'));
                } else {
                    container.appendChild(document.createTextNode(message.charAt(index)));
                }
                index++;
                setTimeout(typeChar, speed);
            } else {
                resolve(); // done
            }
        }

        typeChar();
    });
}

function speakText(text) {
    // Check if the Web Speech API is supported
    if ('speechSynthesis' in window) {
        // Create a new speech synthesis utterance for the given text
        const utterance = new SpeechSynthesisUtterance(text);

        // Optionally, you can set properties such as pitch, rate, and volume
        utterance.pitch = 1;   // range 0-2
        utterance.rate = 1;    // range 0.1-10					// function to use in-built TTS to speak the provided text
        utterance.volume = 1;  // range 0-1

        // Speak the text
        window.speechSynthesis.speak(utterance);
    } else {
        console.error('Text-to-speech is not supported in this browser.');
    }
}

function listenAndConvertToText() {									// function to convert speech to text (english only)
    return new Promise((resolve, reject) => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-US'; // Set language
        recognition.interimResults = false; // Return only final results
        recognition.continuous = false; // Single utterance

        recognition.onstart = () => {
            document.getElementById("startListeningButton").classList.remove("not-recording");
            document.getElementById("startListeningButton").classList.add("recording");
            console.log("Listening...");
        };

        recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript; // Extract the spoken text
                console.log("Recognized text:", transcript);
                resolve(transcript);
                document.getElementById("startListeningButton").classList.remove("recording");
                document.getElementById("startListeningButton").classList.add("not-recording");
                addChatMessage(transcript);
                pywebview.api.frontend_input(transcript).then(function(response) {
                addChatMessage(response);
                speakText(response);
            }).catch(function(error) {
                console.log("Error:", error);
            });
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
        } else {
            reject(new Error("Speech recognition is not supported in this browser."));
        }
    });
}


document.getElementById("send").addEventListener('click', function() {
    var inputBox = document.getElementById('input-box');
    var message = inputBox.value;
    if (message === ""){
        console.log("Error: Blank Field");
    }
    else {
        addChatMessage(message);
        inputBox.value = "";									// listener function for the send button in the chat
        pywebview.api.frontend_input(message).then(function(response) {
            const chatArea = document.getElementById('chatarea');
            const newChatDiv = document.createElement('div');
            newChatDiv.className = 'ai-chat';
            chatArea.appendChild(newChatDiv);
            chatArea.scrollTop = chatArea.scrollHeight;
            typeTextAnimation(response, newChatDiv);
            speakText(response);
        }).catch(function(error) {
            console.log("Error:", error);
        });

    }
})

document.getElementById("startListeningButton").addEventListener('click', () => {
    listenAndConvertToText()
        .then(transcript => {
            console.log("You said:", transcript);
        })											// listener function for the mic button
        .catch(error => {
            console.error("Error:", error);
        });
});

setInterval(updateModelName, 1000);
window.onload = updateModelName;

setupMicrophone();