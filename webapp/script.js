const inputBox = document.getElementById('input-box');
const spinner = document.createElement('div');
spinner.id = 'loading-spinner';
spinner.innerHTML = `<svg width="25" height="25" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" class="motion-safe:animate-spin icon-lg"><path d="M9.5 2.9375V5.5625M9.5 13.4375V16.0625M2.9375 9.5H5.5625M13.4375 9.5H16.0625" stroke="currentColor" stroke-width="1.875" stroke-linecap="round"></path><path d="M4.86011 4.85961L6.71627 6.71577M12.2847 12.2842L14.1409 14.1404M4.86011 14.1404L6.71627 12.2842M12.2847 6.71577L14.1409 4.85961" stroke="currentColor" stroke-width="1.875" stroke-linecap="round"></path></svg>`; // your spinner SVG here
const chatArea = document.getElementById('chatarea-container');

function addChatMessage(message) {
    var newChatDiv = document.createElement('div');
    newChatDiv.className = 'chat';				// simple function to append a new div in the chat area with the message content
    newChatDiv.innerText = message;
    chatArea.appendChild(newChatDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    inputBox.style.height = 'auto';
    inputBox.value = '';
}
document.getElementById("send").addEventListener('click', function() {
    var message = inputBox.value;
    if (message === ""){
        console.log("Error: Blank Field");
    }
    else {
        addChatMessage(message)
        chatArea.appendChild(spinner)
        async function sendPrompt() {
            try {
                const response = await fetch("http://api-panacea.hopto.org:16180/api", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: message, model: "panacea" })
                });
        
                if (!response.ok) {
                    throw new Error("API error: " + response.status);
                }
        
                const newChatDiv = document.createElement('div');
                newChatDiv.className = 'ai-chat';
                chatArea.appendChild(newChatDiv);
                chatArea.scrollTop = chatArea.scrollHeight;
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let done = false;
                let firstChunk = true;
                let accumulatedText = "";
        
                while (!done) {
                    const { value, done: streamDone } = await reader.read();
                    if (streamDone) break;
        
                    const chunk = decoder.decode(value, { stream: true });

                    if (firstChunk) {
                        // Remove spinner immediately when streaming starts
                        spinner.remove();
                        firstChunk = false;
                    }

                    accumulatedText += chunk;
        
                    // Convert the accumulated Markdown to HTML
                    newChatDiv.innerHTML = marked.parse(accumulatedText);
        
                    // Keep the chat scrolled to the bottom
                    chatArea.scrollTop = chatArea.scrollHeight;
                }
        
            } catch (error) {
                console.error("Error:", error);
            }
        }
        sendPrompt()
    }
})