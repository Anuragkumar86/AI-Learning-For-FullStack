
const GEMINI_API_KEY = "**************************"
const userPrompt = document.getElementById('user_prompt')
const systemPrompt = document.getElementById('system_prompt')
const sendButton = document.getElementById('sendBtn')
const responseBox = document.getElementById('response')
const tokenBox = document.getElementById('token_count')

sendButton.addEventListener('click', sendPrompt)

async function sendPrompt() {
    const prompt = userPrompt.value
    const SYSTEM_INSTRUCTION = systemPrompt.value

    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            system_instruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
        })
    });

    const text = await response.json()

    console.log(text);
    const actualRespone = text.candidates[0].content.parts[0].text
    console.log("ActualResponse: ", actualRespone);

    responseBox.innerText = actualRespone

    const totalToken = text.usageMetadata.totalTokenCount
    tokenBox.innerText = totalToken

}