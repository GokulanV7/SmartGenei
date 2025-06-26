import logging
import os
import re
import requests
import uvicorn
from datetime import datetime
from typing import Optional, List, Dict

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings

# Import search tools
from langchain_community.tools import DuckDuckGoSearchRun

# --- Configuration ---
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    groq_api_key: Optional[str] = Field(None, env="GROQ_API_KEY")
    youtube_api_key: Optional[str] = Field(None, env="YOUTUBE_API_KEY")
    model_name: str = Field("llama3-8b-8192", env="GROQ_MODEL_NAME")
    model_temperature: float = Field(0.3, env="MODEL_TEMPERATURE")
    max_response_words: int = Field(200, env="MAX_RESPONSE_WORDS") # Base for direct, smaller
    enable_web_search: bool = Field(True, env="ENABLE_WEB_SEARCH")
    enable_youtube_search: bool = Field(True, env="ENABLE_YOUTUBE_SEARCH")
    max_search_results_chars: int = Field(3000, env="MAX_SEARCH_RESULTS_CHARS") # Increased slightly
    max_youtube_results: int = Field(3, env="MAX_YOUTUBE_RESULTS")

    class Config:
        env_file = ".env"
        extra = "ignore"
        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str) -> any:
            if field_name in ['enable_web_search', 'enable_youtube_search']:
                return raw_val.lower() in ('true', '1', 'yes')
            return raw_val

settings = Settings()

# --- Constants ---
MODEL_STATUS_UNINITIALIZED = "uninitialized"
MODEL_STATUS_CONNECTED = "connected"
MODEL_STATUS_ERROR_PREFIX = "error: "
MODEL_STATUS_API_KEY_MISSING = f"{MODEL_STATUS_ERROR_PREFIX}GROQ_API_KEY not set"
MODEL_STATUS_YOUTUBE_API_KEY_MISSING = f"{MODEL_STATUS_ERROR_PREFIX}YOUTUBE_API_KEY not set (YouTube search may be limited)"

SOURCE_GROQ_AI_DIRECT = "SmartGenie (Direct Knowledge)"
SOURCE_GROQ_AI_RECONCILED = "SmartGenie (Knowledge Verified & Updated with Search)"
SOURCE_GROQ_AI_WITH_SEARCH = "SmartGenie (with Web Search)"
SOURCE_GROQ_AI_WITH_YOUTUBE = "SmartGenie (with YouTube Search)"
SOURCE_GROQ_AI_WITH_MIXED_SEARCH = "SmartGenie (with Web + YouTube Search)"
SOURCE_SYSTEM = "SmartGenie System"

CONFIDENCE_HIGH = "high"
CONFIDENCE_MEDIUM = "medium"
CONFIDENCE_LOW = "low"

ANSWER_UNKNOWN = "Hmm, I'm not sure about that one!"
ANSWER_SERVICE_UNAVAILABLE = "Oops! I'm having some technical difficulties right now. Mind trying again in a bit?"
ANSWER_PROCESSING_ERROR = "Something went wrong on my end! Give it another shot, would you?"

YOUTUBE_TRIGGER_KEYWORDS = [
    "video", "tutorial", "how to", "demonstration", "show me", "watch", "visual",
    "step by step", "guide", "example", "demo", "learn", "course", "lesson",
    "explain visually", "see how", "youtube", "clip", "footage", "review of", "unboxing"
]
FORBIDDEN_PHRASES_IN_RESPONSE = [
    "you should check", "you should search", "i recommend looking up", "you can look up",
    "try searching for", "i suggest you search", "you might want to search",
    "consider searching", "feel free to search", "let me know if you need me to search",
    "you can find more information", "please search for", "try looking up"
]
COMMON_LLM_REFUSALS = [
    "i'm sorry, but i cannot", "i'm unable to provide", "i cannot provide information",
    "i'm not programmed to", "as an ai, i cannot", "i don't have the ability to",
    "i cannot answer this question", "i'm not able to", "i do not have access to real-time information",
    "my knowledge cutoff", "i am an ai language model", "i am a large language model",
    "i am an ai assistant", "i'm an ai assistant", "as a language model"
]

# --- FastAPI Application Setup ---
app = FastAPI(
    title="SmartGenie - Your Casual AI Assistant",
    description="Hey there! I'm SmartGenie, your friendly AI buddy who gives straight answers and finds cool stuff on the web and YouTube when needed!"
)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

# --- Global LLM & Tool Variables ---
groq_llm: Optional[ChatGroq] = None
direct_llm_chain: Optional[LLMChain] = None
search_augmented_llm_chain: Optional[LLMChain] = None
reconciliation_llm_chain: Optional[LLMChain] = None
model_status: str = MODEL_STATUS_UNINITIALIZED
ddg_search: Optional[DuckDuckGoSearchRun] = None

# --- Prompt Templates ---
STRICT_PROMPT_TEMPLATE_TEXT = """
You are SmartGenie, a friendly and casual AI assistant who gives detailed, comprehensive, and helpful answers.
Follow these rules:
1. Give a thorough, detailed answer if you know it from your knowledge. Provide context, examples, and comprehensive information.
2. If you don't know something, just say "Hmm, I'm not sure about that one!"
3. Keep it friendly and conversational - like you're having an in-depth chat with a friend who wants to learn.
4. Don't suggest looking things up elsewhere or mention being an AI, or your knowledge cutoff.
5. Aim for detailed responses (around {max_words} words) that are informative and comprehensive.
6. Use casual language - contractions are fine (like "don't", "can't", "it's").
7. Include relevant details, context, examples, and explanations to make your answer comprehensive.
8. Break down complex topics into understandable parts while maintaining a conversational tone.

Current date: {current_date}
Question: {question}

Answer (detailed and comprehensive, around {max_words} words, or "Hmm, I'm not sure about that one!"):
"""

