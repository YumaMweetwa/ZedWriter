// Submissions Manager
export class SubmissionsManager {
    constructor(app) {
        this.app = app;
        this.currentStep = 1;
        this.formData = {};
        this.uploadedFiles = [];
        this.preselectedType = null;
    }
    
    async init(params = {}) {
        if (!this.app.currentUser) {
            this.app.navigate('home');
            return;
        }
        
        this.preselectedType = params.preselectedType;
        await this.renderSubmissionWizard();
        this.setupEventListeners();
        this.initializeForm();
    }
    
    async renderSubmissionWizard() {
        const container = document.getElementById('page-submit');
        
        container.innerHTML = `
            <section class="py-12 bg-background min-h-screen">
                <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <!-- Wizard Header -->
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-bold mb-4">Submit Your Work</h1>
                        <p class="text-muted-foreground">Complete the steps below to submit your request</p>
                    </div>

                    <!-- Progress Indicator -->
                    <div class="mb-8">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div id="step1-indicator" class="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">1</div>
                                <span class="ml-3 font-medium">Details</span>
                            </div>
                            <div class="flex-1 mx-4 h-2 bg-muted rounded-full">
                                <div id="progress-bar-1" class="h-full bg-primary rounded-full transition-all duration-300" style="width: 33%"></div>
                            </div>
                            <div class="flex items-center">
                                <div id="step2-indicator" class="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-semibold">2</div>
                                <span class="ml-3 text-muted-foreground">Files</span>
                            </div>
                            <div class="flex-1 mx-4 h-2 bg-muted rounded-full">
                                <div id="progress-bar-2" class="h-full bg-muted rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                            <div class="flex items-center">
                                <div id="step3-indicator" class="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-semibold">3</div>
                                <span class="ml-3 text-muted-foreground">Review</span>
                            </div>
                        </div>
                    </div>

                    <!-- Step Content -->
                    <div id="wizard-content">
                        ${this.renderStep1()}
                    </div>
                </div>
            </section>
        `;
    }
    
