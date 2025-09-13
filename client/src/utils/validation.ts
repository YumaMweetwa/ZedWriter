export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// File validation function
export const validateFiles = (files: File[]): FileValidationResult[] => {
  return files.map(file => validateFile(file));
};

export const validateFile = (file: File): FileValidationResult => {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 20MB" };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "File type not supported. Please upload PDF, Word, PowerPoint, Excel, or image files." };
  }
  
  return { valid: true };
};

// Submission form validation
export const validateSubmissionForm = (formData: any): ValidationResult => {
  const errors: string[] = [];
  
  // Required fields validation
  if (!formData.type) {
    errors.push("Work type is required");
  }
  
  if (!formData.firstName) {
    errors.push("First name is required");
  }
  
  if (!formData.lastName) {
    errors.push("Last name is required");
  }
  
  if (!formData.studentId) {
    errors.push("Student ID is required");
  }
  
  if (!formData.email) {
    errors.push("Email is required");
  } else if (!isValidEmail(formData.email)) {
    errors.push("Please enter a valid email address");
  }
  
  if (!formData.phone) {
    errors.push("Phone number is required");
  } else if (!isValidPhone(formData.phone)) {
    errors.push("Please enter a valid Zambian phone number");
  }
  
  if (!formData.school) {
    errors.push("School/University is required");
  }
  
  if (!formData.preferredDate) {
    errors.push("Preferred date is required");
  }
  
  if (!formData.paymentMethod) {
    errors.push("Payment method is required");
  }
  
  if (!formData.paymentArrangement) {
    errors.push("Payment arrangement is required");
  }
  
  // Type-specific validation
  if (formData.type === 'proposal' || formData.type === 'dissertation') {
    if (!formData.researchTitle) {
      errors.push("Research title is required for proposals and dissertations");
    }
    if (!formData.supervisorName) {
      errors.push("Supervisor name is required for proposals and dissertations");
    }
  }
  
  if (formData.type === 'assignment') {
    if (!formData.assignmentTopic) {
      errors.push("Assignment topic is required");
    }
    if (!formData.instructorName) {
      errors.push("Instructor name is required for assignments");
    }
  }
  
  if (formData.type === 'data_analysis' || formData.type === 'data_collection') {
    if (!formData.fieldOfStudy) {
      errors.push("Field of study is required for data analysis/collection");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

// Helper validation functions
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  // Zambian phone number validation (supports +260, 260, or 0 prefix)
  const phoneRegex = /^(\+260|260|0)(7|9)\d{8}$/;
  const cleanPhone = phone.replace(/\s|-/g, '');
  return phoneRegex.test(cleanPhone);
};

export const isValidStudentId = (studentId: string): boolean => {
  // Basic student ID validation - adjust based on your requirements
  return studentId.length >= 6 && studentId.length <= 15;
};

export const validateRequiredField = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (value && value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters`;
  }
  return null;
};