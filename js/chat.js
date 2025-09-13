// Chat Manager
export class ChatManager {
    constructor(app) {
        this.app = app;
        this.messages = [];
        this.currentThreadId = null;
        this.unsubscriber = null;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordingChunks = [];
    }
    
    async init(params = {}) {
        if (!this.app.currentUser) {
            this.app.navigate('home');
            return;
        }
        
        try {
            await this.renderChat();
            await this.initializeThread();
            this.setupEventListeners();
        } catch (error) {
            console.error('Chat initialization error:', error);
            this.app.showToast('Failed to load chat', 'error');
        }
    }
    
    async renderChat() {
        const container = document.getElementById('page-chat');
        
        container.innerHTML = `
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm h-[600px] flex flex-col">
                    <!-- Chat Header -->
                    <div class="bg-primary text-primary-foreground p-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-primary-foreground text-primary rounded-full flex items-center justify-center font-semibold">
                                    A
                                </div>
                                <div>
                                    <div class="font-semibold">Academic Support</div>
                                    <div class="text-sm text-primary-foreground/80">Online • Typically replies instantly</div>
                                </div>
                            </div>
                            <button id="chat-menu-btn" class="text-primary-foreground/80 hover:text-primary-foreground">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Chat Messages -->
                    <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                        <!-- Messages will appear here -->
                    </div>

                    <!-- Typing Indicator -->
                    <div id="typing-indicator" class="px-4 py-2 hidden">
                        <div class="flex items-center space-x-2 text-muted-foreground text-sm">
                            <div class="flex space-x-1">
                                <div class="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                                <div class="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                                <div class="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                            </div>
                            <span>Support is typing...</span>
                        </div>
                    </div>

                    <!-- Chat Input -->
                    <div class="border-t border-border p-4 bg-card">
                        <div class="flex items-end space-x-3">
                            <button id="attach-file-btn" class="text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-muted transition-colors">
                                <i class="fas fa-paperclip"></i>
                            </button>
                            <button id="voice-record-btn" class="text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-muted transition-colors">
                                <i class="fas fa-microphone"></i>
                            </button>
                            <div class="flex-1 relative">
                                <textarea 
                                    id="chat-input" 
                                    class="w-full p-3 border border-border rounded-lg bg-background resize-none" 
                                    rows="1" 
                                    placeholder="Type your message..."
                                    maxlength="1000"></textarea>
                                <div class="absolute bottom-2 right-2 text-xs text-muted-foreground">
                                    <span id="char-count">0</span>/1000
                                </div>
                            </div>
                            <button id="send-message-btn" class="bg-primary text-primary-foreground p-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50" disabled>
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        
                        <!-- Voice Recording UI -->
                        <div id="voice-recording" class="hidden mt-3 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <span class="text-sm font-medium">Recording voice message...</span>
                                    <span id="recording-time" class="text-sm text-muted-foreground">0:00</span>
                                </div>
                                <div class="flex space-x-2">
                                    <button id="cancel-recording-btn" class="text-sm text-muted-foreground hover:text-destructive">
                                        Cancel
                                    </button>
                                    <button id="stop-recording-btn" class="text-sm bg-primary text-primary-foreground px-3 py-1 rounded">
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- File Upload Input -->
                    <input type="file" id="file-upload-input" class="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" multiple>
                </div>
            </div>
        `;
    }
    
    async initializeThread() {
        // Generate thread ID based on user ID
        this.currentThreadId = `user_${this.app.currentUser.uid}`;
        
        // Create thread metadata if it doesn't exist
        await this.ensureThreadExists();
        
        // Load existing messages
        await this.loadMessages();
        
        // Set up real-time message listener
        this.setupMessageListener();
    }
    
