import logging
import os
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
import requests # For YouTube API
import re

# --- Configuration ---
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    groq_api_key: Optional[str] = Field(None, env="GROQ_API_KEY")
    youtube_api_key: Optional[str] = Field(None, env="YOUTUBE_API_KEY")
    model_name: str = Field("llama3-8b-8192", env="GROQ_MODEL_NAME")
    model_temperature: float = Field(0.3, env="MODEL_TEMPERATURE")  # Slightly higher for more personality
    max_response_words: int = Field(45, env="MAX_RESPONSE_WORDS")  # A bit more room for casual tone
    enable_web_search: bool = Field(True, env="ENABLE_WEB_SEARCH")
    enable_youtube_search: bool = Field(True, env="ENABLE_YOUTUBE_SEARCH")
    max_search_results_chars: int = Field(2500, env="MAX_SEARCH_RESULTS_CHARS")
    max_youtube_results: int = Field(3, env="MAX_YOUTUBE_RESULTS")

    class Config:
        env_file = ".env"
        extra = "ignore"
        # For boolean conversion from env strings
        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str) -> any:
            if field_name in ['enable_web_search', 'enable_youtube_search']:
                return raw_val.lower() in ('true', '1', 'yes')
            # Fallback for other types if BaseSettings default parsing isn't enough
            return raw_val


settings = Settings()

# --- Constants ---
MODEL_STATUS_UNINITIALIZED = "uninitialized"
MODEL_STATUS_CONNECTED = "connected"
MODEL_STATUS_ERROR_PREFIX = "error: "
MODEL_STATUS_API_KEY_MISSING = f"{MODEL_STATUS_ERROR_PREFIX}GROQ_API_KEY not set"
MODEL_STATUS_YOUTUBE_API_KEY_MISSING = f"{MODEL_STATUS_ERROR_PREFIX}YOUTUBE_API_KEY not set (YouTube search may be limited)"


SOURCE_GROQ_AI_DIRECT = "SmartGenie (Direct Knowledge)"
SOURCE_GROQ_AI_WITH_SEARCH = "SmartGenie (with Web Search)"
SOURCE_GROQ_AI_WITH_YOUTUBE = "SmartGenie (with YouTube Search)"
SOURCE_GROQ_AI_WITH_MIXED_SEARCH = "SmartGenie (with Web + YouTube Search)"
SOURCE_SYSTEM = "SmartGenie System"

CONFIDENCE_HIGH = "high"
CONFIDENCE_MEDIUM = "medium"
CONFIDENCE_LOW = "low"

# More casual responses
ANSWER_UNKNOWN = "Hmm, I'm not sure about that one!"
ANSWER_SERVICE_UNAVAILABLE = "Oops! I'm having some technical difficulties right now. Mind trying again in a bit?"
ANSWER_PROCESSING_ERROR = "Something went wrong on my end! Give it another shot, would you?"

# Keywords that suggest video/YouTube content would be helpful
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
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global LLM & Tool Variables ---
groq_llm: Optional[ChatGroq] = None
direct_llm_chain: Optional[LLMChain] = None
search_augmented_llm_chain: Optional[LLMChain] = None
model_status: str = MODEL_STATUS_UNINITIALIZED
ddg_search: Optional[DuckDuckGoSearchRun] = None

# --- Prompt Templates ---
STRICT_PROMPT_TEMPLATE_TEXT = """
You are SmartGenie, a friendly and casual AI assistant who gives direct, helpful answers.
Follow these rules:
1. Give a direct, casual answer if you know it from your knowledge.
2. If you don't know something, just say "Hmm, I'm not sure about that one!"
3. Keep it friendly and conversational - like you're chatting with a friend.
4. Don't suggest looking things up elsewhere or mention being an AI.
5. Keep answers short and sweet (under {max_words} words) but still helpful.
6. Use casual language - contractions are fine (like "don't", "can't", "it's").
7. Skip formal greetings or apologies unless it's part of "I'm not sure."

Current date: {current_date}
Question: {question}

Answer (casual and direct, or "Hmm, I'm not sure about that one!"):
"""

