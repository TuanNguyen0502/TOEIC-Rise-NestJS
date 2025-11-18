// messages.constant.ts

export const MessageConstant = {
  // User authentication messages
  INVALID_EMAIL: 'Invalid email! Please enter a valid email address.',
  INVALID_PASSWORD:
    'Invalid password! Password must be 8-20 characters long, contain at least one digit, one lowercase letter, one uppercase letter, one special character from .@#$%^&+=, and have no whitespace.',
  INVALID_OTP: 'Invalid OTP! OTP must be exactly 6 digits (0-9).',
  INVALID_TEST_SET:
    'Test set name can only contain letters, digits, spaces, and parentheses.',
  INVALID_TEST_SET_ID: 'Test set id must be greater than 0',

  // Profile messages
  PROFILE_FULLNAME_NOT_NULL: 'Full name must not be null.',
  PROFILE_FULLNAME_NOT_BLANK: 'Full name must not be blank.',
  PROFILE_FULLNAME_INVALID: 'Full name can only contain letters and spaces.',
  PROFILE_GENDER_NOT_NULL: 'Gender must not be null.',

  // Page messages
  INVALID_INPUT_DATA: 'Invalid input data',
  PAGE_MIN: 'Page index must be zero or greater.',
  SIZE_PAGE_MIN: 'Size must be greater than ten.',
  PAGE_MAX: 'Page index must be less than or equal to 100.',
  SIZE_PAGE_MAX: 'Size must be less than or equal to 50.',

  // Question Group messages
  QUESTION_GROUP_TRANSCRIPT_NOT_BLANK:
    'Question group transcript must not be blank.',
  QUESTION_GROUP_TRANSCRIPT_NOT_NULL:
    'Question group transcript must not be null.',
  QUESTION_GROUP_AUDIO_URL_INVALID: 'Question group audio URL is invalid.',
  QUESTION_GROUP_IMAGE_URL_INVALID: 'Question group image URL is invalid.',
  QUESTION_GROUP_AUDIO_URL_FORMAT_INVALID:
    'Question group audio URL format is invalid.',
  QUESTION_GROUP_IMAGE_URL_FORMAT_INVALID:
    'Question group image URL format is invalid.',

  // System Prompt messages
  SYSTEM_PROMPT_CONTENT_NOT_BLANK: 'Content must not be blank',
  SYSTEM_PROMPT_CONTENT_INVALID:
    'Content must be at least 20 characters and can only contain letters, digits, spaces, and punctuation (.,!?()\'"-)',
  SYSTEM_PROMPT_CONTENT_NOT_NULL: 'Content must not be null',
  SYSTEM_PROMPT_IS_ACTIVE_NOT_NULL: 'isActive must not be null',

  // Chatbot messages
  CHAT_MESSAGE_NOT_BLANK: 'Message must not be blank',
  CHAT_TITLE_NOT_BLANK: 'Title must not be blank',
  CHAT_CONVERSATION_ID_NOT_BLANK: 'Conversation ID must not be blank',
  CHAT_TITLE_INVALID:
    'Title can only contain letters, digits, spaces, and punctuation (.,!?()\'"-), and must be between 1 and 100 characters long.',
  CHAT_CONVERSATION_ID_INVALID: 'Conversation ID is invalid.',
  MESSAGE_ID_NOT_BLANK: 'Message ID must not be blank',
  ECHATBOT_RATING_NOT_NULL: 'Rating must not be null',

  // Test related messages
  TEST_NAME_INVALID:
    "Test's name can only contain letters, digits, spaces, and parentheses.",
  TEST_NAME_NOT_BLANK: "Test's name must not be blank.",
  TEST_STATUS_NOT_NULL: "Test's status must not be null.",

  // User related messages
  EMAIL_NOT_NULL: 'Email must not be null.',
  EMAIL_NOT_BLANK: 'Email must not be blank.',
  PASSWORD_NOT_NULL: 'Password must not be null.',
  PASSWORD_NOT_BLANK: 'Password must not be blank.',
  CONFIRM_PASSWORD_NOT_NULL: 'Confirm Password must not be null.',
  CONFIRM_PASSWORD_NOT_BLANK: 'Confirm Password must not be blank.',
  FULLNAME_NOT_BLANK: 'Full name must not be blank.',
  FULLNAME_NOT_NULL: 'Full name must not be null.',
  FULLNAME_INVALID: 'Full name can only contain letters and spaces.',
  GENDER_NOT_NULL: 'Gender must not be null.',
  ROLE_NOT_NULL: 'Role must not be null.',
  IS_ACTIVE_NOT_NULL: 'isActive must not be null.',

  // Question related messages
  QUESTION_ID_NOT_NULL: 'Question must not be null.',
  QUESTION_GROUP_ID_NOT_NULL: 'Question group must not be null.',
  CORRECT_OPTION_NOT_NULL: 'Correct option must not be null.',
  CORRECT_OPTION_NOT_BLANK: 'Correct option must be blank.',
  EXPLAIN_NOT_BLANK: 'Explain must not be blank.',
  EXPLAIN_NOT_NULL: 'Explain must not be null.',
  TAG_NOT_NULL: 'Tag must not be null.',
  TAG_NOT_EMPTY: 'Tag must not be empty.',

  // User Test related messages
  TEST_ID_NOT_NULL: 'Test ID must not be null.',
  TIME_SPENT_MIN: 'Time spent must be at least 1 second.',
  ANSWERS_NOT_EMPTY: 'Answers must not be empty.',

  // Cloudinary
  CLOUDINARY_ERROR: 'Cloudinary upload error',
} as const;
