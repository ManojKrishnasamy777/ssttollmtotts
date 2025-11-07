export interface LLMService {
  generateResponse(
    userId: string,
    messages: Array<{ role: string; content: string }>,
    clientType?: 'buyer' | 'seller' | 'renter'
  ): Promise<string>;
}
