// Regex patterns
export const DATE_TIME_PATTERN = 'yyyy-MM-dd HH:mm:ss';
export const TIMEZONE_VIETNAM = 'Asia/Ho_Chi_Minh';

// User authentication patterns
export const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
export const PASSWORD_PATTERN =
  /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[.@#$%^&+=])(?=\S+$).{8,20}$/;
export const OTP_PATTERN = /^\d{6}$/;

// Test and test set name patterns
export const TEST_SET_NAME_PATTERN = /^[\p{L}0-9 ()]+$/u;
export const TEST_NAME_PATTERN = /^[\p{L}0-9 ()]+$/u;

// Chatbot patterns
export const SYSTEM_PROMPT_CONTENT_PATTERN = /^[\p{L}0-9 .,!?()'"-]{20,}$/u;
export const CHAT_TITLE_PATTERN = /^[\p{L}0-9 .,!?()'"-]{1,100}$/u;
export const CHAT_CONVERSATION_ID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// Cache constants
export const SYSTEM_PROMPT_CACHE = 'systemPrompt';
export const ACTIVE_PROMPT_KEY = 'active';
export const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Profile constants
export const PROFILE_FULLNAME_PATTERN = /^[\p{L} ]+$/u;
export const PROFILE_AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB

// Question group
export const QUESTION_GROUP_AUDIO_MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const QUESTION_GROUP_IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const QUESTION_GROUP_AUDIO_URL_FORMAT =
  /^(https?:\/\/.*\.(mp3|wav|ogg|m4a|aac))$/i;
export const QUESTION_GROUP_IMAGE_URL_FORMAT =
  /^(https?:\/\/.*\.(jpg|jpeg|png|gif|bmp))$/i;

// User constants
export const FULLNAME_PATTERN = /^[\p{L} ]+$/u;
export const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
