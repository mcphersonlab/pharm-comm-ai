"""
Conversation Simulator Module
Manages patient personas and generates realistic vaccine-hesitant patient responses.
When OPENAI_API_KEY is set the patient persona is powered by a lightweight LLM;
otherwise a rule-based fallback is used.
"""

import os
import uuid
from datetime import datetime
import random
import logging

try:
    from openai import OpenAI
    _openai_available = True
except ImportError:
    _openai_available = False

logger = logging.getLogger(__name__)


class ConversationSimulator:
    """Simulates conversations with vaccine-hesitant patients."""

    # Number of recent conversation turns to include in LLM context
    _LLM_CONTEXT_TURNS = 4

    def __init__(self):
        self.sessions = {}
        self.personas = self._initialize_personas()
        self._llm_client = self._init_llm_client()

    def _init_llm_client(self):
        """Initialize the OpenAI-compatible LLM client if credentials are available."""
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key or not _openai_available:
            return None
        base_url = os.environ.get('OPENAI_BASE_URL')
        kwargs = {'api_key': api_key}
        if base_url:
            kwargs['base_url'] = base_url
        return OpenAI(**kwargs)
    
    def _initialize_personas(self):
        """Define different patient personas with varying concerns."""
        return {
            'default': {
                'name': 'Alex',
                'concerns': ['side_effects', 'safety'],
                'openness': 0.5,
                'initial_message': "I'm not sure about getting this vaccine. I've heard a lot of concerning things about side effects.",
                'personality': 'cautious'
            },
            'safety_concerned': {
                'name': 'Sarah',
                'concerns': ['long_term_effects', 'testing'],
                'openness': 0.3,
                'initial_message': "I don't think the vaccine has been tested enough. How can we know it's safe in the long run?",
                'personality': 'skeptical'
            },
            'natural_immunity': {
                'name': 'Michael',
                'concerns': ['natural_immunity', 'necessity'],
                'openness': 0.4,
                'initial_message': "I'd rather rely on my natural immunity. Why do I need a vaccine if my immune system works fine?",
                'personality': 'confident'
            },
            'side_effects': {
                'name': 'Jennifer',
                'concerns': ['side_effects', 'allergies'],
                'openness': 0.6,
                'initial_message': "I'm worried about side effects. I have some allergies, and I've heard people have had bad reactions.",
                'personality': 'anxious'
            },
            'misinformation': {
                'name': 'Robert',
                'concerns': ['conspiracy', 'distrust'],
                'openness': 0.2,
                'initial_message': "I've read online that vaccines contain tracking chips and harmful chemicals. I don't trust them.",
                'personality': 'distrustful'
            }
        }
    
    def start_session(self, persona_key='default'):
        """
        Start a new conversation session.
        
        Args:
            persona_key: Key for the patient persona to use
            
        Returns:
            tuple: (session_id, initial_message)
        """
        session_id = str(uuid.uuid4())
        persona = self.personas.get(persona_key, self.personas['default'])
        
        self.sessions[session_id] = {
            'persona': persona,
            'conversation_history': [],
            'scores_history': [],
            'start_time': datetime.now(),
            'openness_level': persona['openness'],
            'turn_count': 0
        }
        
        initial_message = persona['initial_message']
        self.sessions[session_id]['conversation_history'].append({
            'speaker': 'patient',
            'message': initial_message,
            'timestamp': datetime.now().isoformat()
        })
        
        return session_id, initial_message
    
    def get_response(self, session_id, student_message, scores):
        """
        Generate patient response based on student's message and scores.
        
        Args:
            session_id: ID of the current session
            student_message: The student's message
            scores: NLP scores for the student's message
            
        Returns:
            str: Patient's response
        """
        if session_id not in self.sessions:
            raise ValueError("Invalid session ID")
        
        session = self.sessions[session_id]
        session['turn_count'] += 1
        
        # Record student message
        session['conversation_history'].append({
            'speaker': 'student',
            'message': student_message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Record scores
        session['scores_history'].append(scores)
        
        # Adjust openness based on empathy and accuracy scores
        empathy_score = scores.get('empathy', 0.5)
        accuracy_score = scores.get('accuracy', 0.5)
        
        # Patient becomes more open if student shows high empathy and accuracy
        if empathy_score > 0.7 and accuracy_score > 0.6:
            session['openness_level'] = min(1.0, session['openness_level'] + 0.15)
        elif empathy_score < 0.4:
            session['openness_level'] = max(0.0, session['openness_level'] - 0.1)
        
        # Generate response based on openness level
        response = self._generate_contextual_response(session, student_message, scores)
        
        # Record patient response
        session['conversation_history'].append({
            'speaker': 'patient',
            'message': response,
            'timestamp': datetime.now().isoformat()
        })
        
        return response
    
    def _generate_contextual_response(self, session, student_message, scores):
        """Generate a contextual patient response, using LLM when available."""
        if self._llm_client is not None:
            try:
                return self._generate_llm_response(session, student_message)
            except Exception as exc:
                logger.warning("LLM call failed, falling back to rule-based response: %s", exc)
        return self._generate_rule_based_response(session, student_message, scores)

    def _build_llm_system_prompt(self, persona, openness):
        """Build a minimal system prompt that describes the patient persona."""
        level = "very resistant" if openness < 0.35 else ("somewhat open" if openness < 0.65 else "fairly open")
        return (
            f"You are {persona['name']}, a vaccine-hesitant patient. "
            f"Personality: {persona['personality']}. "
            f"Main concerns: {', '.join(persona['concerns'])}. "
            f"You are currently {level} to being convinced. "
            "Reply in 1-2 short sentences, staying in character. "
            "Do not repeat yourself. Do not give medical advice."
        )

    def _generate_llm_response(self, session, student_message):
        """Call the LLM to generate a patient response."""
        persona = session['persona']
        model = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')
        system_prompt = self._build_llm_system_prompt(persona, session['openness_level'])

        # Build a short message history (system + last N turns + new student turn)
        messages = [{'role': 'system', 'content': system_prompt}]
        # Each turn contains one student message and one patient message (2 entries each)
        recent_turns = session['conversation_history'][-(self._LLM_CONTEXT_TURNS * 2):]
        for turn in recent_turns:
            role = 'assistant' if turn['speaker'] == 'patient' else 'user'
            messages.append({'role': role, 'content': turn['message']})
        messages.append({'role': 'user', 'content': student_message})

        response = self._llm_client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=100,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()

    def _generate_rule_based_response(self, session, student_message, scores):
        """Generate a contextual patient response."""
        persona = session['persona']
        openness = session['openness_level']
        turn_count = session['turn_count']
        
        # Analyze student message for key topics
        message_lower = student_message.lower()
        
        # High openness responses (patient is being convinced)
        if openness > 0.7:
            responses = [
                "You know, that actually makes sense. I hadn't thought about it that way before.",
                "I appreciate you taking the time to explain this. I'm starting to feel better about it.",
                "Thank you for addressing my concerns. I think I understand better now.",
                "That's reassuring to hear. Maybe I was worrying too much."
            ]
            if turn_count > 3:
                responses.extend([
                    "Okay, I think you've convinced me. What are the next steps to get vaccinated?",
                    "I feel much better about this now. Thank you for being so patient with me."
                ])
        
        # Medium openness (patient is listening but still has concerns)
        elif openness > 0.4:
            if 'side effect' in message_lower or 'reaction' in message_lower:
                responses = [
                    "I see. But what about the people who have had severe reactions?",
                    "That helps, but I'm still worried about potential side effects.",
                    "How common are these side effects you mentioned?"
                ]
            elif 'safe' in message_lower or 'tested' in message_lower:
                responses = [
                    "I understand they did testing, but was it really enough time?",
                    "That's somewhat reassuring, but I still have some doubts.",
                    "Can you tell me more about the testing process?"
                ]
            else:
                responses = [
                    "I'm listening, but I'm not entirely convinced yet.",
                    "That's interesting. Can you explain more?",
                    "I appreciate the information, but I still have questions."
                ]
        
        # Low openness (patient is resistant)
        else:
            if scores.get('empathy', 0.5) < 0.4:
                responses = [
                    "You're not really listening to my concerns.",
                    "I don't think you understand how I feel about this.",
                    "This doesn't feel like you care about my worries."
                ]
            else:
                responses = [
                    "I've heard that before, but I'm still not sure I believe it.",
                    "But what about all the stories I've heard?",
                    "I don't know... I'm still very skeptical.",
                    "That's what they say, but how can I be sure?"
                ]
        
        return random.choice(responses)
    
    def end_session(self, session_id):
        """
        End a session and generate summary.
        
        Args:
            session_id: ID of the session to end
            
        Returns:
            dict: Session summary with statistics
        """
        if session_id not in self.sessions:
            raise ValueError("Invalid session ID")
        
        session = self.sessions[session_id]
        
        # Calculate average scores
        avg_scores = {
            'empathy': 0,
            'accuracy': 0,
            'clarity': 0
        }
        
        if session['scores_history']:
            for score_set in session['scores_history']:
                for key in avg_scores.keys():
                    avg_scores[key] += score_set.get(key, 0)
            
            for key in avg_scores.keys():
                avg_scores[key] /= len(session['scores_history'])
        
        summary = {
            'duration_minutes': (datetime.now() - session['start_time']).seconds / 60,
            'turn_count': session['turn_count'],
            'final_openness': session['openness_level'],
            'average_scores': avg_scores,
            'persona_name': session['persona']['name'],
            'conversation_history': session['conversation_history']
        }
        
        # Clean up session
        del self.sessions[session_id]
        
        return summary
