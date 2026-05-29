

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const apiKey = "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";

export const getAIResponse = async (prompt: string, onChunk: (text: string) => void) => {
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Accept": "text/event-stream",
    "Content-Type": "application/json"
  };

  const payload = {
    "model": "google/gemma-3n-e4b-it",
    "messages": [{"role": "user", "content": prompt}],
    "max_tokens": 512,
    "temperature": 0.20,
    "top_p": 0.70,
    "frequency_penalty": 0.00,
    "presence_penalty": 0.00,
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
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              onChunk(data.choices[0].delta.content);
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
