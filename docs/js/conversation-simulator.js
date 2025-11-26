/**
 * Conversation Simulator Module (Client-side)
 * Manages patient personas and generates realistic vaccine-hesitant patient responses.
 */

class ConversationSimulator {
    constructor() {
        this.sessions = {};
        this.personas = this._initializePersonas();
    }

    _initializePersonas() {
        return {
            'default': {
                name: 'Alex',
                concerns: ['side_effects', 'safety'],
                openness: 0.5,
                initialMessage: "I'm not sure about getting this vaccine. I've heard a lot of concerning things about side effects.",
                personality: 'cautious'
            },
            'safety_concerned': {
                name: 'Sarah',
                concerns: ['long_term_effects', 'testing'],
                openness: 0.3,
                initialMessage: "I don't think the vaccine has been tested enough. How can we know it's safe in the long run?",
                personality: 'skeptical'
            },
            'natural_immunity': {
                name: 'Michael',
                concerns: ['natural_immunity', 'necessity'],
                openness: 0.4,
                initialMessage: "I'd rather rely on my natural immunity. Why do I need a vaccine if my immune system works fine?",
                personality: 'confident'
            },
            'side_effects': {
                name: 'Jennifer',
                concerns: ['side_effects', 'allergies'],
                openness: 0.6,
                initialMessage: "I'm worried about side effects. I have some allergies, and I've heard people have had bad reactions.",
                personality: 'anxious'
            },
            'misinformation': {
                name: 'Robert',
                concerns: ['conspiracy', 'distrust'],
                openness: 0.2,
                initialMessage: "I've read online that vaccines contain tracking chips and harmful chemicals. I don't trust them.",
                personality: 'distrustful'
            }
        };
    }

    /**
     * Generate a unique session ID
     */
    _generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Start a new conversation session
     * @param {string} personaKey - Key for the patient persona
     * @returns {object} Session data with session_id and initial message
     */
    startSession(personaKey = 'default') {
        const sessionId = this._generateSessionId();
        const persona = this.personas[personaKey] || this.personas['default'];

        this.sessions[sessionId] = {
            persona: persona,
            conversationHistory: [],
            scoresHistory: [],
            startTime: new Date(),
            opennessLevel: persona.openness,
            turnCount: 0
        };

        const initialMessage = persona.initialMessage;
        this.sessions[sessionId].conversationHistory.push({
            speaker: 'patient',
            message: initialMessage,
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            session_id: sessionId,
            patient_message: initialMessage,
            persona: personaKey
        };
    }

    /**
     * Get patient response based on student message and scores
     * @param {string} sessionId - Session ID
     * @param {string} studentMessage - Student's message
     * @param {object} scores - NLP scores
     * @returns {string} Patient response
     */
    getResponse(sessionId, studentMessage, scores) {
        if (!this.sessions[sessionId]) {
            throw new Error("Invalid session ID");
        }

        const session = this.sessions[sessionId];
        session.turnCount += 1;

        // Record student message
        session.conversationHistory.push({
            speaker: 'student',
            message: studentMessage,
            timestamp: new Date().toISOString()
        });

        // Record scores
        session.scoresHistory.push(scores);

        // Adjust openness based on empathy and accuracy scores
        const empathyScore = scores.empathy || 0.5;
        const accuracyScore = scores.accuracy || 0.5;

        // Patient becomes more open if student shows high empathy and accuracy
        if (empathyScore > 0.7 && accuracyScore > 0.6) {
            session.opennessLevel = Math.min(1.0, session.opennessLevel + 0.15);
        } else if (empathyScore < 0.4) {
            session.opennessLevel = Math.max(0.0, session.opennessLevel - 0.1);
        }

        // Generate response based on openness level
        const response = this._generateContextualResponse(session, studentMessage, scores);

        // Record patient response
        session.conversationHistory.push({
            speaker: 'patient',
            message: response,
            timestamp: new Date().toISOString()
        });

        return response;
    }

    /**
     * Generate a contextual patient response
     */
    _generateContextualResponse(session, studentMessage, scores) {
        const openness = session.opennessLevel;
        const turnCount = session.turnCount;
        const messageLower = studentMessage.toLowerCase();

        let responses;

        // High openness responses (patient is being convinced)
        if (openness > 0.7) {
            responses = [
                "You know, that actually makes sense. I hadn't thought about it that way before.",
                "I appreciate you taking the time to explain this. I'm starting to feel better about it.",
                "Thank you for addressing my concerns. I think I understand better now.",
                "That's reassuring to hear. Maybe I was worrying too much."
            ];
            if (turnCount > 3) {
                responses.push(
                    "Okay, I think you've convinced me. What are the next steps to get vaccinated?",
                    "I feel much better about this now. Thank you for being so patient with me."
                );
            }
        }
        // Medium openness (patient is listening but still has concerns)
        else if (openness > 0.4) {
            if (messageLower.includes('side effect') || messageLower.includes('reaction')) {
                responses = [
                    "I see. But what about the people who have had severe reactions?",
                    "That helps, but I'm still worried about potential side effects.",
                    "How common are these side effects you mentioned?"
                ];
            } else if (messageLower.includes('safe') || messageLower.includes('tested')) {
                responses = [
                    "I understand they did testing, but was it really enough time?",
                    "That's somewhat reassuring, but I still have some doubts.",
                    "Can you tell me more about the testing process?"
                ];
            } else {
                responses = [
                    "I'm listening, but I'm not entirely convinced yet.",
                    "That's interesting. Can you explain more?",
                    "I appreciate the information, but I still have questions."
                ];
            }
        }
        // Low openness (patient is resistant)
        else {
            if ((scores.empathy || 0.5) < 0.4) {
                responses = [
                    "You're not really listening to my concerns.",
                    "I don't think you understand how I feel about this.",
                    "This doesn't feel like you care about my worries."
                ];
            } else {
                responses = [
                    "I've heard that before, but I'm still not sure I believe it.",
                    "But what about all the stories I've heard?",
                    "I don't know... I'm still very skeptical.",
                    "That's what they say, but how can I be sure?"
                ];
            }
        }

        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * End session and generate summary
     * @param {string} sessionId - Session ID
     * @returns {object} Session summary
     */
    endSession(sessionId) {
        if (!this.sessions[sessionId]) {
            throw new Error("Invalid session ID");
        }

        const session = this.sessions[sessionId];

        // Calculate average scores
        const avgScores = {
            empathy: 0,
            accuracy: 0,
            clarity: 0
        };

        if (session.scoresHistory.length > 0) {
            for (const scoreSet of session.scoresHistory) {
                avgScores.empathy += scoreSet.empathy || 0;
                avgScores.accuracy += scoreSet.accuracy || 0;
                avgScores.clarity += scoreSet.clarity || 0;
            }

            const count = session.scoresHistory.length;
            avgScores.empathy /= count;
            avgScores.accuracy /= count;
            avgScores.clarity /= count;
        }

        const durationMs = new Date() - session.startTime;
        const durationMinutes = durationMs / 60000;

        const summary = {
            duration_minutes: durationMinutes,
            turn_count: session.turnCount,
            final_openness: session.opennessLevel,
            average_scores: avgScores,
            persona_name: session.persona.name,
            conversation_history: session.conversationHistory
        };

        // Clean up session
        delete this.sessions[sessionId];

        return summary;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationSimulator;
}