    renderStep1() {
        return `
            <div id="step-1" class="bg-card border border-border rounded-xl p-8 shadow-sm">
                <h2 class="text-xl font-semibold mb-6">Step 1: Project Details</h2>
                
                <form id="details-form" class="space-y-6">
                    <!-- Work Type -->
                    <div>
                        <label class="block text-sm font-medium mb-2">Work Type *</label>
                        <select id="work-type" name="type" class="w-full p-3 border border-border rounded-lg" required>
                            <option value="">Select work type</option>
                            <option value="proposal" ${this.preselectedType === 'proposal' ? 'selected' : ''}>Research Proposal</option>
                            <option value="dissertation" ${this.preselectedType === 'dissertation' ? 'selected' : ''}>Dissertation</option>
                            <option value="assignment" ${this.preselectedType === 'assignment' ? 'selected' : ''}>Assignment</option>
                            <option value="data_analysis" ${this.preselectedType === 'data_analysis' ? 'selected' : ''}>Data Analysis</option>
                            <option value="data_collection" ${this.preselectedType === 'data_collection' ? 'selected' : ''}>Data Collection</option>
                        </select>
                    </div>

                    <!-- Common Fields -->
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium mb-2">First Name *</label>
                            <input type="text" id="first-name" name="firstName" class="w-full p-3 border border-border rounded-lg" required placeholder="Enter your first name" value="${this.app.currentUser.firstName || ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Last Name *</label>
                            <input type="text" id="last-name" name="lastName" class="w-full p-3 border border-border rounded-lg" required placeholder="Enter your last name" value="${this.app.currentUser.lastName || ''}">
                        </div>
                    </div>

                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium mb-2">Student ID *</label>
                            <input type="text" id="student-id" name="studentId" class="w-full p-3 border border-border rounded-lg" required placeholder="Your student ID" value="${this.app.currentUser.studentId || ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Email *</label>
                            <input type="email" id="email" name="email" class="w-full p-3 border border-border rounded-lg" required placeholder="your.email@example.com" value="${this.app.currentUser.email}" readonly>
                        </div>
                    </div>

                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium mb-2">Phone/WhatsApp *</label>
                            <input type="tel" id="phone" name="phone" class="w-full p-3 border border-border rounded-lg" required placeholder="+260 XX XXX XXXX" value="${this.app.currentUser.phone || ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">School/University *</label>
                            <input type="text" id="school" name="school" class="w-full p-3 border border-border rounded-lg" required placeholder="Your institution" value="${this.app.currentUser.school || ''}">
                        </div>
                    </div>

                    <!-- Type-specific fields -->
                    <div id="proposal-fields" class="hidden space-y-6">
                        <div>
                            <label class="block text-sm font-medium mb-2">Research Title *</label>
                            <input type="text" id="research-title" name="researchTitle" class="w-full p-3 border border-border rounded-lg" placeholder="Enter your research title">
                        </div>
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium mb-2">Supervisor Name</label>
                                <input type="text" id="supervisor-name" name="supervisorName" class="w-full p-3 border border-border rounded-lg" placeholder="Supervisor's name">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Supervisor Contact</label>
                                <input type="text" id="supervisor-contact" name="supervisorContact" class="w-full p-3 border border-border rounded-lg" placeholder="Supervisor's email or phone">
                            </div>
                        </div>
                    </div>

                    <div id="dissertation-fields" class="hidden space-y-6">
                        <div>
                            <label class="block text-sm font-medium mb-2">Research Title *</label>
                            <input type="text" id="dissertation-title" name="researchTitle" class="w-full p-3 border border-border rounded-lg" placeholder="Enter your dissertation title">
                        </div>
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium mb-2">Supervisor Name</label>
                                <input type="text" id="dissertation-supervisor-name" name="supervisorName" class="w-full p-3 border border-border rounded-lg" placeholder="Supervisor's name">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Supervisor Contact</label>
                                <input type="text" id="dissertation-supervisor-contact" name="supervisorContact" class="w-full p-3 border border-border rounded-lg" placeholder="Supervisor's email or phone">
                            </div>
                        </div>
                    </div>

                    <div id="assignment-fields" class="hidden space-y-6">
                        <div>
                            <label class="block text-sm font-medium mb-2">Assignment Topic/Title *</label>
                            <input type="text" id="assignment-topic" name="assignmentTopic" class="w-full p-3 border border-border rounded-lg" placeholder="Enter assignment topic">
                        </div>
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium mb-2">Field of Study *</label>
                                <input type="text" id="field-of-study" name="fieldOfStudy" class="w-full p-3 border border-border rounded-lg" placeholder="e.g., Medicine, Engineering">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Instructor Name</label>
                                <input type="text" id="instructor-name" name="instructorName" class="w-full p-3 border border-border rounded-lg" placeholder="Instructor's name">
                            </div>
                        </div>
                    </div>

                    <!-- Additional Details -->
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium mb-2">File Format</label>
                            <select id="file-format" name="fileFormat" class="w-full p-3 border border-border rounded-lg">
                                <option value="pdf">PDF (Recommended)</option>
                                <option value="docx">Microsoft Word</option>
                                <option value="both">Both PDF and Word</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Preferred Completion Date *</label>
                            <input type="date" id="preferred-date" name="preferredDate" class="w-full p-3 border border-border rounded-lg" required>
                        </div>
                    </div>

                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium mb-2">Payment Method</label>
                            <select id="payment-method" name="paymentMethod" class="w-full p-3 border border-border rounded-lg">
                                <option value="mobile_money">Mobile Money</option>
                                <option value="bank">Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Payment Arrangement</label>
                            <select id="payment-arrangement" name="paymentArrangement" class="w-full p-3 border border-border rounded-lg">
                                <option value="50/50">50% upfront, 50% on completion</option>
                                <option value="full_upfront">100% upfront</option>
                                <option value="full_completion">100% on completion</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">Additional Comments</label>
                        <textarea id="comments" name="comments" class="w-full p-3 border border-border rounded-lg" rows="4" maxlength="500" placeholder="Any additional requirements or comments..."></textarea>
                        <div class="text-sm text-muted-foreground mt-1">
                            <span id="comments-count">0</span>/500 characters
                        </div>
                    </div>

                    <div class="flex justify-end pt-6">
                        <button type="button" id="next-step-1" class="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                            Next: Upload Files <i class="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </form>
            </div>
        `;
    }
    
