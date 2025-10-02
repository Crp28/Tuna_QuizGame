// Translation strings for English and te reo Māori

const translations = {
  en: {
    // Login form
    loginWelcome: "Welcome!",
    loginEnterDetails: "Please enter your details to start playing:",
    loginUsername: "Nickname or Username",
    loginFirstName: "First Name",
    loginLastName: "Last Name",
    loginEmail: "Email",
    loginPlayButton: "Play Now",
    
    // Game title and info
    gameTitle: "Snake Quiz Game for",
    gameAtBlock: "at block",
    gameLevel: "Level:",
    gameTime: "Time:",
    
    // Question panel
    questionPrefix: "Q:",
    howToPlayTitle: "📚 How to Play",
    howToPlayInstructions: [
      "🐍 Use arrow keys or WASD to control the snake",
      "🪱 Eat the worm with the correct answer (A/B/C/D)",
      "✅ Correct answer = grow longer and score points",
      "❌ Wrong answer or hitting wall/self = game over",
      "🏆 Pass 50% to unlock next level",
      "Press S to start!"
    ],
    
    // Splash screen
    splashReady: "Ready to play,",
    splashPlayAgain: "Play again,",
    splashStartPrompt: "Press S to start the game!",
    splashQuestionsInfo: "This game block contains",
    splashQuestionsCount: "questions.",
    splashAim: "Let's aim for at least 50% correct!",
    splashHintCorrect: "🪱 Eat the correct answer worm (A/B/C/D) to score points.",
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
    
    // Footer
    footerMadeBy: "Made by Minh Nguyen @",
    footerAdmin: "Admin: Edit Question Bank",
    
    // Language switcher
    languageLabel: "Language:",
    languageEnglish: "English",
    languageMaori: "Te Reo Māori"
  },
  mi: {
    // Login form
    loginWelcome: "Nau mai!",
    loginEnterDetails: "Tēnā koa, whakauruhia ō taipitopito kia tīmata te tākaro:",
    loginUsername: "Ingoa ingoa, ingoa kaiwhakamahi rānei",
    loginFirstName: "Ingoa Tuatahi",
    loginLastName: "Ingoa Whakamutunga",
    loginEmail: "Īmēra",
    loginPlayButton: "Tākaro Ināianei",
    
    // Game title and info
    gameTitle: "Kēmu Pātai Nākahi mō",
    gameAtBlock: "i te poraka",
    gameLevel: "Taumata:",
    gameTime: "Wā:",
    
    // Question panel
    questionPrefix: "P:",
    howToPlayTitle: "📚 Me Pēhea te Tākaro",
    howToPlayInstructions: [
      "🐍 Whakamahia ngā patuhi pere, WASD rānei ki te whakahaere i te nākahi",
      "🪱 Kainga te kutukutu me te whakautu tika (A/B/C/D)",
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
    splashHintCorrect: "🪱 Kainga te kutukutu whakautu tika (A/B/C/D) ki te whiwhi piro.",
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
