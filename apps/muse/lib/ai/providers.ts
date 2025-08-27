import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { groq } from '@ai-sdk/groq';
import { anthropic } from '@ai-sdk/anthropic';

export const myProvider = customProvider({
  languageModels: {
    // Primary models - Claude as default
    'claude-sonnet': anthropic('claude-3-5-sonnet-20241022'),
    'claude-opus': anthropic('claude-3-opus-20240229'),
    
    // Groq fallback models  
    'chat-model-small': groq('meta-llama/llama-4-maverick-17b-128e-instruct'),
    'chat-model-large': groq('moonshotai/kimi-k2-instruct'),
    'chat-model-reasoning': wrapLanguageModel({
      model: groq('deepseek-r1-distill-llama-70b'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    
    // Specialized models - prefer Claude for better quality
    'title-model': anthropic('claude-3-5-sonnet-20241022'),
    'artifact-model': anthropic('claude-3-5-sonnet-20241022'),
  },
});
