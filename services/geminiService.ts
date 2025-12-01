import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("环境变量中未找到 API Key");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeWorldData = async (content: string, type: string): Promise<string> => {
  try {
    const ai = getClient();
    const modelId = 'gemini-2.5-flash';
    
    const prompt = `
      你是一个名为“核心档案管理员 (Core Archivist)”的AI系统，专门用于分析虚构的世界观设定数据。
      请分析用户提供的以下条目。
      
      条目类型: ${type}
      内容:
      """
      ${content}
      """

      请提供一份简短的、系统风格的分析报告（最多3句话）。
      1. 评估原创性或逻辑一致性。
      2. 提出一个改进建议或一个关键问题以深化设定。
      3. 保持冷静、机械、乐于助人但分析性的语气。请用中文回答。
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "系统错误：无法处理数据流。";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "连接中断。无法连接核心档案管理员。";
  }
};