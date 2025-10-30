declare module 'puter' {
  interface AIMessage {
    content?: string;
    role?: string;
  }

  interface AIResponse {
    message?: AIMessage;
  }

  interface AIOptions {
    model?: string;
    system?: string;
    temperature?: number;
  }

  interface AI {
    chat(prompt: string, options?: AIOptions): Promise<AIResponse>;
  }

  interface Puter {
    ai: AI;
  }

  const puter: Puter;
  export default puter;
}