SEARCH_AUGMENTED_PROMPT_TEMPLATE_TEXT = """
You are SmartGenie, a friendly AI assistant. Your goal is to provide a detailed, comprehensive, and helpful answer based *entirely* on the "Search Results" provided.
Follow these rules VERY STRICTLY:
1.  **Synthesize your answer using ONLY the information found in the "Search Results" section.** Do not use any external knowledge.
2.  If the "Search Results" contain information relevant to the "Question", you MUST formulate an answer based on them.
3.  If the "Search Results" are truly irrelevant or insufficient to answer the "Question" even in a summary form, *only then* should you say "Hmm, I'm not sure about that one!"
4.  Your answer should be detailed and comprehensive. If the question is about "latest news" or recent events, summarize the key events, scores, or updates found in the search results.
5.  Aim for a response around **{max_words_augmented} words**. Be informative and cover the main points from the search results.
6.  Keep it casual and conversational, like you're sharing interesting findings with a friend.
7.  Do not say "based on the search results" or "the search results indicate." Integrate the information naturally.
8.  If there are YouTube videos in the "Search Results," casually mention them. For example: "It looks like there was an exciting match recently! There's a video from [Channel] titled '[Video Title]' that covers..." and then briefly explain what the video discusses based on its title or description in the search results.
9.  If you see Wikipedia articles, news sites, or other web links, you can mention the general topics they cover if relevant. For example: "For more background, sites like [Site Name] or Wikipedia have more details on [Topic]."
10. Combine information from different search snippets if they cover the same event or topic to create a more complete picture.
11. Focus on directly addressing the user's "Question" using the provided "Search Results."

Search Results:
{search_results}

Current date: {current_date}
Question: {question}

Answer (detailed, comprehensive, around {max_words_augmented} words, based ONLY on search results, or "Hmm, I'm not sure about that one!" if results are truly unhelpful):
"""

RECONCILE_PROMPT_TEMPLATE_TEXT = """
You are SmartGenie, an AI assistant focused on accuracy and providing up-to-date, comprehensive, and friendly information.
You have an original question, an initial answer provided by an AI from its internal knowledge, and fresh search results.
Your task is to provide the most accurate, current, and detailed answer to the question, presented casually.

Follow these rules:
1.  Carefully compare the "Initial AI Answer" with the "Search Results."
2.  If the "Search Results" provide more current or accurate information that contradicts or significantly updates the "Initial AI Answer", formulate a comprehensive new answer based PRIMARILY on the "Search Results". You can casually mention that the information has been updated if it feels natural (e.g., "Oh, it looks like the latest info shows..." or "Actually, things have changed a bit...").
3.  If the "Initial AI Answer" is largely consistent with the "Search Results" and still accurate, you can affirm it and expand it significantly with details from the search results to create a comprehensive response.
4.  If the "Search Results" do not provide a clear answer to the specific question or seem irrelevant, and the "Initial AI Answer" was a reasonable attempt, expand on the initial answer with additional context and details. If both are weak or the search doesn't clarify, it's okay to respond with "Hmm, I'm not sure about that one!"
5.  Provide detailed, comprehensive answers (around {max_words_reconciled} words) that are friendly, conversational, and informative.
6.  Do not explicitly say "Based on my initial knowledge..." or "The search results explicitly state...". Integrate the information naturally as if you just found it out.
7.  Include relevant context, examples, background information, and detailed explanations to make your answer thorough and helpful.
8.  If you see Wikipedia articles, academic sources, YouTube videos, or educational resources in the search results, casually reference them as great places to learn more.

Current date: {current_date}
Original Question: {question}
Initial AI Answer: {initial_answer}

Search Results:
{search_results}

Final Updated Answer (detailed and comprehensive, around {max_words_reconciled} words, or "Hmm, I'm not sure about that one!"):
"""

# --- Pydantic Models ---
class QuestionRequest(BaseModel):
    question: str
    include_youtube: Optional[bool] = True

class YouTubeVideo(BaseModel):
    title: str
    url: str
    channel: str
    description: str
    duration: Optional[str] = None
    view_count: Optional[str] = None
    published_at: Optional[str] = None

class AnswerResponse(BaseModel):
    answer: str
    source: str
    confidence: str
    search_performed: bool = False
    youtube_search_performed: bool = False
    search_queries_used: Optional[List[str]] = None
    source_urls: Optional[List[str]] = None
    youtube_videos: Optional[List[YouTubeVideo]] = None
    additional_resources: Optional[Dict[str, List[str]]] = None

# --- Helper Functions ---
def get_current_date() -> str:
    return datetime.now().strftime("%Y-%m-%d")

def should_search_youtube(question: str) -> bool:
    question_lower = question.lower()
    return any(keyword in question_lower for keyword in YOUTUBE_TRIGGER_KEYWORDS)

