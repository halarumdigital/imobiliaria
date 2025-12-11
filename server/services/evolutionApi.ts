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
    const apiCallId = Math.random().toString(36).substr(2, 9);
    console.log(`🎯 [API-${apiCallId}] EvolutionApiService.sendMessage called`);
    console.log(`🎯 [API-${apiCallId}] Instance: ${instanceName}`);
    console.log(`🎯 [API-${apiCallId}] Number: ${number}`);
    console.log(`🎯 [API-${apiCallId}] Message length: ${message.length}`);

    const payload = {
      number,
      text: message
    };

    console.log(`📡 [API-${apiCallId}] Making request to: /message/sendText/${instanceName}`);
    console.log(`📡 [API-${apiCallId}] Payload:`, JSON.stringify(payload, null, 2));

    try {
      const result = await this.makeRequest(`/message/sendText/${instanceName}`, 'POST', payload);
      console.log(`✅ [API-${apiCallId}] Evolution API response:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error(`❌ [API-${apiCallId}] Evolution API error:`, error);
      throw error;
    }
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
    return this.makeRequest(`/chat/findMessages/${instanceName}`, 'POST', {
      where: {}
    });
  }

  async getChats(instanceName: string): Promise<any> {
    console.log(`🔍 [Evolution API] Calling findChats for instance: ${instanceName}`);
    try {
      // Try POST with empty where clause first (as per Evolution API v2 docs)
      console.log(`📞 Trying POST request to /chat/findChats/${instanceName}`);
      let result = await this.makeRequest(`/chat/findChats/${instanceName}`, 'POST', {
        where: {}
      });
      return result;
    } catch (postError) {
      console.log(`⚠️ POST request failed, trying GET request`);
      try {
        // Fallback to GET request if POST fails
        let result = await this.makeRequest(`/chat/findChats/${instanceName}`, 'GET');
        return result;
      } catch (getError) {
        console.error(`❌ [Evolution API] Both POST and GET findChats failed`);
        throw getError;
      }
    }
  }

  async getChatMessages(instanceName: string, remoteJid?: string): Promise<any> {
    console.log(`🔍 [Evolution API] Calling findMessages for instance: ${instanceName}, remoteJid: ${remoteJid}`);
    try {
      const endpoint = `/chat/findMessages/${instanceName}`;
      
      // Ensure remoteJid has the correct format
      let formattedJid = remoteJid;
      if (remoteJid && !remoteJid.includes('@')) {
        // Add @s.whatsapp.net if it's missing
        formattedJid = `${remoteJid}@s.whatsapp.net`;
        console.log(`📱 [Evolution API] Formatted remoteJid: ${formattedJid}`);
      }
      
      // Try different where clause structures based on Evolution API v2 docs
      const payload = formattedJid ? {
        where: {
          key: {
            remoteJid: formattedJid
          }
        },
        limit: 50 // Add limit to get more messages
      } : {
        where: {},
        limit: 50
      };
      
      console.log(`📤 [Evolution API] Sending payload:`, JSON.stringify(payload, null, 2));
      
      const result = await this.makeRequest(endpoint, 'POST', payload);
      
      console.log(`📥 [Evolution API] Received ${Array.isArray(result) ? result.length : 'non-array'} messages`);
      if (!Array.isArray(result) && result) {
        console.log(`📥 [Evolution API] Response structure:`, Object.keys(result));
      }
      
      return result;
    } catch (error) {
      console.error(`❌ [Evolution API] findMessages failed:`, error);
      
      // Try alternative approach with just remoteJid in where clause
      if (formattedJid) {
        console.log(`🔄 [Evolution API] Trying alternative where clause structure`);
        try {
          const altPayload = {
            where: {
              remoteJid: formattedJid
            },
            limit: 50
          };
          console.log(`📤 [Evolution API] Alternative payload:`, JSON.stringify(altPayload, null, 2));
          const altResult = await this.makeRequest(endpoint, 'POST', altPayload);
          return altResult;
        } catch (altError) {
          console.error(`❌ [Evolution API] Alternative approach also failed:`, altError);
        }
      }
      
      throw error;
    }
  }

  // Alternative method to get all messages (which might include chat info)
  async getAllMessages(instanceName: string): Promise<any> {
    console.log(`🔍 [Evolution API] Calling getAllMessages for instance: ${instanceName}`);
    // POST request with empty where clause to get all messages
    return this.makeRequest(`/chat/findMessages/${instanceName}`, 'POST', {
      where: {}
    });
  }

  // Get instance info which might include chat data
  async getInstanceInfo(instanceName: string): Promise<any> {
    console.log(`🔍 [Evolution API] Calling getInstanceInfo for instance: ${instanceName}`);
    return this.makeRequest(`/instance/fetchInstances?instanceName=${instanceName}`);
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

  // Message sending methods for scheduled messages
  async sendTextMessage(instanceName: string, phoneNumber: string, text: string): Promise<any> {
    const endpoint = `/message/sendText/${instanceName}`;
    
    // Format phone number with @s.whatsapp.net
    const remoteJid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
    
    return this.makeRequest(endpoint, 'POST', {
      number: remoteJid,
      text: text,
      delay: 1000 // 1 second delay
    });
  }

  async sendImageMessage(instanceName: string, phoneNumber: string, base64: string, caption?: string): Promise<any> {
    const endpoint = `/message/sendMedia/${instanceName}`;
    
    // Format phone number with @s.whatsapp.net
    const remoteJid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
    
    // Add data URL prefix if not present
    const mediaBase64 = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
    
    return this.makeRequest(endpoint, 'POST', {
      number: remoteJid,
      mediatype: 'image',
      media: mediaBase64,
      caption: caption || '',
      delay: 1000
    });
  }

  async sendAudioMessage(instanceName: string, phoneNumber: string, base64: string): Promise<any> {
    const endpoint = `/message/sendMedia/${instanceName}`;
    
    // Format phone number with @s.whatsapp.net
    const remoteJid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
    
    // Add data URL prefix if not present
    const mediaBase64 = base64.startsWith('data:') ? base64 : `data:audio/mpeg;base64,${base64}`;
    
    return this.makeRequest(endpoint, 'POST', {
      number: remoteJid,
      mediatype: 'audio',
      media: mediaBase64,
      delay: 1000
    });
  }

  async sendVideoMessage(instanceName: string, phoneNumber: string, base64: string, caption?: string): Promise<any> {
    const endpoint = `/message/sendMedia/${instanceName}`;
    
    // Format phone number with @s.whatsapp.net
    const remoteJid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
    
    // Add data URL prefix if not present
    const mediaBase64 = base64.startsWith('data:') ? base64 : `data:video/mp4;base64,${base64}`;
    
    return this.makeRequest(endpoint, 'POST', {
      number: remoteJid,
      mediatype: 'video',
      media: mediaBase64,
      caption: caption || '',
      delay: 1000
    });
  }
}
