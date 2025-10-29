/**
 * Main JavaScript Application for Pharm Comm AI
 * Handles UI interactions, API calls, and real-time feedback display
 */

class PharmCommApp {
    constructor() {
        this.sessionId = null;
        this.currentPersona = null;
        this.apiBase = window.location.origin;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
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

        // Add student message to chat
        this.addMessage('student', message);

        // Clear input
        input.value = '';

        // Disable send button while processing
        const sendBtn = document.getElementById('send-btn');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';

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
                // Add patient response
                this.addMessage('patient', data.patient_message);

                // Update feedback display
                this.updateFeedback(data.scores, data.feedback);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to send message. Please try again.');
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
        const voiceStatus = document.getElementById('voice-status');
        const voiceBtn = document.getElementById('voice-btn');

        if (voiceStatus.style.display === 'none') {
            // Start recording (placeholder for actual implementation)
            voiceStatus.style.display = 'block';
            voiceBtn.textContent = '⏹️';
            
            // In a real implementation, this would use Web Speech API or a similar service
            alert('Voice input is a placeholder feature. In production, this would use the Web Speech API or integrate with a speech-to-text service.');
            
            // Auto-stop after showing alert
            voiceStatus.style.display = 'none';
            voiceBtn.textContent = '🎤';
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