def is_question_potentially_stale(question: str) -> bool:
    question_lower = question.lower()
    stale_keywords = [
        "current", "latest", "now", "today", "who is the president", "who is the ceo",
        "what is the price of", "update on", "news about", "what's new", "currently",
        "how many", "population of", "record for", "election", "winner of"
    ]
    if re.search(r"who is (the|current|new) (\w+ )*(president|ceo|minister|mayor|governor|chancellor|chairman|secretary|leader|winner|champion|monarch|king|queen|prime minister)", question_lower):
        return True
    return any(keyword in question_lower for keyword in stale_keywords)

def clean_response(response_text: str, is_from_search: bool = False) -> str:
    cleaned = response_text.strip()
    if not cleaned: return ANSWER_UNKNOWN
    lower_cleaned = cleaned.lower()

    # Check for "Hmm, I'm not sure..." early
    if "hmm, i'm not sure about that one!" in lower_cleaned or cleaned == ANSWER_UNKNOWN:
        return ANSWER_UNKNOWN
        
    for refusal in COMMON_LLM_REFUSALS:
        if refusal in lower_cleaned:
            logger.debug(f"Refusal phrase '{refusal}' found in response: '{cleaned[:100]}...'")
            return ANSWER_UNKNOWN
    for phrase in FORBIDDEN_PHRASES_IN_RESPONSE:
        if phrase in lower_cleaned:
            logger.debug(f"Forbidden phrase '{phrase}' found in response: '{cleaned[:100]}...'")
            # This might be too aggressive if the LLM is just trying to be polite.
            # Consider if these should always lead to ANSWER_UNKNOWN or just be cleaned.
            # For now, keeping it as leading to UNKNOWN to enforce direct answers.
            return ANSWER_UNKNOWN
            
    preambles_to_remove = [
        "answer:", "response:", "here is the answer:", "the answer is:",
        "certainly, here's the information:", "okay, here's that:", "sure!", "absolutely!"
    ]
    for preamble in preambles_to_remove:
        if cleaned.lower().startswith(preamble):
            cleaned = cleaned[len(preamble):].lstrip()
            logger.debug(f"Removed preamble '{preamble}' from response: '{cleaned[:100]}...'")

    # Determine the target max words based on whether it was a searched response
    if is_from_search:
        target_max_words = settings.max_response_words + 150 # Corresponds to max_words_augmented/reconciled
        if target_max_words < 300: target_max_words = 300
    else:
        target_max_words = settings.max_response_words

    absolute_max_words_limit = target_max_words * 1.25 # Allow 25% leeway
    words = cleaned.split()

    if len(words) > absolute_max_words_limit:
        logger.debug(f"Response too long: '{cleaned[:100]}...' ({len(words)} words, limit ~{int(absolute_max_words_limit)})")
        sentences = re.split(r'(?<=[.!?])\s+', cleaned) # Split sentences more robustly
        truncated_response = ""
        word_count = 0
        
        for i, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if not sentence: continue
            
            sentence_words = sentence.split()
            if not sentence_words: continue

            if word_count + len(sentence_words) <= absolute_max_words_limit:
                truncated_response += sentence + " "
                word_count += len(sentence_words)
            else:
                # If it's the first sentence and it's already too long, we might have an issue
                # or the sentence is just naturally very long.
                if i == 0: 
                    truncated_response = " ".join(sentence_words[:int(absolute_max_words_limit)]) + "..."
                    word_count = len(truncated_response.split())
                break # Stop adding sentences
        
        cleaned = truncated_response.strip()
        # Check if the truncated response is substantial enough
        if word_count >= target_max_words * 0.6: # At least 60% of original target
            logger.debug(f"Truncated to: '{cleaned[:100]}...' ({word_count} words)")
            return cleaned
        else:
            logger.debug(f"Truncation resulted in too short response ({word_count} words vs target {target_max_words}). Returning UNKNOWN.")
            return ANSWER_UNKNOWN
            
    return cleaned.strip()

def extract_urls_from_search_results(search_results_text: str) -> Dict[str, List[str]]:
    url_pattern = r'https?://[^\s<>"\'()\[\]{}|\\^`\n]+[^\s<>"\'()\[\]{}|\\^`.,;:!?\n]'
    markdown_link_pattern = r'\[[^\]]+\]\((https?://[^\s<>"\'()\[\]{}|\\^`\n]+[^\s<>"\'()\[\]{}|\\^`.,;:!?\n])\)'
    wrapped_url_pattern = r'[<"\']+(https?://[^\s<>"\'()\[\]{}|\\^`\n]+)[>"\']+'
    
    categorized_urls = {
        'wikipedia': [], 'academic': [], 'news': [],
        'government': [], 'educational': [], 'general': []
    }
    all_urls = set()
    
    for pattern in [url_pattern, markdown_link_pattern, wrapped_url_pattern]:
        found_urls = re.findall(pattern, search_results_text, re.IGNORECASE)
        for url_match in found_urls:
            url = url_match if isinstance(url_match, str) else url_match[0] if isinstance(url_match, tuple) and url_match else None
            if not url: continue
            url_cleaned = url.strip().rstrip(').,!?:;"\'')
            if not any(blocked_domain in url_cleaned.lower() for blocked_domain in ["duckduckgo.com", "google.com/search", "bing.com/search"]):
                all_urls.add(url_cleaned)
    
    logger.debug(f"Extracted {len(all_urls)} unique URLs from search results before categorization.")
    
    for url in all_urls:
        url_lower = url.lower()
        if 'wikipedia.org' in url_lower or 'wiki' in url_lower:
            categorized_urls['wikipedia'].append(url)
        elif any(domain in url_lower for domain in ['.edu', 'scholar.', 'academia.', 'researchgate.', 'pubmed.', 'arxiv.', 'jstor.', 'springer.', 'ieee.', 'acm.org']):
            categorized_urls['academic'].append(url)
        elif any(domain in url_lower for domain in ['.gov', '.mil', 'who.int', 'un.org', 'unesco.', 'worldbank.', 'imf.org', 'europa.eu']):
            categorized_urls['government'].append(url)
        elif any(domain in url_lower for domain in ['bbc.', 'cnn.', 'reuters.', 'ap.org', 'npr.', 'news', 'guardian.', 'nytimes.', 'wsj.', 'bloomberg.', 'espn.', 'cricinfo.', 'espncricinfo.']):
            categorized_urls['news'].append(url)
        elif any(domain in url_lower for domain in ['coursera.', 'edx.', 'khanacademy.', 'udemy.', 'skillshare.', 'pluralsight.', 'lynda.', 'masterclass.']):
            categorized_urls['educational'].append(url)
        else:
            categorized_urls['general'].append(url)
            
    result = {k: v for k, v in categorized_urls.items() if v}
    logger.debug(f"Categorized URLs: {[(k, len(v)) for k, v in result.items()]}")
    return result

