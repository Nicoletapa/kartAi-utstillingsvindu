# # src/clients/trpc_client.py (Corrected Payload + Debug Logging)

# import requests
# import json
# import os
# from datetime import date, datetime
# from enum import Enum
# # Use typing_extensions for older Python versions if needed, otherwise standard typing
# # from typing_extensions import Any, Dict, Optional, List, Union, TypedDict
# from typing_extensions import Any, Dict, Optional, List, Union, TypedDict
# from dotenv import load_dotenv
# import logging

# load_dotenv()
# # Ensure basicConfig is called *before* getting the logger if running standalone
# # If run via FastAPI/Uvicorn, logging might be configured elsewhere.
# # logging.basicConfig(level=logging.DEBUG) # Consider setting level via environment or config
# logger = logging.getLogger(__name__)
# # Ensure logger has handlers and level set appropriately in your main app setup (e.g., setup_logging())


# # --- Replicate Enums from Prisma Schema ---
# class ApplicationStatus(Enum):
#     PABEGYNT = "Pabegynt"
#     SENDT = "Sendt"
#     MOTATT = "Motatt"
#     UNDER_BEHANDLING = "Under_Behandling"
#     HORING = "Horing"
#     VEDTAKFAATTES = "Vedtakfattes"
#     ENDELIG_AVGJORELSE = "Endelig_Avgjorelse"
#     FERDIG_BEHANDLET = "Ferdig_behandlet"

# class ApplicationType(Enum):
#     SMA_BYGGEPROSJEKTER = "sma_byggeprosjekter"
#     BRUKSENDRING = "bruksendring"
#     PENDING = "pending"

# # --- TypedDicts for type hinting ---
# class ApplicationFieldDict(TypedDict):
#     application_fieldID: int; fieldName: str; createdDate: str; updatedDate: str; applicationID: int; fieldValue: str

# # Define ApplicationDict based on expected RETURN structure from tRPC
# # Match the CASE of keys returned by the backend (likely camelCase from Prisma default)
# class ApplicationDict(TypedDict):
#     # Assuming backend returns camelCase by default
#     applicationId: int # <-- NOTE: Changed to camelCase based on common Prisma behavior
#     userId: str      # <-- NOTE: Changed to camelCase
#     submissionDate: str # Usually returned as ISO string
#     status: str
#     applicationType: str
#     subTypeId: Optional[str]
#     updatedDate: str # Usually returned as ISO string
#     application_fields: Optional[List[ApplicationFieldDict]] # If selected

# class ApplicationCountDict(TypedDict):
#     status: str; count: int # Check actual return type of count

# class DeleteResultDict(TypedDict):
#     success: bool
#     deletedApplication: ApplicationDict # Check actual return structure


# # --- Configuration from Environment Variables ---
# TRPC_API_BASE_URL = os.getenv("TRPC_API_BASE_URL")
# SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME")

# if not TRPC_API_BASE_URL:
#     logger.error("TRPC_API_BASE_URL environment variable not set.")
#     raise ValueError("TRPC_API_BASE_URL not set in environment")
# if not SESSION_COOKIE_NAME:
#     logger.error("SESSION_COOKIE_NAME environment variable not set.")
#     raise ValueError("SESSION_COOKIE_NAME not set in environment (e.g., 'next-auth.session-token')")


# # --- Custom Exception ---
# class TRPCAPIError(Exception):
#     def __init__(self, status_code: int, message: str, error_details: Optional[Any] = None):
#         self.status_code = status_code
#         self.message = message
#         self.error_details = error_details
#         super().__init__(f"API Error {status_code}: {message}")


# # --- The Client Class (Delegated Token Version) ---
# class TRPCClient:
#     def __init__(self, base_url: str = TRPC_API_BASE_URL):
#         """Initializes the tRPC client. Does not store tokens."""
#         self.base_url = base_url
#         logger.info(f"TRPCClient initialized for base URL: {self.base_url}")
#         logger.debug(f"Expecting session cookie name: {SESSION_COOKIE_NAME}")

#     # --- JSON Serializer Helper ---
#     def _json_serial(self, obj):
#         if isinstance(obj, (datetime, date)):
#             # Ensure timezone info is handled if necessary, isoformat() is usually correct
#             return obj.isoformat()
#         if isinstance(obj, Enum):
#             return obj.value # Use the string value of the enum
#         raise TypeError(f"Type {type(obj)} not serializable")

#     # --- Core Request Helper ---
#     def _make_request(self,
#                       method: str,
#                       procedure_path: str,
#                       user_session_token: Optional[str],
#                       params: Optional[Dict] = None,
#                       data: Optional[Dict] = None) -> Any:
#         """
#         Makes an HTTP request to the tRPC endpoint, forwarding the user's session token.
#         """
#         if not user_session_token:
#             logger.error(f"Attempted call to {procedure_path} without user_session_token.")
#             raise TRPCAPIError(401, "User session token is required for this operation")

