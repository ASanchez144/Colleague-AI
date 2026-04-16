/**
 * Voice Agent for Tu Socia!
 * Handles automated phone calls with Retell AI integration
 * Manages call flows, transcription, and human transfer
 */

import { EventEmitter } from 'events';

/**
 * Represents a single entry in the call transcript
 */
interface TranscriptEntry {
  timestamp: number;
  speaker: 'agent' | 'user';
  text: string;
  confidence?: number;
  duration?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

/**
 * Configuration for a call session
 */
interface CallConfig {
  language: string;
  voiceId: string;
  maxCallDuration: number;
  greeting: string;
  transferNumber: string;
  recordCalls: boolean;
  enableTranscription: boolean;
  timezone: string;
  retryAttempts: number;
  webhookTimeout: number;
  callScript?: CallScript;
  transferRules?: TransferRule[];
  businessHours?: BusinessHours;
}

/**
 * Call script with multiple conversation paths
 */
interface CallScript {
  mainMenu: string;
  appointmentBooking: string;
  billingInquiry: string;
  technicalSupport: string;
  [key: string]: string;
}

/**
 * Rule for determining when to transfer calls
 */
interface TransferRule {
  trigger: string;
  department: string;
  priority: number;
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'matches';
    value: string;
  }>;
}

/**
 * Business hours configuration
 */
interface BusinessHours {
  [day: string]: {
    start: string;
    end: string;
  };
}

/**
 * Active call session tracking
 */
interface CallSession {
  callId: string;
  fromNumber: string;
  toNumber: string;
  startTime: number;
  endTime?: number;
  status: 'ringing' | 'active' | 'on-hold' | 'transferred' | 'ended';
  transcript: TranscriptEntry[];
  customData?: Record<string, any>;
  transferredTo?: string;
  transferredAt?: number;
  reason?: string;
}

/**
 * Voice Agent class for handling automated phone calls
 * Integrates with Retell AI and Twilio for call management
 */
export class VoiceAgent extends EventEmitter {
  private config: CallConfig;
  private retellApiKey: string;
  private twilio: any;
  private activeCalls: Map<string, CallSession>;
  private callScriptEngine: CallScriptEngine;

  /**
   * Initialize the Voice Agent
   * @param config - Agent configuration
   * @param retellApiKey - Retell AI API key
   * @param twilioClient - Twilio client instance
   */
  constructor(config: CallConfig, retellApiKey: string, twilioClient: any) {
    super();
    this.config = config;
    this.retellApiKey = retellApiKey;
    this.twilio = twilioClient;
    this.activeCalls = new Map();
    this.callScriptEngine = new CallScriptEngine(config.callScript || {});

    this.setupEventListeners();
  }

  /**
   * Setup internal event listeners
   */
  private setupEventListeners(): void {
    this.on('call:ended', (callId: string) => {
      this.activeCalls.delete(callId);
    });
  }