def get_legacy_urls_list(categorized_urls: Dict[str, List[str]]) -> List[str]:
    all_urls = []
    for category_urls in categorized_urls.values():
        all_urls.extend(category_urls)
    return list(set(all_urls))

async def search_youtube(query: str) -> tuple[List[YouTubeVideo], str]:
    youtube_videos_data = []
    youtube_context_text = ""
    if not settings.youtube_api_key:
        logger.warning("YouTube API key not provided. YouTube search will be skipped.")
        return youtube_videos_data, youtube_context_text
    if not settings.enable_youtube_search:
        logger.info("YouTube search is disabled by configuration.")
        return youtube_videos_data, youtube_context_text
    try:
        search_api_url = "https://www.googleapis.com/youtube/v3/search"
        search_params = {'part':'snippet','q':query,'type':'video','maxResults':settings.max_youtube_results,'key':settings.youtube_api_key,'order':'relevance','safeSearch':'moderate'}
        logger.info(f"Searching YouTube with query: '{query}'")
        response = requests.get(search_api_url, params=search_params, timeout=10)
        response.raise_for_status()
        search_data = response.json()
        video_ids = [item['id']['videoId'] for item in search_data.get('items', []) if item.get('id', {}).get('kind') == 'youtube#video']
        if not video_ids:
            logger.info("No YouTube video IDs found from search.")
            return youtube_videos_data, youtube_context_text
        videos_api_url = "https://www.googleapis.com/youtube/v3/videos"
        videos_params = {'part':'snippet,contentDetails,statistics','id':','.join(video_ids),'key':settings.youtube_api_key}
        details_response = requests.get(videos_api_url, params=videos_params, timeout=10)
        details_response.raise_for_status()
        videos_data = details_response.json()
        for item in videos_data.get('items', []):
            snippet, content_details, statistics = item.get('snippet',{}), item.get('contentDetails',{}), item.get('statistics',{})
            duration_iso = content_details.get('duration', '')
            duration_str = None
            if duration_iso:
                match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_iso)
                if match:
                    h, m, s = match.groups()
                    parts = [f"{x}{l}" for x, l in zip([h, m, s], ['h', 'm', 's']) if x]
                    duration_str = " ".join(parts) if parts else "N/A"
            view_count_str = None
            if 'viewCount' in statistics:
                vc = int(statistics['viewCount'])
                if vc >= 1_000_000: view_count_str = f"{vc/1_000_000:.1f}M views"
                elif vc >= 1_000: view_count_str = f"{vc/1_000:.1f}K views"
                else: view_count_str = f"{vc} views"
            video = YouTubeVideo(title=snippet.get('title','N/A'),url=f"https://www.youtube.com/watch?v={item['id']}",channel=snippet.get('channelTitle','N/A'),
                                 description=snippet.get('description','')[:250]+"..." if snippet.get('description') else 'N/A',
                                 duration=duration_str,view_count=view_count_str,published_at=snippet.get('publishedAt',''))
            youtube_videos_data.append(video)
            youtube_context_text += f"YouTube Video: {video.title}\nChannel: {video.channel}\n"
            if video.duration: youtube_context_text += f"Duration: {video.duration}\n"
            if video.view_count: youtube_context_text += f"Views: {video.view_count}\n"
            youtube_context_text += f"Description Snippet: {video.description}\nURL: {video.url}\n\n"
        logger.info(f"Found {len(youtube_videos_data)} YouTube videos for query: {query}")
    except requests.exceptions.RequestException as e: logger.error(f"YouTube API request error: {e}")
    except Exception as e: logger.error(f"Error processing YouTube search: {e}", exc_info=True)
    return youtube_videos_data, youtube_context_text.strip()

