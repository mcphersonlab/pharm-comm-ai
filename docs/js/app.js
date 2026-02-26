/**
 * Main JavaScript Application for Pharm Comm AI (Static Version)
 * Handles UI interactions and integrates client-side NLP scoring
 */

class PharmCommApp {
    constructor() {
        this.sessionId = null;
        this.currentPersona = null;
        
        // Initialize modules
        this.conversationSim = new ConversationSimulator();
        this.nlpScorer = new NLPScorer();
        this.feedbackGen = new FeedbackGenerator();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLLMSettings();
    }

    loadLLMSettings() {
        const keyEl = document.getElementById('api-key-input');
        const baseUrlEl = document.getElementById('base-url-input');
        const modelEl = document.getElementById('model-input');
        if (!keyEl || !baseUrlEl || !modelEl) return;
        keyEl.value = localStorage.getItem('openai_api_key') || '';
        baseUrlEl.value = localStorage.getItem('openai_base_url') || '';
        modelEl.value = localStorage.getItem('openai_model') || '';
    }

    setupEventListeners() {
        // LLM settings
        document.getElementById('llm-settings-btn').addEventListener('click', () => {
            this.loadLLMSettings();
            document.getElementById('llm-settings-modal').style.display = 'flex';
        });

        document.getElementById('save-settings-btn').addEventListener('click', () => {
            const key = document.getElementById('api-key-input').value.trim();
            const baseUrl = document.getElementById('base-url-input').value.trim();
            const model = document.getElementById('model-input').value.trim();
            if (key) {
                localStorage.setItem('openai_api_key', key);
            } else {
                localStorage.removeItem('openai_api_key');
            }
            if (baseUrl) {
                localStorage.setItem('openai_base_url', baseUrl);
            } else {
                localStorage.removeItem('openai_base_url');
            }
            if (model) {
                localStorage.setItem('openai_model', model);
            } else {
                localStorage.removeItem('openai_model');
            }
            document.getElementById('llm-settings-modal').style.display = 'none';
        });

        document.getElementById('close-settings-btn').addEventListener('click', () => {
            document.getElementById('llm-settings-modal').style.display = 'none';
        });

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

    startSession(persona) {
        try {
            const result = this.conversationSim.startSession(persona);

            if (result.success) {
                this.sessionId = result.session_id;
                this.currentPersona = result.persona;

                // Switch to conversation interface
                document.getElementById('persona-selection').style.display = 'none';
                document.getElementById('conversation-interface').style.display = 'block';

                // Update patient name
                document.getElementById('patient-name').textContent = this.getPersonaName(persona);

                // Clear chat
                document.getElementById('chat-container').innerHTML = '';

                // Add initial patient message
                this.addMessage('patient', result.patient_message);
            } else {
                alert('Error starting session');
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

        // Add student message to chat
        this.addMessage('student', message);

        // Clear input
        input.value = '';

        // Disable send button while processing
        const sendBtn = document.getElementById('send-btn');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Processing...';

        try {
            // Score the message using client-side NLP
            const scores = this.nlpScorer.scoreMessage(message, this.sessionId);

            // Get patient response (uses LLM when configured, rule-based fallback otherwise)
            const patientResponse = await this.conversationSim.getResponseAsync(this.sessionId, message, scores);

            // Generate feedback
            const feedback = this.feedbackGen.generateFeedback(message, scores);

            // Add patient response
            this.addMessage('patient', patientResponse);

            // Update feedback display
            this.updateFeedback(scores, feedback);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to process message. Please try again.');
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
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

    endSession() {
        if (!confirm('Are you sure you want to end this session?')) {
            return;
        }

        try {
            const summary = this.conversationSim.endSession(this.sessionId);
            this.showSummary(summary);
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
        const voiceStatus = document.getElementById('voice-status');
        const voiceBtn = document.getElementById('voice-btn');
        const messageInput = document.getElementById('message-input');

        // Check for Speech Recognition API support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
            return;
        }

        if (voiceStatus.style.display === 'none') {
            // Start recording
            voiceStatus.style.display = 'block';
            voiceBtn.textContent = '⏹️';
            
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                messageInput.value = transcript;
                voiceStatus.style.display = 'none';
                voiceBtn.textContent = '🎤';
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                voiceStatus.style.display = 'none';
                voiceBtn.textContent = '🎤';
                
                if (event.error === 'not-allowed') {
                    alert('Microphone access was denied. Please allow microphone access to use voice input.');
                } else {
                    alert('Voice input failed. Please try again or type your response.');
                }
            };

            recognition.onend = () => {
                voiceStatus.style.display = 'none';
                voiceBtn.textContent = '🎤';
            };

            recognition.start();
        } else {
            // Stop recording
            voiceStatus.style.display = 'none';
            voiceBtn.textContent = '🎤';
        }
    }

    resetApp() {
        document.getElementById('summary-modal').style.display = 'none';
        document.getElementById('conversation-interface').style.display = 'none';
        document.getElementById('persona-selection').style.display = 'block';

        // Reset state
        this.sessionId = null;
        this.currentPersona = null;

        // Clear feedback
        document.getElementById('score-display').style.display = 'none';
        document.getElementById('feedback-details').style.display = 'none';
        const placeholder = document.querySelector('.feedback-placeholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }
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
