import { auth } from '@/app/(auth)/auth';
import type { Experimental_LanguageModelV1Middleware, LanguageModelV1StreamPart } from 'ai';

type LLMUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

type UsageType = "STREAM" | "GENERATE";

const trackUserLLMUsage = async (usage: LLMUsage, type: UsageType) => {
  const session = await auth();
  const userId = session?.user?.id;

  // TODO: track user usage in a database
  
  console.dir({usage, userId, type}, { depth: null }); 
}

export const customMiddleware: Experimental_LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate, }) => {
    const result = await doGenerate();
    
    const usage: LLMUsage = {
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.promptTokens + result.usage.completionTokens,
    };    

    trackUserLLMUsage(usage, "GENERATE");   
    return result;
  },

  wrapStream: async ({ doStream, params }) => {   
    const streamPromise = await doStream();
    const { stream, ...rest } = streamPromise;

    let usage: LLMUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };    

    const transformStream = new TransformStream<
      LanguageModelV1StreamPart,
      LanguageModelV1StreamPart
    >({
      transform(chunk, controller) {   
        // we only get usage info in the last chunk
        if (chunk.type === 'finish') {
          usage = {
            promptTokens: chunk.usage.promptTokens,
            completionTokens: chunk.usage.completionTokens,
            totalTokens: chunk.usage.promptTokens + chunk.usage.completionTokens,
          };          
        }
        controller.enqueue(chunk);
      },

      flush() {
       trackUserLLMUsage(usage, "STREAM");        
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};
