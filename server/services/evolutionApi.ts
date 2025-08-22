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
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.token,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Evolution API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return response.json();
  }

  async createInstance(request: CreateInstanceRequest): Promise<any> {
    // Usar o endpoint correto
    return this.makeRequest('/instance/create', 'POST', request);
  }

  async getInstanceStatus(instanceName: string): Promise<InstanceStatus> {
    return this.makeRequest(`/instance/status/${instanceName}`);
  }

  async generateQRCode(instanceName: string): Promise<QRCodeResponse> {
    return this.makeRequest(`/instance/qrcode/${instanceName}`);
  }

  async deleteInstance(instanceName: string): Promise<any> {
    return this.makeRequest(`/instance/delete/${instanceName}`, 'DELETE');
  }

  async disconnectInstance(instanceName: string): Promise<any> {
    return this.makeRequest(`/instance/logout/${instanceName}`, 'DELETE');
  }

  async sendMessage(instanceName: string, number: string, message: string): Promise<any> {
    return this.makeRequest(`/message/sendText/${instanceName}`, 'POST', {
      number,
      options: {
        delay: 1200,
        presence: 'composing'
      },
      textMessage: {
        text: message
      }
    });
  }

  async getMessages(instanceName: string): Promise<any> {
    return this.makeRequest(`/chat/findMessages/${instanceName}`);
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
