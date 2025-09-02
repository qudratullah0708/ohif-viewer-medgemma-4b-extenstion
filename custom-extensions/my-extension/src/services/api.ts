// API service for communicating with the backend
import { API_BASE_URL } from '../config';

export interface Comment {
  id: number;
  content: string;
  image_id: number;
  doctor_id?: number;
  is_ai_generated: boolean;
  ai_model?: string;
  created_at: string;
  updated_at: string;
}

export interface ImageData {
  id: number;
  image_id: string;
  study_instance_uid?: string;
  series_instance_uid?: string;
  sop_instance_uid?: string;
  patient_id?: string;
  study_date?: string;
  modality?: string;
  comment_count: number;
  created_at: string;
}

export interface CreateCommentRequest {
  content: string;
  image_id: number;
  is_ai_generated: boolean;
  ai_model?: string;
}

export interface CreateImageRequest {
  image_id: string;
  study_instance_uid?: string;
  series_instance_uid?: string;
  sop_instance_uid?: string;
  patient_id?: string;
  study_date?: string;
  modality?: string;
}

export interface RegisterDoctorRequest {
  name: string;
  email: string;
  password: string;
  id_card_number: string;
}

export interface LoginDoctorRequest {
  email: string;
  password: string;
}

class ApiService {
  private authToken: string | null = null;

  setToken(token: string | null) {
    this.authToken = token;
  }

  setTokenFromWindow() {
    try {
      const tok = (window as any)?.DOCTOR_JWT || localStorage.getItem('DOCTOR_JWT');
      if (tok) {
        this.authToken = tok;
      }
    } catch {}
  }

  private hasAuth(): boolean {
    return !!this.authToken;
  }

  isAuthenticated(): boolean {
    return this.hasAuth();
  }

  logout() {
    this.authToken = null;
    try { localStorage.removeItem('DOCTOR_JWT'); } catch {}
    try { localStorage.removeItem('DOCTOR_NAME'); } catch {}
  }

  private apiPrefix(): string {
    // Use secured endpoints when we have a JWT; otherwise fall back to dev endpoints
    return this.hasAuth() ? '/api/v1' : '/api/v1/dev';
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      (headers as any)['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  async createImage(imageData: CreateImageRequest): Promise<ImageData> {
    console.log('📤 Creating image in database:', imageData);
    const response = await fetch(`${API_BASE_URL}${this.apiPrefix()}/images/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(imageData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to create image:', response.status, errorText);
      throw new Error(`Failed to create image: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Image created successfully:', result);
    return result;
  }

  async getImageByOhifId(ohifImageId: string): Promise<ImageData> {
    console.log('🔍 Looking up image by ID:', ohifImageId);
    const response = await fetch(`${API_BASE_URL}${this.apiPrefix()}/images/by-ohif-id/${encodeURIComponent(ohifImageId)}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      console.log('❌ Image not found in database:', ohifImageId);
      throw new Error(`Failed to get image: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Found existing image:', result);
    return result;
  }

  async createComment(commentData: CreateCommentRequest): Promise<Comment> {
    console.log('📤 Creating comment in database:', commentData);
    const response = await fetch(`${API_BASE_URL}${this.apiPrefix()}/comments/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(commentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to create comment:', response.status, errorText);
      throw new Error(`Failed to create comment: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Comment created successfully:', result);
    return result;
  }

  async getCommentsByImage(imageId: number): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}${this.apiPrefix()}/comments/image/${imageId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get comments: ${response.statusText}`);
    }

    return response.json();
  }

  async registerDoctor(payload: RegisterDoctorRequest): Promise<{ message: string; doctor_id: number }> {
    const url = `${API_BASE_URL}/api/v1/auth/register`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Registration failed');
    }
    return response.json();
  }

  async loginDoctor(payload: LoginDoctorRequest): Promise<{ access_token: string; token_type: string } & any> {
    const url = `${API_BASE_URL}/api/v1/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Login failed');
    }
    const data = await response.json();
    const token = data?.access_token;
    if (token) {
      try { localStorage.setItem('DOCTOR_JWT', token); } catch {}
      this.setToken(token);
    }
    const name = data?.doctor_info?.name || data?.doctor_info?.full_name;
    if (name) {
      try { localStorage.setItem('DOCTOR_NAME', name); } catch {}
    }
    return data;
  }

  async getCurrentDoctor(): Promise<{ id: number; name?: string; full_name?: string } | null> {
    if (!this.isAuthenticated()) return null;
    const url = `${API_BASE_URL}/api/v1/auth/me`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  }

  getStoredDoctorName(): string | null {
    try { return localStorage.getItem('DOCTOR_NAME'); } catch { return null; }
  }
}

export const apiService = new ApiService();
