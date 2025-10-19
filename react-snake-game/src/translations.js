// Translation strings for English and te reo Māori

const translations = {
  en: {
    // Login/Register page
    loginGameTitle: "Tuna Quiz Game",
    loginTitle: "Login",
    registerTitle: "Register",
    username: "Username",
    password: "Password",
    confirmPassword: "Confirm Password",
    name: "Full Name",
    email: "Email",
    accountType: "Account Type",
    student: "Student",
    admin: "Admin",
    loginButton: "Login",
    registerButton: "Register",
    loading: "Loading...",

    // Old login form (keep for backward compatibility)
    loginWelcome: "Welcome!",
    loginEnterDetails: "Please enter your details to start playing:",
    loginUsername: "Nickname or Username",
    loginFirstName: "First Name",
    loginLastName: "Last Name",
    loginEmail: "Email",
    loginPlayButton: "Play Now",

    // User Panel
    logout: "Logout",
    loggingOut: "Logging out...",
    adminPanel: "Admin Panel",

    // Admin Panel
    adminPanelTitle: "Admin Panel",
    createBankTab: "Create Bank",
    addQuestionsTab: "Add Questions",
    bulkUploadTab: "Bulk Upload",
    manageBanksTab: "Manage Banks",
    close: "Close",
    folder: "Folder ID",
    bankName: "Bank Name",
    description: "Description (optional)",
    createButton: "Create Question Bank",
    selectBank: "Select Bank",
    questionText: "Question Text",
    optionA: "Option A",
    optionB: "Option B",
    optionC: "Option C",
    optionD: "Option D",
    correctAnswer: "Correct Answer",
    addQuestionButton: "Add Question",
    bulkUploadButton: "Upload Questions",
    bulkJsonLabel: "Paste JSON or Upload File",
    bulkJsonPlaceholder: "Paste JSON array of questions here...",
    bulkFileUpload: "Or choose a JSON file",
    bulkUploadSuccess: "Successfully uploaded",
    bulkUploadFailed: "Failed to upload",
    bulkUploadInvalidJson: "Invalid JSON format",
    questionPlaceholder: "Enter your question here...",
    optionPlaceholder: "Enter option text...",
    manageBanksTitle: "Manage Question Banks",
    questionCount: "Questions",
    deleteBank: "Delete",
    confirmDeleteTitle: "Confirm Delete",
    confirmDeleteMessage: "Are you sure you want to delete this question bank? This will also delete all leaderboard data for this bank. This action cannot be undone.",
    confirmDeleteButton: "Yes, Delete",
    cancelButton: "Cancel",
    deleteBankSuccess: "Question bank deleted successfully",
    noBanksAvailable: "No question banks available",

    // Question Bank Selector
    selectQuestionBank: "Select Question Bank",

    // Game title and info
    gameTitle: "Tuna Game for",
    gameAtBlock: "at block",
    gameLevel: "Level:",
    gameTime: "Time:",

    // Question panel
    questionPrefix: "Q:",
    howToPlayTitle: "❔ How to Play",
    howToPlayInstructions: [
      "🐍 Use arrow keys or WASD to control the tuna",
      "🦀 Eat the crab with the correct answer (A/B/C/D)",
      "✅ Correct answer = grow longer and score points",
      "❌ Wrong answer or hitting wall/self = game over",
      "🏆 Try to get as much as you can!",
      "Press S to start!"
    ],

    // Splash screen
    splashReady: "Ready to play,",
    splashPlayAgain: "Play again,",
    splashStartPrompt: "Press S to start the game!",
    splashQuestionsInfo: "This game block contains",
    splashQuestionsCount: "questions.",
    splashAim: "Let's aim for at least 50% correct!",
    splashHintCorrect: "🦀 Eat the correct answer crab (A/B/C/D) to score points.",
    splashHintWrong: "❌ Hitting the wall or eating a wrong answer will end your run.",
    splashHint50Percent: "🟢 Once you pass the 50% mark, you may proceed to the next set of questions (if available).",
    splashHintLeaderboard: "🏆 Check the Leaderboard to see how you rank!",

    // Next level
    nextLevelCongrats: "🎉 Congratulations! You've passed over 50% of the questions.",
    nextLevelEligible: "You're eligible to go to the next level.",
    nextLevelButton: "✅ Next Level",

    // Leaderboard
    leaderboardTitle: "🏆 Top Players Leaderboard",
    leaderboardRank: "#",
    leaderboardName: "Name",
    leaderboardLevel: "Level",
    leaderboardTime: "Time (s)",
    leaderboardEmpty: "No entries yet.",

    // Practice Mode
    practiceModeTitle: "Practice Mode Available",
    practiceModeMessage1: "We noticed you're having some challenges! 🎮",
    practiceModeMessage2: "Would you like to try Practice Mode?",
    practiceModeFeatures: "In Practice Mode:",
    practiceFeatureSlower: "🐢 The snake moves slower, giving you more time to react",
    practiceFeatureNoScore: "📊 Your scores won't be recorded on the leaderboard",
    practiceFeatureNoUnlock: "🔒 Levels won't unlock, but you can practice and improve",
    practiceModeAccept: "Try Practice Mode",
    practiceModeDecline: "Continue Normal Mode",
    practiceModeIndicator: "🎯 PRACTICE MODE",
    exitPracticeMode: "Exit Practice",
    practiceDontShowAgain: "Don't show this again",

    // Footer
    footerMadeBy: "Made by Minh Nguyen @",
    footerAdmin: "Admin: Edit Question Bank",

    // Language switcher
    languageLabel: "Language:",
    languageEnglish: "English",
    languageMaori: "Te Reo Māori"
  },
  mi: {
    // Login/Register page
    loginGameTitle: "Kēmu Patapatai Tuna",
    loginTitle: "Takiuru",
    registerTitle: "Rēhita",
    username: "Ingoa Kaiwhakamahi",
    password: "Kupuhipa",
    confirmPassword: "Whakamana Kupuhipa",
    name: "Ingoa Tūturu",
    email: "Īmēra",
    accountType: "Momo Pūkete",
    student: "Ākonga",
    admin: "Kaiwhakahaere",
    loginButton: "Takiuru",
    registerButton: "Rēhita",
    loading: "E uta ana...",

    // Old login form (keep for backward compatibility)
    loginWelcome: "Nau mai!",
    loginEnterDetails: "Tēnā koa, whakauruhia ō taipitopito kia tīmata te tākaro:",
    loginUsername: "Ingoa ingoa, ingoa kaiwhakamahi rānei",
    loginFirstName: "Ingoa Tuatahi",
    loginLastName: "Ingoa Whakamutunga",
    loginEmail: "Īmēra",
    loginPlayButton: "Tākaro Ināianei",

    // User Panel
    logout: "Takiputa",
    loggingOut: "E takiputa ana...",
    adminPanel: "Papa Kaiwhakahaere",

    // Admin Panel
    adminPanelTitle: "Papa Kaiwhakahaere",
    createBankTab: "Waihanga Pūtea",
    addQuestionsTab: "Tāpiri Pātai",
    bulkUploadTab: "Tukuake Nui",
    manageBanksTab: "Whakahaere Pūtea",
    close: "Kati",
    folder: "ID Kōpaki",
    bankName: "Ingoa Pūtea",
    description: "Whakamāramatanga (kōwhiringa)",
    createButton: "Waihanga Pūtea Pātai",
    selectBank: "Tīpako Pūtea",
    questionText: "Kupu Pātai",
    optionA: "Kōwhiringa A",
    optionB: "Kōwhiringa B",
    optionC: "Kōwhiringa C",
    optionD: "Kōwhiringa D",
    correctAnswer: "Whakautu Tika",
    addQuestionButton: "Tāpiri Pātai",
    bulkUploadButton: "Tukuake Pātai",
    bulkJsonLabel: "Whakapiri JSON, Tukuake Kōnae rānei",
    bulkJsonPlaceholder: "Whakapiri i te raupapa JSON o ngā pātai ki konei...",
    bulkFileUpload: "Kōwhiri kōnae JSON rānei",
    bulkUploadSuccess: "I tukuake pai",
    bulkUploadFailed: "I rahua te tukuake",
    bulkUploadInvalidJson: "Hōputu JSON muhu",
    questionPlaceholder: "Tomo i tō pātai ki konei...",
    optionPlaceholder: "Tomo i te kupu kōwhiringa...",
    manageBanksTitle: "Whakahaere Pūtea Pātai",
    questionCount: "Ngā Pātai",
    deleteBank: "Muku",
    confirmDeleteTitle: "Whakamana Muku",
    confirmDeleteMessage: "Kei te tino hiahia koe ki te muku i tēnei pūtea pātai? Ka mukua hoki ngā raraunga papa tākaro katoa mō tēnei pūtea. Kāore e taea te whakakore i tēnei mahi.",
    confirmDeleteButton: "Āe, Muku",
    cancelButton: "Whakakore",
    deleteBankSuccess: "I mukua te pūtea pātai",
    noBanksAvailable: "Kāore he pūtea pātai e wātea ana",

    // Question Bank Selector
    selectQuestionBank: "Tīpako Pūtea Pātai",

    // Game title and info
    gameTitle: "Kēmu Pātai Tuna mō",
    gameAtBlock: "i te poraka",
    gameLevel: "Taumata:",
    gameTime: "Wā:",

    // Question panel
    questionPrefix: "P:",
    howToPlayTitle: "❔ Me Pēhea te Tākaro",
    howToPlayInstructions: [
      "🐍 Whakamahia ngā patuhi pere, WASD rānei ki te whakahaere i te tuna",
      "🦀 Kainga te pāpaka me te whakautu tika (A/B/C/D)",
      "✅ Whakautu tika = tipu roa ake, whiwhi piro",
      "❌ Whakautu hē, patu pakitara, patu i a koe anō rānei = mutu kēmu",
      "🏆 Whiti 50% ki te whakatuwhera i te taumata e whai ake",
      "Pēhia S ki te tīmata!"
    ],

    // Splash screen
    splashReady: "Kei te reri ki te tākaro,",
    splashPlayAgain: "Tākaro anō,",
    splashStartPrompt: "Pēhia S ki te tīmata i te kēmu!",
    splashQuestionsInfo: "Kei roto i tēnei poraka kēmu",
    splashQuestionsCount: "ngā pātai.",
    splashAim: "Me whai kia tika te iti rawa 50%!",
    splashHintCorrect: "🦀 Kainga te pāpaka whakautu tika (A/B/C/D) ki te whiwhi piro.",
    splashHintWrong: "❌ Ka patu i te pakitara, kai i te whakautu hē rānei ka mutu tō rere.",
    splashHint50Percent: "🟢 Ka tae koe ki te 50%, ka taea e koe te haere ki ngā pātai e whai ake ana (mēnā kei te wātea).",
    splashHintLeaderboard: "🏆 Tirohia te Papa Tākaro ki te kite i tō tūnga!",

    // Next level
    nextLevelCongrats: "🎉 Kia ora! Kua hipa koe i te 50% o ngā pātai.",
    nextLevelEligible: "Kei te tika koe ki te haere ki te taumata e whai ake.",
    nextLevelButton: "✅ Taumata e whai ake",

    // Leaderboard
    leaderboardTitle: "🏆 Papa Tākaro Kaitākaro Teitei",
    leaderboardRank: "#",
    leaderboardName: "Ingoa",
    leaderboardLevel: "Taumata",
    leaderboardTime: "Wā (h)",
    leaderboardEmpty: "Kāore anō kia whakauruhia.",

    // Practice Mode
    practiceModeTitle: "Āwhina Whakaako E Wātea Ana",
    practiceModeMessage1: "I kite mātou kei te whai wero koe! 🎮",
    practiceModeMessage2: "E hiahia ana koe ki te whakamātau i te Aratau Whakaako?",
    practiceModeFeatures: "I roto i te Aratau Whakaako:",
    practiceFeatureSlower: "🐢 Ka nuku pōturi ake te tuna, ka tuku atu i te wā ki a koe",
    practiceFeatureNoScore: "📊 Kāore ō piro e tuhia ki te papa tākaro",
    practiceFeatureNoUnlock: "🔒 Kāore ngā taumata e whakatuwhera, engari ka taea e koe te whakaako",
    practiceModeAccept: "Whakamātau Aratau Whakaako",
    practiceModeDecline: "Haere Tonu i te Aratau Māori",
    practiceModeIndicator: "🎯 ARATAU WHAKAAKO",
    exitPracticeMode: "Puta Whakaako",
    practiceDontShowAgain: "Kaua e whakaatu anō",

    // Footer
    footerMadeBy: "I hangaia e Minh Nguyen @",
    footerAdmin: "Kaiwhakahaere: Whakatika Pūtea Pātai",

    // Language switcher
    languageLabel: "Reo:",
    languageEnglish: "English",
    languageMaori: "Te Reo Māori"
  }
};

export default translations;