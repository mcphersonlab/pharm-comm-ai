"""
Main Flask application for the AI-powered training module.
Handles API endpoints for conversation simulation and evaluation.
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import logging

from modules.conversation_simulator import ConversationSimulator
from modules.nlp_scorer import NLPScorer
from modules.feedback_generator import FeedbackGenerator

app = Flask(__name__, 
            template_folder='../frontend',
            static_folder='../static')
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize modules
conversation_sim = ConversationSimulator()
nlp_scorer = NLPScorer()
feedback_gen = FeedbackGenerator()


@app.route('/')
def index():
    """Serve the main application page."""
    return render_template('index.html')


@app.route('/api/start-session', methods=['POST'])
def start_session():
    """
    Start a new training session with a patient persona.
    Returns session_id and initial patient message.
    """
    try:
        data = request.json
        persona = data.get('persona', 'default')
        
        session_id, initial_message = conversation_sim.start_session(persona)
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'patient_message': initial_message,
            'persona': persona
        })
    except Exception as e:
        logger.error(f"Error starting session: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/send-message', methods=['POST'])
def send_message():
    """
    Process student's message and return patient response with evaluation.
    """
    try:
        data = request.json
        session_id = data.get('session_id')
        student_message = data.get('message')
        
        if not session_id or not student_message:
            return jsonify({
                'success': False, 
                'error': 'Missing session_id or message'
            }), 400
        
        # Score the student's message
        scores = nlp_scorer.score_message(student_message, session_id)
        
        # Get patient response based on student message
        patient_response = conversation_sim.get_response(session_id, student_message, scores)
        
        # Generate feedback
        feedback = feedback_gen.generate_feedback(student_message, scores)
        
        return jsonify({
            'success': True,
            'patient_message': patient_response,
            'scores': scores,
            'feedback': feedback
        })
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/end-session', methods=['POST'])
def end_session():
    """
    End a training session and return final summary.
    """
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'success': False, 'error': 'Missing session_id'}), 400
        
        # Get session summary
        summary = conversation_sim.end_session(session_id)
        
        return jsonify({
            'success': True,
            'summary': summary
        })
    except Exception as e:
        logger.error(f"Error ending session: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/transcribe-speech', methods=['POST'])
def transcribe_speech():
    """
    Transcribe speech audio to text.
    """
    try:
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No audio file'}), 400
        
        audio_file = request.files['audio']
        
        # For now, return a placeholder - in production, integrate with speech-to-text service
        # Could use Google Speech-to-Text, Azure Speech Service, or open-source alternatives
        text = "Speech transcription placeholder - integrate with STT service"
        
        return jsonify({
            'success': True,
            'text': text
        })
    except Exception as e:
        logger.error(f"Error transcribing speech: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