async def perform_enhanced_web_search(query: str) -> tuple[str, Dict[str, List[str]]]:
    search_results_context = ""
    categorized_urls: Dict[str, List[str]] = {}
    
    if ddg_search:
        try:
            logger.info(f"Attempting DuckDuckGo search for: '{query}'")
            ddg_result_text = await ddg_search.arun(query)
            logger.info(f"DDG result length: {len(ddg_result_text) if ddg_result_text else 0}")
            
            if ddg_result_text and len(ddg_result_text.strip()) > 20:
                search_results_context += f"Web Search Results (from DuckDuckGo):\n{ddg_result_text}\n\n"
                extracted_urls = extract_urls_from_search_results(ddg_result_text)
                for category, urls in extracted_urls.items():
                    categorized_urls.setdefault(category, []).extend(urls)
                logger.info(f"DDG search successful. Found URL categories: {list(categorized_urls.keys())}")
                # return search_results_context, categorized_urls # Don't return early, allow suggested URLs too
            else:
                logger.warning(f"DDG search returned insufficient results: {ddg_result_text[:100] if ddg_result_text else 'None'}")
        except Exception as e:
            logger.error(f"DDG search failed: {e}", exc_info=True)
    
    # Always try to generate suggested URLs, they can supplement DDG or act as fallback
    logger.info("Attempting to generate suggested URLs.")
    suggested_urls_map = generate_suggested_urls(query)
    if suggested_urls_map:
        temp_suggested_context = f"Suggested Resources for '{query}':\n"
        has_suggestions = False
        for category, urls in suggested_urls_map.items():
            if urls:
                has_suggestions = True
                temp_suggested_context += f"\n{category.title()} Sources:\n"
                # Add to categorized_urls, ensuring uniqueness if DDG already found some
                current_cat_urls = categorized_urls.setdefault(category, [])
                for url in urls:
                    if url not in current_cat_urls:
                        current_cat_urls.append(url)
                        temp_suggested_context += f"- {url}\n" # Only add to context if new
        
        if has_suggestions: # Only add context if new suggestions were actually added to text
            if any(len(urls_in_cat) > 0 for cat_name, urls_in_cat in suggested_urls_map.items()): # Check if any actual URLs were added
                 if not search_results_context.strip().endswith(temp_suggested_context.strip()): # Avoid duplication if context is same
                    search_results_context += temp_suggested_context + "\n"
            logger.info(f"Generated/merged {len(categorized_urls)} categories of suggested URLs.")
        else:
            logger.info("No new suggested URLs were generated or added to context.")
            
    return search_results_context, categorized_urls

def generate_suggested_urls(query: str) -> Dict[str, List[str]]:
    query_lower = query.lower()
    suggested_urls: Dict[str, List[str]] = {}
    
    wikipedia_topics = []
    if any(word in query_lower for word in ['climate', 'environment', 'global warming']):
        wikipedia_topics = ["https://en.wikipedia.org/wiki/Climate_change", "https://en.wikipedia.org/wiki/Global_warming"]
    elif any(word in query_lower for word in ['cricket', 'india', 'england', 'test match']):
        wikipedia_topics = ["https://en.wikipedia.org/wiki/Cricket", "https://en.wikipedia.org/wiki/India_national_cricket_team", "https://en.wikipedia.org/wiki/England_cricket_team"]
    elif any(word in query_lower for word in ['covid', 'coronavirus', 'pandemic']):
        wikipedia_topics = ["https://en.wikipedia.org/wiki/COVID-19", "https://en.wikipedia.org/wiki/COVID-19_pandemic"]
    elif any(word in query_lower for word in ['ai', 'artificial intelligence', 'machine learning']):
        wikipedia_topics = ["https://en.wikipedia.org/wiki/Artificial_intelligence", "https://en.wikipedia.org/wiki/Machine_learning"]
    if wikipedia_topics: suggested_urls['wikipedia'] = wikipedia_topics
    
    news_sources = []
    if any(word in query_lower for word in ['cricket', 'sports', 'match', 'india', 'england']):
        news_sources = ["https://www.espncricinfo.com", "https://www.bbc.com/sport/cricket", "https://www.cricbuzz.com"]
    elif any(word in query_lower for word in ['climate', 'environment', 'weather']):
        news_sources = ["https://www.bbc.com/news/science-environment", "https://www.reuters.com/business/environment/"]
    elif any(word in query_lower for word in ['technology', 'ai', 'tech']):
        news_sources = ["https://www.bbc.com/news/technology", "https://www.reuters.com/technology/"]
    if news_sources: suggested_urls['news'] = news_sources
    
    educational_sources = []
    if any(word in query_lower for word in ['learn', 'tutorial', 'course', 'education']):
        educational_sources = ["https://www.coursera.org", "https://www.khanacademy.org"]
    if educational_sources: suggested_urls['educational'] = educational_sources
        
    gov_sources = []
    if any(word in query_lower for word in ['climate', 'environment', 'policy']):
        gov_sources = ["https://www.epa.gov", "https://www.who.int"]
    if gov_sources: suggested_urls['government'] = gov_sources
        
    return suggested_urls

