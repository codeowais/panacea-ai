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

        function animateCircle() {
            analyser.getByteFrequencyData(dataArray);
            let sum = dataArray.reduce((a, b) => a + b, 0);
            let averageVolume = sum / bufferLength;

            const circle = document.getElementById('circle');
            let newSize = Math.max(175, averageVolume * 2); // Minimum size of 100px
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

setupMicrophone();