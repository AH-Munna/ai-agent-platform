import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '$NVIDIA_API_KEY',
  baseURL: 'https://integrate.api.nvidia.com/v1',
})
 
async function main() {
  const completion = await openai.chat.completions.create({
    model: "deepseek-ai/deepseek-v3.1-terminus",
    messages: [{"role":"user","content":""}],
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: 8192,
    chat_template_kwargs: {"thinking":true},
    stream: true
  })
   
  for await (const chunk of completion) {
        const reasoning = chunk.choices[0]?.delta?.reasoning_content;
    if (reasoning) process.stdout.write(reasoning);
        process.stdout.write(chunk.choices[0]?.delta?.content || '')
    
  }
  
}

main();