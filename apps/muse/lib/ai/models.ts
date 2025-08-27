export const DEFAULT_CHAT_MODEL: string = 'claude-sonnet';

interface ChatModel {
  id: string;
  name: string;
  description: string;
  proOnly?: boolean;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic\'s most balanced and capable model',
  },
  {
    id: 'claude-opus',
    name: 'Claude 3 Opus',
    description: 'Most powerful model for complex tasks',
    proOnly: true,
  },
  {
    id: 'chat-model-small',
    name: 'Llama 4',
    description: 'Small and fast model (Groq)',
  },
  {
    id: 'chat-model-large',
    name: 'Kimi K2',
    description: 'Large and powerful model (Groq)',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Deepseek R1',
    description: 'Advanced reasoning model (Groq)',
  },
];