    async ensureThreadExists() {
        try {
            const threadData = await this.app.getDocument('messages', this.currentThreadId);
            
            if (!threadData) {
                // Create new thread
                await this.app.createDocument('messages', {
                    participants: [this.app.currentUser.uid, 'admin'],
                    lastMessage: null,
                    lastMessageAt: null,
                    unreadCount: { [this.app.currentUser.uid]: 0, admin: 0 }
                }, this.currentThreadId);
            }
        } catch (error) {
            console.error('Error ensuring thread exists:', error);
        }
    }
    
    async loadMessages() {
        try {
            this.messages = await this.app.getCollection(`messages/${this.currentThreadId}/entries`, {
                orderBy: { field: 'createdAt', direction: 'asc' },
                limit: 50
            });
            
            this.renderMessages();
            this.scrollToBottom();
        } catch (error) {
            console.error('Error loading messages:', error);
            this.renderEmptyState();
        }
    }
    
    setupMessageListener() {
        const { collection, query, orderBy, onSnapshot } = import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js').then(module => {
            const messagesRef = collection(this.app.db, `messages/${this.currentThreadId}/entries`);
            const q = query(messagesRef, orderBy('createdAt', 'asc'));
            
            this.unsubscriber = onSnapshot(q, (snapshot) => {
                this.messages = [];
                snapshot.forEach((doc) => {
                    this.messages.push({ id: doc.id, ...doc.data() });
                });
                
                this.renderMessages();
                this.scrollToBottom();
                
                // Mark messages as read
                this.markMessagesAsRead();
            });
        });
    }
    
    renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        if (this.messages.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        container.innerHTML = this.messages.map(message => this.renderMessage(message)).join('');
    }
    
    renderMessage(message) {
        const isUser = message.from === 'user';
        const time = this.app.formatRelativeTime(message.createdAt);
        
        return `
            <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
                <div class="max-w-xs lg:max-w-md">
                    ${!isUser ? `
                        <div class="flex items-center space-x-2 mb-1">
                            <div class="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                                A
                            </div>
                            <span class="text-xs text-muted-foreground">Support</span>
                        </div>
                    ` : ''}
                    
                    <div class="${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} rounded-lg p-3">
                        ${this.renderMessageContent(message)}
                    </div>
                    
                    <div class="text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : 'text-left'}">
                        ${time}
                        ${isUser && message.readBy?.admin ? '<i class="fas fa-check-double ml-1 text-primary"></i>' : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMessageContent(message) {
        switch (message.type) {
            case 'text':
                return `<p class="text-sm">${this.escapeHtml(message.text)}</p>`;
                
            case 'file':
                return `
                    <div class="space-y-2">
                        ${message.text ? `<p class="text-sm">${this.escapeHtml(message.text)}</p>` : ''}
                        <div class="bg-background/10 rounded-lg p-3">
                            <div class="flex items-center space-x-2">
                                <i class="fas ${this.getFileIcon(message.file.name)} text-lg"></i>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium truncate">${message.file.name}</p>
                                    <p class="text-xs opacity-80">${this.formatFileSize(message.file.size)}</p>
                                </div>
                                <a href="${message.file.downloadURL}" target="_blank" class="text-xs hover:underline">
                                    <i class="fas fa-download"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                `;
                
            case 'voice':
                return `
                    <div class="space-y-2">
                        ${message.text ? `<p class="text-sm">${this.escapeHtml(message.text)}</p>` : ''}
                        <div class="bg-background/10 rounded-lg p-3">
                            <div class="flex items-center space-x-2">
                                <button class="play-voice-btn w-8 h-8 bg-background/20 rounded-full flex items-center justify-center" data-url="${message.file.downloadURL}">
                                    <i class="fas fa-play text-xs"></i>
                                </button>
                                <div class="flex-1">
                                    <div class="h-2 bg-background/20 rounded-full">
                                        <div class="h-2 bg-background/40 rounded-full" style="width: 0%"></div>
                                    </div>
                                </div>
                                <span class="text-xs opacity-80">${message.file.duration || '0:00'}</span>
                            </div>
                        </div>
                    </div>
                `;
                
            default:
                return `<p class="text-sm">${this.escapeHtml(message.text || 'Unsupported message type')}</p>`;
        }
    }
    
    renderEmptyState() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        container.innerHTML = `
            <div class="flex-1 flex items-center justify-center">
                <div class="text-center">
                    <i class="fas fa-comments text-4xl text-muted-foreground mb-4"></i>
                    <h3 class="text-lg font-medium text-foreground mb-2">Start a conversation</h3>
                    <p class="text-muted-foreground">Send a message to our support team and we'll get back to you right away.</p>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Send message button
        document.getElementById('send-message-btn')?.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter key to send
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea and character count
        const chatInput = document.getElementById('chat-input');
        chatInput?.addEventListener('input', (e) => {
            this.updateCharCount(e.target.value.length);
            this.autoResizeTextarea(e.target);
            this.updateSendButton(e.target.value.trim());
        });
        
        // File attachment
        document.getElementById('attach-file-btn')?.addEventListener('click', () => {
            document.getElementById('file-upload-input')?.click();
        });
        
        document.getElementById('file-upload-input')?.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });
        
        // Voice recording
        document.getElementById('voice-record-btn')?.addEventListener('click', () => {
            this.toggleVoiceRecording();
        });
        
        document.getElementById('cancel-recording-btn')?.addEventListener('click', () => {
            this.cancelRecording();
        });
        
        document.getElementById('stop-recording-btn')?.addEventListener('click', () => {
            this.stopRecording();
        });
        
        // Voice message playback
        document.addEventListener('click', (e) => {
            const playBtn = e.target.closest('.play-voice-btn');
            if (playBtn && playBtn.closest('#page-chat')) {
                this.playVoiceMessage(playBtn.dataset.url, playBtn);
            }
        });
    }
    
    updateCharCount(length) {
        const countEl = document.getElementById('char-count');
        if (countEl) {
            countEl.textContent = length;
        }
    }
    
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    updateSendButton(hasText) {
        const sendBtn = document.getElementById('send-message-btn');
        if (sendBtn) {
            sendBtn.disabled = !hasText;
        }
    }
    
    async sendMessage() {
        const input = document.getElementById('chat-input');
        if (!input) return;
        
        const text = input.value.trim();
        if (!text) return;
        
        try {
            await this.createMessage({
                type: 'text',
                text,
                from: 'user'
            });
            
            // Clear input
            input.value = '';
            this.updateCharCount(0);
            this.updateSendButton(false);
            this.autoResizeTextarea(input);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.app.showToast('Failed to send message', 'error');
        }
    }
    
    async handleFileUpload(files) {
        if (!files || files.length === 0) return;
        
        // Validate files
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'text/plain'
        ];
        
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                this.app.showToast(`Unsupported file type: ${file.name}`, 'error');
                continue;
            }
            
            if (file.size > maxSize) {
                this.app.showToast(`File too large: ${file.name} (max 10MB)`, 'error');
                continue;
            }
            
            try {
                this.app.showLoading('Uploading file...', `Uploading ${file.name}`);
                
                // Upload file
                const path = `chat/${this.currentThreadId}/${Date.now()}_${file.name}`;
                const uploadedFile = await this.app.uploadFile(file, path);
                
                // Send file message
                await this.createMessage({
                    type: 'file',
                    text: '', // Optional caption
                    from: 'user',
                    file: uploadedFile
                });
                
                this.app.hideLoading();
                
            } catch (error) {
                console.error('Error uploading file:', error);
                this.app.hideLoading();
                this.app.showToast(`Failed to upload ${file.name}`, 'error');
            }
        }
        
        // Clear file input
        document.getElementById('file-upload-input').value = '';
    }
    
    async toggleVoiceRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            this.recordingChunks = [];
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordingChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            this.mediaRecorder.start();
            
            // Show recording UI
            document.getElementById('voice-recording')?.classList.remove('hidden');
            document.getElementById('voice-record-btn')?.classList.add('bg-red-500', 'text-white');
            
            // Start timer
            this.startRecordingTimer();
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.app.showToast('Failed to start voice recording', 'error');
        }
    }
    
    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            const timeEl = document.getElementById('recording-time');
            if (timeEl) {
                timeEl.textContent = timeStr;
            }
            
            // Auto-stop after 5 minutes
            if (elapsed >= 300) {
                this.stopRecording();
            }
        }, 1000);
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        this.cleanupRecording();
    }
    
    cancelRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        this.recordingChunks = [];
        this.cleanupRecording();
    }
    
    cleanupRecording() {
        this.isRecording = false;
        
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        // Hide recording UI
        document.getElementById('voice-recording')?.classList.add('hidden');
        document.getElementById('voice-record-btn')?.classList.remove('bg-red-500', 'text-white');
    }
    
    async processRecording() {
        if (this.recordingChunks.length === 0) return;
        
        try {
            const blob = new Blob(this.recordingChunks, { type: 'audio/webm' });
            const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            
            this.app.showLoading('Uploading voice message...', 'Processing your voice message');
            
            // Create file object
            const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
            
            // Upload voice file
            const path = `chat/${this.currentThreadId}/voice_${Date.now()}.webm`;
            const uploadedFile = await this.app.uploadFile(file, path);
            
            // Add duration to file metadata
            uploadedFile.duration = this.formatDuration(duration);
            
            // Send voice message
            await this.createMessage({
                type: 'voice',
                text: '',
                from: 'user',
                file: uploadedFile
            });
            
            this.app.hideLoading();
            
        } catch (error) {
            console.error('Error processing recording:', error);
            this.app.hideLoading();
            this.app.showToast('Failed to send voice message', 'error');
        }
    }
    
    async createMessage(messageData) {
        try {
            const { serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Create message
            const message = await this.app.createDocument(`messages/${this.currentThreadId}/entries`, {
                ...messageData,
                readBy: messageData.from === 'user' ? { user: true } : { admin: true }
            });
            
            // Update thread metadata
            await this.app.updateDocument('messages', this.currentThreadId, {
                lastMessage: messageData.text || (messageData.type === 'file' ? 'File attachment' : 'Voice message'),
                lastMessageAt: serverTimestamp()
            });
            
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    }
    
    async markMessagesAsRead() {
        try {
            // Mark unread admin messages as read
            const unreadMessages = this.messages.filter(m => 
                m.from === 'admin' && !m.readBy?.[this.app.currentUser.uid]
            );
            
            for (const message of unreadMessages) {
                await this.app.updateDocument(`messages/${this.currentThreadId}/entries`, message.id, {
                    [`readBy.${this.app.currentUser.uid}`]: true
                });
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }
    
    playVoiceMessage(url, button) {
        // Simple audio playback implementation
        const audio = new Audio(url);
        const icon = button.querySelector('i');
        
        audio.addEventListener('play', () => {
            icon.className = 'fas fa-pause text-xs';
        });
        
        audio.addEventListener('pause', () => {
            icon.className = 'fas fa-play text-xs';
        });
        
        audio.addEventListener('ended', () => {
            icon.className = 'fas fa-play text-xs';
        });
        
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    }
    
    scrollToBottom() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            pdf: 'fa-file-pdf text-red-500',
            doc: 'fa-file-word text-blue-500',
            docx: 'fa-file-word text-blue-500',
            jpg: 'fa-file-image text-green-500',
            jpeg: 'fa-file-image text-green-500',
            png: 'fa-file-image text-green-500',
            txt: 'fa-file-alt text-gray-500'
        };
        return iconMap[ext] || 'fa-file text-gray-500';
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    cleanup() {
        if (this.unsubscriber) {
            this.unsubscriber();
            this.unsubscriber = null;
        }
        
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }
}
