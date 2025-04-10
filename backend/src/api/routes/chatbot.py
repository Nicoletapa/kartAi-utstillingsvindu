# src/api/routes/chatbot.py

import logging
from fastapi import APIRouter, HTTPException, Header, Request, status
from pydantic import BaseModel, Field
from typing_extensions import Optional, Dict, Any
from datetime import datetime

# Import your TRPC client and related types/errors
from src.trpc_client import TRPCClient, TRPCAPIError, ApplicationType, ApplicationStatus, ApplicationDict

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize the tRPC client instance (can be shared across requests)
# For more complex scenarios, consider FastAPI dependency injection
trpc_client = TRPCClient()

# --- Request/Response Models ---

class ChatbotRequest(BaseModel):
    userMessage: str = Field(..., description="The message sent by the user from the chat interface.")
    # Add other potential fields like conversation history if needed
    # conversation_id: Optional[str] = None

class ChatbotResponse(BaseModel):
    reply: Optional[str] = Field(None, description="The text response from the chatbot to show to the user.")
    success: bool = Field(False, description="Indicates if the underlying action (if any) was successful.")
    application: Optional[ApplicationDict] = Field(None, description="Application data if relevant to the response (e.g., after creation).")
    error: Optional[str] = Field(None, description="An error message if the request failed (might be redundant if using HTTP status codes).")


# --- Placeholder for Intent Logic ---
# Replace this with your actual logic (e.g., calling Gemini)
def determine_intent(message: str) -> Dict[str, Any]:
    """
    Analyzes the user message to determine the intent and extract details.
    Returns a dictionary like: {"intent": "create_application", "details": {"type": ApplicationType.SMA_BYGGEPROSJEKTER}}
    """
    logger.info(f"Determining intent for message: '{message}'")
    msg_lower = message.lower()
    if "create" in msg_lower and ("application" in msg_lower or "søknad" in msg_lower):
        details = {"application_type": ApplicationType.SMA_BYGGEPROSJEKTER} # Default
        if "bruksendring" in msg_lower:
            details["application_type"] = ApplicationType.BRUKSENDRING
        logger.info(f"Intent determined: create_application, Details: {details}")
        return {"intent": "create_application", "details": details}
    elif ("show" in msg_lower or "get" in msg_lower or "vis" in msg_lower) and ("application" in msg_lower or "søknad" in msg_lower):
        try:
            # Very naive extraction - use NLP/regex for real use case
            parts = msg_lower.split()
            app_id = int(parts[-1])
            logger.info(f"Intent determined: get_application, Details: {{'id': {app_id}}}")
            return {"intent": "get_application", "details": {"id": app_id}}
        except (ValueError, IndexError):
            logger.warning("Could not extract application ID for get_application intent.")
            pass # Fall through to unknown
    # Add more intent detections...
    logger.info("Intent determined: unknown")
    return {"intent": "unknown", "details": {}}

# --- API Endpoint ---

# Note: The path is "/" here because the prefix will be added in main.py
@router.post(
    "/",
    response_model=ChatbotResponse,
    summary="Handle chatbot interactions",
    description="Receives user messages, determines intent, interacts with tRPC backend, and returns a response.",
    status_code=status.HTTP_200_OK # Usually return 200 OK for chat, error details in payload
)
async def handle_chatbot_interaction(
    payload: ChatbotRequest,
    request: Request, # Access to the full request object if needed
    # --- CRITICAL: Extract the session token header ---
    x_user_session_token: Optional[str] = Header(None, alias="X-User-Session-Token", description="User's session token obtained from frontend cookie.")
):
    logger.info(f"Received chatbot request. Message: '{payload.userMessage}'")

    if not x_user_session_token:
        logger.warning("Missing X-User-Session-Token header.")
        # Use HTTPException for clear client errors like missing auth
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Session-Token header. User authentication required."
        )

    # 1. Determine Intent & Details (using placeholder)
    intent_data = determine_intent(payload.userMessage)
    intent = intent_data.get("intent")
    details = intent_data.get("details", {})

    # 2. Execute Action based on Intent
    try:
        if intent == "create_application":
            app_type = details.get("application_type")
            if not app_type or not isinstance(app_type, ApplicationType):
                 logger.warning("Missing or invalid application_type for create_application")
                 return ChatbotResponse(reply="Please specify a valid application type (e.g., sma_byggeprosjekter, bruksendring).")

            # --- Call tRPC client, passing the token ---
            created_app = await request.app.state.loop.run_in_executor( # Run synchronous requests call in executor
                 None,
                 trpc_client.create_application, # Function to call
                 app_type, datetime.now(), x_user_session_token # Arguments for the function
            )
            logger.info(f"Successfully created application via tRPC: ID {created_app['applicationID']}")
            return ChatbotResponse(
                reply=f"Application {created_app['applicationID']} ({app_type.value}) created successfully.",
                success=True,
                application=created_app
            )

        elif intent == "get_application":
            app_id = details.get("id")
            if not app_id or not isinstance(app_id, int):
                logger.warning("Missing or invalid id for get_application")
                return ChatbotResponse(reply="Please provide the application ID you want to see.")

            # --- Call tRPC client, passing the token ---
            fetched_app = await request.app.state.loop.run_in_executor( # Run sync requests in executor
                None,
                trpc_client.get_application, # Function
                app_id, x_user_session_token # Arguments
            )
            logger.info(f"Successfully fetched application via tRPC: ID {fetched_app['applicationID']}")
            return ChatbotResponse(
                 reply=f"Found Application {fetched_app['applicationID']}. Status: {fetched_app['status']}.",
                 success=True,
                 application=fetched_app
            )

        # Add handlers for other intents (update, delete, add field, etc.)

        else: # Unknown Intent
             logger.info("Handling unknown intent.")
             # Optionally call LLM here for a conversational response
             return ChatbotResponse(reply="I'm not sure how to handle that request yet.")

    # --- Error Handling ---
    except TRPCAPIError as e:
        logger.error(f"tRPC API Error during chatbot action: Status={e.status_code}, Msg='{e.message}'", exc_info=True)
        # Map tRPC errors to user-friendly replies, keep 200 OK status for chat UI
        reply = f"An error occurred: {e.message}"
        if e.status_code == status.HTTP_401_UNAUTHORIZED:
            # This specific error should ideally return 401, but can be caught earlier.
            # If caught here, maybe the token became invalid between checks.
            reply = "Your session seems invalid or expired. Please try logging in again."
            # Optionally raise HTTPException here instead:
            # raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=reply)
        elif e.status_code == status.HTTP_403_FORBIDDEN:
            reply = "You don't have permission to perform this action."
        elif e.status_code == status.HTTP_404_NOT_FOUND:
            reply = "I couldn't find the requested resource (e.g., application not found)."
        elif e.status_code >= 500:
            reply = "A problem occurred on the backend application server. Please try again later."

        return ChatbotResponse(reply=reply, error=e.message, success=False)

    except Exception as e:
        logger.exception("An unexpected error occurred in the chatbot endpoint.") # Logs full traceback
        # Use HTTPException for unexpected internal server errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal error occurred in the chatbot service: {e}"
        )