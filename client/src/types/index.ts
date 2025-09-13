export interface WorkType {
  value: string;
  label: string;
  price: number;
  features: string[];
}

export interface FileUpload {
  id: string;
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

export interface SubmissionFormData {
  type: string;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
  phone: string;
  school: string;
  researchTitle?: string;
  supervisorName?: string;
  supervisorContact?: string;
  assignmentTopic?: string;
  fieldOfStudy?: string;
  instructorName?: string;
  fileFormat: string;
  preferredDate: string;
  paymentMethod: string;
  paymentArrangement: string;
  comments?: string;
}

export interface TopicGenerationParams {
  domain: string;
  subdomain?: string;
  department?: string;
  keywords: string[];
  studyArea?: string;
  requirements?: string;
}

export interface GeneratedTopic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  difficulty: string;
  duration: string;
}

export interface NotificationToast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  title?: string;
  message?: string;
}
