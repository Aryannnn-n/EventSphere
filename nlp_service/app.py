"""
EventSphere NLP Microservice
============================
Flask server that performs:
1. Sentiment Analysis     — VADER
2. Keyword Extraction     — YAKE
3. Text Summarization     — Sumy (LSA algorithm)

Run with: python app.py
Runs on:  http://localhost:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import yake
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words
import nltk
import re
import logging

# ─── SETUP ───────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)  # Allow Next.js to call this service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download required NLTK data on startup
try:
    nltk.download("punkt", quiet=True)
    nltk.download("punkt_tab", quiet=True)
    nltk.download("stopwords", quiet=True)
except Exception as e:
    logger.warning(f"NLTK download warning: {e}")

# Initialize VADER sentiment analyzer
analyzer = SentimentIntensityAnalyzer()

# ─── HELPERS ─────────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Remove special characters, extra spaces, normalize text."""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)          # collapse multiple spaces
    text = re.sub(r"[^\w\s.,!?'-]", "", text) # remove special chars
    return text


def analyze_sentiment(comment: str) -> dict:
    """
    Use VADER to classify a single comment.
    Returns: { label, score, positive, neutral, negative }
    
    VADER compound score ranges:
      >= 0.05  → POSITIVE
      <= -0.05 → NEGATIVE
      else     → NEUTRAL
    """
    cleaned = clean_text(comment)
    scores = analyzer.polarity_scores(cleaned)
    compound = scores["compound"]

    if compound >= 0.05:
        label = "POSITIVE"
    elif compound <= -0.05:
        label = "NEGATIVE"
    else:
        label = "NEUTRAL"

    return {
        "label": label,
        "compound": round(compound, 4),
        "positive": round(scores["pos"], 4),
        "neutral": round(scores["neu"], 4),
        "negative": round(scores["neg"], 4),
    }


def extract_keywords(text: str, max_keywords: int = 10) -> list[str]:
    """
    Use YAKE to extract top keywords from combined feedback text.
    YAKE uses statistical features (TF-IDF like) — no training needed.
    Lower score = more important keyword in YAKE.
    """
    if not text or len(text.strip()) < 10:
        return []

    try:
        # YAKE configuration
        language = "en"
        max_ngram_size = 2        # allow 1-2 word phrases
        deduplication_threshold = 0.7
        num_of_keywords = max_keywords

        kw_extractor = yake.KeywordExtractor(
            lan=language,
            n=max_ngram_size,
            dedupLim=deduplication_threshold,
            top=num_of_keywords,
            features=None,
        )

        keywords = kw_extractor.extract_keywords(text)
        # Return only keyword strings (not scores), sorted by importance
        return [kw[0].lower() for kw in keywords]

    except Exception as e:
        logger.error(f"Keyword extraction error: {e}")
        return []


def summarize_text(text: str, sentence_count: int = 3) -> str:
    """
    Use Sumy LSA algorithm to extract most important sentences.
    Extractive summarization — picks best existing sentences.
    Returns a summary paragraph.
    """
    if not text or len(text.strip()) < 30:
        return text.strip() if text else ""

    try:
        # Count sentences — don't request more than exist
        sentence_count_in_text = len(re.findall(r"[.!?]+", text))
        actual_count = min(sentence_count, max(1, sentence_count_in_text))

        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        stemmer = Stemmer("english")
        summarizer = LsaSummarizer(stemmer)
        summarizer.stop_words = get_stop_words("english")

        summary_sentences = summarizer(parser.document, actual_count)
        summary = " ".join(str(sentence) for sentence in summary_sentences)

        return summary if summary else text[:300]

    except Exception as e:
        logger.error(f"Summarization error: {e}")
        # Fallback: return first 300 chars
        return text[:300] + "..." if len(text) > 300 else text


def calculate_stats(sentiment_results: list[dict]) -> dict:
    """Calculate sentiment counts and percentages from results list."""
    total = len(sentiment_results)
    if total == 0:
        return {
            "total": 0,
            "positiveCount": 0,
            "neutralCount": 0,
            "negativeCount": 0,
            "positivePercent": 0,
            "neutralPercent": 0,
            "negativePercent": 0,
            "avgCompound": 0,
        }

    positive = sum(1 for r in sentiment_results if r["sentiment"] == "POSITIVE")
    neutral = sum(1 for r in sentiment_results if r["sentiment"] == "NEUTRAL")
    negative = sum(1 for r in sentiment_results if r["sentiment"] == "NEGATIVE")
    avg_compound = sum(r["compound"] for r in sentiment_results) / total

    return {
        "total": total,
        "positiveCount": positive,
        "neutralCount": neutral,
        "negativeCount": negative,
        "positivePercent": round((positive / total) * 100, 1),
        "neutralPercent": round((neutral / total) * 100, 1),
        "negativePercent": round((negative / total) * 100, 1),
        "avgCompound": round(avg_compound, 4),
    }


