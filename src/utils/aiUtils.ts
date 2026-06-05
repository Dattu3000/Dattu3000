

const invokeUrl = "/api/ai/v1/chat/completions";
const apiKey = import.meta.env.VITE_NVIDIA_API_KEY || "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";

export const getAIResponse = async (prompt: string, onChunk: (text: string) => void) => {
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Accept": "text/event-stream",
    "Content-Type": "application/json"
  };

  const payload = {
    "model": "nvidia/nemotron-3-ultra-550b-a55b",
    "messages": [{"role": "user", "content": prompt}],
    "temperature": 1,
    "top_p": 0.95,
    "max_tokens": 16384,
    "chat_template_kwargs": { "enable_thinking": true },
    "reasoning_budget": 16384,
    "stream": true
  };

  try {
    // In browser, native fetch is best for streaming. We adapt the axios code to work in the browser.
    const response = await fetch(invokeUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') break;
          try {
            const data = JSON.parse(dataStr);
            const delta = data.choices[0].delta;
            if (delta) {
              if (delta.reasoning_content) {
                // Wrap reasoning content in a distinct styling if possible, or just append it.
                // We'll just stream it directly as text to keep it simple, since the UI expects raw text.
                onChunk(delta.reasoning_content);
              }
              if (delta.content) {
                onChunk(delta.content);
              }
            }
          } catch (e) {
            console.error("Error parsing chunk", e, dataStr);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error communicating with AI:", error);
    onChunk("Sorry, I encountered an error. Please try again.");
  }
};
