/**
 * Text Processor for Tu Socia!
 * Handles email summarization, inbox management, and review analysis
 */

import { EventEmitter } from 'events';

/**
 * Email metadata and content
 */
interface Email {
  id: string;
  messageId: string;
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  timestamp: number;
  threadId?: string;
  labels?: string[];
  isRead: boolean;
  isSpam: boolean;
  isArchived: boolean;
  attachmentCount: number;
  wordCount: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  importance?: 'low' | 'normal' | 'high';
}

/**
 * Summarized email representation
 */
interface EmailSummary {
  emailId: string;
  subject: string;
  from: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  requiresResponse: boolean;
  suggestedResponse?: string;
  timestamp: number;
}

/**
 * Daily digest report
 */
interface DigestReport {
  date: string;
  timezone: string;
  emailCount: number;
  categorySummary: Record<string, number>;
  prioritySummary: Record<string, number>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topSenders: Array<{
    email: string;
    name?: string;
    emailCount: number;
  }>;
  actionItems: string[];
  emergingTopics: string[];
  summaries: EmailSummary[];
  generatedAt: number;
}

/**
 * Review analysis for external reviews (Google Reviews, etc.)
 */
interface ReviewAnalysis {
  reviewId: string;
  source: 'google-reviews' | 'trustpilot' | 'yelp' | 'custom';
  author: string;
  rating: number;
  content: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  hasResponse: boolean;
  suggestedResponse?: string;
  timestamp: number;
  relevance: number; // 0-1 score
}

/**
 * Classification for emails
 */
interface EmailClassification {
  category: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  requiresResponse: boolean;
  suggestedAction: 'skip' | 'summarize' | 'alert' | 'forward' | 'label';
  confidence: number; // 0-1
}

/**
 * Text Processor for email and review analysis
 */
export class TextProcessor extends EventEmitter {
  private config: TextProcessorConfig;
  private gmailClient: any;
  private openaiApiKey: string;
  private cache: Map<string, any>;

  /**
   * Initialize the Text Processor
   * @param config - Processor configuration
   * @param gmailClient - Gmail API client
   * @param openaiApiKey - OpenAI API key
   */
  constructor(config: TextProcessorConfig, gmailClient: any, openaiApiKey: string) {
    super();
    this.config = config;
    this.gmailClient = gmailClient;
    this.openaiApiKey = openaiApiKey;
    this.cache = new Map();
  }

  /**
   * Fetch emails from Gmail
   * @param query - Gmail query string
   * @param maxResults - Maximum emails to fetch
   * @returns Promise resolving to array of emails
   */
  async fetchEmails(query: string = 'is:unread', maxResults: number = 50): Promise<Email[]> {
    try {
      const response = await this.gmailClient.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: Math.min(maxResults, this.config.maxEmailsPerBatch),
      });

      const messages = response.data.messages || [];
      const emails: Email[] = [];

      for (const message of messages) {
        const email = await this.fetchEmailDetails(message.id);
        if (email) {
          emails.push(email);
        }
      }

