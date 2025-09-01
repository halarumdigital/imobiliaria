interface EvolutionApiConfig {
  baseURL: string;
  token: string;
}

interface CreateInstanceRequest {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  number?: string;
  integration?: string;
}

interface InstanceStatus {
  instance: {
    instanceName: string;
    status: string;
  };
}

interface QRCodeResponse {
  qrcode: {
    code: string;
    base64: string;
  };
}

export class EvolutionApiService {
  private config: EvolutionApiConfig;

  constructor(config: EvolutionApiConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    console.log(`🔗 Evolution API Request: ${method} ${url}`);
    console.log(`🔑 API Key: ${this.config.token?.substring(0, 10)}...`);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.token,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ Evolution API Error Response:`, errorBody);
      throw new Error(`Evolution API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const result = await response.json();
    console.log(`✅ Evolution API Success:`, JSON.stringify(result, null, 2));
    return result;
  }

  async createInstance(request: CreateInstanceRequest): Promise<any> {
    // Payload simples baseado na documentação da Evolution API
    const instanceData = {
      instanceName: request.instanceName,
      integration: "WHATSAPP-BAILEYS" // Para WhatsApp Web com QR Code
    };
    
    console.log("Creating instance with data:", JSON.stringify(instanceData, null, 2));
    return this.makeRequest('/instance/create', 'POST', instanceData);
  }

  async getInstanceStatus(instanceName: string): Promise<InstanceStatus> {
    return this.makeRequest(`/instance/connectionState/${instanceName}`);
  }

  async generateQRCode(instanceName: string): Promise<QRCodeResponse> {
    // Use the correct endpoint that generates AND returns QR code
    return this.makeRequest(`/instance/connect/${instanceName}`);
  }

  async deleteInstance(instanceName: string): Promise<any> {
    return this.makeRequest(`/instance/delete/${instanceName}`, 'DELETE');
  }

  async disconnectInstance(instanceName: string): Promise<any> {
    return this.makeRequest(`/instance/logout/${instanceName}`, 'DELETE');
  }

  async listInstances(): Promise<any> {
    return this.makeRequest(`/instance/fetchInstances`);
  }

  async connectInstance(instanceName: string): Promise<any> {
    return this.makeRequest(`/instance/connect/${instanceName}`);
  }

  async sendMessage(instanceName: string, number: string, message: string): Promise<any> {
    console.log(`🎯 EvolutionApiService.sendMessage called with instance: ${instanceName}, number: ${number}`);
    return this.makeRequest(`/message/sendText/${instanceName}`, 'POST', {
      number,
      text: message  // Evolution API expects simple format with "text" field
    });
  }

  async sendMedia(instanceName: string, number: string, mediaData: {
    mediaBase64: string;
    fileName: string;
    mediaType: 'image' | 'audio' | 'video';
    caption?: string;
  }): Promise<any> {
    console.log(`🎯 EvolutionApiService.sendMedia called with instance: ${instanceName}, number: ${number}, type: ${mediaData.mediaType}`);
    
    // Determinar o endpoint baseado no tipo de mídia
    const endpoints = {
      image: `/message/sendMedia/${instanceName}`,
      audio: `/message/sendMedia/${instanceName}`,
      video: `/message/sendMedia/${instanceName}`
    };

    // Determinar o MIME type baseado na extensão do arquivo
    const mimeTypes = {
      image: this.getMimeTypeFromFileName(mediaData.fileName, 'image'),
      audio: this.getMimeTypeFromFileName(mediaData.fileName, 'audio'),
      video: this.getMimeTypeFromFileName(mediaData.fileName, 'video')
    };

    const payload = {
      number,
      media: mediaData.mediaBase64,
      fileName: mediaData.fileName,
      caption: mediaData.caption || '',
      mediatype: mediaData.mediaType,
      mimetype: mimeTypes[mediaData.mediaType]
    };

    console.log(`📁 Media payload:`, {
      number,
      fileName: mediaData.fileName,
      mediatype: mediaData.mediaType,
      mimetype: mimeTypes[mediaData.mediaType],
      caption: mediaData.caption || '',
      mediaSize: `${Math.round(mediaData.mediaBase64.length * 0.75 / 1024)} KB` // Aproximação do tamanho
    });

    return this.makeRequest(endpoints[mediaData.mediaType], 'POST', payload);
  }

  private getMimeTypeFromFileName(fileName: string, mediaType: 'image' | 'audio' | 'video'): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const mimeTypeMap: Record<string, string> = {
      // Image types
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      
      // Audio types
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      'flac': 'audio/flac',
      
      // Video types
      'mp4': 'video/mp4',
      'avi': 'video/avi',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska'
    };

    const mimeType = mimeTypeMap[extension];
    if (mimeType) {
      return mimeType;
    }

    // Fallback para tipos padrão se extensão não for reconhecida
    const fallbacks = {
      image: 'image/jpeg',
      audio: 'audio/mpeg',
      video: 'video/mp4'
    };

    return fallbacks[mediaType];
  }

  async getMessages(instanceName: string): Promise<any> {
    return this.makeRequest(`/chat/findMessages/${instanceName}`);
  }

  async setSettings(instanceName: string, settings: any): Promise<any> {
    return this.makeRequest(`/settings/set/${instanceName}`, 'POST', settings);
  }

  async setWebhook(instanceName: string, webhook: any): Promise<any> {
    return this.makeRequest(`/webhook/set/${instanceName}`, 'POST', webhook);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/instance/fetchInstances');
      return true;
    } catch (error) {
      return false;
    }
  }
}