async def perform_search(query: str, include_youtube_flag: bool) -> tuple[str, List[str], Dict[str, List[str]], List[YouTubeVideo]]:
    search_results_context = ""
    queries_used = []
    categorized_urls: Dict[str, List[str]] = {}
    youtube_videos_found: List[YouTubeVideo] = []
    
    if settings.enable_web_search:
        try:
            web_context_text, web_urls_map = await perform_enhanced_web_search(query)
            if web_context_text:
                search_results_context += web_context_text
                # Only add web query if context was actually generated
                if "Web Search Results" in web_context_text or "Suggested Resources" in web_context_text:
                     queries_used.append(f"Web: {query}")

            if isinstance(web_urls_map, dict):
                for category, urls in web_urls_map.items():
                    current_cat_urls = categorized_urls.setdefault(category, [])
                    for url in urls:
                        if url not in current_cat_urls:
                            current_cat_urls.append(url)
            logger.info(f"Web search completed. Found categories: {list(categorized_urls.keys())}")
        except Exception as e:
            logger.error(f"Enhanced web search failed: {e}", exc_info=True)
    else:
        logger.info("Web search is disabled by configuration.")

    should_run_youtube_search = include_youtube_flag and settings.enable_youtube_search and settings.youtube_api_key
    if should_run_youtube_search:
        try:
            youtube_vids, youtube_ctx = await search_youtube(query)
            if youtube_ctx: # If any text context from YouTube
                search_results_context += f"\nCool YouTube Videos Found:\n{youtube_ctx}\n\n"
                queries_used.append(f"YouTube: {query}")
            if youtube_vids: # If any video objects
                youtube_videos_found.extend(youtube_vids)
            logger.debug(f"YouTube search for '{query}' yielded {len(youtube_videos_found)} videos.")
        except Exception as e: 
            logger.error(f"Error during YouTube search integration: {e}", exc_info=True)
    elif include_youtube_flag and settings.enable_youtube_search and not settings.youtube_api_key: 
        logger.warning("YouTube search requested and enabled, but YOUTUBE_API_KEY is missing.")
    elif not include_youtube_flag: 
        logger.info("YouTube search skipped as per request flag.")
    elif not settings.enable_youtube_search: 
        logger.info("YouTube search skipped as it's disabled in configuration.")

    if len(search_results_context) > settings.max_search_results_chars:
        search_results_context = search_results_context[:settings.max_search_results_chars] + "\n... [Search results truncated due to length]"
        logger.info(f"Combined search results truncated to {settings.max_search_results_chars} characters.")
    
    return search_results_context.strip(), queries_used, categorized_urls, youtube_videos_found

# --- FastAPI Events ---
@app.on_event("startup")
async def startup_event():
    global groq_llm, direct_llm_chain, search_augmented_llm_chain, reconciliation_llm_chain, model_status, ddg_search
    logger.info("SmartGenie is waking up! Initializing AI and search tools...")
    if not settings.groq_api_key:
        model_status = MODEL_STATUS_API_KEY_MISSING
        logger.error(model_status)
    else:
        try:
            groq_llm = ChatGroq(temperature=settings.model_temperature, model_name=settings.model_name, groq_api_key=settings.groq_api_key)
            
            # Max words for responses generated from search results (can be larger)
            max_words_for_searched_answer = settings.max_response_words + 150 
            if max_words_for_searched_answer < 300: # Ensure at least 300
                max_words_for_searched_answer = 300
            logger.info(f"Max words for direct answers: {settings.max_response_words}")
            logger.info(f"Max words for search-based/reconciled answers: {max_words_for_searched_answer}")


            direct_prompt_template = PromptTemplate(
                template=STRICT_PROMPT_TEMPLATE_TEXT, 
                input_variables=["current_date", "question"], 
                partial_variables={"max_words": str(settings.max_response_words)}
            )
            direct_llm_chain = LLMChain(prompt=direct_prompt_template, llm=groq_llm)
            
            search_augmented_prompt_template = PromptTemplate(
                template=SEARCH_AUGMENTED_PROMPT_TEMPLATE_TEXT, 
                input_variables=["current_date", "question", "search_results"], 
                partial_variables={"max_words_augmented": str(max_words_for_searched_answer)}
            )
            search_augmented_llm_chain = LLMChain(prompt=search_augmented_prompt_template, llm=groq_llm)

            reconcile_prompt_template = PromptTemplate(
                template=RECONCILE_PROMPT_TEMPLATE_TEXT, 
                input_variables=["current_date", "question", "initial_answer", "search_results"], 
                partial_variables={"max_words_reconciled": str(max_words_for_searched_answer)}
            )
            reconciliation_llm_chain = LLMChain(prompt=reconcile_prompt_template, llm=groq_llm)
            
            model_status = MODEL_STATUS_CONNECTED
            logger.info(f"SmartGenie's brain (all chains) is ready! Using {settings.model_name}")
        except Exception as e:
            model_status = f"{MODEL_STATUS_ERROR_PREFIX}LLM_CHAINS_INIT_FAILED: {str(e)}"
            logger.error(f"SmartGenie had trouble starting up its brain: {model_status}", exc_info=True)
            groq_llm, direct_llm_chain, search_augmented_llm_chain, reconciliation_llm_chain = None, None, None, None
            
    if settings.enable_web_search:
        try:
            ddg_search = DuckDuckGoSearchRun(max_results=5, safesearch="moderate", region="wt-wt")
            logger.info("SmartGenie's web search powers (DuckDuckGo) are ready!")
        except Exception as e:
            logger.error(f"Failed to initialize DuckDuckGo search: {e}", exc_info=True)
            ddg_search = None
    else:
        ddg_search = None
        logger.info("Web search is turned off for SmartGenie.")
        
    if settings.enable_youtube_search and not settings.youtube_api_key:
        logger.warning(MODEL_STATUS_YOUTUBE_API_KEY_MISSING + " SmartGenie might not find YouTube videos.")
        
    logger.info(f"Web search for SmartGenie: {'Enabled and tool ready' if ddg_search else ('Enabled but tool failed' if settings.enable_web_search else 'Disabled')}")
    logger.info(f"YouTube search for SmartGenie: {'Enabled' if settings.enable_youtube_search else 'Disabled'}")
    logger.info(f"YouTube API key for SmartGenie: {'Configured' if settings.youtube_api_key else 'Missing'}")
    logger.info(f"SmartGenie is fully awake! LLM Status: {model_status}")