SEARCH_AUGMENTED_PROMPT_TEMPLATE_TEXT = """
You are SmartGenie, a friendly AI assistant. Use the search results to give a casual, helpful answer.
Follow these rules:
1. Base your answer on the search results provided.
2. If the search results don't help, just say "Hmm, I'm not sure about that one!"
3. Keep it casual and conversational - like explaining to a friend.
4. Answer should be {max_words} words or less.
5. Don't say "based on search results" - just give the info naturally.
6. Use contractions and friendly language.
7. If there are YouTube videos mentioned, you can casually reference them like "There's a cool video by [Channel] that shows..."

Search Results:
{search_results}

Current date: {current_date}
Question: {question}

Answer (casual and friendly, {max_words} words or less, or "Hmm, I'm not sure about that one!"):
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

def clean_response(response_text: str, is_from_search: bool = False) -> str:
    cleaned = response_text.strip()
    if not cleaned:
        return ANSWER_UNKNOWN

    lower_cleaned = cleaned.lower()

    if lower_cleaned == ANSWER_UNKNOWN.lower() or "hmm, i'm not sure about that one!" in lower_cleaned:
        return ANSWER_UNKNOWN

    for refusal in COMMON_LLM_REFUSALS:
        if refusal in lower_cleaned:
            logger.debug(f"Refusal phrase '{refusal}' found in response: '{cleaned}'")
            return ANSWER_UNKNOWN

    for phrase in FORBIDDEN_PHRASES_IN_RESPONSE:
        if phrase in lower_cleaned:
            logger.debug(f"Forbidden phrase '{phrase}' found in response: '{cleaned}'")
            return ANSWER_UNKNOWN

    preambles_to_remove = [
        "answer:", "response:", "here is the answer:", "the answer is:",
        "certainly, here's the information:", "okay, here's that:", "sure!", "absolutely!"
    ]
    for preamble in preambles_to_remove:
        if cleaned.lower().startswith(preamble):
            cleaned = cleaned[len(preamble):].lstrip()
            logger.debug(f"Removed preamble '{preamble}' from response: '{cleaned}'")

    max_words_for_direct_answer_extraction = settings.max_response_words
    
    if is_from_search:
        lines = [line.strip() for line in cleaned.split('\n') if line.strip()]
        if lines:
            possible_answer = lines[-1]
            if not any(refusal in possible_answer.lower() for refusal in COMMON_LLM_REFUSALS) and \
               not any(phrase in possible_answer.lower() for phrase in FORBIDDEN_PHRASES_IN_RESPONSE):
                if len(possible_answer.split()) <= max_words_for_direct_answer_extraction:
                    logger.debug(f"Extracted last line as answer: '{possible_answer}'")
                    return possible_answer.strip()

    max_words_limit_safety_net = settings.max_response_words * 1.5 if is_from_search else settings.max_response_words
    words = cleaned.split()
    if len(words) > max_words_limit_safety_net:
        logger.debug(f"Response too long: '{cleaned}' ({len(words)} words)")
        match = re.match(r"^(.*?[.!?])", cleaned)
        if match:
            first_sentence = match.group(1).strip()
            if len(first_sentence.split()) <= max_words_limit_safety_net and \
               not any(refusal in first_sentence.lower() for refusal in COMMON_LLM_REFUSALS) and \
               not any(phrase in first_sentence.lower() for phrase in FORBIDDEN_PHRASES_IN_RESPONSE):
                logger.debug(f"Truncated to first sentence: '{first_sentence}'")
                return first_sentence.strip()
        return ANSWER_UNKNOWN

    return cleaned.strip()

def extract_urls_from_search_results(search_results_text: str) -> List[str]:
    url_pattern = r'https?://[^\s<>"\'()\[\]{}|\\^`]+[^\s<>"\'()\[\]{}|\\^`.,;:!?]'
    markdown_link_pattern = r'\[[^\]]+\]\((https?://[^\s<>"\'()\[\]{}|\\^`]+[^\s<>"\'()\[\]{}|\\^`.,;:!?])\)'
    urls = set()
    plain_urls = re.findall(url_pattern, search_results_text)
    for url in plain_urls:
        url_cleaned = url.strip().rstrip(').,!?:;')
        if not ("duckduckgo.com" in url_cleaned or "google.com/search" in url_cleaned):
            urls.add(url_cleaned)
    md_urls = re.findall(markdown_link_pattern, search_results_text)
    for url in md_urls:
        url_cleaned = url.strip().rstrip(').,!?:;')
        if not ("duckduckgo.com" in url_cleaned or "google.com/search" in url_cleaned):
            urls.add(url_cleaned)
    logger.info(f"Extracted URLs: {list(urls)}")
    return list(urls)

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
        search_params = {
            'part': 'snippet', 'q': query, 'type': 'video',
            'maxResults': settings.max_youtube_results, 'key': settings.youtube_api_key,
            'order': 'relevance', 'safeSearch': 'moderate'
        }
        logger.info(f"Searching YouTube with query: '{query}'")
        response = requests.get(search_api_url, params=search_params, timeout=10)
        response.raise_for_status()
        search_data = response.json()
        video_ids = [item['id']['videoId'] for item in search_data.get('items', []) if item.get('id', {}).get('kind') == 'youtube#video']
        if not video_ids:
            logger.info("No YouTube video IDs found from search.")
            return youtube_videos_data, youtube_context_text
        videos_api_url = "https://www.googleapis.com/youtube/v3/videos"
        videos_params = {'part': 'snippet,contentDetails,statistics', 'id': ','.join(video_ids), 'key': settings.youtube_api_key}
        details_response = requests.get(videos_api_url, params=videos_params, timeout=10)
        details_response.raise_for_status()
        videos_data = details_response.json()
        for item in videos_data.get('items', []):
            snippet = item.get('snippet', {})
            content_details = item.get('contentDetails', {})
            statistics = item.get('statistics', {})
            duration_iso = content_details.get('duration', '')
            duration_str = None
            if duration_iso:
                match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_iso)
                if match:
                    hours, minutes, seconds = match.groups()
                    parts = []
                    if hours: parts.append(f"{hours}h")
                    if minutes: parts.append(f"{minutes}m")
                    if seconds: parts.append(f"{seconds}s")
                    duration_str = " ".join(parts) if parts else "N/A"
            view_count_str = None
            if 'viewCount' in statistics:
                vc = int(statistics['viewCount'])
                if vc >= 1_000_000: view_count_str = f"{vc/1_000_000:.1f}M views"
                elif vc >= 1_000: view_count_str = f"{vc/1_000:.1f}K views"
                else: view_count_str = f"{vc} views"
            video = YouTubeVideo(
                title=snippet.get('title', 'N/A'), url=f"https://www.youtube.com/watch?v={item['id']}",
                channel=snippet.get('channelTitle', 'N/A'),
                description=snippet.get('description', '')[:250] + "..." if snippet.get('description') else 'N/A',
                duration=duration_str, view_count=view_count_str, published_at=snippet.get('publishedAt', '')
            )
            youtube_videos_data.append(video)
            youtube_context_text += f"YouTube Video: {video.title}\nChannel: {video.channel}\n"
            if video.duration: youtube_context_text += f"Duration: {video.duration}\n"
            if video.view_count: youtube_context_text += f"Views: {video.view_count}\n"
            youtube_context_text += f"Description Snippet: {video.description}\nURL: {video.url}\n\n"
        logger.info(f"Found {len(youtube_videos_data)} YouTube videos for query: {query}")
    except requests.exceptions.RequestException as e:
        logger.error(f"YouTube API request error: {e}")
    except Exception as e:
        logger.error(f"Error processing YouTube search: {e}", exc_info=True)
    return youtube_videos_data, youtube_context_text.strip()

async def perform_search(query: str, include_youtube_flag: bool) -> tuple[str, List[str], List[str], List[YouTubeVideo]]:
    search_results_context = ""
    queries_used = []
    source_urls_from_web_search = []
    youtube_videos_found: List[YouTubeVideo] = []
    if settings.enable_web_search and ddg_search:
        try:
            logger.info(f"Performing DDG web search for: '{query}'")
            ddg_result_text = await ddg_search.arun(query)
            if ddg_result_text:
                no_result_indicators = ["no good duckduckgo search result was found", "could not find any relevant information", "no results found for your query"]
                is_no_result = any(indicator in ddg_result_text.lower() for indicator in no_result_indicators)
                if not is_no_result and len(ddg_result_text.strip()) > 30:
                    search_results_context += f"Web Search Results:\n{ddg_result_text}\n\n"
                    queries_used.append(f"Web: {query}")
                    source_urls_from_web_search.extend(extract_urls_from_search_results(ddg_result_text))
                    logger.info(f"DDG search for '{query}' yielded results.")
                else: logger.info(f"DDG search for '{query}' did not yield substantial/relevant results.")
            else: logger.info(f"DDG search for '{query}' returned no text.")
        except Exception as e: logger.error(f"Error during DuckDuckGo search: {e}", exc_info=True)
    elif settings.enable_web_search and not ddg_search: logger.warning("Web search is enabled, but DDG tool is not initialized.")
    else: logger.info("Web search is disabled by configuration.")

    should_run_youtube_search = include_youtube_flag and settings.enable_youtube_search and settings.youtube_api_key and \
                                (should_search_youtube(query) or settings.enable_youtube_search)
    if should_run_youtube_search:
        try:
            logger.info(f"Performing YouTube video search for: '{query}'")
            youtube_videos_found, youtube_context = await search_youtube(query)
            if youtube_context:
                search_results_context += f"Cool YouTube Videos Found:\n{youtube_context}\n\n"
                queries_used.append(f"YouTube: {query}")
                logger.info(f"YouTube search for '{query}' yielded {len(youtube_videos_found)} videos.")
            else: logger.info(f"YouTube search for '{query}' yielded no video information for context.")
        except Exception as e: logger.error(f"Error during YouTube search integration: {e}", exc_info=True)
    elif include_youtube_flag and settings.enable_youtube_search and not settings.youtube_api_key: logger.warning("YouTube search requested and enabled, but YOUTUBE_API_KEY is missing.")
    elif not include_youtube_flag: logger.info("YouTube search skipped as per request flag.")
    elif not settings.enable_youtube_search: logger.info("YouTube search skipped as it's disabled in configuration.")

    if len(search_results_context) > settings.max_search_results_chars:
        search_results_context = search_results_context[:settings.max_search_results_chars] + "\n... [Got more but keeping it short!]"
        logger.info(f"Combined search results truncated to {settings.max_search_results_chars} characters.")
    unique_urls = sorted(list(set(source_urls_from_web_search)))
    return search_results_context.strip(), queries_used, unique_urls, youtube_videos_found

# --- FastAPI Events ---
@app.on_event("startup")
async def startup_event():
    global groq_llm, direct_llm_chain, search_augmented_llm_chain, model_status, ddg_search
    logger.info("SmartGenie is waking up! Initializing AI and search tools...")
    if not settings.groq_api_key:
        model_status = MODEL_STATUS_API_KEY_MISSING
        logger.error(model_status)
    else:
        try:
            groq_llm = ChatGroq(temperature=settings.model_temperature, model_name=settings.model_name, groq_api_key=settings.groq_api_key)
            direct_prompt_template = PromptTemplate(template=STRICT_PROMPT_TEMPLATE_TEXT, input_variables=["current_date", "question"], partial_variables={"max_words": str(settings.max_response_words)})
            direct_llm_chain = LLMChain(prompt=direct_prompt_template, llm=groq_llm)
            search_augmented_prompt_template = PromptTemplate(template=SEARCH_AUGMENTED_PROMPT_TEMPLATE_TEXT, input_variables=["current_date", "question", "search_results"], partial_variables={"max_words": str(settings.max_response_words)})
            search_augmented_llm_chain = LLMChain(prompt=search_augmented_prompt_template, llm=groq_llm)
            model_status = MODEL_STATUS_CONNECTED
            logger.info(f"SmartGenie's brain is ready! Using {settings.model_name}")
        except Exception as e:
            model_status = f"{MODEL_STATUS_ERROR_PREFIX}LLM_INIT_FAILED: {str(e)}"
            logger.error(f"SmartGenie had trouble starting up its brain: {model_status}", exc_info=True)
            groq_llm, direct_llm_chain, search_augmented_llm_chain = None, None, None
    if settings.enable_web_search:
        try:
            ddg_search = DuckDuckGoSearchRun(max_results=3)
            logger.info("SmartGenie's web search powers are ready!")
        except Exception as e:
            logger.error(f"Failed to initialize SmartGenie's web search powers: {e}", exc_info=True)
            ddg_search = None
    else:
        ddg_search = None
        logger.info("Web search is turned off for SmartGenie.")
    if settings.enable_youtube_search and not settings.youtube_api_key:
        logger.warning(MODEL_STATUS_YOUTUBE_API_KEY_MISSING + " SmartGenie might not find YouTube videos.")
    logger.info(f"Web search for SmartGenie: {'Enabled' if settings.enable_web_search else 'Disabled'}")
    logger.info(f"YouTube search for SmartGenie: {'Enabled' if settings.enable_youtube_search else 'Disabled'}")
    logger.info(f"YouTube API key for SmartGenie: {'Configured' if settings.youtube_api_key else 'Missing'}")
    logger.info(f"SmartGenie is fully awake! LLM Status: {model_status}")

# --- API Endpoints ---
@app.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    if model_status != MODEL_STATUS_CONNECTED or not groq_llm or not direct_llm_chain:
        logger.error(f"SmartGenie isn't ready yet. Status: {model_status}")
        if model_status == MODEL_STATUS_API_KEY_MISSING:
            raise HTTPException(status_code=503, detail="Oops! SmartGenie needs some configuration help - API key is missing.")
        raise HTTPException(status_code=503, detail=ANSWER_SERVICE_UNAVAILABLE)

    logger.info(f"Someone asked SmartGenie: '{request.question}' (Include YouTube: {request.include_youtube})")
    current_date_str = get_current_date()
    final_answer: str = ANSWER_UNKNOWN
    final_source: str = SOURCE_SYSTEM
    final_confidence: str = CONFIDENCE_LOW
    search_was_performed_flag: bool = False
    youtube_search_was_performed_flag: bool = False
    search_queries: List[str] = []
    web_source_urls: List[str] = []
    youtube_videos_results: List[YouTubeVideo] = []

    try:
        logger.info("SmartGenie is thinking...")
        context_direct = {"current_date": current_date_str, "question": request.question}
        raw_direct_response = await direct_llm_chain.arun(context_direct)
        logger.info(f"SmartGenie's first thought: '{raw_direct_response}'")
        cleaned_direct_answer = clean_response(raw_direct_response, is_from_search=False)
        logger.info(f"SmartGenie's cleaned direct answer: '{cleaned_direct_answer}'")
        is_direct_answer_unknown = cleaned_direct_answer.lower() == ANSWER_UNKNOWN.lower()

        if not is_direct_answer_unknown:
            final_answer = cleaned_direct_answer
            final_source = SOURCE_GROQ_AI_DIRECT
            final_confidence = CONFIDENCE_HIGH
            # For direct responses, ensure no resources are included
            web_source_urls = []
            youtube_videos_results = []
            search_was_performed_flag = False
            youtube_search_was_performed_flag = False
            search_queries = []
        elif (settings.enable_web_search or (request.include_youtube and settings.enable_youtube_search)) and search_augmented_llm_chain:
            logger.info("SmartGenie doesn't know this one - time to search the web and YouTube!")
            search_was_performed_flag = True
            search_context_str, search_queries, web_source_urls, youtube_videos_results = await perform_search(
                request.question, include_youtube_flag=request.include_youtube
            )
            youtube_search_was_performed_flag = any("YouTube:" in query for query in search_queries) and bool(youtube_videos_results)
            if search_context_str:
                logger.info(f"Found some good stuff! ({len(search_context_str)} chars). SmartGenie is processing this...")
                context_augmented = {"current_date": current_date_str, "question": request.question, "search_results": search_context_str}
                raw_augmented_response = await search_augmented_llm_chain.arun(context_augmented)
                logger.info(f"SmartGenie's search-powered thought: '{raw_augmented_response}'")
                cleaned_augmented_answer = clean_response(raw_augmented_response, is_from_search=True)
                logger.info(f"SmartGenie's cleaned search-powered answer: '{cleaned_augmented_answer}'")
                if cleaned_augmented_answer.lower() != ANSWER_UNKNOWN.lower():
                    final_answer = cleaned_augmented_answer
                    has_web_results = any("Web:" in q for q in search_queries) and web_source_urls
                    has_youtube_results = youtube_search_was_performed_flag
                    if has_web_results and has_youtube_results: final_source = SOURCE_GROQ_AI_WITH_MIXED_SEARCH
                    elif has_youtube_results: final_source = SOURCE_GROQ_AI_WITH_YOUTUBE
                    elif has_web_results: final_source = SOURCE_GROQ_AI_WITH_SEARCH
                    else: final_source = SOURCE_SYSTEM 
                    final_confidence = CONFIDENCE_MEDIUM
                else:
                    final_answer = ANSWER_UNKNOWN
                    final_source = SOURCE_GROQ_AI_WITH_SEARCH 
                    final_confidence = CONFIDENCE_LOW
                    logger.info("Even with search results, SmartGenie couldn't figure this one out.")
            else:
                logger.info("Search didn't turn up anything useful for SmartGenie.")
                final_answer = ANSWER_UNKNOWN
                final_source = SOURCE_SYSTEM 
                final_confidence = CONFIDENCE_LOW
        else:
            final_answer = cleaned_direct_answer
            final_source = SOURCE_GROQ_AI_DIRECT
            final_confidence = CONFIDENCE_LOW
            # Ensure no resources for direct responses even if search is not active
            web_source_urls = []
            youtube_videos_results = []
            search_was_performed_flag = False
            youtube_search_was_performed_flag = False
            search_queries = []
            if is_direct_answer_unknown:
                 logger.info("SmartGenie doesn't know and search fallback is not active/configured.")
        
        additional_res = {}
        if web_source_urls: additional_res["web_sources"] = web_source_urls
        if youtube_videos_results: additional_res["youtube_sources"] = [video.url for video in youtube_videos_results]

        return AnswerResponse(
            answer=final_answer, source=final_source, confidence=final_confidence,
            search_performed=search_was_performed_flag,
            youtube_search_performed=youtube_search_was_performed_flag,
            search_queries_used=search_queries if search_was_performed_flag else None,
            source_urls=web_source_urls if web_source_urls else None,
            youtube_videos=youtube_videos_results if youtube_videos_results else None,
            additional_resources=additional_res if additional_res else None
        )
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Unexpected error while SmartGenie was working on /ask: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=ANSWER_PROCESSING_ERROR)

@app.get("/health")
async def health_check():
    is_llm_healthy = model_status == MODEL_STATUS_CONNECTED and groq_llm is not None and \
                     direct_llm_chain is not None and search_augmented_llm_chain is not None
    web_search_status_detail = "N/A"
    if settings.enable_web_search:
        web_search_status_detail = "tool_initialized_and_ready" if ddg_search else "tool_initialization_failed_or_not_available"
    else: web_search_status_detail = "disabled_by_configuration"
    youtube_search_status_detail = "N/A"
    if settings.enable_youtube_search:
        if settings.youtube_api_key: youtube_search_status_detail = "enabled_with_api_key"
        else: youtube_search_status_detail = "enabled_but_youtube_api_key_missing"
    else: youtube_search_status_detail = "disabled_by_configuration"
    overall_status = "healthy"
    if not is_llm_healthy: overall_status = "degraded"
    if settings.enable_web_search and not ddg_search:
        overall_status = "degraded"
        web_search_status_detail = "tool_initialization_failed_or_not_available (web_search_is_enabled)"
    return {
        "status": overall_status, "timestamp": datetime.utcnow().isoformat(),
        "llm_service": {"status": model_status, "model_name": settings.model_name if is_llm_healthy else None},
        "web_search_service": {"configured_enabled": settings.enable_web_search, "tool_status": web_search_status_detail},
        "youtube_search_service": {"configured_enabled": settings.enable_youtube_search, 
                                   "api_key_configured": bool(settings.youtube_api_key), "status": youtube_search_status_detail}
    }

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting Uvicorn server for SmartGenie API...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