#         url = f"{self.base_url}/{procedure_path}"
#         headers = {
#             'Content-Type': 'application/json',
#             'Cookie': f'{SESSION_COOKIE_NAME}={user_session_token}'
#         }

#         # Prepare params for GET (input=<json_string>)
#         encoded_params = None
#         if method.upper() == "GET" and params:
#              # Standard tRPC GET: input param is URL-encoded JSON string
#              try:
#                  encoded_params = {'input': json.dumps(params)}
#              except TypeError as e:
#                  logger.error(f"Failed to JSON encode GET params for {procedure_path}: {params} - Error: {e}")
#                  raise TRPCAPIError(400, f"Invalid input data for GET request: {e}")
#              params = None # Clear original params dict as it's now encoded

#         logger.debug(f"Making tRPC request: {method} {url}")
#         if encoded_params: logger.debug(f" GET Encoded Params: {encoded_params}")
#         # Avoid logging full 'data' in production if it contains sensitive info
#         # if data: logger.debug(f" POST/PUT Data (partial): {str(data)[:100]}...")

#         try:
#             # Serialize request body data for POST/PUT/etc.
#             serialized_data = json.dumps(data, default=self._json_serial) if data else None

#             response = requests.request(
#                 method,
#                 url,
#                 headers=headers,
#                 params=encoded_params, # Use encoded params for GET
#                 data=serialized_data,  # Use serialized data for POST body
#                 timeout=20
#             )

#             logger.debug(f"tRPC response status: {response.status_code} for {url}")

#             response.raise_for_status() # Check for 4xx/5xx HTTP errors

#             if not response.text:
#                 logger.debug(f"Received empty response body for {url}")
#                 return None

#             response_data = response.json()
#             # --- Debugging: Log Raw Response ---
#             logger.debug(f"Raw JSON response data from tRPC: {response_data}")
#             # --- End Debugging ---

#             if "result" in response_data and "data" in response_data["result"]:
#                 extracted_data = response_data["result"]["data"]
#                 # --- Debugging: Log Extracted Data and Keys ---
#                 logger.debug(f"Extracted data being returned: {extracted_data}")
#                 if isinstance(extracted_data, dict):
#                     logger.debug(f"Keys in extracted data dictionary: {list(extracted_data.keys())}")
#                 elif isinstance(extracted_data, list) and extracted_data and isinstance(extracted_data[0],dict) :
#                     logger.debug(f"Keys in first item of extracted list: {list(extracted_data[0].keys())}")
#                 # --- End Debugging ---
#                 return extracted_data

#             if "error" in response_data:
#                 error_details = response_data.get("error", {}).get("json", {})
#                 msg = error_details.get("message", "Unknown error structure in success response")
#                 logger.warning(f"tRPC call {url} succeeded (HTTP {response.status_code}) but returned error structure: {error_details}")
#                 raise TRPCAPIError(status_code=response.status_code, message=msg, error_details=error_details)

#             logger.warning(f"Unexpected tRPC success response format for {url}: {response_data}")
#             return response_data

#         except requests.exceptions.HTTPError as http_err:
#             status_code = http_err.response.status_code
#             error_message = f"HTTP Error {status_code}"
#             error_details = None
#             try:
#                 error_data = http_err.response.json()
#                 if "error" in error_data and "json" in error_data["error"]:
#                     error_details = error_data["error"]["json"]
#                     error_message = error_details.get("message", error_message)
#                     tRPC_code = error_details.get("code", "UNKNOWN")
#                     logger.error(f"tRPC Backend Error (Code: {tRPC_code}): {error_message} - Details: {error_details}")
#                 elif "error" in error_data:
#                     error_details = error_data["error"]
#                     error_message = error_details.get("message", error_message)
#                     logger.error(f"tRPC Backend Error (Simpler Format): {error_message} - Details: {error_details}")
#                 else:
#                      error_message = f"HTTP Error {status_code}. Response JSON: {error_data}"
#                      logger.error(error_message)
#             except json.JSONDecodeError:
#                 error_message = f"HTTP Error {status_code}. Response: {http_err.response.text[:500]}"
#                 logger.error(error_message)
#             raise TRPCAPIError(status_code=status_code, message=error_message, error_details=error_details) from http_err
#         except requests.exceptions.RequestException as req_err:
#             logger.error(f"tRPC Request Exception calling {url}: {req_err}", exc_info=True)
#             raise TRPCAPIError(status_code=503, message=f"Service Unavailable: Could not connect to tRPC backend at {self.base_url}. Details: {req_err}") from req_err
#         except Exception as e:
#             logger.exception(f"Unexpected error during tRPC request to {url}")
#             raise TRPCAPIError(status_code=500, message=f"An unexpected error occurred: {e}")


