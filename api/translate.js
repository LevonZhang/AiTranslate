// api/translate.js
export async function POST(req, res) {
    try {
      const MODEL_NAME = "gemini-1.5-pro-latest";
      // 使用 dynamic import() 导入 Google Generative AI
      const { GoogleGenerativeAI, FunctionDeclarationSchemaType} = await import('@google/generative-ai');
  
      // 初始化 Google Gemini API 客户端
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

      // 从请求体中获取 texts 和 target_language
      const { texts, target_language } = req.body; 

      let sys_prompt = `Translate the following texts to {target_language}, paying close attention to the context and ensuring accuracy. Double-check for any potentially ambiguous words or phrases and choose the most appropriate translation. 
                        **Examples of potential ambiguities:**
                        - If the word "charge" refers to billing, ensure it is not translated as "charging" (as in electricity).

                        **Formatting instructions:**
                        - Do not add any extra line breaks, markdown formatting, numbering, or any other special formatting. 
                        - Please preserving all original formatting, including spaces, line breaks, and special characters such as tabs.
                        - Directly return a JSON array without any additional formatting. 
                        `

      const schema = {
        description: "Objects containing index and translated text",
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
          index: {
            type: FunctionDeclarationSchemaType.STRING,
            description: "Index of translated text",
            nullable: false,
          },
          translation: {
            type: FunctionDeclarationSchemaType.STRING,
            description: "Translated text",
            nullable: false,
          },
        },
        required: ["index", "translation"],
      };  

      const generationConfig = {
        response_mime_type:'application/json',
        responseSchema: schema,
      }

      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: {
          parts: [{ text: sys_prompt }],
          role:"model"
        },
        generationConfig: generationConfig,
      });  
    
      const result = await model.generateContent(texts);  

      if(result.response.promptFeedback && result.response.promptFeedback.blockReason) {   
        return { error: `Blocked for ${result.response.promptFeedback.blockReason}` };
      }
      let text = result.response.text();
      return new Response(JSON.stringify(JSON.parse(text)), { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        } 
      });
    } catch (error) {
      console.error("Error translate:", error);
      return new Response("Error translate", { status: 500 }); 
    }
  };