    renderStep2() {
        return `
            <div id="step-2" class="bg-card border border-border rounded-xl p-8 shadow-sm">
                <h2 class="text-xl font-semibold mb-6">Step 2: Upload Files</h2>
                
                <!-- File Upload Area -->
                <div id="file-drop-zone" class="border-2 border-dashed border-border rounded-xl p-8 text-center mb-6 transition-colors hover:border-primary/50">
                    <div class="max-w-md mx-auto">
                        <i class="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-4"></i>
                        <h3 class="text-lg font-semibold mb-2">Upload your files</h3>
                        <p class="text-muted-foreground mb-4">Drag and drop files here or click to browse</p>
                        <input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" class="hidden" id="file-input">
                        <button type="button" id="browse-files-btn" class="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                            Choose Files
                        </button>
                        <p class="text-sm text-muted-foreground mt-3">
                            Supported: PDF, Word, PowerPoint, Excel • Max 20MB each • Up to 6 files
                        </p>
                    </div>
                </div>

                <!-- Uploaded Files List -->
                <div id="uploaded-files" class="space-y-3 mb-6">
                    <!-- Files will appear here -->
                </div>

                <div class="flex justify-between pt-6">
                    <button type="button" id="prev-step-2" class="border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-muted transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i> Back
                    </button>
                    <button type="button" id="next-step-2" class="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                        Next: Review <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    renderStep3() {
        return `
            <div id="step-3" class="bg-card border border-border rounded-xl p-8 shadow-sm">
                <h2 class="text-xl font-semibold mb-6">Step 3: Review & Submit</h2>
                
                <div class="space-y-6">
                    <!-- Project Summary -->
                    <div class="bg-muted rounded-lg p-6">
                        <h3 class="font-semibold mb-4">Project Summary</h3>
                        <div class="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-muted-foreground">Work Type:</span>
                                <span class="ml-2 font-medium">${this.formatWorkType(this.formData.type)}</span>
                            </div>
                            <div>
                                <span class="text-muted-foreground">Student:</span>
                                <span class="ml-2 font-medium">${this.formData.firstName} ${this.formData.lastName}</span>
                            </div>
                            <div>
                                <span class="text-muted-foreground">School:</span>
                                <span class="ml-2 font-medium">${this.formData.school}</span>
                            </div>
                            <div>
                                <span class="text-muted-foreground">Due Date:</span>
                                <span class="ml-2 font-medium">${this.app.formatDate(new Date(this.formData.preferredDate))}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Details -->
                    <div class="bg-muted rounded-lg p-6">
                        <h3 class="font-semibold mb-4">Contact Details</h3>
                        <div class="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-muted-foreground">Email:</span>
                                <span class="ml-2 font-medium">${this.formData.email}</span>
                            </div>
                            <div>
                                <span class="text-muted-foreground">Phone:</span>
                                <span class="ml-2 font-medium">${this.formData.phone}</span>
                            </div>
                        </div>
                    </div>

                    ${this.formData.researchTitle || this.formData.assignmentTopic ? `
                    <div class="bg-muted rounded-lg p-6">
                        <h3 class="font-semibold mb-4">Work Details</h3>
                        <div class="text-sm">
                            <div>
                                <span class="text-muted-foreground">Title:</span>
                                <span class="ml-2 font-medium">${this.formData.researchTitle || this.formData.assignmentTopic}</span>
                            </div>
                            ${this.formData.supervisorName ? `
                            <div class="mt-2">
                                <span class="text-muted-foreground">Supervisor:</span>
                                <span class="ml-2 font-medium">${this.formData.supervisorName}</span>
                            </div>
                            ` : ''}
                            ${this.formData.fieldOfStudy ? `
                            <div class="mt-2">
                                <span class="text-muted-foreground">Field of Study:</span>
                                <span class="ml-2 font-medium">${this.formData.fieldOfStudy}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Files Summary -->
                    <div class="bg-muted rounded-lg p-6">
                        <h3 class="font-semibold mb-4">Uploaded Files</h3>
                        <div class="space-y-2 text-sm">
                            ${this.uploadedFiles.length > 0 ? 
                                this.uploadedFiles.map(file => `
                                    <div class="flex items-center justify-between">
                                        <span>${file.name}</span>
                                        <span class="text-muted-foreground">${this.formatFileSize(file.size)}</span>
                                    </div>
                                `).join('') : 
                                '<p class="text-muted-foreground">No files uploaded</p>'
                            }
                        </div>
                    </div>

                    <!-- Payment Summary -->
                    <div class="bg-muted rounded-lg p-6">
                        <h3 class="font-semibold mb-4">Payment Information</h3>
                        <div class="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-muted-foreground">Total Amount:</span>
                                <span class="ml-2 font-medium text-lg text-primary">${this.app.formatCurrency(this.calculateAmount())}</span>
                            </div>
                            <div>
                                <span class="text-muted-foreground">Payment Method:</span>
                                <span class="ml-2 font-medium">${this.formatPaymentMethod(this.formData.paymentMethod)}</span>
                            </div>
                            <div>
                                <span class="text-muted-foreground">Arrangement:</span>
                                <span class="ml-2 font-medium">${this.formatPaymentArrangement(this.formData.paymentArrangement)}</span>
                            </div>
                        </div>
                    </div>

                    ${this.formData.comments ? `
                    <div class="bg-muted rounded-lg p-6">
                        <h3 class="font-semibold mb-4">Additional Comments</h3>
                        <p class="text-sm text-muted-foreground">${this.formData.comments}</p>
                    </div>
                    ` : ''}
                </div>

                <div class="flex justify-between pt-8">
                    <button type="button" id="prev-step-3" class="border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-muted transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i> Back
                    </button>
                    <button type="button" id="submit-work-btn" class="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                        Submit Work <i class="fas fa-paper-plane ml-2"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Work type change
        document.addEventListener('change', (e) => {
            if (e.target.id === 'work-type') {
                this.handleWorkTypeChange(e.target.value);
            }
        });
        
        // Comments character count
        document.addEventListener('input', (e) => {
            if (e.target.id === 'comments') {
                this.updateCommentsCount(e.target.value.length);
            }
        });
        
        // Step navigation
        document.addEventListener('click', (e) => {
            if (e.target.id === 'next-step-1') {
                this.nextStep();
            } else if (e.target.id === 'prev-step-2') {
                this.prevStep();
            } else if (e.target.id === 'next-step-2') {
                this.nextStep();
            } else if (e.target.id === 'prev-step-3') {
                this.prevStep();
            } else if (e.target.id === 'submit-work-btn') {
                this.submitWork();
            }
        });
        
        // File upload
        document.addEventListener('click', (e) => {
            if (e.target.id === 'browse-files-btn') {
                document.getElementById('file-input')?.click();
            }
        });
        
        document.addEventListener('change', (e) => {
            if (e.target.id === 'file-input') {
                this.handleFileSelect(e.target.files);
            }
        });
        
        // Drag and drop
        const dropZone = document.getElementById('file-drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('border-primary');
                dropZone.classList.add('bg-primary/5');
            });
            
            dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-primary');
                dropZone.classList.remove('bg-primary/5');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-primary');
                dropZone.classList.remove('bg-primary/5');
                this.handleFileSelect(e.dataTransfer.files);
            });
        }
    }
    
    initializeForm() {
        // Set minimum date to today + 3 days
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 3);
        const preferredDateInput = document.getElementById('preferred-date');
        if (preferredDateInput) {
            preferredDateInput.min = minDate.toISOString().split('T')[0];
        }
        
        // Show type-specific fields if preselected
        if (this.preselectedType) {
            this.handleWorkTypeChange(this.preselectedType);
        }
    }
    
    handleWorkTypeChange(type) {
        // Hide all type-specific fields
        const typeFields = ['proposal-fields', 'dissertation-fields', 'assignment-fields'];
        typeFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.add('hidden');
                // Clear required attributes
                field.querySelectorAll('input[required]').forEach(input => {
                    input.removeAttribute('required');
                });
            }
        });
        
        // Show relevant fields
        let fieldsToShow = [];
        if (type === 'proposal') {
            fieldsToShow = ['proposal-fields'];
        } else if (type === 'dissertation') {
            fieldsToShow = ['dissertation-fields'];
        } else if (type === 'assignment') {
            fieldsToShow = ['assignment-fields'];
        }
        
        fieldsToShow.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.remove('hidden');
                // Add required attributes where needed
                field.querySelectorAll('input[name="researchTitle"], input[name="assignmentTopic"], input[name="fieldOfStudy"]').forEach(input => {
                    if (input.name === 'fieldOfStudy' && type === 'assignment') {
                        input.setAttribute('required', '');
                    } else if ((input.name === 'researchTitle' && (type === 'proposal' || type === 'dissertation')) ||
                               (input.name === 'assignmentTopic' && type === 'assignment')) {
                        input.setAttribute('required', '');
                    }
                });
            }
        });
    }
    
    updateCommentsCount(length) {
        const countEl = document.getElementById('comments-count');
        if (countEl) {
            countEl.textContent = length;
        }
    }
    
    async nextStep() {
        if (this.currentStep === 1) {
            if (await this.validateStep1()) {
                this.currentStep = 2;
                this.updateProgress();
                document.getElementById('wizard-content').innerHTML = this.renderStep2();
                this.setupEventListeners();
            }
        } else if (this.currentStep === 2) {
            this.currentStep = 3;
            this.updateProgress();
            document.getElementById('wizard-content').innerHTML = this.renderStep3();
            this.setupEventListeners();
        }
    }
    
    prevStep() {
        if (this.currentStep === 2) {
            this.currentStep = 1;
            this.updateProgress();
            document.getElementById('wizard-content').innerHTML = this.renderStep1();
            this.setupEventListeners();
            this.initializeForm();
            this.populateFormData();
        } else if (this.currentStep === 3) {
            this.currentStep = 2;
            this.updateProgress();
            document.getElementById('wizard-content').innerHTML = this.renderStep2();
            this.setupEventListeners();
            this.renderUploadedFiles();
        }
    }
    
    updateProgress() {
        // Update step indicators
        for (let i = 1; i <= 3; i++) {
            const indicator = document.getElementById(`step${i}-indicator`);
            const progressBar = document.getElementById(`progress-bar-${i}`);
            
            if (indicator) {
                if (i <= this.currentStep) {
                    indicator.classList.remove('bg-muted', 'text-muted-foreground');
                    indicator.classList.add('bg-primary', 'text-primary-foreground');
                } else {
                    indicator.classList.add('bg-muted', 'text-muted-foreground');
                    indicator.classList.remove('bg-primary', 'text-primary-foreground');
                }
            }
            
            if (progressBar) {
                if (i < this.currentStep) {
                    progressBar.style.width = '100%';
                    progressBar.classList.remove('bg-muted');
                    progressBar.classList.add('bg-primary');
                } else if (i === this.currentStep) {
                    progressBar.style.width = '33%';
                    progressBar.classList.remove('bg-muted');
                    progressBar.classList.add('bg-primary');
                } else {
                    progressBar.style.width = '0%';
                    progressBar.classList.add('bg-muted');
                    progressBar.classList.remove('bg-primary');
                }
            }
        }
        
        // Update step labels
        const labels = ['Details', 'Files', 'Review'];
        for (let i = 1; i <= 3; i++) {
            const label = document.querySelector(`#step${i}-indicator`).nextElementSibling;
            if (label) {
                if (i <= this.currentStep) {
                    label.classList.remove('text-muted-foreground');
                    label.classList.add('font-medium');
                } else {
                    label.classList.add('text-muted-foreground');
                    label.classList.remove('font-medium');
                }
            }
        }
    }
    
    async validateStep1() {
        const form = document.getElementById('details-form');
        if (!form) return false;
        
        // Clear previous errors
        this.clearFormErrors();
        
        // Collect form data
        const formData = new FormData(form);
        this.formData = Object.fromEntries(formData.entries());
        
        let isValid = true;
        
        // Validate required fields
        const requiredFields = ['type', 'firstName', 'lastName', 'studentId', 'email', 'phone', 'school', 'preferredDate'];
        
        requiredFields.forEach(field => {
            if (!this.formData[field]) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            }
        });
        
        // Validate type-specific required fields
        if (this.formData.type === 'proposal' || this.formData.type === 'dissertation') {
            if (!this.formData.researchTitle) {
                this.showFieldError('researchTitle', 'Research title is required');
                isValid = false;
            }
        } else if (this.formData.type === 'assignment') {
            if (!this.formData.assignmentTopic) {
                this.showFieldError('assignmentTopic', 'Assignment topic is required');
                isValid = false;
            }
            if (!this.formData.fieldOfStudy) {
                this.showFieldError('fieldOfStudy', 'Field of study is required');
                isValid = false;
            }
        }
        
        // Validate email
        if (this.formData.email && !this.app.validateEmail(this.formData.email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate phone
        if (this.formData.phone && !this.app.validateZambiaPhone(this.formData.phone)) {
            this.showFieldError('phone', 'Please enter a valid Zambian phone number (+260 or 0)');
            isValid = false;
        }
        
        // Validate date
        if (this.formData.preferredDate) {
            const selectedDate = new Date(this.formData.preferredDate);
            const minDate = new Date();
            minDate.setDate(minDate.getDate() + 3);
            
            if (selectedDate < minDate) {
                this.showFieldError('preferredDate', 'Preferred date must be at least 3 days from today');
                isValid = false;
            }
        }
        
        // Validate comments length
        if (this.formData.comments && this.formData.comments.length > 500) {
            this.showFieldError('comments', 'Comments must not exceed 500 characters');
            isValid = false;
        }
        
        return isValid;
    }
    
    populateFormData() {
        // Populate form with saved data
        Object.keys(this.formData).forEach(key => {
            const field = document.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = this.formData[key];
            }
        });
        
        // Update work type specific fields
        if (this.formData.type) {
            this.handleWorkTypeChange(this.formData.type);
        }
        
        // Update comments count
        if (this.formData.comments) {
            this.updateCommentsCount(this.formData.comments.length);
        }
    }
    
    showFieldError(fieldName, message) {
        const field = document.querySelector(`[name="${fieldName}"]`) || document.getElementById(fieldName);
        if (!field) return;
        
        // Add error styling
        field.style.borderColor = 'hsl(var(--destructive))';
        
        // Add error message
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message text-destructive text-sm mt-1';
        errorEl.textContent = message;
        field.parentNode.appendChild(errorEl);
    }
    
    clearFormErrors() {
        // Remove error styling
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.style.borderColor = '';
        });
        
        // Remove error messages
        document.querySelectorAll('.error-message').forEach(error => {
            error.remove();
        });
    }
    
    async handleFileSelect(files) {
        const fileArray = Array.from(files);
        
        // Validate files
        for (const file of fileArray) {
            if (!this.validateFile(file)) {
                continue;
            }
            
            // Check if we already have 6 files
            if (this.uploadedFiles.length >= 6) {
                this.app.showToast('Maximum 6 files allowed', 'error');
                break;
            }
            
            // Check for duplicates
            if (this.uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
                this.app.showToast(`File "${file.name}" already uploaded`, 'error');
                continue;
            }
            
            // Add file to list
            this.uploadedFiles.push({
                file,
                name: file.name,
                size: file.size,
                id: Date.now() + Math.random()
            });
        }
        
        this.renderUploadedFiles();
    }
    
    validateFile(file) {
        // Check file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            this.app.showToast(`Invalid file type: ${file.name}`, 'error');
            return false;
        }
        
        // Check file size (20MB)
        if (file.size > 20 * 1024 * 1024) {
            this.app.showToast(`File too large: ${file.name} (max 20MB)`, 'error');
            return false;
        }
        
        return true;
    }
    
    renderUploadedFiles() {
        const container = document.getElementById('uploaded-files');
        if (!container) return;
        
        if (this.uploadedFiles.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = this.uploadedFiles.map(fileData => `
            <div class="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div class="flex items-center space-x-3">
                    <i class="fas ${this.getFileIcon(fileData.name)} text-xl"></i>
                    <div>
                        <div class="font-medium">${fileData.name}</div>
                        <div class="text-sm text-muted-foreground">${this.formatFileSize(fileData.size)}</div>
                    </div>
                </div>
                <button type="button" class="remove-file-btn text-destructive hover:text-destructive/80" data-file-id="${fileData.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Add remove file listeners
        container.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-file-btn');
            if (removeBtn) {
                const fileId = parseFloat(removeBtn.dataset.fileId);
                this.removeFile(fileId);
            }
        });
    }
    
    removeFile(fileId) {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
        this.renderUploadedFiles();
    }
    
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            pdf: 'fa-file-pdf text-red-500',
            doc: 'fa-file-word text-blue-500',
            docx: 'fa-file-word text-blue-500',
            ppt: 'fa-file-powerpoint text-orange-500',
            pptx: 'fa-file-powerpoint text-orange-500',
            xls: 'fa-file-excel text-green-500',
            xlsx: 'fa-file-excel text-green-500'
        };
        return iconMap[ext] || 'fa-file text-gray-500';
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    formatWorkType(type) {
        const typeMap = {
            proposal: 'Research Proposal',
            dissertation: 'Dissertation',
            assignment: 'Assignment',
            data_analysis: 'Data Analysis',
            data_collection: 'Data Collection'
        };
        return typeMap[type] || type;
    }
    
    formatPaymentMethod(method) {
        const methodMap = {
            mobile_money: 'Mobile Money',
            bank: 'Bank Transfer'
        };
        return methodMap[method] || method;
    }
    
    formatPaymentArrangement(arrangement) {
        const arrangementMap = {
            '50/50': '50% upfront, 50% on completion',
            'full_upfront': '100% upfront',
            'full_completion': '100% on completion'
        };
        return arrangementMap[arrangement] || arrangement;
    }
    
    calculateAmount() {
        const pricing = {
            proposal: 500,
            dissertation: 1000,
            assignment: 300,
            data_analysis: 400,
            data_collection: 400
        };
        return pricing[this.formData.type] || 0;
    }
    
    async submitWork() {
        try {
            this.app.showLoading('Submitting work...', 'Please wait while we process your submission.');
            
            // Upload files first
            const uploadedFiles = [];
            for (const fileData of this.uploadedFiles) {
                const path = `uploads/${this.app.currentUser.uid}/${Date.now()}_${fileData.name}`;
                const uploadedFile = await this.app.uploadFile(fileData.file, path);
                uploadedFiles.push(uploadedFile);
            }
            
            // Create submission document
            const submissionData = {
                uid: this.app.currentUser.uid,
                type: this.formData.type,
                commonFields: {
                    firstName: this.formData.firstName,
                    lastName: this.formData.lastName,
                    studentId: this.formData.studentId,
                    email: this.formData.email,
                    phone: this.formData.phone,
                    school: this.formData.school
                },
                typeFields: {},
                preferredDate: new Date(this.formData.preferredDate),
                paymentMethod: this.formData.paymentMethod,
                paymentArrangement: this.formData.paymentArrangement,
                comments: this.formData.comments || '',
                status: 'pending',
                amount: this.calculateAmount(),
                files: uploadedFiles,
                title: this.formData.researchTitle || this.formData.assignmentTopic || `${this.formatWorkType(this.formData.type)} Submission`
            };
            
            // Add type-specific fields
            if (this.formData.type === 'proposal' || this.formData.type === 'dissertation') {
                submissionData.typeFields = {
                    researchTitle: this.formData.researchTitle,
                    supervisorName: this.formData.supervisorName,
                    supervisorContact: this.formData.supervisorContact
                };
            } else if (this.formData.type === 'assignment') {
                submissionData.typeFields = {
                    assignmentTopic: this.formData.assignmentTopic,
                    fieldOfStudy: this.formData.fieldOfStudy,
                    instructorName: this.formData.instructorName
                };
            }
            
            const submission = await this.app.createDocument('submissions', submissionData);
            
            this.app.hideLoading();
            this.app.showToast('Work submitted successfully!', 'success');
            
            // Navigate to dashboard with success message
            this.app.navigate('dashboard', { tab: 'submissions' });
            
        } catch (error) {
            console.error('Submission error:', error);
            this.app.hideLoading();
            this.app.showToast('Failed to submit work. Please try again.', 'error');
        }
    }
}
