export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  details?: any;
  source?: string;
}

export interface LogFilter {
  levels?: LogLevel[];
  categories?: string[];
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
}

// Browser-compatible EventEmitter alternative
class SimpleEventEmitter {
  private events: Map<string, Set<(...args: any[]) => void>> = new Map();

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
}

class RealtimeLogService extends SimpleEventEmitter {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private filters: LogFilter = {};
  private isConnected = false;
  private subscribers: Set<(logs: LogEntry[]) => void> = new Set();

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
    // Set up event listeners for various services
    this.setupServiceListeners();
  }

  private setupServiceListeners() {
    // Listen to global events and convert them to logs
    if (typeof window !== 'undefined') {
      // Intercept console methods
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
      };

      // Only intercept voice-CRM related logs
      console.log = (...args) => {
        originalConsole.log(...args);
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : arg
        ).join(' ');
        
        if (this.isVoiceCRMRelated(message)) {
          this.addLog('INFO', 'System', message);
        }
      };

      console.error = (...args) => {
        originalConsole.error(...args);
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : arg
        ).join(' ');
        
        if (this.isVoiceCRMRelated(message)) {
          this.addLog('ERROR', 'System', message);
        }
      };

      console.warn = (...args) => {
        originalConsole.warn(...args);
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : arg
        ).join(' ');
        
        if (this.isVoiceCRMRelated(message)) {
          this.addLog('WARN', 'System', message);
        }
      };
    }
  }

  private isVoiceCRMRelated(message: string): boolean {
    const keywords = [
      'voice', 'transcription', 'telegram', 'bot', 'decision', 
      'crm', 'ai', 'processing', 'communication', 'workflow',
      'openai', 'whisper', 'speech', 'audio'
    ];
    
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
  }

  public addLog(
    level: LogLevel,
    category: string,
    message: string,
    details?: any,
    source?: string
  ): void {
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      source,
    };

    // Add to logs array
    this.logs.unshift(logEntry);

    // Maintain max log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Emit event for real-time updates
    this.emit('log', logEntry);

    // Notify all subscribers
    this.notifySubscribers();
  }

  public subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.subscribers.add(callback);
    // Send current logs immediately
    callback(this.getFilteredLogs());
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    const filteredLogs = this.getFilteredLogs();
    this.subscribers.forEach(callback => callback(filteredLogs));
  }

  public setFilters(filters: LogFilter): void {
    this.filters = filters;
    this.notifySubscribers();
  }

  public getFilteredLogs(): LogEntry[] {
    let filtered = [...this.logs];

    // Apply level filter
    if (this.filters.levels && this.filters.levels.length > 0) {
      filtered = filtered.filter(log => 
        this.filters.levels!.includes(log.level)
      );
    }

    // Apply category filter
    if (this.filters.categories && this.filters.categories.length > 0) {
      filtered = filtered.filter(log => 
        this.filters.categories!.includes(log.category)
      );
    }

    // Apply search filter
    if (this.filters.searchTerm) {
      const searchLower = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.category.toLowerCase().includes(searchLower) ||
        (log.source && log.source.toLowerCase().includes(searchLower))
      );
    }

    // Apply date filter
    if (this.filters.startDate) {
      filtered = filtered.filter(log => 
        log.timestamp >= this.filters.startDate!
      );
    }

    if (this.filters.endDate) {
      filtered = filtered.filter(log => 
        log.timestamp <= this.filters.endDate!
      );
    }

    return filtered;
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.notifySubscribers();
  }

  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getFilteredLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV format
      const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Source'];
      const rows = logs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        log.category,
        `"${log.message.replace(/"/g, '""')}"`,
        log.source || '',
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
  }

  // Specific logging methods for Voice-CRM operations
  public logVoiceReceived(source: string, duration?: number): void {
    this.addLog('INFO', 'Voice Processing', 
      `Voice message received from ${source}${duration ? ` (${duration}s)` : ''}`,
      { source, duration },
      'Telegram'
    );
  }

  public logTranscriptionStart(method: 'web-speech' | 'openai'): void {
    this.addLog('INFO', 'Transcription', 
      `Starting transcription using ${method === 'web-speech' ? 'Web Speech API (FREE)' : 'OpenAI Whisper'}`,
      { method },
      'Transcription Service'
    );
  }

  public logTranscriptionComplete(text: string, duration: number): void {
    this.addLog('SUCCESS', 'Transcription', 
      `Transcription completed in ${duration}ms: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`,
      { text, duration },
      'Transcription Service'
    );
  }

  public logAIDecision(decision: any): void {
    this.addLog('INFO', 'AI Decision', 
      `Generated decision: ${decision.decision_type} with ${Math.round(decision.confidence_score * 100)}% confidence`,
      decision,
      'AI Decision Engine'
    );
  }

  public logCRMAction(action: string, details: any): void {
    this.addLog('SUCCESS', 'CRM Action', 
      `CRM action executed: ${action}`,
      details,
      'CRM Service'
    );
  }

  public logError(category: string, error: any, source?: string): void {
    this.addLog('ERROR', category, 
      error.message || 'Unknown error occurred',
      { error: error.stack || error },
      source
    );
  }

  public logWarning(category: string, message: string, details?: any): void {
    this.addLog('WARN', category, message, details);
  }

  public logDebug(category: string, message: string, details?: any): void {
    this.addLog('DEBUG', category, message, details);
  }
}

// Export singleton instance
export const realtimeLogService = new RealtimeLogService();