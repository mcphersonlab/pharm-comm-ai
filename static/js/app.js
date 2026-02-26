/**
 * Main JavaScript Application for Pharm Comm AI
 * Handles UI interactions, API calls, and real-time feedback display
 */

class PharmCommApp {
    constructor() {
        this.sessionId = null;
        this.currentPersona = null;
        this.apiBase = window.location.origin;
        this.recognition = null;
        this.isListening = false;
        this.finalTranscript = '';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSpeechRecognition();
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    this.finalTranscript += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            document.getElementById('message-input').value = this.finalTranscript + interim;
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                this.recognition.start();
            }
        };

        this.recognition.onerror = (event) => {
            if (event.error !== 'no-speech') {
                console.error('Speech recognition error:', event.error);
            }
        };
    }

    setupEventListeners() {
        // Persona selection
        document.querySelectorAll('.persona-card button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.persona-card');
                const persona = card.dataset.persona;
                this.startSession(persona);
            });
        });

        // Send message
        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Voice button
        document.getElementById('voice-btn').addEventListener('click', () => {
            this.toggleVoiceInput();
        });

        // End session
        document.getElementById('end-session-btn').addEventListener('click', () => {
            this.endSession();
        });

        // Close summary
        document.getElementById('close-summary-btn').addEventListener('click', () => {
            this.resetApp();
        });
    }

    async startSession(persona) {
        try {
            const response = await fetch(`${this.apiBase}/api/start-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ persona })
            });

            const data = await response.json();

            if (data.success) {
                this.sessionId = data.session_id;
                this.currentPersona = data.persona;

                // Switch to conversation interface
                document.getElementById('persona-selection').style.display = 'none';
                document.getElementById('conversation-interface').style.display = 'block';

                // Update patient name
                document.getElementById('patient-name').textContent = this.getPersonaName(persona);

                // Clear chat
                document.getElementById('chat-container').innerHTML = '';

                // Add initial patient message
                this.addMessage('patient', data.patient_message);
            } else {
                alert('Error starting session: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to start session. Please try again.');
        }
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();

        if (!message) return;

        // Pause continuous voice listening while the patient "speaks"
        const wasListening = this.isListening;
        if (wasListening) {
            this.isListening = false;
            this.recognition.stop();
        }

        // Add student message to chat
        this.addMessage('student', message);

        // Clear input and transcript buffer
        input.value = '';
        this.finalTranscript = '';

        // Disable send button while processing
        const sendBtn = document.getElementById('send-btn');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';

        // Show patient typing indicator immediately
        this.showTypingIndicator();

        try {
            const response = await fetch(`${this.apiBase}/api/send-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    message: message
                })
            });

            const data = await response.json();

            if (data.success) {
                // Stream patient response word by word
                await this.addMessageStreaming('patient', data.patient_message);

                // Update feedback display
                this.updateFeedback(data.scores, data.feedback);
            } else {
                this.hideTypingIndicator();
                alert('Error: ' + data.error);
            }
        } catch (error) {
            this.hideTypingIndicator();
            console.error('Error:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';

            // Resume voice listening after patient finishes for ongoing dialogue
            if (wasListening) {
                this.isListening = true;
                this.recognition.start();
                document.getElementById('voice-status').style.display = 'block';
                document.getElementById('voice-btn').textContent = '⏹️';
            }
        }
    }

    addMessage(speaker, content) {
        const chatContainer = document.getElementById('chat-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${speaker}-message`;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.textContent = speaker === 'patient' ? '🏥 Patient' : '👨‍⚕️ You';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;

        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(contentDiv);
        chatContainer.appendChild(messageDiv);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    showTypingIndicator() {
        const chatContainer = document.getElementById('chat-container');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message patient-message';
        typingDiv.id = 'typing-indicator';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.textContent = '🏥 Patient';

        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'typing-indicator';
        indicatorDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

        typingDiv.appendChild(headerDiv);
        typingDiv.appendChild(indicatorDiv);
        chatContainer.appendChild(typingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    addMessageStreaming(speaker, content) {
        this.hideTypingIndicator();

        const chatContainer = document.getElementById('chat-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${speaker}-message`;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.textContent = speaker === 'patient' ? '🏥 Patient' : '👨‍⚕️ You';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(contentDiv);
        chatContainer.appendChild(messageDiv);

        const words = content.split(' ');
        let wordIndex = 0;

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (wordIndex < words.length) {
                    contentDiv.textContent += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
                    wordIndex++;
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, 80);
        });
    }

    updateFeedback(scores, feedback) {
        // Show score display
        document.getElementById('score-display').style.display = 'block';
        document.getElementById('feedback-details').style.display = 'block';

        // Update score bars
        this.updateScoreBar('empathy', scores.empathy);
        this.updateScoreBar('accuracy', scores.accuracy);
        this.updateScoreBar('clarity', scores.clarity);

        // Update feedback text
        const feedbackText = document.getElementById('feedback-text');
        feedbackText.innerHTML = `
            <p><strong>Overall:</strong> ${feedback.overall}</p>
            <p><strong>Empathy:</strong> ${feedback.empathy.message}</p>
            <p><strong>Accuracy:</strong> ${feedback.accuracy.message}</p>
            <p><strong>Clarity:</strong> ${feedback.clarity.message}</p>
        `;

        // Update suggestions
        if (feedback.suggestions && feedback.suggestions.length > 0) {
            document.getElementById('suggestions-section').style.display = 'block';
            const suggestionsList = document.getElementById('suggestions-list');
            suggestionsList.innerHTML = '';

            feedback.suggestions.forEach(suggestion => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `
                    <div class="suggestion-category">${suggestion.category}</div>
                    <div>${suggestion.tip}</div>
                    <div class="suggestion-example">Example: "${suggestion.example}"</div>
                `;
                suggestionsList.appendChild(div);
            });
        }

        // Update strengths
        if (feedback.strengths && feedback.strengths.length > 0) {
            document.getElementById('strengths-section').style.display = 'block';
            const strengthsList = document.getElementById('strengths-list');
            strengthsList.innerHTML = '';

            feedback.strengths.forEach(strength => {
                const div = document.createElement('div');
                div.className = 'strength-item';
                div.textContent = '✓ ' + strength;
                strengthsList.appendChild(div);
            });
        }

        // Hide placeholder
        const placeholder = document.querySelector('.feedback-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    }

    updateScoreBar(type, score) {
        const bar = document.getElementById(`${type}-bar`);
        const scoreText = document.getElementById(`${type}-score`);
        
        const percentage = Math.round(score * 100);
        bar.style.width = percentage + '%';
        scoreText.textContent = percentage + '%';

        // Color coding
        if (score >= 0.75) {
            bar.style.background = '#10b981';
        } else if (score >= 0.5) {
            bar.style.background = '#f59e0b';
        } else {
            bar.style.background = '#ef4444';
        }
    }

    async endSession() {
        if (!confirm('Are you sure you want to end this session?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/api/end-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSummary(data.summary);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to end session. Please try again.');
        }
    }

    showSummary(summary) {
        const modal = document.getElementById('summary-modal');
        const content = document.getElementById('summary-content');

        const avgScores = summary.average_scores;
        const finalOpenness = Math.round(summary.final_openness * 100);

        content.innerHTML = `
            <div class="summary-stat">
                <strong>Patient:</strong>
                <span>${summary.persona_name}</span>
            </div>
            <div class="summary-stat">
                <strong>Duration:</strong>
                <span>${summary.duration_minutes.toFixed(1)} minutes</span>
            </div>
            <div class="summary-stat">
                <strong>Conversation Turns:</strong>
                <span>${summary.turn_count}</span>
            </div>
            <div class="summary-stat">
                <strong>Patient Openness:</strong>
                <span>${finalOpenness}%</span>
            </div>
            <hr style="margin: 15px 0;">
            <h3>Average Scores</h3>
            <div class="summary-stat">
                <strong>Empathy:</strong>
                <span>${Math.round(avgScores.empathy * 100)}%</span>
            </div>
            <div class="summary-stat">
                <strong>Accuracy:</strong>
                <span>${Math.round(avgScores.accuracy * 100)}%</span>
            </div>
            <div class="summary-stat">
                <strong>Clarity:</strong>
                <span>${Math.round(avgScores.clarity * 100)}%</span>
            </div>
            <hr style="margin: 15px 0;">
            <p style="margin-top: 15px; font-style: italic; color: #64748b;">
                ${this.getPerformanceSummary(avgScores, finalOpenness)}
            </p>
        `;

        modal.style.display = 'flex';
    }

    getPerformanceSummary(scores, openness) {
        const avg = (scores.empathy + scores.accuracy + scores.clarity) / 3;

        if (avg >= 0.75 && openness >= 70) {
            return "Excellent work! You effectively addressed the patient's concerns and built trust.";
        } else if (avg >= 0.6 && openness >= 50) {
            return "Good job! You made progress with the patient. Keep practicing to improve further.";
        } else if (avg >= 0.5) {
            return "You're making progress. Focus on being more empathetic and providing clearer information.";
        } else {
            return "Keep practicing! Remember to acknowledge concerns, provide accurate information, and communicate clearly.";
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            alert('Speech recognition is not supported in this browser. Please try Chrome or Edge.');
            return;
        }

        const voiceStatus = document.getElementById('voice-status');
        const voiceBtn = document.getElementById('voice-btn');

        if (!this.isListening) {
            this.isListening = true;
            this.finalTranscript = '';
            this.recognition.start();
            voiceStatus.style.display = 'block';
            voiceBtn.textContent = '⏹️';
        } else {
            this.isListening = false;
            this.recognition.stop();
            voiceStatus.style.display = 'none';
            voiceBtn.textContent = '🎤';
        }
    }

    resetApp() {
        // Stop voice recognition if active
        if (this.isListening) {
            this.isListening = false;
            this.recognition.stop();
            document.getElementById('voice-btn').textContent = '🎤';
        }

        document.getElementById('summary-modal').style.display = 'none';
        document.getElementById('conversation-interface').style.display = 'none';
        document.getElementById('persona-selection').style.display = 'block';

        // Reset state
        this.sessionId = null;
        this.currentPersona = null;
        this.finalTranscript = '';

        // Clear feedback
        document.getElementById('score-display').style.display = 'none';
        document.getElementById('feedback-details').style.display = 'none';
        document.querySelector('.feedback-placeholder').style.display = 'block';
    }

    getPersonaName(persona) {
        const names = {
            'default': 'Alex',
            'safety_concerned': 'Sarah',
            'natural_immunity': 'Michael',
            'side_effects': 'Jennifer',
            'misinformation': 'Robert'
        };
        return names[persona] || 'Patient';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PharmCommApp();
});