  /**
   * Handle incoming call from Twilio/Retell
   * @param callData - Incoming call data
   * @returns Promise resolving to the call session
   */
  async handleIncomingCall(callData: {
    callId: string;
    fromNumber: string;
    toNumber: string;
  }): Promise<CallSession> {
    const callSession: CallSession = {
      callId: callData.callId,
      fromNumber: callData.fromNumber,
      toNumber: callData.toNumber,
      startTime: Date.now(),
      status: 'ringing',
      transcript: [],
    };

    this.activeCalls.set(callData.callId, callSession);

    try {
      // Initiate Retell AI call
      await this.initializeRetellCall(callData.callId);

      callSession.status = 'active';

      // Play greeting message
      const greeting = this.interpolateConfig(this.config.greeting);
      await this.playAudio(callData.callId, greeting);

      // Log transcript entry
      this.addTranscriptEntry(callData.callId, {
        timestamp: Date.now(),
        speaker: 'agent',
        text: greeting,
      });

      this.emit('call:started', callSession);

      return callSession;
    } catch (error) {
      callSession.status = 'ended';
      this.emit('call:error', {
        callId: callData.callId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Initialize a call with Retell AI
   * @param callId - Call ID
   */
  private async initializeRetellCall(callId: string): Promise<void> {
    try {
      const response = await fetch('https://api.retellai.com/v2/calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.retellApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId,
          agentId: process.env.RETELL_AGENT_ID,
          retryNum: this.config.retryAttempts,
          metadata: {
            language: this.config.language,
            timezone: this.config.timezone,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Retell API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Failed to initialize Retell call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Play audio to the caller
   * @param callId - Call ID
   * @param text - Text to speak
   */
  private async playAudio(callId: string, text: string): Promise<void> {
    // Implementation would use Google Cloud Text-to-Speech or similar
    // This is a placeholder for the actual audio playback logic
    console.log(`[Audio] Call ${callId}: ${text}`);
  }

  /**
   * Process incoming transcript from speech recognition
   * @param callId - Call ID
   * @param transcript - User speech transcript
   * @returns Promise resolving to agent response
   */
  async processTranscript(callId: string, transcript: string): Promise<string> {
    const callSession = this.activeCalls.get(callId);
    if (!callSession) {
      throw new Error(`Call session ${callId} not found`);
    }

    // Add user transcript entry
    this.addTranscriptEntry(callId, {
      timestamp: Date.now(),
      speaker: 'user',
      text: transcript,
    });

    try {
      // Determine intent and next step
      const intent = await this.detectIntent(transcript);
      const response = await this.generateResponse(intent, callSession);

      // Add agent response to transcript
      this.addTranscriptEntry(callId, {
        timestamp: Date.now(),
        speaker: 'agent',
        text: response,
      });

      this.emit('transcript:processed', {
        callId,
        userInput: transcript,
        intent,
        response,
      });

      return response;
    } catch (error) {
      const errorResponse = 'Lo siento, no entendí bien. ¿Puedes repetir?';
      this.addTranscriptEntry(callId, {
        timestamp: Date.now(),
        speaker: 'agent',
        text: errorResponse,
      });
      throw error;
    }
  }

  /**
   * Detect intent from user input
   * @param transcript - User speech
   * @returns Promise resolving to detected intent
   */
  private async detectIntent(transcript: string): Promise<string> {
    // Placeholder for AI-based intent detection
    // Would integrate with OpenAI, Azure Language Understanding, or similar
    const keywords = {
      'cita|reserva|agendar|programar': 'appointment_booking',
      'factura|pago|billing|costo|precio': 'billing_inquiry',
      'técnico|soporte|problema|error|no funciona': 'technical_support',
      'ayuda|información|datos|detalles': 'general_inquiry',
    };

    for (const [pattern, intent] of Object.entries(keywords)) {
      if (new RegExp(pattern, 'i').test(transcript)) {
        return intent;
      }
    }

    return 'general_inquiry';
  }

  /**
   * Generate response based on detected intent
   * @param intent - Detected user intent
   * @param callSession - Current call session
   * @returns Promise resolving to response text
   */
  private async generateResponse(intent: string, callSession: CallSession): Promise<string> {
    const scriptResponse = this.callScriptEngine.getResponse(intent);

    if (!scriptResponse) {
      return '¿Cómo más puedo ayudarte?';
    }

    // Check if transfer is needed
    if (this.shouldTransfer(intent, callSession)) {
      return 'Déjame transferirte con un agente especializado. Un momento, por favor.';
    }

    return scriptResponse;
  }

  /**
   * Determine if call should be transferred to human
   * @param intent - Current intent
   * @param callSession - Call session
   * @returns Boolean indicating if transfer is needed
   */
  private shouldTransfer(intent: string, callSession: CallSession): boolean {
    if (!this.config.transferRules) {
      return false;
    }

    return this.config.transferRules.some((rule) => {
      return rule.trigger === intent || rule.trigger.includes(intent);
    });
  }

  /**
   * Transfer call to human agent
   * @param callId - Call ID
   * @param department - Target department
   * @returns Promise resolving when transfer is initiated
   */
  async transferToHuman(callId: string, department?: string): Promise<void> {
    const callSession = this.activeCalls.get(callId);
    if (!callSession) {
      throw new Error(`Call session ${callId} not found`);
    }

    const transferNumber = department
      ? this.getTransferNumberForDepartment(department)
      : this.config.transferNumber;

    try {
      // Initiate transfer via Twilio
      await this.twilio.calls(callId).update({
        twiml: `
          <Response>
            <Dial timeout="30">
              <Number>${transferNumber}</Number>
            </Dial>
          </Response>
        `,
      });

      callSession.status = 'transferred';
      callSession.transferredTo = transferNumber;
      callSession.transferredAt = Date.now();

      this.addTranscriptEntry(callId, {
        timestamp: Date.now(),
        speaker: 'agent',
        text: `[TRANSFERRED to ${department || 'human agent'}]`,
      });

      this.emit('call:transferred', {
        callId,
        department: department || 'support',
        transferNumber,
      });
    } catch (error) {
      throw new Error(`Failed to transfer call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transfer number for specific department
   * @param department - Department name
   * @returns Transfer phone number
   */
  private getTransferNumberForDepartment(department: string): string {
    const departmentNumbers: Record<string, string> = {
      'support': this.config.transferNumber,
      'billing': process.env.BILLING_TRANSFER_NUMBER || this.config.transferNumber,
      'sales': process.env.SALES_TRANSFER_NUMBER || this.config.transferNumber,
    };

    return departmentNumbers[department] || this.config.transferNumber;
  }

  /**
   * End the call
   * @param callId - Call ID
   * @param reason - Reason for ending call
   */
  async endCall(callId: string, reason?: string): Promise<CallSession | null> {
    const callSession = this.activeCalls.get(callId);
    if (!callSession) {
      return null;
    }

    callSession.status = 'ended';
    callSession.endTime = Date.now();
    callSession.reason = reason;

    try {
      // Hangup via Twilio
      await this.twilio.calls(callId).update({
        status: 'completed',
      });

      // Store call recording if enabled
      if (this.config.recordCalls) {
        await this.storeCallRecording(callId, callSession);
      }

      this.emit('call:ended', callId);

      return callSession;
    } catch (error) {
      console.error(`Error ending call ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Store call recording and metadata
   * @param callId - Call ID
   * @param session - Call session
   */
  private async storeCallRecording(callId: string, session: CallSession): Promise<void> {
    // Placeholder for storing recordings and metadata
    const metadata = {
      callId,
      duration: (session.endTime || 0) - session.startTime,
      from: session.fromNumber,
      to: session.toNumber,
      transcriptLength: session.transcript.length,
      timestamp: new Date(session.startTime).toISOString(),
    };

    console.log(`[Recording] Storing call metadata:`, metadata);
  }

  /**
   * Add entry to call transcript
   * @param callId - Call ID
   * @param entry - Transcript entry
   */
  private addTranscriptEntry(callId: string, entry: Omit<TranscriptEntry, 'timestamp'>): void {
    const callSession = this.activeCalls.get(callId);
    if (callSession) {
      callSession.transcript.push({
        timestamp: Date.now(),
        ...entry,
      });
    }
  }

  /**
   * Interpolate config values with template variables
   * @param text - Text containing {{variable}} placeholders
   * @returns Interpolated text
   */
  private interpolateConfig(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return process.env[variable.toUpperCase()] || match;
    });
  }

  /**
   * Get call session details
   * @param callId - Call ID
   * @returns Call session or undefined
   */
  getCallSession(callId: string): CallSession | undefined {
    return this.activeCalls.get(callId);
  }

  /**
   * Get all active calls
   * @returns Array of active call sessions
   */
  getActiveCalls(): CallSession[] {
    return Array.from(this.activeCalls.values()).filter(
      (call) => call.status !== 'ended'
    );
  }
}

/**
 * Call Script Engine for managing conversation flows
 */
class CallScriptEngine {
  private scripts: CallScript;

  /**
   * Initialize the script engine
   * @param scripts - Call scripts by intent
   */
  constructor(scripts: CallScript) {
    this.scripts = scripts;
  }

  /**
   * Get response for intent
   * @param intent - Intent name
   * @returns Response text
   */
  getResponse(intent: string): string | undefined {
    return this.scripts[intent];
  }

  /**
   * Add or update script
   * @param intent - Intent name
   * @param script - Script text
   */
  setScript(intent: string, script: string): void {
    this.scripts[intent] = script;
  }
}

/**
 * Webhook handler for Retell/Twilio callbacks
 */
export async function handleRetellWebhook(req: any): Promise<any> {
  const event = req.body;

  switch (event.type) {
    case 'call.started':
      console.log(`Call started: ${event.callId}`);
      return { status: 'ok' };

    case 'call.ended':
      console.log(`Call ended: ${event.callId}`);
      return { status: 'ok' };

    case 'transcript.updated':
      console.log(`Transcript updated for call ${event.callId}`);
      return { status: 'ok' };

    case 'transfer.completed':
      console.log(`Transfer completed for call ${event.callId}`);
      return { status: 'ok' };

    default:
      console.warn(`Unknown webhook event type: ${event.type}`);
      return { status: 'ok' };
  }
}

/**
 * Webhook handler for Twilio status callbacks
 */
export async function handleTwilioStatusCallback(req: any): Promise<any> {
  const callStatus = req.body.CallStatus;
  const callSid = req.body.CallSid;

  console.log(`Twilio status update - Call ${callSid}: ${callStatus}`);

  return { status: 'ok' };
}

export { CallSession, CallConfig, TranscriptEntry };
