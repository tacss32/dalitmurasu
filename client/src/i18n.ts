import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          welcome: "Welcome",
          new_feeds: "NEW Feeds",
          dalitmurasu: "Dalitmurasu",
          home: "Home",
          recent_posts: "Recent Posts",
          about: "About",
          contact: "Contact",
          settings: "Settings",
          premium_articles: "Premium Articles",
          editorials: "Editorials",
          series: "Series",
          babasaheb_speaks: "Babasaheb Speaks",
          periyar_speaks: "Periyar Speaks",
          marketplace_books_more: "Marketplace - Books & More",
          dalit_murasu_archive: "Dalit Murasu Archive",
          blue_thoughts: "Blue Thoughts",
          book_review: "Book Review",
          interviews: "Interviews",
          poems: "Poems",
          more: "More",
        },
      },
      ta: {
        translation: {
          welcome: "வரவேற்கிறோம்",
          new_feeds: "புதிய செய்திகள்",
          dalitmurasu: "தலித் முரசு",
          home: "முகப்பு",
          recent_posts: "அண்மைப் பதிவுகள்",
          about: "பற்றி",
          contact: "தொடர்பு கொள்ள",
          settings: "அமைப்புகள்",
          premium_articles: "பிரீமியம் - கட்டுரைகள்",
          editorials: "தலையங்கம்",
          series: "தொடர் ",
          babasaheb_speaks: "பாபாசாகேப் பேசுகிறார்",
          periyar_speaks: "பெரியார் பேசுகிறார்",
          marketplace_books_more: "அங்காடி-புத்தகங்கள் இன்ன பிற",
          dalit_murasu_archive: "தலித் முரசு களஞ்சியம்",
          blue_thoughts: "நீல சிந்தனைகள்",
          book_review: "புத்தகத் திறனாய்வு",
          interviews: "பேட்டி",
          poems: "கவிதை",
          more: "மேலும்",
        },
      },
    },
    lng: "ta",
    fallbackLng: "ta",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