# --- API Endpoints ---
@app.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    if model_status != MODEL_STATUS_CONNECTED or not groq_llm or not direct_llm_chain or \
       not search_augmented_llm_chain or not reconciliation_llm_chain:
        logger.error(f"LLM service not fully available. Status: {model_status}")
        if model_status == MODEL_STATUS_API_KEY_MISSING:
            raise HTTPException(status_code=503, detail="Service configuration error: Groq API key missing.")
        raise HTTPException(status_code=503, detail=ANSWER_SERVICE_UNAVAILABLE)

    logger.info(f"Someone asked SmartGenie: '{request.question}' (Include YouTube: {request.include_youtube})")
    current_date_str = get_current_date()
    final_answer: str = ANSWER_UNKNOWN
    final_source: str = SOURCE_SYSTEM
    final_confidence: str = CONFIDENCE_LOW
    search_was_performed_flag: bool = False
    youtube_search_was_performed_flag: bool = False
    search_queries: List[str] = []
    categorized_web_urls: Dict[str, List[str]] = {}
    youtube_videos_results: List[YouTubeVideo] = []

    try:
        logger.info("SmartGenie is thinking (direct answer attempt)...")
        context_direct = {"current_date": current_date_str, "question": request.question}
        raw_direct_response = await direct_llm_chain.arun(context_direct)
        logger.info(f"SmartGenie's first thought (raw): '{raw_direct_response[:200]}...'")
        cleaned_direct_answer = clean_response(raw_direct_response, is_from_search=False)
        logger.info(f"SmartGenie's cleaned direct answer: '{cleaned_direct_answer[:200]}...'")

        is_direct_answer_unknown = cleaned_direct_answer == ANSWER_UNKNOWN # Simpler check now
        
        search_needed_for_unknown = is_direct_answer_unknown
        search_needed_for_staleness_check = not is_direct_answer_unknown and is_question_potentially_stale(request.question)
        
        should_perform_search_operation = search_needed_for_unknown or search_needed_for_staleness_check
        
        search_actually_possible = (settings.enable_web_search and ddg_search) or \
                                   (request.include_youtube and settings.enable_youtube_search and settings.youtube_api_key)
        
        if should_perform_search_operation and search_actually_possible:
            logger.info(f"Search operation initiated. Reason - Direct unknown: {search_needed_for_unknown}, Potentially stale: {search_needed_for_staleness_check}")
            
            search_context_str, search_queries_used_in_search, urls_from_search, yt_videos_from_search = await perform_search(
                request.question, include_youtube_flag=request.include_youtube
            )
            search_was_performed_flag = bool(search_queries_used_in_search) # If any queries were made
            
            search_queries.extend(search_queries_used_in_search)
            if isinstance(urls_from_search, dict):
                 categorized_web_urls = urls_from_search
            if yt_videos_from_search:
                youtube_videos_results.extend(yt_videos_from_search)
                youtube_search_was_performed_flag = True # Set if videos are found

            if search_context_str.strip(): # Check if search_context_str has actual content
                if search_needed_for_staleness_check and reconciliation_llm_chain:
                    logger.info("Reconciling potentially stale direct answer with new search results...")
                    context_reconcile = {"current_date": current_date_str, "question": request.question, "initial_answer": cleaned_direct_answer, "search_results": search_context_str}
                    raw_reconciled_response = await reconciliation_llm_chain.arun(context_reconcile)
                    final_answer = clean_response(raw_reconciled_response, is_from_search=True)
                    logger.info(f"LLM Reconciled Cleaned: '{final_answer[:200]}...'")
                    final_source = SOURCE_GROQ_AI_RECONCILED if final_answer != ANSWER_UNKNOWN else SOURCE_GROQ_AI_WITH_SEARCH
                    final_confidence = CONFIDENCE_HIGH if final_answer != ANSWER_UNKNOWN else CONFIDENCE_LOW
                
                elif search_needed_for_unknown and search_augmented_llm_chain:
                    logger.info("Direct answer was 'Unknown'. Augmenting with search results...")
                    context_augmented = {"current_date": current_date_str, "question": request.question, "search_results": search_context_str}
                    raw_augmented_response = await search_augmented_llm_chain.arun(context_augmented)
                    final_answer = clean_response(raw_augmented_response, is_from_search=True)
                    logger.info(f"LLM Augmented Cleaned: '{final_answer[:200]}...'")
                    if final_answer != ANSWER_UNKNOWN:
                        has_web_res = any("Web:" in q for q in search_queries) and categorized_web_urls
                        # youtube_search_was_performed_flag is already set if yt_videos_from_search was true
                        if has_web_res and youtube_search_was_performed_flag: final_source = SOURCE_GROQ_AI_WITH_MIXED_SEARCH
                        elif youtube_search_was_performed_flag: final_source = SOURCE_GROQ_AI_WITH_YOUTUBE
                        elif has_web_res: final_source = SOURCE_GROQ_AI_WITH_SEARCH
                        else: final_source = SOURCE_GROQ_AI_WITH_SEARCH # Fallback if search context was used
                        final_confidence = CONFIDENCE_MEDIUM if final_answer != ANSWER_UNKNOWN else CONFIDENCE_LOW
                    else: # Augmentation still led to "I don't know"
                        final_source = SOURCE_GROQ_AI_WITH_SEARCH # Source still reflects search attempt
                        final_confidence = CONFIDENCE_LOW
                else: # Fallback if conditions not met but search context exists
                    logger.warning("Search yielded context, but neither reconciliation nor augmentation path was fully taken. Using direct answer if available.")
                    final_answer = cleaned_direct_answer if not is_direct_answer_unknown else ANSWER_UNKNOWN
                    final_source = SOURCE_GROQ_AI_DIRECT if not is_direct_answer_unknown else SOURCE_SYSTEM
                    final_confidence = CONFIDENCE_HIGH if final_answer != ANSWER_UNKNOWN else CONFIDENCE_LOW
            else: # Search operation performed but yielded no text context
                logger.info("Search operation yielded no usable text context. Using direct answer if available.")
                final_answer = cleaned_direct_answer if not is_direct_answer_unknown else ANSWER_UNKNOWN
                final_source = SOURCE_GROQ_AI_DIRECT if not is_direct_answer_unknown else SOURCE_SYSTEM
                final_confidence = CONFIDENCE_HIGH if final_answer != ANSWER_UNKNOWN else CONFIDENCE_LOW
        else: # No search operation performed
            logger.info(f"No search operation performed or search tools not available. Search needed: {should_perform_search_operation}, Search possible: {search_actually_possible}")
            final_answer = cleaned_direct_answer
            final_source = SOURCE_GROQ_AI_DIRECT
            final_confidence = CONFIDENCE_HIGH if not is_direct_answer_unknown else CONFIDENCE_LOW
            search_was_performed_flag = False
            youtube_search_was_performed_flag = False
            search_queries = []
            categorized_web_urls = {}
            youtube_videos_results = []

        additional_res: Dict[str, List[str]] = {}
        if categorized_web_urls:
            if 'wikipedia' in categorized_web_urls and categorized_web_urls['wikipedia']:
                additional_res["wikipedia_articles"] = categorized_web_urls['wikipedia']
            if 'academic' in categorized_web_urls and categorized_web_urls['academic']:
                additional_res["academic_sources"] = categorized_web_urls['academic']
            if 'news' in categorized_web_urls and categorized_web_urls['news']:
                additional_res["news_articles"] = categorized_web_urls['news']
            if 'government' in categorized_web_urls and categorized_web_urls['government']:
                additional_res["government_sources"] = categorized_web_urls['government']
            if 'educational' in categorized_web_urls and categorized_web_urls['educational']:
                additional_res["educational_resources"] = categorized_web_urls['educational']
            if 'general' in categorized_web_urls and categorized_web_urls['general']:
                additional_res["web_sources"] = categorized_web_urls['general']
        
        if youtube_videos_results: 
            additional_res["youtube_videos_urls"] = [video.url for video in youtube_videos_results]
        
        legacy_web_urls = get_legacy_urls_list(categorized_web_urls) if categorized_web_urls else []
        
        # Final check if answer is still unknown despite search attempts
        if final_answer == ANSWER_UNKNOWN and search_was_performed_flag:
            logger.info(f"Final answer is UNKNOWN despite search. Question: '{request.question}'")
            # Source should reflect that search was attempted.
            # Confidence is already low.

        return AnswerResponse(
            answer=final_answer, source=final_source, confidence=final_confidence,
            search_performed=search_was_performed_flag,
            youtube_search_performed=youtube_search_was_performed_flag,
            search_queries_used=search_queries if search_queries else None,
            source_urls=legacy_web_urls if legacy_web_urls else None,
            youtube_videos=youtube_videos_results if youtube_videos_results else None,
            additional_resources=additional_res if additional_res else None
        )
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Unexpected error during /ask endpoint processing: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=ANSWER_PROCESSING_ERROR)