#     # --- Application Procedures (Each accepts user_session_token) ---

#     def create_application(self,
#                            application_type: ApplicationType,
#                            submission_date: datetime,
#                            user_session_token: str, 
#                            sub_type_id: Optional[str] = None,
#                            status: ApplicationStatus = ApplicationStatus.PABEGYNT
#                            ) -> ApplicationDict:
#         """Calls protected procedure application.createApplication"""
#         # Build the input payload
#         input_data = {
#             "applicationType": application_type.value,
#             # Send timestamp as integer (milliseconds) for proper date conversion by z.coerce.date()
#             "submissionDate": int(submission_date.timestamp() * 1000),  
#             "status": status.value if isinstance(status, Enum) else status,
#         }
#         if sub_type_id is not None:
#             input_data["subTypeId"] = sub_type_id
            
#         # Wrap in the format tRPC expects: { "json": YOUR_ACTUAL_DATA }
#         payload = {"json": input_data}
        
#         logger.info(f"Calling tRPC createApplication for type {application_type.value}")
#         logger.debug(f"Payload format: {payload}")
#         result = self._make_request("POST", "application.createApplication", user_session_token, data=payload)
        
#         # Extract the actual application data from the nested structure
#         if isinstance(result, dict) and 'json' in result:
#             application_data = result['json']
#             if 'applicationID' in application_data:
#                 return application_data
                
#         # If we get here, the response format is unexpected
#         logger.error(f"Unexpected response structure from createApplication: {result}")
#         raise TRPCAPIError(500, "Invalid response structure from API", result)
#     # def get_application(self,
#     #                     application_id: int,
#     #                     user_session_token: str
#     #                     ) -> ApplicationDict:
#     #     """Calls protected procedure application.getApplication"""
#     #     # --- CORRECTED PARAMS for GET: Pass dict to 'params' kwarg ---
#     #     # _make_request will handle JSON encoding and putting it in 'input' query param
#     #     input_payload = {"applicationID": application_id}
#     #     logger.info(f"Calling tRPC getApplication for ID {application_id}")
#     #     return self._make_request("GET", "application.getApplication", user_session_token, params=input_payload)

#     # def delete_application(self,
#     #                        application_id: int,
#     #                        user_session_token: str
#     #                        ) -> DeleteResultDict:
#     #     """Calls protected procedure application.deleteApplication"""
#     #     # POST sends payload directly in 'data' kwarg
#     #     payload = {"applicationID": application_id}
#     #     logger.info(f"Calling tRPC deleteApplication for ID {application_id}")
#     #     return self._make_request("POST", "application.deleteApplication", user_session_token, data=payload)

#     # def add_application_field(self,
#     #                           application_id: int,
#     #                           field_name: str,
#     #                           field_value: str,
#     #                           user_session_token: str
#     #                           ) -> ApplicationFieldDict:
#     #     """Calls protected procedure application.addApplicationField"""
#     #     # POST sends payload directly in 'data' kwarg
#     #     payload = {
#     #         "applicationID": application_id,
#     #         "fieldName": field_name,
#     #         "fieldValue": field_value,
#     #     }
#     #     logger.info(f"Calling tRPC addApplicationField for ID {application_id}, Field: {field_name}")
#     #     return self._make_request("POST", "application.addApplicationField", user_session_token, data=payload)

#     # def submit_application(self,
#     #                        application_id: int,
#     #                        user_session_token: str
#     #                        ) -> ApplicationDict:
#     #     """Calls protected procedure application.submitApplication"""
#     #      # POST sends payload directly in 'data' kwarg
#     #     payload = {"applicationID": application_id}
#     #     logger.info(f"Calling tRPC submitApplication for ID {application_id}")
#     #     return self._make_request("POST", "application.submitApplication", user_session_token, data=payload)

#     # --- Add other methods (update_application, get_all_applications, etc.) ---
#     # --- Make sure they accept user_session_token and use correct -----
#     # --- 'params' for GET or 'data' for POST when calling _make_request ---

#     # Example for update:
#     # def update_application(self, application_id: int, user_session_token: str, **update_data) -> ApplicationDict:
#     #     payload = {"applicationID": application_id}
#     #     # Only add fields present in update_data, potentially converting enums/dates
#     #     if 'applicationType' in update_data and isinstance(update_data['applicationType'], ApplicationType):
#     #          payload['applicationType'] = update_data['applicationType'].value
#     #     if 'status' in update_data and isinstance(update_data['status'], ApplicationStatus):
#     #          payload['status'] = update_data['status'].value
#     #     # ... handle other fields like submissionDate (pass datetime object) ...
#     #     logger.info(f"Calling tRPC updateApplication for ID {application_id}")
#     #     return self._make_request("POST", "application.updateApplication", user_session_token, data=payload)


# # Remember to ensure logging is configured properly in your main application entry point (e.g., main.py or using setup_logging)