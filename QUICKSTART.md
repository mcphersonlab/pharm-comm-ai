# Quick Start Guide

## Getting Started in 3 Steps

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Application
```bash
cd backend
python app.py
```

### 3. Open in Browser
Navigate to: http://localhost:5000

## Using the Training Module

1. **Select a Patient Persona** - Choose from 5 different vaccine-hesitant patient types
2. **Start Conversation** - Click "Start Conversation" to begin
3. **Type Your Response** - Enter your response in the chat box
4. **Review Feedback** - See real-time scores and suggestions
5. **Continue Practice** - Keep conversing to improve scores
6. **End Session** - View comprehensive summary of your performance

## Tips for High Scores

### Empathy (Target: 75%+)
- Acknowledge patient concerns: "I understand your worry..."
- Use validating phrases: "That's a valid concern"
- Avoid dismissive language: "just", "simply", "you should"

### Accuracy (Target: 75%+)
- Reference clinical data: "Studies with 30,000+ participants..."
- Mention FDA approval and safety monitoring
- Avoid misinformation

### Clarity (Target: 75%+)
- Keep responses 15-60 words
- Use 2-3 clear sentences
- Minimize jargon
- Ask follow-up questions

## Patient Personas

- **Alex**: General concerns - good for beginners
- **Sarah**: Safety skeptic - moderate difficulty
- **Michael**: Natural immunity - moderate difficulty
- **Jennifer**: Allergy worried - easier, receptive
- **Robert**: Misinformation - hardest, very skeptical

## Troubleshooting

**Port 5000 already in use?**
```bash
# Kill existing process
pkill -f "python app.py"
# Or change port in backend/app.py
```

**NLTK data missing?**
```bash
python -c "import nltk; nltk.download('vader_lexicon')"
```

## Need Help?

See the full [README.md](README.md) for detailed documentation and API reference.