# ─── ROUTES ──────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint — Next.js can ping this to verify service is up."""
    return jsonify({ "status": "ok", "service": "EventSphere NLP" })


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Main analysis endpoint.
    
    Expected request body:
    {
        "eventId": "string",
        "feedbacks": [
            { "id": "feedback-id", "comment": "The session was very informative." },
            { "id": "feedback-id-2", "comment": "Could have been better." },
            ...
        ]
    }
    
    Returns:
    {
        "eventId": "string",
        "results": [
            {
                "id": "feedback-id",
                "comment": "The session was very informative.",
                "sentiment": "POSITIVE",
                "compound": 0.6249,
                "positive": 0.491,
                "neutral": 0.509,
                "negative": 0.0
            },
            ...
        ],
        "keywords": ["informative", "session", "practical examples", ...],
        "summary": "Students found the session highly engaging...",
        "stats": {
            "total": 20,
            "positiveCount": 14,
            "neutralCount": 4,
            "negativeCount": 2,
            "positivePercent": 70.0,
            "neutralPercent": 20.0,
            "negativePercent": 10.0,
            "avgCompound": 0.4231
        }
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({ "error": "Request body is required" }), 400

        event_id = data.get("eventId", "")
        feedbacks = data.get("feedbacks", [])

        if not feedbacks:
            return jsonify({ "error": "feedbacks array is required and cannot be empty" }), 400

        if not isinstance(feedbacks, list):
            return jsonify({ "error": "feedbacks must be an array" }), 400

        logger.info(f"Analyzing {len(feedbacks)} feedbacks for event: {event_id}")

        # ── Step 1: Analyze sentiment for each feedback ──────────────────────
        results = []
        for fb in feedbacks:
            fb_id = fb.get("id", "")
            comment = fb.get("comment", "")

            if not comment or not comment.strip():
                results.append({
                    "id": fb_id,
                    "comment": comment,
                    "sentiment": "NEUTRAL",
                    "compound": 0.0,
                    "positive": 0.0,
                    "neutral": 1.0,
                    "negative": 0.0,
                })
                continue

            sentiment_result = analyze_sentiment(comment)
            results.append({
                "id": fb_id,
                "comment": comment,
                "sentiment": sentiment_result["label"],
                "compound": sentiment_result["compound"],
                "positive": sentiment_result["positive"],
                "neutral": sentiment_result["neutral"],
                "negative": sentiment_result["negative"],
            })

        # ── Step 2: Combine all comments for keyword + summary ───────────────
        all_comments_combined = " ".join(
            fb.get("comment", "") for fb in feedbacks if fb.get("comment", "").strip()
        )

        # ── Step 3: Extract keywords from combined text ──────────────────────
        keywords = extract_keywords(all_comments_combined, max_keywords=10)

        # ── Step 4: Generate summary from combined text ──────────────────────
        summary = summarize_text(all_comments_combined, sentence_count=3)

        # ── Step 5: Calculate overall stats ─────────────────────────────────
        stats = calculate_stats(results)

        logger.info(f"Analysis complete for event {event_id}: {stats}")

        return jsonify({
            "eventId": event_id,
            "results": results,
            "keywords": keywords,
            "summary": summary,
            "stats": stats,
        })

    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({ "error": f"Analysis failed: {str(e)}" }), 500


@app.route("/sentiment", methods=["POST"])
def sentiment_only():
    """
    Quick sentiment check for a single comment.
    Useful for testing.
    
    Body: { "comment": "The session was amazing!" }
    """
    try:
        data = request.get_json()
        comment = data.get("comment", "")

        if not comment:
            return jsonify({ "error": "comment is required" }), 400

        result = analyze_sentiment(comment)
        return jsonify(result)

    except Exception as e:
        return jsonify({ "error": str(e) }), 500


# ─── MAIN ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 50)
    print("  EventSphere NLP Microservice")
    print("  Running on http://localhost:5000")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True)