@app.get("/health")
async def health_check():
    is_llm_healthy = model_status == MODEL_STATUS_CONNECTED and all(
        chain is not None for chain in [groq_llm, direct_llm_chain, search_augmented_llm_chain, reconciliation_llm_chain]
    )
    
    web_search_status_detail = "disabled_by_configuration"
    if settings.enable_web_search:
        web_search_status_detail = "tool_initialized_and_ready" if ddg_search else "tool_initialization_failed_or_not_available"
    
    youtube_search_status_detail = "disabled_by_configuration"
    if settings.enable_youtube_search:
        youtube_search_status_detail = "enabled_with_api_key" if settings.youtube_api_key else "enabled_but_youtube_api_key_missing"

    overall_status = "healthy"
    if not is_llm_healthy: 
        overall_status = "degraded (LLM issue)"
    if settings.enable_web_search and not ddg_search:
        overall_status = "degraded (Web Search Tool issue)"
    if settings.enable_youtube_search and not settings.youtube_api_key:
        if overall_status == "healthy": overall_status = "degraded (YouTube API Key missing)"
        else: overall_status += " & YouTube API Key missing"

    return {
        "status": overall_status, "timestamp": datetime.utcnow().isoformat(),
        "llm_service": {"status": model_status, "model_name": settings.model_name if is_llm_healthy else None},
        "web_search_service": {"configured_enabled": settings.enable_web_search, "tool_status": web_search_status_detail},
        "youtube_search_service": {"configured_enabled": settings.enable_youtube_search, 
                                   "api_key_configured": bool(settings.youtube_api_key), "status": youtube_search_status_detail}
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting Uvicorn server for SmartGenie API on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)