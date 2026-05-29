export interface FlowOption {
  label: string;
  nextId: string;
}

export interface FlowNode {
  id: string;
  text: string;
  options?: FlowOption[];
  isCustom?: boolean; // flags special rendering like pricing table or contact cards
}

export const chatbotFlows: Record<string, FlowNode> = {
  home: {
    id: 'home',
    text: "Hello! I am your PTE Exam Prep Assistant. 🎓 How can I help you today? Please choose an option below:",
    options: [
      { label: '💰 Pricing Plans', nextId: 'pricing' },
      { label: '📝 Mock Tests', nextId: 'mock_tests' },
      { label: '🗣️ Speaking Module', nextId: 'speaking' },
      { label: '✍️ Writing Module', nextId: 'writing' },
      { label: '📖 Reading Module', nextId: 'reading' },
      { label: '🎧 Listening Module', nextId: 'listening' },
      { label: '📊 Scoring System', nextId: 'scoring' },
      { label: '👤 Account Support', nextId: 'account' },
      { label: '🛠️ Technical Support', nextId: 'technical' },
      { label: '📅 Study Plans', nextId: 'study_plans' },
      { label: '📞 Contact Support', nextId: 'contact' },
    ],
  },

  // PRICING PLANS FLOW
  pricing: {
    id: 'pricing',
    text: "We offer tailored pricing plans to match your preparation level. Select a plan to view its details or choose 'Compare Plans' to see a side-by-side comparison:",
    options: [
      { label: 'Basic Plan', nextId: 'pricing_basic' },
      { label: 'Pro Plan', nextId: 'pricing_pro' },
      { label: 'Premium Plan', nextId: 'pricing_premium' },
      { label: '📊 Compare Plans', nextId: 'pricing_compare' },
    ],
  },
  pricing_basic: {
    id: 'pricing_basic',
    text: "**Basic Plan (Fast Review)**\n\n* **Price:** $29 / month\n* **Duration:** 30 Days\n* **Mock Test Access:** 1 Full-Length Mock Test included.\n* **Speaking Practice:** Available (no AI scoring, recording playback only).\n* **AI Evaluation:** Not Available.\n* **Features:** Access to standard question bank, full practice answers, general templates.",
    options: [
      { label: 'View Pro Plan', nextId: 'pricing_pro' },
      { label: 'Compare All Plans', nextId: 'pricing_compare' },
    ],
  },
  pricing_pro: {
    id: 'pricing_pro',
    text: "**Pro Plan (Most Popular)**\n\n* **Price:** $59 / month\n* **Duration:** 90 Days\n* **Mock Test Access:** 5 Full-Length Mock Tests + 10 Sectional Tests.\n* **Speaking Practice:** Available with AI Pronunciation & Fluency grading.\n* **AI Evaluation:** Available (20 essays & 20 speaking attempts per month).\n* **Features:** Detailed analytics, sample high-scoring responses, video solutions for tricky questions.",
    options: [
      { label: 'View Premium Plan', nextId: 'pricing_premium' },
      { label: 'Compare All Plans', nextId: 'pricing_compare' },
    ],
  },
  pricing_premium: {
    id: 'pricing_premium',
    text: "**Premium Plan (Full Prep)**\n\n* **Price:** $99 / month\n* **Duration:** 180 Days\n* **Mock Test Access:** Unlimited Full-Length & Sectional Mock Tests.\n* **Speaking Practice:** Available (unlimited AI scoring & instant detailed feedback).\n* **AI Evaluation:** Unlimited evaluations for Writing and Speaking.\n* **Features:** All features + 1-on-1 expert tutor review session (1 hour), study progress tracker, priority support.",
    options: [
      { label: 'View Basic Plan', nextId: 'pricing_basic' },
      { label: 'Compare All Plans', nextId: 'pricing_compare' },
    ],
  },
  pricing_compare: {
    id: 'pricing_compare',
    text: "**Plan Comparison Matrix**\n\n| Feature | Basic Plan | Pro Plan | Premium Plan |\n| :--- | :--- | :--- | :--- |\n| **Price** | $29 / mo | $59 / mo | $99 / mo |\n| **Duration** | 30 Days | 90 Days | 180 Days |\n| **Mock Tests** | 1 Full | 5 Full + 10 Sectional | Unlimited |\n| **AI Evaluation** | ❌ None | ⚡ 20 credits/mo | 🚀 Unlimited |\n| **Speaking AI** | ❌ Playback only | ✅ Pronunciation/Fluency | ✅ Advanced Detail |\n| **1-on-1 Session**| ❌ No | ❌ No | ✅ 1-Hour Session |\n| **Study Tracker**| ❌ No | ✅ Yes | ✅ Yes |",
    options: [
      { label: 'Choose Basic', nextId: 'pricing_basic' },
      { label: 'Choose Pro', nextId: 'pricing_pro' },
      { label: 'Choose Premium', nextId: 'pricing_premium' },
    ],
  },

  // MOCK TESTS FLOW
  mock_tests: {
    id: 'mock_tests',
    text: "We offer comprehensive testing setups designed to match the official Pearson PTE exam interface. What details would you like to know about mock tests?",
    options: [
      { label: 'Full Mock Tests', nextId: 'mock_tests_full' },
      { label: 'Sectional Tests', nextId: 'mock_tests_sectional' },
      { label: 'Test Duration & Format', nextId: 'mock_tests_duration' },
      { label: 'Score Reports & Analytics', nextId: 'mock_tests_reports' },
    ],
  },
  mock_tests_full: {
    id: 'mock_tests_full',
    text: "**Full-Length Mock Tests**\n\n* **PTE Exam Simulation:** Replicates the actual exam atmosphere, timings, and interface.\n* **All Modules:** Covers Speaking & Writing (54-67 min), Reading (29-30 min), and Listening (30-43 min) in one session.\n* **AI Scoring:** Our AI engine grades your performance against official PTE parameters, delivering an overall score from 10 to 90.",
    options: [
      { label: 'Sectional Tests', nextId: 'mock_tests_sectional' },
      { label: 'Score Reports', nextId: 'mock_tests_reports' },
    ],
  },
  mock_tests_sectional: {
    id: 'mock_tests_sectional',
    text: "**Sectional Practice Tests**\n\n* **Targeted Practice:** Focus on specific weak areas without committing to a full 2-hour exam.\n* **Four Options:** Select Speaking, Writing, Reading, or Listening sectional tests.\n* **Immediate Scoring:** Get graded on individual modules immediately with key focus indicators.",
    options: [
      { label: 'Full Mock Tests', nextId: 'mock_tests_full' },
      { label: 'Test Duration & Format', nextId: 'mock_tests_duration' },
    ],
  },
  mock_tests_duration: {
    id: 'mock_tests_duration',
    text: "**PTE Academic Test Duration**\n\n* **Total Duration:** Approximately 2 hours.\n* **Section 1: Speaking & Writing** (54 - 67 minutes)\n* **Section 2: Reading** (29 - 30 minutes)\n* **Section 3: Listening** (30 - 43 minutes)\n\n*Tip: There is no scheduled break in the PTE Academic exam, so endurance is key!*",
    options: [
      { label: 'Full Mock Tests', nextId: 'mock_tests_full' },
      { label: 'Score Reports', nextId: 'mock_tests_reports' },
    ],
  },
  mock_tests_reports: {
    id: 'mock_tests_reports',
    text: "**Score Reports & Skill Profile**\n\n* **Overall Score:** 10–90 scale.\n* **Communicative Skills:** Separate scores for Listening, Reading, Speaking, and Writing.\n* **Enabling Skills feedback:** Insights on grammar, oral fluency, pronunciation, spelling, vocabulary, and written discourse.\n* **Error Analysis:** Get questions highlighted where you lost marks with expert correction notes.",
    options: [
      { label: 'Full Mock Tests', nextId: 'mock_tests_full' },
      { label: 'Sectional Tests', nextId: 'mock_tests_sectional' },
    ],
  },

  // SPEAKING MODULE FLOW
  speaking: {
    id: 'speaking',
    text: "The Speaking module tests your oral fluency and pronunciation. Click on a question type below to read expert strategies:",
    options: [
      { label: 'Read Aloud Tips', nextId: 'speaking_read_aloud' },
      { label: 'Repeat Sentence Tips', nextId: 'speaking_repeat_sentence' },
      { label: 'Describe Image Strategy', nextId: 'speaking_describe_image' },
      { label: 'Retell Lecture Strategy', nextId: 'speaking_retell_lecture' },
    ],
  },
  speaking_read_aloud: {
    id: 'speaking_read_aloud',
    text: "**Read Aloud Strategies**\n\n1. **Preparation Time (35-40s):** Scan the text. Pronounce difficult words silently.\n2. **Oral Fluency:** Maintain a steady, natural pace. Avoid hesitations, false starts, and self-correction.\n3. **Intonation & Stress:** Stress content words (nouns, verbs, adjectives) and keep weak words unstressed. Raise pitch at commas and lower pitch at full stops.\n4. **No Rushing:** Clear pronunciation is more important than speaking fast.",
    options: [
      { label: 'Repeat Sentence Tips', nextId: 'speaking_repeat_sentence' },
      { label: 'Describe Image Strategy', nextId: 'speaking_describe_image' },
    ],
  },
  speaking_repeat_sentence: {
    id: 'speaking_repeat_sentence',
    text: "**Repeat Sentence Strategies**\n\n1. **Listen to the Cadence:** Don't write the words down. Close your eyes and absorb the meaning and cadence of the sentence.\n2. **50% Rule:** To secure full points for content, you need to repeat at least 50% of the words in the correct sequence. If you miss a word, keep going smoothly.\n3. **Mimic Intonation:** Match the speaker's stress pattern, pitch, and phrasing. Do not hesitate before starting to speak.",
    options: [
      { label: 'Read Aloud Tips', nextId: 'speaking_read_aloud' },
      { label: 'Retell Lecture Strategy', nextId: 'speaking_retell_lecture' },
    ],
  },
  speaking_describe_image: {
    id: 'speaking_describe_image',
    text: "**Describe Image Strategies**\n\n1. **Use a Structural Template:**\n   * *Introduction:* State what the image represents.\n   * *Body (Key points):* Mention the highest values, lowest values, and clear trends.\n   * *Conclusion:* Summarize the overall visual data in one sentence.\n2. **Fluency is King:** Do not stutter or pause to double-check details. Continuous, smooth speech scores higher than listing 100% correct facts with pauses.",
    options: [
      { label: 'Read Aloud Tips', nextId: 'speaking_read_aloud' },
      { label: 'Retell Lecture Strategy', nextId: 'speaking_retell_lecture' },
    ],
  },
  speaking_retell_lecture: {
    id: 'speaking_retell_lecture',
    text: "**Retell Lecture Strategies**\n\n1. **Structured Note Taking:** Jot down key nouns and short phrases. Avoid writing whole sentences.\n2. **Use a Template:** \"The speaker was discussing [Topic]. Firstly, they highlighted [Keyword 1]. Secondly, they mentioned [Keyword 2] and [Keyword 3]. In conclusion, the lecture provides critical insights into [Topic].\"\n3. **Oral Delivery:** Speak for 30-35 seconds smoothly. Do not stop to think; keep your pace natural.",
    options: [
      { label: 'Repeat Sentence Tips', nextId: 'speaking_repeat_sentence' },
      { label: 'Describe Image Strategy', nextId: 'speaking_describe_image' },
    ],
  },

  // WRITING MODULE FLOW
  writing: {
    id: 'writing',
    text: "The Writing module assesses grammar, vocabulary, and structural writing. Choose a topic to explore tips and templates:",
    options: [
      { label: 'Essay Writing Tips', nextId: 'writing_essay' },
      { label: 'Summarize Written Text', nextId: 'writing_summarize' },
      { label: 'Essay Templates', nextId: 'writing_templates' },
      { label: 'Word Limits & Constraints', nextId: 'writing_word_limits' },
    ],
  },
  writing_essay: {
    id: 'writing_essay',
    text: "**PTE Write Essay Tips**\n\n1. **Analyze the Prompt:** Identify if it is an Agree/Disagree, Discussion, or Problem-Solution essay.\n2. **Structure:**\n   * *Intro:* Paraphrase the prompt & state position (40-50 words).\n   * *Body Para 1:* First main point + supporting explanation + example (70-80 words).\n   * *Body Para 2:* Second main point + explanation + example (70-80 words).\n   * *Conclusion:* Summarize main arguments and restate final opinion (30-40 words).\n3. **Vocabulary & Spelling:** Avoid repeating the same words. Use academic vocabulary and double-check spelling (stick to either US or UK spelling consistently).",
    options: [
      { label: 'Essay Templates', nextId: 'writing_templates' },
      { label: 'Word Limits', nextId: 'writing_word_limits' },
    ],
  },
  writing_summarize: {
    id: 'writing_summarize',
    text: "**Summarize Written Text (SWT) Guide**\n\n1. **The Golden Rule:** You must write **EXACTLY ONE sentence** ending with a single full stop.\n2. **Word Count:** Must be between 5 and 75 words (recommended 35–45 words).\n3. **Method:** Locate the primary thesis statements in the passage. Connect them using logical coordinators/subordinators (e.g., *and*, *but*, *although*, *whereas*, *because*).\n4. **Proofread:** Ensure there are no comma splices or grammatical errors.",
    options: [
      { label: 'Essay Writing Tips', nextId: 'writing_essay' },
      { label: 'Word Limits', nextId: 'writing_word_limits' },
    ],
  },
  writing_templates: {
    id: 'writing_templates',
    text: "**Standard Agree / Disagree Template**\n\n* *Introduction:* \"These days, [Topic] is a subject of significant discussion. While some believe that [Opponent view], I argue that [Your view].\"\n* *Body Paragraph 1:* \"To begin with, there are multiple reasons why [Your view] is beneficial. For instance, [Example]. This clearly shows [Outcome].\"\n* *Body Paragraph 2:* \"Furthermore, another crucial aspect is that [Point 2]. As an illustration, [Example 2]. Consequently, [Result 2].\"\n* *Conclusion:* \"In conclusion, although some arguments support [Opponent view], I reiterate that [Your view] is more logical because [Summary sentence].\"",
    options: [
      { label: 'Essay Writing Tips', nextId: 'writing_essay' },
      { label: 'Word Limits', nextId: 'writing_word_limits' },
    ],
  },
  writing_word_limits: {
    id: 'writing_word_limits',
    text: "**Writing Word Limits (Crucial for Scoring)**\n\n* **Write Essay:** **200 - 300 words**. Writing below 120 or above 380 words receives a raw score of 0 for content.\n* **Summarize Written Text (SWT):** **5 - 75 words**. Writing two sentences or breaching the limit sets the score to 0 for grammar and form.\n\n*Always keep an eye on the word count counter on the screen during mock tests!*",
    options: [
      { label: 'Summarize Written Text', nextId: 'writing_summarize' },
      { label: 'Essay Templates', nextId: 'writing_templates' },
    ],
  },

  // READING MODULE FLOW
  reading: {
    id: 'reading',
    text: "The Reading module values time management and vocabulary collocations. Choose a topic to learn more:",
    options: [
      { label: 'Fill in the Blanks (FIB)', nextId: 'reading_fib' },
      { label: 'Reorder Paragraphs', nextId: 'reading_reorder' },
      { label: 'Time Management Tips', nextId: 'reading_time' },
      { label: 'Multiple Choice Qs (MCQs)', nextId: 'reading_mcqs' },
    ],
  },
  reading_fib: {
    id: 'reading_fib',
    text: "**Reading Fill in the Blanks Strategies**\n\n1. **Collocations:** Over 60% of blanks are solved by knowing collocations (e.g. *take into account*, *play a role*, *highly likely*).\n2. **Grammar Clues:** Identify the part of speech needed. If the blank is after \"has been...\", you likely need a past participle (V3) or adjective.\n3. **Contextual Flow:** Read the sentence before and after the blank to grasp positive or negative connotations.",
    options: [
      { label: 'Reorder Paragraphs', nextId: 'reading_reorder' },
      { label: 'Time Management Tips', nextId: 'reading_time' },
    ],
  },
  reading_reorder: {
    id: 'reading_reorder',
    text: "**Reorder Paragraphs Rules**\n\n1. **Find the Independent Sentence:** This is the topic sentence. It contains no pronouns referencing prior sentences (like *he*, *they*, *this*) or transitions (like *however*, *consequently*).\n2. **Find Noun-Pronoun Pairs:** Look for a noun in one paragraph followed by its pronoun counterpart in another.\n3. **Chronological / Logical Order:** Move from general claims to specific examples or follow time-based markers (e.g., *In 1990* -> *Ten years later*).",
    options: [
      { label: 'Fill in the Blanks (FIB)', nextId: 'reading_fib' },
      { label: 'Multiple Choice Qs (MCQs)', nextId: 'reading_mcqs' },
    ],
  },
  reading_time: {
    id: 'reading_time',
    text: "**Reading Time Management**\n\n* The Reading section has a overall countdown timer (29–30 minutes total) for all questions.\n* **FIB Reading & Writing:** Spend max 2.5 minutes per question.\n* **FIB Drag & Drop:** Spend max 2 minutes per question.\n* **Reorder Paragraphs:** Spend max 2 minutes per question.\n* **MCQs (Single & Multiple):** Spend max 1 minute per question. Do not waste time here; make your best guess and move on.",
    options: [
      { label: 'Fill in the Blanks (FIB)', nextId: 'reading_fib' },
      { label: 'Multiple Choice Qs (MCQs)', nextId: 'reading_mcqs' },
    ],
  },
  reading_mcqs: {
    id: 'reading_mcqs',
    text: "**Reading MCQs Strategy**\n\n* **Multiple Answers:** Beware! This question has negative marking for incorrect choices. If you are not 100% sure about a second option, only select the one you are certain is correct. Selecting an incorrect choice costs you 1 mark.\n* **Single Answer:** No negative marking. Scan the text for key terms, eliminate obviously wrong options, and select your final answer.",
    options: [
      { label: 'Reorder Paragraphs', nextId: 'reading_reorder' },
      { label: 'Time Management Tips', nextId: 'reading_time' },
    ],
  },

  // LISTENING MODULE FLOW
  listening: {
    id: 'listening',
    text: "The Listening module requires strong active listening. Choose a question type to learn strategies:",
    options: [
      { label: 'Note Taking Tips', nextId: 'listening_note_taking' },
      { label: 'Highlight Incorrect Words', nextId: 'listening_incorrect_words' },
      { label: 'Write From Dictation', nextId: 'listening_dictation' },
      { label: 'Summarize Spoken Text', nextId: 'listening_summarize' },
    ],
  },
  listening_note_taking: {
    id: 'listening_note_taking',
    text: "**Active Note Taking in Listening**\n\n* Use the erasable notepad provided at the test center.\n* Write in shorthand or abbreviations (e.g. *govt* for government, *dev* for development).\n* Keep your eyes partially on the screen to track audio progression, but focus on writing key facts, numbers, dates, and causes.",
    options: [
      { label: 'Write From Dictation', nextId: 'listening_dictation' },
      { label: 'Summarize Spoken Text', nextId: 'listening_summarize' },
    ],
  },
  listening_incorrect_words: {
    id: 'listening_incorrect_words',
    text: "**Highlight Incorrect Words (HIW)**\n\n* **Negative Marking Applies:** Selecting a correct word as incorrect deducts 1 point. If you are unsure, do not click it!\n* **Strategy:** Move your cursor along with the audio speaker. Click only when the spoken word and the text word clearly differ in pronunciation or meaning.",
    options: [
      { label: 'Note Taking Tips', nextId: 'listening_note_taking' },
      { label: 'Write From Dictation', nextId: 'listening_dictation' },
    ],
  },
  listening_dictation: {
    id: 'listening_dictation',
    text: "**Write From Dictation (WFD) - Most Important Task**\n\n1. **High Value:** Every single word spelled correctly in its correct position gives 1 point to both Listening and Writing sections.\n2. **Type Everything:** Listen carefully, write initial letters first if helpful, then immediately type it out.\n3. **Alternative Spellings:** If you are unsure if a word is plural/singular or has a different spelling, you can write both in the box separated by space (the scoring algorithm extracts valid matches).",
    options: [
      { label: 'Note Taking Tips', nextId: 'listening_note_taking' },
      { label: 'Summarize Spoken Text', nextId: 'listening_summarize' },
    ],
  },
  listening_summarize: {
    id: 'listening_summarize',
    text: "**Summarize Spoken Text (SST)**\n\n* **Time Limit:** Exactly 10 minutes per summary. (Separate timer from overall listening).\n* **Word Count:** **50 to 70 words**.\n* **Structure:** Describe the speaker's main theme, then detail two secondary arguments using keywords from your notes. Maintain high grammatical accuracy.",
    options: [
      { label: 'Highlight Incorrect Words', nextId: 'listening_incorrect_words' },
      { label: 'Write From Dictation', nextId: 'listening_dictation' },
    ],
  },

  // SCORING SYSTEM FLOW
  scoring: {
    id: 'scoring',
    text: "PTE Academic uses a fully automated scoring engine to grade your skills. Choose an area to understand the mechanics:",
    options: [
      { label: 'How Scoring Works', nextId: 'scoring_how_works' },
      { label: 'Partial Marking', nextId: 'scoring_partial' },
      { label: 'Speaking Evaluation', nextId: 'scoring_speaking' },
      { label: 'Writing Evaluation', nextId: 'scoring_writing' },
    ],
  },
  scoring_how_works: {
    id: 'scoring_how_works',
    text: "**Integrated PTE Scoring Engine**\n\n* **Overall Score:** Ranges from 10 to 90.\n* **Cross-Section Scoring:** Many items contribute points to multiple sections. For instance, *Read Aloud* scores both Reading and Speaking; *Summarize Spoken Text* scores both Listening and Writing.",
    options: [
      { label: 'Partial Marking', nextId: 'scoring_partial' },
      { label: 'Speaking Evaluation', nextId: 'scoring_speaking' },
    ],
  },
  scoring_partial: {
    id: 'scoring_partial',
    text: "**Partial Credit vs Correct/Incorrect**\n\n* **Partial Marking:** Most items score you partially based on content, grammar, and pronunciation. You don't need a flawless answer to score highly.\n* **Negative Marking Items:** Beware of these three items:\n  1. MCQ Choose Multiple Answers (Reading)\n  2. MCQ Choose Multiple Answers (Listening)\n  3. Highlight Incorrect Words (Listening)\n\n*Note: The score for any single item never falls below 0.*",
    options: [
      { label: 'How Scoring Works', nextId: 'scoring_how_works' },
      { label: 'Writing Evaluation', nextId: 'scoring_writing' },
    ],
  },
  scoring_speaking: {
    id: 'scoring_speaking',
    text: "**Speaking Evaluation Parameters**\n\n* **Content:** Did you repeat/describe what was requested?\n* **Oral Fluency:** Smooth, natural phrasing, correct stress, and no long pauses or self-corrections.\n* **Pronunciation:** Clear vowels and consonants, matching the standard national varieties of English.",
    options: [
      { label: 'How Scoring Works', nextId: 'scoring_how_works' },
      { label: 'Partial Marking', nextId: 'scoring_partial' },
    ],
  },
  scoring_writing: {
    id: 'scoring_writing',
    text: "**Writing Evaluation Parameters**\n\n* **Form:** Length must fit within the word limits.\n* **Content:** Relevancy of the arguments to the essay topic.\n* **Grammar & Sentence Structure:** Variety of simple, compound, and complex structures.\n* **Vocabulary:** Academic word usage.\n* **Spelling:** Consistent regional spelling rules.",
    options: [
      { label: 'Partial Marking', nextId: 'scoring_partial' },
      { label: 'How Scoring Works', nextId: 'scoring_how_works' },
    ],
  },

  // ACCOUNT SUPPORT FLOW
  account: {
    id: 'account',
    text: "Need help managing your profile, subscription, or billing details? Pick an option to learn how to resolve it:",
    options: [
      { label: 'Forgot Password', nextId: 'account_forgot' },
      { label: 'Upgrade Plan', nextId: 'account_upgrade' },
      { label: 'Cancel Subscription', nextId: 'account_cancel' },
      { label: 'Payment Issues', nextId: 'account_payment' },
    ],
  },
  account_forgot: {
    id: 'account_forgot',
    text: "**How to Reset Your Password**\n\n1. Go to the **Login Page**.\n2. Click on the **Forgot Password?** link below the login button.\n3. Enter your registered email address.\n4. Check your inbox (and spam folder) for a password reset link.\n5. Follow the link to create a new secure password.",
    options: [
      { label: 'Payment Issues', nextId: 'account_payment' },
      { label: 'Upgrade Plan', nextId: 'account_upgrade' },
    ],
  },
  account_upgrade: {
    id: 'account_upgrade',
    text: "**Upgrading Your Active Plan**\n\n1. Navigate to the **Pricing page** in the header navigation.\n2. Select your desired higher plan (Pro or Premium).\n3. Click **Upgrade Now**.\n4. Any remaining days on your current active plan will be pro-rated as a discount at checkout.",
    options: [
      { label: 'Compare Plans', nextId: 'pricing_compare' },
      { label: 'Cancel Subscription', nextId: 'account_cancel' },
    ],
  },
  account_cancel: {
    id: 'account_cancel',
    text: "**Subscription Cancellation Policy**\n\n* You can cancel recurring subscriptions anytime from **Profile -> Account Settings -> Manage Subscription**.\n* Once canceled, you will maintain full access to all your plan benefits until the end of your current billing cycle.\n* No further charges will be made. We do not offer partial refunds.",
    options: [
      { label: 'Upgrade Plan', nextId: 'account_upgrade' },
      { label: 'Payment Issues', nextId: 'account_payment' },
    ],
  },
  account_payment: {
    id: 'account_payment',
    text: "**Resolving Payment Issues**\n\n* **Card Declined:** Double-check your international transaction permissions, card expiry, and CVV. Many banking cards block overseas educational platforms by default.\n* **Alternative Methods:** We support Visa, Mastercard, American Express, PayPal, and UPI/regional bank transfers.\n* **Double Charge:** If you see two holds on your account, one is usually a pending pre-authorization check that will clear in 2-3 business days. Contact support if both post.",
    options: [
      { label: 'Forgot Password', nextId: 'account_forgot' },
      { label: 'Contact Support', nextId: 'contact' },
    ],
  },

  // TECHNICAL SUPPORT FLOW
  technical: {
    id: 'technical',
    text: "Technical hitches can disrupt your mock tests. Select your issue below to troubleshoot immediately:",
    options: [
      { label: '🎤 Microphone Issues', nextId: 'technical_mic' },
      { label: '🔊 Audio Not Playing', nextId: 'technical_audio' },
      { label: '🌐 Browser Compatibility', nextId: 'technical_browser' },
      { label: '⚡ Slow Website / Lagging', nextId: 'technical_slow' },
    ],
  },
  technical_mic: {
    id: 'technical_mic',
    text: "**Microphone Troubleshooting**\n\n1. **Browser Permission:** Ensure the site has access. In your address bar, click the Lock icon and toggle \"Microphone\" to **Allow**.\n2. **Hardware Connection:** Unplug and replug your headset. We strongly recommend wired USB headsets over Bluetooth buds (Bluetooth can drop audio frames).\n3. **System Settings:** Check your OS settings. Ensure the correct mic is selected as the default input device and volume is above 75%.",
    options: [
      { label: 'Audio Not Playing', nextId: 'technical_audio' },
      { label: 'Browser Compatibility', nextId: 'technical_browser' },
    ],
  },
  technical_audio: {
    id: 'technical_audio',
    text: "**Audio Playback Troubleshooting**\n\n1. **Volume Level:** Verify that the website is not muted in your browser tab settings. Check system volume.\n2. **Output Device:** Check if audio is routing to monitor speakers or a disconnected Bluetooth headset.\n3. **Page Refresh:** Sometimes audio files fail to load due to momentary connection drops. Refresh the page (your test progress is saved).",
    options: [
      { label: 'Microphone Issues', nextId: 'technical_mic' },
      { label: 'Slow Website', nextId: 'technical_slow' },
    ],
  },
  technical_browser: {
    id: 'technical_browser',
    text: "**Recommended Browsers for PTE**\n\n* **Chrome:** Fully supported (Best performance for speech recording and player elements).\n* **Microsoft Edge:** Fully supported.\n* **Safari:** Supported (make sure it's updated to the latest iOS/macOS version).\n* *Avoid Firefox or DuckDuckGo private browser wrappers for audio recording, as they often block microphone APIs.*",
    options: [
      { label: 'Microphone Issues', nextId: 'technical_mic' },
      { label: 'Slow Website', nextId: 'technical_slow' },
    ],
  },
  technical_slow: {
    id: 'technical_slow',
    text: "**Improving Website Speed & Loading**\n\n1. **Clear Cache:** Clear browser cookies and cache, then restart the browser.\n2. **Close Tabs:** Close background tabs and applications consuming memory/bandwidth (especially video streams or downloads).\n3. **VPN Status:** Turn off active VPNs, as they might slow down connections to our AI evaluation servers.",
    options: [
      { label: 'Browser Compatibility', nextId: 'technical_browser' },
      { label: 'Contact Support', nextId: 'contact' },
    ],
  },

  // STUDY PLANS FLOW
  study_plans: {
    id: 'study_plans',
    text: "Having a structured approach makes all the difference. Which preparation resource would you like to access?",
    options: [
      { label: '📅 30-Day Study Plan', nextId: 'study_plans_30day' },
      { label: '💡 Daily Practice Tips', nextId: 'study_plans_daily' },
      { label: '⏱️ Time Management Strategy', nextId: 'study_plans_time' },
      { label: '🚀 How to Score 79+', nextId: 'study_plans_79plus' },
    ],
  },
  study_plans_30day: {
    id: 'study_plans_30day',
    text: "**30-Day PTE Study Strategy**\n\n* **Week 1 (Fundamentals):** Learn the format of all 20 question types. Focus on Speaking *Read Aloud* and Writing *SWT*.\n* **Week 2 (Core Skill Building):** Practice Speaking *Repeat Sentence* and Listening *Write from Dictation*. Target collocations for Reading *FIB*.\n* **Week 3 (Full Sectionals):** Take one sectional test daily. Focus on time limits and review weak scores.\n* **Week 4 (Simulations):** Take 3 Full Mock Tests under timed conditions. Review score reports carefully.",
    options: [
      { label: 'Daily Practice Tips', nextId: 'study_plans_daily' },
      { label: 'How to Score 79+', nextId: 'study_plans_79plus' },
    ],
  },
  study_plans_daily: {
    id: 'study_plans_daily',
    text: "**Daily Preparation Checklist (1.5 Hours/day)**\n\n* 15 mins: Read an academic news article (Reading practice).\n* 15 mins: Listen to a podcast/TED talk and summarize (Listening practice).\n* 30 mins: Practice 10 *Repeat Sentences* and 5 *Write from Dictations*.\n* 30 mins: Complete 5 Reading *FIB* and 2 Writing *Essays*.\n\n*Consistency beats cramming!*",
    options: [
      { label: '30-Day Study Plan', nextId: 'study_plans_30day' },
      { label: 'Time Management', nextId: 'study_plans_time' },
    ],
  },
  study_plans_time: {
    id: 'study_plans_time',
    text: "**Exam Time Management Principles**\n\n1. **Speaking:** Never pause for more than 3 seconds, or the microphone closes automatically.\n2. **Writing:** Keep 2 minutes at the end of *Write Essay* to proofread spelling/grammar.\n3. **Reading:** Do not spend more than 2 minutes on any single blank. Save time for high-value items.\n4. **Listening:** Keep enough time at the end for *Write from Dictation* (each correct word is worth 1 full mark).",
    options: [
      { label: 'Daily Practice Tips', nextId: 'study_plans_daily' },
      { label: 'How to Score 79+', nextId: 'study_plans_79plus' },
    ],
  },
  study_plans_79plus: {
    id: 'study_plans_79plus',
    text: "**Roadmap to Score 79+ (Equivalent to IELTS 8.0)**\n\n1. **Perfect your Pronunciation:** Ensure your speech is clear to the computer AI scoring system.\n2. **Master Write From Dictation:** Secure 100% accuracy in this high-scoring section.\n3. **Use Academic Templates:** Templates prevent grammar errors under pressure.\n4. **Review Analytics:** Analyze mock test feedback and drill down on enabling skills like Vocabulary and Written Discourse.",
    options: [
      { label: '30-Day Study Plan', nextId: 'study_plans_30day' },
      { label: 'Time Management', nextId: 'study_plans_time' },
    ],
  },

  // CONTACT SUPPORT FLOW
  contact: {
    id: 'contact',
    text: "Our dedicated human support team is ready to assist you! Feel free to reach out via these details:\n\n* **✉️ Support Email:** support@pteprepplatform.com\n* **💬 WhatsApp Chat:** +1 (555) 019-2834\n* **🕒 Timings:** Monday to Friday, 9:00 AM – 6:00 PM (GMT)\n\n*We usually respond within 2-4 business hours.*",
    isCustom: true,
    options: [
      { label: 'Back to Pricing Plans', nextId: 'pricing' },
      { label: 'Back to Technical Support', nextId: 'technical' },
    ],
  },
};

