# Pharm Comm AI - AI-Powered Training Module

Interactive AI module training pharmacy students to counsel vaccine-resistant patients through simulated dialogue and automated evaluation.

## Features

- **Multiple Patient Personas**: Practice with 5 different vaccine-hesitant patient types
- **Real-time NLP Scoring**: Get instant feedback on empathy, accuracy, and clarity
- **Interactive Conversations**: Text-based chat interface with dynamic patient responses
- **Instant Feedback Reports**: Detailed feedback with actionable suggestions
- **Session Summaries**: Track your progress and performance metrics
- **Speech Input Support**: Voice input capability (integration ready)

## Architecture

### Backend (Python/Flask)
- **Modular Design**: Separated concerns for conversation simulation, NLP scoring, and feedback generation
- **Flask API**: RESTful endpoints for session management and message processing
- **NLP Scoring Module**: Uses TextBlob and NLTK for sentiment analysis and scoring
- **Conversation Simulator**: Dynamic patient responses based on student performance
- **Feedback Generator**: Provides detailed, actionable feedback

### Frontend (Web-based)
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Instant feedback display and score visualization
- **Interactive UI**: Clean, professional interface for training sessions
- **Score Visualization**: Progress bars and color-coded feedback

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/mcphersonlab/pharm-comm-ai.git
cd pharm-comm-ai
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Download required NLTK data (will auto-download on first run):
```bash
python -c "import nltk; nltk.download('vader_lexicon')"
```

## Usage

### Running the Application

1. Start the Flask server:
```bash
cd backend
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

3. Select a patient persona to begin a training session

4. Have a conversation with the virtual patient:
   - Type your responses in the chat interface
   - Review real-time feedback on empathy, accuracy, and clarity
   - See suggestions for improvement
   - Track your progress through score visualizations

5. End the session to see a comprehensive summary

### Patient Personas

1. **Alex (General Concerns)**: Cautious patient worried about side effects and safety
2. **Sarah (Safety First)**: Skeptical about long-term effects and testing procedures
3. **Michael (Natural Immunity)**: Confident in natural immunity, questions necessity
4. **Jennifer (Allergies)**: Anxious about side effects and allergic reactions
5. **Robert (Misinformation)**: Distrustful, influenced by conspiracy theories

## Scoring System

### Empathy (0-100%)
- Measures acknowledgment of patient concerns
- Detects empathetic language and validation
- Penalizes dismissive or condescending tone

### Accuracy (0-100%)
- Evaluates factual correctness
- Rewards evidence-based information
- Penalizes misinformation

### Clarity (0-100%)
- Assesses message readability
- Optimal length and structure
- Appropriate use of technical terms

## API Endpoints

### POST `/api/start-session`
Start a new training session
```json
{
  "persona": "default"
}
```

### POST `/api/send-message`
Send a student message and get patient response with feedback
```json
{
  "session_id": "uuid",
  "message": "I understand your concerns..."
}
```

### POST `/api/end-session`
End session and get summary
```json
{
  "session_id": "uuid"
}
```

### POST `/api/transcribe-speech`
Transcribe speech to text (integration ready)
```
multipart/form-data with audio file
```

## Development

### Project Structure
```
pharm-comm-ai/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── conversation_simulator.py
│   │   ├── nlp_scorer.py
│   │   └── feedback_generator.py
│   └── tests/                 # Test files
├── frontend/
│   └── index.html            # Main web interface
├── static/
│   ├── css/
│   │   └── style.css         # Styling
│   └── js/
│       └── app.js            # Frontend JavaScript
├── requirements.txt          # Python dependencies
└── README.md
```

### Adding New Features

#### Adding a New Patient Persona
Edit `backend/modules/conversation_simulator.py` and add to the `_initialize_personas()` method:
```python
'new_persona': {
    'name': 'Name',
    'concerns': ['concern1', 'concern2'],
    'openness': 0.5,
    'initial_message': "Opening statement...",
    'personality': 'trait'
}
```

#### Customizing Scoring
Modify `backend/modules/nlp_scorer.py` to adjust keywords, weights, or add new scoring dimensions.

## Future Enhancements

- [ ] Integration with speech-to-text services (Google Speech API, Azure Speech Service)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Student progress tracking over multiple sessions
- [ ] Custom persona creation
- [ ] Export conversation transcripts
- [ ] Integration with LMS platforms

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See LICENSE file for details.

## Support

For questions or issues, please open an issue on GitHub.

## Acknowledgments

Developed for healthcare education to improve vaccine communication skills through AI-powered simulation and feedback.