      this.emit('emails:fetched', { count: emails.length, query });
      return emails;
    } catch (error) {
      throw new Error(`Failed to fetch emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch detailed email information
   * @param messageId - Message ID
   * @returns Promise resolving to email details
   */
  private async fetchEmailDetails(messageId: string): Promise<Email | null> {
    try {
      const response = await this.gmailClient.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;
      const headers = message.payload.headers;

      const email: Email = {
        id: message.id,
        messageId: this.getHeader(headers, 'Message-ID'),
        from: this.getHeader(headers, 'From'),
        fromName: this.extractName(this.getHeader(headers, 'From')),
        to: [this.getHeader(headers, 'To')],
        subject: this.getHeader(headers, 'Subject'),
        body: this.getEmailBody(message.payload),
        timestamp: parseInt(message.internalDate),
        threadId: message.threadId,
        labels: message.labelIds || [],
        isRead: !message.labelIds?.includes('UNREAD'),
        isSpam: message.labelIds?.includes('SPAM') || false,
        isArchived: !message.labelIds?.includes('INBOX'),
        attachmentCount: this.countAttachments(message.payload),
        wordCount: 0,
      };

      email.wordCount = email.body.split(/\s+/).length;

      return email;
    } catch (error) {
      console.error(`Error fetching email ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Extract name from email address
   * @param emailString - Email string (e.g., "John Doe <john@example.com>")
   * @returns Extracted name or empty string
   */
  private extractName(emailString: string): string {
    const match = /^([^<]+)</.exec(emailString);
    return match ? match[1].trim() : '';
  }

  /**
   * Get header value from email headers
   * @param headers - Email headers array
   * @param headerName - Header name to find
   * @returns Header value or empty string
   */
  private getHeader(headers: any[], headerName: string): string {
    const header = headers.find((h) => h.name === headerName);
    return header ? header.value : '';
  }

  /**
   * Extract email body from payload
   * @param payload - Message payload
   * @returns Email body text
   */
  private getEmailBody(payload: any): string {
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain') {
          return Buffer.from(part.body.data || '', 'base64').toString();
        }
      }
    }

    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }

    return '';
  }

  /**
   * Count attachments in email
   * @param payload - Message payload
   * @returns Number of attachments
   */
  private countAttachments(payload: any): number {
    if (!payload.parts) return 0;

    return payload.parts.filter((part: any) => part.filename && part.filename.length > 0).length;
  }

  /**
   * Classify email based on content
   * @param email - Email to classify
   * @returns Promise resolving to classification
   */
  async classifyEmail(email: Email): Promise<EmailClassification> {
    // Check cache first
    const cacheKey = `classify_${email.id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let priority: 'low' | 'normal' | 'high' | 'critical' = 'normal';
      let category = 'general';
      let requiresResponse = false;

      // Apply priority rules
      if (this.config.priorityRules) {
        for (const rule of this.config.priorityRules) {
          if (this.matchesRule(email, rule)) {
            priority = (rule.priority as any) || 'normal';
            break;
          }
        }
      }

      // Classify by category
      for (const categoryDef of this.config.categories) {
        if (this.matchesCategory(email, categoryDef)) {
          category = categoryDef.name;
          break;
        }
      }

      // Detect if response is needed
      requiresResponse = this.detectResponseNeeded(email);

      const classification: EmailClassification = {
        category,
        priority,
        requiresResponse,
        suggestedAction: this.determineSuggestedAction(category, priority),
        confidence: 0.85,
      };

      this.cache.set(cacheKey, classification);
      return classification;
    } catch (error) {
      throw new Error(`Failed to classify email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if email matches a priority rule
   * @param email - Email to check
   * @param rule - Priority rule
   * @returns True if email matches rule
   */
  private matchesRule(email: Email, rule: any): boolean {
    if (rule.from && email.from.includes(rule.from)) {
      return true;
    }
    if (rule.subject && new RegExp(rule.subject, 'i').test(email.subject)) {
      return true;
    }
    return false;
  }

  /**
   * Check if email matches a category
   * @param email - Email to check
   * @param category - Category definition
   * @returns True if email matches category
   */
  private matchesCategory(email: Email, category: any): boolean {
    const combinedText = `${email.subject} ${email.body}`.toLowerCase();
    return category.keywords.some((keyword: string) => combinedText.includes(keyword.toLowerCase()));
  }

  /**
   * Detect if email requires a response
   * @param email - Email to check
   * @returns True if response is needed
   */
  private detectResponseNeeded(email: Email): boolean {
    const responseKeywords = [
      'pregunta',
      'question',
      'solicitud',
      'request',
      '¿',
      '?',
      'responde',
      'please reply',
      'feedback',
      'opinion',
    ];

    const combinedText = `${email.subject} ${email.body}`.toLowerCase();
    return responseKeywords.some((keyword) => combinedText.includes(keyword));
  }

  /**
   * Determine suggested action based on classification
   * @param category - Email category
   * @param priority - Email priority
   * @returns Suggested action
   */
  private determineSuggestedAction(category: string, priority: string): 'skip' | 'summarize' | 'alert' | 'forward' | 'label' {
    if (priority === 'critical') {
      return 'alert';
    }
    if (priority === 'high') {
      return 'summarize';
    }
    return 'label';
  }

  /**
   * Generate summary of email content
   * @param email - Email to summarize
   * @param format - Summary format
   * @returns Promise resolving to email summary
   */
  async generateSummary(email: Email, format?: string): Promise<EmailSummary> {
    const summaryFormat = format || this.config.summaryFormat;
    const classification = await this.classifyEmail(email);

    try {
      // Use OpenAI to generate summary
      const summaryText = await this.callOpenAI(
        this.generateSummaryPrompt(email, summaryFormat),
        this.config.summaryLength || 'medium'
      );

      const keyPoints = await this.extractKeyPoints(email.body);
      const actionItems = await this.extractActionItems(email.body);

      const summary: EmailSummary = {
        emailId: email.id,
        subject: email.subject,
        from: email.from,
        summary: summaryText,
        keyPoints,
        actionItems,
        sentiment: await this.analyzeSentiment(email.body),
        category: classification.category,
        priority: classification.priority,
        requiresResponse: classification.requiresResponse,
        timestamp: Date.now(),
      };

      if (summary.requiresResponse) {
        summary.suggestedResponse = await this.generateSuggestedResponse(email);
      }

      this.emit('summary:generated', { emailId: email.id, summaryLength: summary.summary.length });
      return summary;
    } catch (error) {
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate summary prompt for OpenAI
   * @param email - Email to summarize
   * @param format - Desired format
   * @returns Prompt string
   */
  private generateSummaryPrompt(email: Email, format: string): string {
    const formatInstructions: Record<string, string> = {
      'bullet-points': 'Proporciona un resumen en forma de puntos clave (máximo 5)',
      'paragraph': 'Proporciona un resumen en un párrafo conciso',
      'executive-summary': 'Proporciona un resumen ejecutivo con conclusión y acción recomendada',
      'markdown': 'Proporciona el resumen en formato Markdown con secciones claras',
      'structured-json': 'Proporciona el resumen como JSON estructurado',
    };

    return `
Asunto: ${email.subject}
De: ${email.from}

${email.body}

---

${formatInstructions[format] || 'Proporciona un resumen breve'}
Responde en ${this.config.summaryLanguage || 'es'}
    `.trim();
  }

  /**
   * Call OpenAI API for text generation
   * @param prompt - Prompt text
   * @param length - Response length hint
   * @returns Promise resolving to generated text
   */
  private async callOpenAI(prompt: string, length: string = 'medium'): Promise<string> {
    try {
      const maxTokens = length === 'brief' ? 100 : length === 'comprehensive' ? 500 : 250;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente experto en resumir y analizar emails de negocio.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`OpenAI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract key points from text
   * @param text - Text to analyze
   * @returns Promise resolving to array of key points
   */
  private async extractKeyPoints(text: string): Promise<string[]> {
    const prompt = `Extrae máximo 3 puntos clave de este texto:\n\n${text}`;

    try {
      const response = await this.callOpenAI(prompt, 'brief');
      return response
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .slice(0, 3);
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract action items from text
   * @param text - Text to analyze
   * @returns Promise resolving to array of action items
   */
  private async extractActionItems(text: string): Promise<string[]> {
    const prompt = `Extrae los items de acción necesarios de este texto (máximo 5):\n\n${text}`;

    try {
      const response = await this.callOpenAI(prompt, 'brief');
      return response
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .slice(0, 5);
    } catch (error) {
      return [];
    }
  }

  /**
   * Analyze sentiment of text
   * @param text - Text to analyze
   * @returns Promise resolving to sentiment
   */
  private async analyzeSentiment(text: string): Promise<'positive' | 'neutral' | 'negative'> {
    const prompt = `Analiza el sentimiento de este texto y responde solo con: positive, neutral o negative\n\n${text.substring(0, 500)}`;

    try {
      const response = await this.callOpenAI(prompt, 'brief');
      const sentiment = response.toLowerCase().trim();

      if (sentiment.includes('positive')) return 'positive';
      if (sentiment.includes('negative')) return 'negative';
      return 'neutral';
    } catch (error) {
      return 'neutral';
    }
  }

  /**
   * Generate suggested response
   * @param email - Original email
   * @returns Promise resolving to suggested response
   */
  private async generateSuggestedResponse(email: Email): Promise<string> {
    const prompt = `Basándote en este email, genera una respuesta profesional y breve:\n\nDe: ${email.from}\nAsunto: ${email.subject}\n\n${email.body}`;

    try {
      return await this.callOpenAI(prompt, 'brief');
    } catch (error) {
      return '';
    }
  }

  /**
   * Generate daily digest report
   * @param emails - Emails to include
   * @returns Promise resolving to digest report
   */
  async generateDailyDigest(emails: Email[]): Promise<DigestReport> {
    const summaries: EmailSummary[] = [];
    const topSenders: Map<string, number> = new Map();
    const categories: Record<string, number> = {};
    const priorities: Record<string, number> = {};
    const sentiments = { positive: 0, neutral: 0, negative: 0 };

    // Process all emails
    for (const email of emails) {
      const summary = await this.generateSummary(email);
      summaries.push(summary);

      // Track senders
      const senderKey = email.fromName || email.from;
      topSenders.set(senderKey, (topSenders.get(senderKey) || 0) + 1);

      // Track categories and priorities
      categories[summary.category] = (categories[summary.category] || 0) + 1;
      priorities[summary.priority] = (priorities[summary.priority] || 0) + 1;
      sentiments[summary.sentiment]++;
    }

    // Extract action items
    const actionItems = summaries
      .flatMap((s) => s.actionItems)
      .filter((item, idx, arr) => arr.indexOf(item) === idx) // deduplicate
      .slice(0, 10);

    // Extract emerging topics
    const emergingTopics = await this.extractEmergingTopics(emails);

    const report: DigestReport = {
      date: new Date().toISOString().split('T')[0],
      timezone: this.config.timezone || 'UTC',
      emailCount: emails.length,
      categorySummary: categories,
      prioritySummary: priorities,
      sentimentAnalysis: sentiments,
      topSenders: Array.from(topSenders.entries())
        .map(([email, count]) => ({ email, emailCount: count }))
        .sort((a, b) => b.emailCount - a.emailCount)
        .slice(0, 5),
      actionItems,
      emergingTopics,
      summaries: summaries.slice(0, 20), // Include top 20 summaries
      generatedAt: Date.now(),
    };

    this.emit('digest:generated', { emailCount: emails.length, date: report.date });
    return report;
  }

  /**
   * Extract emerging topics from emails
   * @param emails - Emails to analyze
   * @returns Promise resolving to topic list
   */
  private async extractEmergingTopics(emails: Email[]): Promise<string[]> {
    const combinedText = emails.map((e) => `${e.subject} ${e.body}`).join('\n\n');
    const prompt = `Identifica los 3-5 temas principales o tendencias emergentes en estos emails:\n\n${combinedText.substring(0, 2000)}`;

    try {
      const response = await this.callOpenAI(prompt, 'brief');
      return response.split('\n').filter((line) => line.trim().length > 0);
    } catch (error) {
      return [];
    }
  }

  /**
   * Process reviews from external sources
   * @param reviews - Review data to process
   * @returns Promise resolving to analysis array
   */
  async processReviews(reviews: Array<{ source: string; rating: number; content: string; author: string }>): Promise<ReviewAnalysis[]> {
    const analyses: ReviewAnalysis[] = [];

    for (const review of reviews) {
      const sentiment = await this.analyzeSentiment(review.content);
      const keywords = await this.extractKeywordsFromText(review.content);

      const analysis: ReviewAnalysis = {
        reviewId: `${review.source}-${Date.now()}`,
        source: (review.source as any) || 'custom',
        author: review.author,
        rating: review.rating,
        content: review.content,
        summary: await this.callOpenAI(
          `Resume brevemente esta reseña: ${review.content}`,
          'brief'
        ),
        sentiment,
        keywords,
        hasResponse: false,
        timestamp: Date.now(),
        relevance: this.calculateRelevance(review.rating, sentiment),
      };

      if (review.rating <= 3 || sentiment === 'negative') {
        analysis.suggestedResponse = await this.generateReviewResponse(analysis);
      }

      analyses.push(analysis);
    }

    this.emit('reviews:processed', { count: analyses.length });
    return analyses;
  }

  /**
   * Extract keywords from text
   * @param text - Text to analyze
   * @returns Promise resolving to keyword list
   */
  private async extractKeywordsFromText(text: string): Promise<string[]> {
    const prompt = `Extrae 5 palabras clave principales de este texto: ${text.substring(0, 300)}`;

    try {
      const response = await this.callOpenAI(prompt, 'brief');
      return response.split(',').map((k) => k.trim());
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate relevance score
   * @param rating - Review rating
   * @param sentiment - Review sentiment
   * @returns Relevance score 0-1
   */
  private calculateRelevance(rating: number, sentiment: string): number {
    let score = 0.5;

    if (rating <= 2) score += 0.3;
    if (rating >= 4) score -= 0.1;

    if (sentiment === 'negative') score += 0.25;
    if (sentiment === 'positive') score -= 0.1;

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Generate response to review
   * @param analysis - Review analysis
   * @returns Promise resolving to response text
   */
  private async generateReviewResponse(analysis: ReviewAnalysis): Promise<string> {
    const prompt = `Genera una respuesta profesional y empática a esta reseña:

Autor: ${analysis.author}
Rating: ${analysis.rating}/5
Contenido: ${analysis.content}

La respuesta debe ser breve y constructiva.`;

    try {
      return await this.callOpenAI(prompt, 'brief');
    } catch (error) {
      return '';
    }
  }
}

/**
 * Text Processor configuration interface
 */
interface TextProcessorConfig {
  summaryLanguage: string;
  maxEmailsPerBatch: number;
  summaryFormat: string;
  summaryLength?: string;
  categories: Array<{
    name: string;
    keywords: string[];
    priority: number;
  }>;
  priorityRules?: Array<{
    from?: string;
    subject?: string;
    priority?: string;
    action?: string;
  }>;
  timezone?: string;
  autoReplyEnabled?: boolean;
}

export { Email, EmailSummary, DigestReport, ReviewAnalysis, TextProcessorConfig };
