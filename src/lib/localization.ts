export type Language = "el" | "en";
export type ThemeMode = "light" | "dark";

export const DEFAULT_LANGUAGE: Language = "el";
export const DEFAULT_THEME: ThemeMode = "light";

export const translations = {
  el: {
    appTitle: "NW-Talks",
    nav: {
      schedule: "Πρόγραμμα",
      talks: "Ομιλίες",
      overview: "Επισκόπηση",
      speakers: "Ομιλητές",
      settings: "Ρυθμίσεις",
      admin: "Διαχείριση",
      signOut: "Αποσύνδεση",
      signIn: "Σύνδεση",
      adminTabs: "Καρτέλες διαχείρισης",
      toggleMenu: "Εναλλαγή μενού",
      language: "Γλώσσα",
      theme: "Θέμα",
      light: "Φωτεινό",
      dark: "Σκοτεινό",
      greek: "Ελληνικά",
      english: "Αγγλικά",
    },
    common: {
      today: "Σήμερα",
      backToTop: "Πάνω",
      noSpeakerAssigned: "Δεν έχει οριστεί ομιλητής",
      openInAdminSchedule: "Άνοιγμα στη διαχείριση προγράμματος",
      clearSearch: "Καθαρισμός αναζήτησης",
      loading: "Φόρτωση...",
      save: "Αποθήκευση",
      saving: "Αποθήκευση...",
      noResults: "Δεν βρέθηκαν αποτελέσματα",
    },
    status: {
      confirmed: "Επιβεβαιωμένη",
      open: "Ανοιχτή",
      cancelled: "Ακυρωμένη",
    },
    home: {
      title: "Πρόγραμμα",
      emptyForYear: "Δεν βρέθηκαν ομιλίες για το {year}.",
    },
    talks: {
      title: "Ομιλίες",
      showGuide: "Εμφάνιση οδηγού",
      hideGuide: "Απόκρυψη οδηγού",
      talks: "ομιλίες",
      available: "διαθέσιμες",
      notRecommended: "όχι προτεινόμενες",
      tooRecent: "πολύ πρόσφατες",
      showing: "Εμφάνιση:",
      allTalks: "Όλες οι ομιλίες",
      clickGuide:
        "Πατήστε μια κατηγορία για φιλτράρισμα. Πατήστε ξανά για εμφάνιση όλων.",
      greenGuide: "12+ μήνες - ασφαλές για παρουσίαση",
      orangeGuide: "6-12 μήνες - καλύτερα να περιμένει",
      redGuide: "< 6 μήνες - απαιτείται έγκριση διαχειριστή",
      searchPlaceholder: "Αναζήτηση με τίτλο ή αριθμό...",
      filteredBy: "φιλτραρισμένο κατά",
      matching: "ταιριάζει με",
      talk: "ομιλία",
      talksCount: "ομιλίες",
      noTalksFound: "Δεν βρέθηκαν ομιλίες",
      tryAdjusting: "Δοκιμάστε άλλη αναζήτηση ή φίλτρο",
      neverPresented: "Δεν έχει παρουσιαστεί",
      lastPresented: "Τελευταία:",
      monthsAgo: "μήνες πριν",
      presentation: "παρουσίαση",
      presentations: "παρουσιάσεις",
      freshness: {
        greenLabel: "Διαθέσιμη",
        greenShort: "Διαθέσιμη",
        greenDescription: "12+ μήνες - ασφαλές για παρουσίαση",
        orangeLabel: "Όχι προτεινόμενη",
        orangeShort: "Προσοχή",
        orangeDescription: "6-12 μήνες - καλύτερα να περιμένει",
        redLabel: "Πολύ πρόσφατη",
        redShort: "Πολύ πρόσφατη",
        redDescription: "< 6 μήνες - απαιτείται έγκριση διαχειριστή",
      },
    },
    login: {
      title: "Σύνδεση Διαχείρισης",
      subtitle:
        "Συνδεθείτε με τον λογαριασμό Google για να διαχειριστείτε πρόγραμμα, ομιλητές και ομιλίες.",
      signInGoogle: "Σύνδεση με Google",
      signingIn: "Σύνδεση...",
      signInFailed: "Η σύνδεση απέτυχε",
    },
    adminOverview: {
      title: "Επισκόπηση",
      unassigned: "Χωρίς ανάθεση",
      confirmed: "Επιβεβαιωμένες",
      cancelled: "Ακυρωμένες",
    },
    settings: {
      title: "Ρυθμίσεις",
      meetingDay: "Ημέρα συνάθροισης Σαββατοκύριακου",
      meetingDayHelp:
        "Ορίστε την ημέρα συνάθροισης ανά έτος. Προεπιλογή: Κυριακή.",
      active: "Ενεργό",
      sat: "Σάβ",
      sun: "Κυρ",
      followingYear: "Επόμενο έτος",
      nextYearBadge: "(επόμενο έτος)",
      localCongregation: "Τοπική εκκλησία",
      localCongregationHint:
        "Οι ομιλητές των οποίων η εκκλησία ταιριάζει με αυτή την τιμή θεωρούνται τοπικοί.",
      adminEmails: "Email διαχειριστών",
      add: "Προσθήκη",
      noAdminEmails:
        "Δεν υπάρχουν email διαχειριστών. Προσθέστε τουλάχιστον ένα για πρόσβαση διαχείρισης.",
      saveSettings: "Αποθήκευση ρυθμίσεων",
      settingsSaved: "Οι ρυθμίσεις αποθηκεύτηκαν.",
      prefsHint:
        "Η γλώσσα και το θέμα αλλάζουν από τη γραμμή πλοήγησης για κάθε χρήστη.",
    },
  },
  en: {
    appTitle: "NW-Talks",
    nav: {
      schedule: "Schedule",
      talks: "Talks",
      overview: "Overview",
      speakers: "Speakers",
      settings: "Settings",
      admin: "Admin",
      signOut: "Sign out",
      signIn: "Sign in",
      adminTabs: "Admin tabs",
      toggleMenu: "Toggle menu",
      language: "Language",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      greek: "Greek",
      english: "English",
    },
    common: {
      today: "Today",
      backToTop: "Back to top",
      noSpeakerAssigned: "No speaker assigned",
      openInAdminSchedule: "Open in admin schedule",
      clearSearch: "Clear search",
      loading: "Loading...",
      save: "Save",
      saving: "Saving...",
      noResults: "No results",
    },
    status: {
      confirmed: "Confirmed",
      open: "Open",
      cancelled: "Cancelled",
    },
    home: {
      title: "Schedule",
      emptyForYear: "No talks found for {year}.",
    },
    talks: {
      title: "Talk Gallery",
      showGuide: "Show guide",
      hideGuide: "Hide guide",
      talks: "talks",
      available: "available",
      notRecommended: "not recommended",
      tooRecent: "too recent",
      showing: "Showing:",
      allTalks: "All talks",
      clickGuide: "Click a category to filter. Click again to show all.",
      greenGuide: "12+ months - safe to present",
      orangeGuide: "6-12 months - consider waiting",
      redGuide: "< 6 months - admin override needed",
      searchPlaceholder: "Search by title or number...",
      filteredBy: "filtered by",
      matching: "matching",
      talk: "talk",
      talksCount: "talks",
      noTalksFound: "No talks found",
      tryAdjusting: "Try adjusting your search or filter",
      neverPresented: "Never presented",
      lastPresented: "Last:",
      monthsAgo: "mo ago",
      presentation: "presentation",
      presentations: "presentations",
      freshness: {
        greenLabel: "Available",
        greenShort: "Available",
        greenDescription: "12+ months - safe to present",
        orangeLabel: "Not recommended",
        orangeShort: "Caution",
        orangeDescription: "6-12 months - consider waiting",
        redLabel: "Too recent",
        redShort: "Too recent",
        redDescription: "< 6 months - admin override required",
      },
    },
    login: {
      title: "Admin Sign In",
      subtitle:
        "Sign in with your Google account to manage schedules, speakers, and talks.",
      signInGoogle: "Sign in with Google",
      signingIn: "Signing in...",
      signInFailed: "Sign-in failed",
    },
    adminOverview: {
      title: "Overview",
      unassigned: "Unassigned",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
    },
    settings: {
      title: "Settings",
      meetingDay: "Weekend Meeting Day",
      meetingDayHelp:
        "Toggle the meeting day for each year. Default is Sunday.",
      active: "Active",
      sat: "Sat",
      sun: "Sun",
      followingYear: "Following year",
      nextYearBadge: "(next year)",
      localCongregation: "Local Congregation",
      localCongregationHint:
        "Speakers whose congregation matches this name are considered local.",
      adminEmails: "Admin Emails",
      add: "Add",
      noAdminEmails:
        "No admin emails configured. Add at least one to enable admin access.",
      saveSettings: "Save Settings",
      settingsSaved: "Settings saved.",
      prefsHint:
        "Language and theme are user preferences and can be changed from the navbar.",
    },
  },
} as const;

export type AppTranslations = (typeof translations)[Language];

export function getTranslations(language: Language): AppTranslations {
  return translations[language];
}

export function formatText(
  template: string,
  replacements: Record<string, string | number>,
): string {
  return Object.entries(replacements).reduce(
    (value, [key, replacement]) =>
      value.replaceAll(`{${key}}`, String(replacement)),
    template,
  );
}
