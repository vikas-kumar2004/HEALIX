





export const getResponseFromGemini = async (currentUserPrompt, fewHistory = null) => {



    const geminiChatModel = "gemini-2.5-flash";

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${geminiChatModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "contents": contents,

            })
        })

        if (!res.ok) {
            const errorData = await res.json()
            console.log(errorData?.error?.message)
            console.log("Star Ai was busy.")

            return null

        }
        try {
            const data = await res.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        } catch (error) {
            console.log(error.message)
            return null;
        }
    } catch (e) {
        console.log(e.message)
        return null

    }

}
// i think above one i  m not using anymore, but  i have not checked yet





export const geminiFeaturesSelectFromProblems = async (problemsArray, featuresArray) => {

    const contents = [
            {  // here i can also make the prompt more specific later
                role: "user",
                parts: [
                        {
                            text: `
                                Analyze the user's health problems and recommend ONLY relevant sensor combinations.

                                User's Problems:
                                ${JSON.stringify(problemsArray)}

                                Available Sensor Combinations:
                                ${featuresArray.map((feature, index) => `[${index}]: ${feature}`).join('\n')}

                                Sensor capabilities:
                                Understand by yourself.

                                Instructions:
                                1. Match sensors to the specific problems mentioned
                                2. Be HIGHLY SELECTIVE - only choose combinations directly relevant to the problems
                                3. If problems are skin-related, focus on temperature, UV, and environmental sensors
                                4. Return ONLY indexes of relevant combinations (aim for 3-8 selections, not all ${featuresArray.length})
                                `
                        }
                ]
            }
    ];

    const tools = [
            {
                functionDeclarations: [
                    {
                        name: "recommendFeatures",
                        description: "Returns indexes of selected features",
                        parameters: {
                            type: "object",
                            properties: {
                                totalFeatures: {
                                    type: "array",
                                    items: { type: "object" }
                                },
                                selectedIndixes: {
                                    type: "array",
                                    items: { type: "integer" }
                                }
                            },
                            required: ["selectedIndixes"]
                        }
                    }
                ]
            }
    ];

    const geminiChatModel = "gemini-2.5-flash";

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiChatModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: contents,
                tools: tools,
                toolConfig: {
                    functionCallingConfig: {
                        mode: "ANY"
                    }
                }
            })
        })

        if (!res.ok) {
            const errorData = await res.json()
            console.log(errorData?.error?.message)
            console.log("Star Ai was busy.")
            return null
        }

        const data = await res.json()
        // {
        //     "candidates": [
        //         {
        //         "content": {
        //             "role": "model",
        //             "parts": [
        //             {
        //                 "functionCall": {
        //                 "name": "recommendFeatures",
        //                 "args": {
        //                     "selectedIndixes": [0, 2, 5] 
        //                 }
        //                 }
        //             }
        //             ]
        //         },
        //         "finishReason": "STOP",
        //         "index": 0,
        //         "safetyRatings": [
        //             {
        //             "category": "HARM_CATEGORY_HARASSMENT",
        //             "probability": "NEGLIGIBLE"
        //             }
        //         ]
        //         }
        //     ],
        //     "usageMetadata": {
        //         "promptTokenCount": 150,
        //         "candidatesTokenCount": 20,
        //         "totalTokenCount": 170
        //     }
        // }
        // ye data h

        const parts = data.candidates[0].content.parts;
        const functionPart = parts.find(p => p.functionCall);

        return functionPart ? functionPart.functionCall : null;

        // {
        //     "name": "recommendFeatures",
        //     "args": {
        //         "selectedIndixes": [0, 2, 5] 
        //     }
        // } 
        // ye return ho rha h


    } catch (e) {
        console.log(e.message)
        return null
    }
}