// Keyword matcher map for text inputs
export const keywordFlowMap: { keywords: string[]; nextId: string }[] = [
  { keywords: ['price', 'pricing', 'plan', 'cost', 'subscription', 'buy', 'premium', 'basic', 'pro', 'compare'], nextId: 'pricing' },
  { keywords: ['mock', 'test', 'exam', 'full length', 'sectional', 'report', 'score report'], nextId: 'mock_tests' },
  { keywords: ['speaking', 'read aloud', 'repeat sentence', 'describe image', 'retell lecture'], nextId: 'speaking' },
  { keywords: ['writing', 'essay', 'summarize written', 'swt', 'template'], nextId: 'writing' },
  { keywords: ['reading', 'blank', 'fib', 'reorder', 'mcq'], nextId: 'reading' },
  { keywords: ['listening', 'note', 'incorrect word', 'dictation', 'wfd', 'sst'], nextId: 'listening' },
  { keywords: ['score', 'scoring', 'mark', 'grading', 'evaluate', 'evaluation', 'result'], nextId: 'scoring' },
  { keywords: ['account', 'password', 'forgot', 'login', 'cancel', 'card', 'payment', 'charge'], nextId: 'account' },
  { keywords: ['tech', 'technical', 'mic', 'microphone', 'audio', 'sound', 'slow', 'browser', 'lag'], nextId: 'technical' },
  { keywords: ['study', 'plan', 'schedule', 'practice', '79', 'tips', 'daily'], nextId: 'study_plans' },
  { keywords: ['contact', 'support', 'email', 'phone', 'whatsapp', 'help', 'human', 'timings'], nextId: 'contact' },
];
