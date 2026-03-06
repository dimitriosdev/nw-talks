/**
 * Seed script — populates Firestore with sample data for nw-talks.
 *
 * Usage:
 *   node scripts/seed.mjs
 *
 * Requires .env.local to contain Firebase config (reads it manually).
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  writeBatch,
} from "firebase/firestore";

// --- Load .env.local manually (no dotenv dependency) -------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
const envFile = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim())),
);

// --- Firebase init -----------------------------------------------------------

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);

// =============================================================================
// SEED DATA
// =============================================================================

/** Global settings  */
const settings = {
  activeYear: 2026,
  meetingDay: "Saturday",
  localCongregation: "Zürich",
  adminEmails: [],
};

/** Public talks (id + title). */
const talks = [
  { id: 1, title: "Πόσο καλά γνωρίζετε τον Θεό;" },
  { id: 2, title: "Θα επιζήσετε εσείς από τις τελευταίες ημέρες;" },
  { id: 3, title: "Να προχωρείτε μαζι με την ενοποιημένη οργάνωση του Ιεχωβά" },
  { id: 4, title: "Αποδείξεις περί Θεού στον κόσμο που μας περιβάλλει" },
  { id: 5, title: "Πραγματική βοήθεια για την οικογένεια" },
  {
    id: 6,
    title: "Ο κατακλυσμός των ημερών του Νώε και η Σημασία του για εμας",
  },
  { id: 7, title: "Να μιμείστε τον Πατέρα του τρυφερού ελέους" },
  {
    id: 8,
    title: "Ας ζούμε για να κάνουμε το θέλημα του Θεού και όχι το δικό μας",
  },
  { id: 9, title: "Να ακούτε τον Λόγο του Θεού και να τον εκτελείτε" },
  { id: 10, title: "Να είστε έντιμοι σε όλα όσα λέτε και κάνετε" },
  { id: 11, title: "Μην είστε μέρος του κόσμου, μιμούμενοι τον Χριστό" },
  { id: 12, title: "Η αποψή σας για την εξουσία έχει σημασία για τον Θεό" },
  { id: 13, title: "Η θεική άποψη για το σεξ και τον γάμο" },
  { id: 14, title: "Ένας καθαρός λαός τιμάει τον Ιεχωβά" },
  { id: 15, title: "Ας κάνουμε το καλό σε όλους" },
  { id: 16, title: "Να ενισχύετε συνεχώς τη σχέση σας με τον Θεό" },
  { id: 17, title: "Πως να δοξάζουμε τον Θεό με όλα όσα έχουμε" },
  { id: 18, title: "Να κάνετε τον Ιεχωβα οχυρό σας" },
  { id: 19, title: "Το Μέλλον Σας—Πώς Μπορείτε να το Μάθετε;" },
  { id: 20, title: "Μήπως Έφτασε ο Καιρός να Κυβερνήσει ο Θεός τον Κόσμο;" },
  {
    id: 21,
    title: "Να Θεωρείτε Πολύτιμη τη Θέση Σας στη Διευθέτηση της Βασιλείας",
  },
  { id: 22, title: "Ωφελείστε Εσείς από τις Προμήθειες του Ιεχωβά;" },
  { id: 23, title: "Η Ζωή Έχει Πράγματι Σκοπό" },
  { id: 24, title: "Ένα «Μαργαριτάρι Μεγάλης Αξίας»—Εσείς το Έχετε Βρει;" },
  { id: 25, title: "Να Αντιστέκεστε στο Πνεύμα του Κόσμου!" },
  { id: 26, title: "Έχετε Αξία για τον Θεό;" },
  { id: 27, title: "Κάντε μια Καλή Αρχή στον Γάμο Σας" },
  { id: 28, title: "Να Δείχνετε Σεβασμό και Αγάπη Μέσα στον Γάμο Σας" },
  { id: 29, title: "Ευθύνες και Ανταμοιβές των Γονέων" },
  { id: 30, title: "Βελτιώστε την Επικοινωνία στην Οικογένειά Σας" },
  { id: 31, title: "Έχετε Συναίσθηση της Πνευματικής σας Ανάγκης;" },
  { id: 32, title: "Αντιμετωπίστε με Επιτυχία τις Ανησυχίες της Ζωής" },
  { id: 33, title: "Θα Υπάρξει Ποτέ Αληθινή Δικαιοσύνη;" },
  { id: 34, title: "Θα Λάβετε Εσείς το Σημάδι για Επιβίωση;" },
  { id: 35, title: "Μπορείτε να Ζείτε για Πάντα; Εσείς θα Ζήσετε;" },
  { id: 36, title: "Αυτό Είναι Όλο και Όλο η Ζωή του Ανθρώπου;" },
  { id: 37, title: "Είναι οι Οδοί του Θεού Πραγματικά Ωφέλιμες;" },
  { id: 38, title: "Πώς Μπορείτε να Επιζήσετε από το Τέλος του Κόσμου;" },
  { id: 39, title: "Ιησούς Χριστός, Νικητής του Κόσμου—Πώς και Πότε;" },
  { id: 40, title: "Τι Επιφυλάσσει το Κοντινό Μέλλον;" },
  { id: 41, title: "«Σταθείτε και Δείτε τη Σωτηρία του Ιεχωβά»" },
  { id: 42, title: "Πώς σας Επηρεάζει η Βασιλεία του Θεού" },
  { id: 43, title: "Οι Απαιτήσεις του Θεού—Πάντοτε Ωφέλιμες" },
  { id: 44, title: "Πώς Μπορούν να σας Ωφελήσουν οι Διδασκαλίες του Ιησού;" },
  { id: 45, title: "Ακολουθήστε την Οδό που Οδηγεί στη Ζωή" },
  { id: 46, title: "Διατηρήστε Σταθερή την Πεποίθησή σας Μέχρι το Τέλος" },
  { id: 47, title: "-" },
  {
    id: 48,
    title: "Επιτυχής Αντιμετώπιση της Δοκιμασίας της Χριστιανικής Οσιότητας",
  },
  { id: 49, title: "Μια Καθαρή Γη—Είναι Εφικτή;" },
  { id: 50, title: "Πώς να Παίρνετε Αποφάσεις που Οδηγούν σε Επιτυχία" },
  { id: 51, title: "Μεταμορφώνει η Αλήθεια τη Ζωή Σας;" },
  { id: 52, title: "Ποιος Είναι ο Δικός σας Θεός;" },
  {
    id: 53,
    title: "Συμφωνεί ο Δικός σας Τρόπος Σκέψης με τον Τρόπο Σκέψης του Θεού;",
  },
  { id: 54, title: "Οικοδομήστε Πίστη στον Θεό και στις Υποσχέσεις Του" },
  { id: 55, title: "Πώς Μπορείτε να Κάνετε Καλό Όνομα Ενώπιον του Θεού;" },
  { id: 56, title: "Ποιον Ηγέτη Μπορείτε να Εμπιστευτείτε;" },
  { id: 57, title: "Πώς να Αντέξετε το Διωγμό" },
  { id: 58, title: "Ποιοι Είναι οι Πραγματικοί Ακόλουθοι του Χριστού;" },
  { id: 59, title: "Θα Θερίσετε ό,τι Σπέρνετε" },
  { id: 60, title: "Ποιος Είναι ο Σκοπός της Ζωής Σας;" },
  { id: 61, title: "Σε Τίνος τις Υποσχέσεις Βασίζεστε;" },
  { id: 62, title: "Πού Μπορείτε να Βρείτε Πραγματική Ελπίδα;" },
  { id: 63, title: "Έχετε το Ευαγγελιστικό Πνεύμα;" },
  { id: 64, title: "Εσείς τι Αγαπάτε; Τις Απολαύσεις ή τον Θεό;" },
  { id: 65, title: "Πώς να Καλλιεργείτε Ειρήνη σε έναν Θυμωμένο Κόσμο" },
  { id: 66, title: "Θα Είστε Εσείς Εργάτης στον Θερισμό;" },
  { id: 67, title: "Να Στοχάζεστε τον Λόγο και τα Έργα του Ιεχωβά" },
  { id: 68, title: "«Να Συγχωρείτε ο Ένας τον Άλλον Ανεπιφύλακτα»" },
  { id: 69, title: "Γιατί Πρέπει να Δείχνουμε Αυτοθυσιαστική Αγάπη;" },
  { id: 70, title: "Θέστε στον Ιεχωβά την Εμπιστοσύνη Σας" },
  { id: 71, title: "Να Μένετε Άγρυπνοι—Γιατί και Πώς;" },
  { id: 72, title: "Η Αγάπη Χαρακτηρίζει την Αληθινή Χριστιανική Εκκλησία" },
  { id: 73, title: "Αποκτήστε «Σοφή Καρδιά»" },
  { id: 74, title: "Τα Μάτια του Ιεχωβά Είναι Πάνω Μας" },
  {
    id: 75,
    title: "Να Υποστηρίζετε τη Διακυβέρνηση του Ιεχωβά στην Προσωπική σας Ζωή",
  },
  {
    id: 76,
    title:
      "Βιβλικές Αρχές—Μπορούν να μας Βοηθήσουν να Αντεπεξερχόμαστε στα Σημερινά Προβλήματα;",
  },
  { id: 77, title: "«Να Ακολουθείτε την Πορεία της Φιλοξενίας»" },
  { id: 78, title: "Να Υπηρετείτε τον Ιεχωβά με Χαρούμενη Καρδιά" },
  { id: 79, title: "Τίνος τη Φιλία θα Διαλέξετε;" },
  {
    id: 80,
    title: "Πού Στηρίζετε τις Ελπίδες Σας; Στην Επιστήμη ή στην Αγία Γραφή;",
  },
  { id: 81, title: "Ποιοι Έχουν τα Προσόντα να Κάνουν Μαθητές;" },
  { id: 82, title: "Ο Ιεχωβά και ο Χριστός—Είναι Μέρος μιας Τριάδας;" },
  { id: 83, title: "Ο Καιρός Κρίσης της Θρησκείας" },
  {
    id: 84,
    title: "Θα Διαφύγετε από το Τέλος που Προορίζεται να Έχει Αυτός ο Κόσμος;",
  },
  { id: 85, title: "Καλά Νέα Μέσα σε έναν Βίαιο Κόσμο" },
  { id: 86, title: "Προσευχές που Εισακούονται από τον Θεό" },
  { id: 87, title: "Ποια Είναι η Σχέση σας με τον Θεό;" },
  {
    id: 88,
    title: "Γιατί Πρέπει να Ζούμε Σύμφωνα με τους Κανόνες της Αγίας Γραφής;",
  },
  { id: 89, title: "Ελάτε, Εσείς που Διψάτε για την Αλήθεια!" },
  { id: 90, title: "Επιδιώξτε την Πραγματική Ζωή!" },
  { id: 91, title: "Η Παρουσία του Μεσσία και η Διακυβέρνησή Του" },
  { id: 92, title: "Ο Ρόλος της Θρησκείας στις Παγκόσμιες Υποθέσεις" },
  { id: 93, title: "«Θεομηνίες»—Πώς τις Θεωρείτε;" },
  {
    id: 94,
    title:
      "Η Αληθινή Θρησκεία Ανταποκρίνεται στις Ανάγκες της Ανθρώπινης Κοινωνίας",
  },
  { id: 95, title: "Η Άποψη της Αγίας Γραφής για τις Πνευματιστικές Πράξεις" },
  { id: 96, title: "Ο Ρόλος της Θρησκείας στις Παγκόσμιες Υποθέσεις" },
  { id: 97, title: "Να Παραμένετε Άμεμπτοι Ανάμεσα σε μια Εξαχρειωμένη Γενιά" },
  { id: 98, title: "«Το Σκηνικό Αυτού του Κόσμου Αλλάζει»" },
  { id: 99, title: "Γιατί Μπορείτε να Εμπιστευτείτε την Αγία Γραφή" },
  { id: 100, title: "Πώς να Οικοδομήσετε Ισχυρές και Διαρκείς Φιλίες" },
  { id: 101, title: "Ο Ιεχωβά—Ο Μεγαλειώδης Δημιουργός" },
  { id: 102, title: "Να Δίνετε Προσοχή στον Προφητικό Λόγο" },
  { id: 103, title: "Πώς Μπορείτε να Βρείτε Αληθινή Χαρά;" },
  { id: 104, title: "Γονείς—Οικοδομείτε με Πυρίμαχα Υλικά;" },
  { id: 105, title: "Πώς να Βρίσκουμε Παρηγοριά σε Όλες τις Θλίψεις Μας" },
  { id: 106, title: "Η Καταστροφή της Γης Επιφέρει τη Θεϊκή Ανταπόδοση" },
  { id: 107, title: "Ωφελείστε Εσείς από απο μια εκπαιδευμένη Συνείδηση;" },
  { id: 108, title: "Πώς να Υπερνικήσετε το Φόβο για το Μέλλον" },
  { id: 109, title: "Η Βασιλεία του Θεού Είναι Κοντά" },
  {
    id: 110,
    title: "Στην Πετυχημένη Οικογενειακή Ζωή ο Θεός Βρίσκεται στην Πρώτη Θέση",
  },
  { id: 111, title: "Τι Επιτελεί η Θεραπεία των Εθνών;" },
  { id: 112, title: "Πώς να Εκδηλώνετε Αγάπη Μέσα σε έναν Άνομο Κόσμο" },
  {
    id: 113,
    title: "Πώς Μπορούν οι Νεαροί να Είναι Επιτυχημένοι και Ευτυχισμένοι;",
  },
  { id: 114, title: "Να Εκτιμάτε τα Θαύματα της Δημιουργίας του Θεού" },
  { id: 115, title: "Πώς να Προστατευτούμε από τις Παγίδες του Σατανά" },
  { id: 116, title: "Να Διαλέγετε τις Συναναστροφές σας Σοφά!" },
  { id: 117, title: "Πώς να Νικάτε το Κακό με το Καλό" },
  { id: 118, title: "Ας Βλέπουμε τους Νέους από την Άποψη του Ιεχωβά" },
  {
    id: 119,
    title: "Ο Αποχωρισμός των Χριστιανών από τον Κόσμο—Γιατί Είναι Ωφέλιμος",
  },
  { id: 120, title: "Γιατί να Υποταχθούμε στη Διακυβέρνηση του Θεού Τώρα" },
  { id: 121, title: "Μια Παγκόσμια Αδελφότητα Σώζεται από τη Συμφορά" },
  { id: 122, title: "Παγγήινη Ειρήνη—Από Ποια Πηγή;" },
  { id: 123, title: "Γιατί Πρέπει να Είναι Διαφορετικοί οι Χριστιανοί" },
  { id: 124, title: "Βάση για Πίστη στη Θεοπνευστία της Αγίας Γραφής" },
  { id: 125, title: "Γιατί η Ανθρωπότητα Χρειάζεται Λύτρο" },
  { id: 126, title: "Ποιοι Μπορούν να Σωθούν;" },
  { id: 127, title: "Τι Συμβαίνει Όταν Πεθαίνουμε;" },
  { id: 128, title: "Άδης ή «Κόλαση»—Τόπος Πύρινων Βασάνων;" },
  { id: 129, title: "Διδάσκει η Αγία Γραφή την Τριάδα;" },
  { id: 130, title: "Η Γη θα Παραμείνει για Πάντα" },
  { id: 131, title: "Υπάρχει Πράγματι Διάβολος;" },
  { id: 132, title: "Η Ανάσταση—Νίκη Κατά του Θανάτου!" },
  { id: 133, title: "Η Προέλευση των Ανθρώπων—Έχει Σημασία Τι Πιστεύετε;" },
  { id: 134, title: "Πρέπει να Τηρούν οι Χριστιανοί το Σάββατο;" },
  { id: 135, title: "Η Ιερότητα της Ζωής και του Αίματος" },
  { id: 136, title: "Επιδοκιμάζει ο Θεός τη Χρήση Εικόνων στη Λατρεία;" },
  { id: 137, title: "Συνέβησαν Πράγματι τα Γραφικά Θαύματα;" },
  { id: 138, title: "Να Ζείτε με Σωφροσύνη Μέσα σε έναν Εξαχρειωμένο Κόσμο" },
  { id: 139, title: "Θεϊκή Σοφία Μέσα σε έναν Επιστημονικό Κόσμο" },
  { id: 140, title: "Ποιος Είναι στην Πραγματικότητα ο Ιησούς Χριστός;" },
  {
    id: 141,
    title: "Ο Στεναγμός της Ανθρώπινης Δημιουργίας—Πότε θα Τελειώσει;",
  },
  { id: 142, title: "Γιατί Πρέπει να Βρείτε Καταφύγιο στον Ιεχωβά" },
  { id: 143, title: "Να Εμπιστεύεστε στον Θεό Κάθε Παρηγοριάς" },
  { id: 144, title: "Μια Όσια Εκκλησία Υπό την Ηγεσία του Χριστού" },
  { id: 145, title: "Ποιος Είναι σαν τον Ιεχωβά τον Θεό Μας;" },
  {
    id: 146,
    title: "Να Χρησιμοποιείτε την Εκπαίδευση για να Αινείτε τον Ιεχωβά",
  },
  { id: 147, title: "Να Εμπιστεύεστε στη Σωτήρια Δύναμη του Ιεχωβά" },
  { id: 148, title: "Συμμερίζεστε την Άποψη του Θεού για τη Ζωή;" },
  { id: 149, title: "Περπατάτε Εσείς με τον Θεό;" },
  { id: 150, title: "Είναι Αυτός ο Κόσμος Καταδικασμένος να Καταστραφεί;" },
  { id: 151, title: "Ο Ιεχωβά Είναι «Ασφαλές Ύψωμα» για το Λαό Του" },
  { id: 152, title: "Ο Αληθινός Αρμαγεδδών—Γιατί; Πότε;" },
  { id: 153, title: "Να Έχετε Διαρκώς στον Νου την Ημέρα που Εμπνέει Δέος" },
  { id: 154, title: "Η Ανθρώπινη Διακυβέρνηση στη Ζυγαριά" },
  { id: 155, title: "Έχει Φτάσει η Ώρα της Κρίσης της Βαβυλώνας;" },
  { id: 156, title: "Η Ημέρα της Κρίσης—Καιρός για Φόβο ή για Ελπίδα;" },
  {
    id: 157,
    title: "Πώς Στολίζουν οι Αληθινοί Χριστιανοί τη Θεϊκή Διδασκαλία",
  },
  { id: 158, title: "Να Είστε Θαρραλέοι και να Εμπιστεύεστε στον Ιεχωβά" },
  { id: 159, title: "Βρείτε Ασφάλεια Μέσα σε έναν Επικίνδυνο Κόσμο" },
  { id: 160, title: "Διαφυλάξτε τη Χριστιανική σας Ταυτότητα!" },
  { id: 161, title: "Γιατί Υπέφερε και Πέθανε ο Ιησούς;" },
  { id: 162, title: "Απελευθέρωση από έναν Κόσμο Σκοταδιού" },
  { id: 163, title: "Γιατί Πρέπει να Φοβόμαστε τον Αληθινό Θεό;" },
  { id: 164, title: "Εξακολουθεί να Ασκεί ο Θεός τον Έλεγχο της Κατάστασης;" },
  { id: 165, title: "Τίνος τις Αξίες Θεωρείτε Εσείς Πολύτιμες;" },
  { id: 166, title: "Αληθινή Πίστη—Τι Είναι και Πώς Γίνεται Φανερή;" },
  { id: 167, title: "Να Ενεργείτε Σοφά σε έναν Ασύνετο Κόσμο" },
  {
    id: 168,
    title: "Μπορείτε να Νιώθετε Ασφαλείς σε Αυτόν τον Ταραγμένο Κόσμο!",
  },
  { id: 169, title: "Γιατί Πρέπει να Καθοδηγούμαστε από την Αγία Γραφή;" },
  { id: 170, title: "Ποιος Έχει τα Προσόντα να Κυβερνήσει την Ανθρωπότητα;" },
  {
    id: 171,
    title: "Μπορείτε να Απολαμβάνετε Ζωή με Ειρήνη Τώρα—Και για Πάντα!",
  },
  { id: 172, title: "Ποια Είναι η Υπόστασή σας Ενώπιον του Θεού;" },
  { id: 173, title: "Υπάρχει Αληθινή Θρησκεία από την Άποψη του Θεού;" },
  { id: 174, title: "Ο Νέος Κόσμος του Θεού—Ποιοι θα Ζήσουν σε Αυτόν;" },
  { id: 175, title: "Τι Πιστοποιεί την Αυθεντικότητα της Αγίας Γραφής;" },
  { id: 176, title: "Αληθινή Ειρήνη και Ασφάλεια—Πότε;" },
  { id: 177, title: "Πού Μπορείτε να Βρείτε Βοήθεια σε Καιρούς Στενοχώριας;" },
  { id: 178, title: "Να Περπατάτε στην Οδό της Ακεραιότητας" },
  {
    id: 179,
    title:
      "Να Απορρίπτετε τις Κοσμικές Φαντασιώσεις, να Επιδιώκετε τις Πραγματικότητες της Βασιλείας",
  },
  {
    id: 180,
    title: "Ανάσταση—Γιατί Αυτή η Ελπίδα Πρέπει να Είναι Πραγματική για Εσάς",
  },
  { id: 181, title: "Μήπως Είναι Πιο Αργά από ό,τι Νομίζετε;" },
  { id: 182, title: "Τι Κάνει για Εμάς η Βασιλεία του Θεού Τώρα" },
  { id: 183, title: "Να Απομακρύνετε τα Μάτια σας από Ό,τι Δεν Έχει Αξία!" },
  { id: 184, title: "Τελειώνουν Όλα με το Θάνατο;" },
  { id: 185, title: "Επηρεάζει η Αλήθεια τη Ζωή Σας;" },
  { id: 186, title: "Ενωθείτε με τον Ευτυχισμένο Λαό του Θεού" },
  { id: 187, title: "Γιατί να Επιτρέπει ένας Στοργικός Θεός την Πονηριά;" },
  { id: 188, title: "Θέτετε την Πεποίθησή σας στον Ιεχωβά;" },
  { id: 189, title: "Περπατώντας με τον Θεό Ευλογούμαστε Τώρα και για Πάντα" },
  { id: 190, title: "Μια Υπόσχεση για Τέλεια Οικογενειακή Ευτυχία" },
  { id: 191, title: "Πώς Νικάει τον Κόσμο η Αγάπη και η Πίστη" },
  { id: 192, title: "Βαδίζετε Εσείς στον Δρόμο που Οδηγεί στην Αιώνια Ζωή;" },
  { id: 193, title: "Διάσωση Μέσα από την Παγκόσμια Στενοχώρια" },
  { id: 194, title: "Πως μας Ωφελεί η Θεϊκή Σοφία" },
];

/** Speakers — full first names filled in from 2025 schedule data. */
const speakers = [
  // --- Backnang ----------------------------------------------------------------
  {
    firstName: "Π.",
    lastName: "Μιχαηλίδης",
    congregation: "Backnang",
    phone: "+4971911879517",
    availableTalks: [10, 185],
  },
  {
    firstName: "Κ.",
    lastName: "Κυριαζίδης",
    congregation: "Backnang",
    phone: "+49719184396",
    availableTalks: [10, 185],
  },
  {
    firstName: "Δαυίδ",
    lastName: "Αγγελιδάκης",
    congregation: "Backnang",
    phone: "+491715300952",
    availableTalks: [23, 79, 180],
  },
  {
    firstName: "Γ.",
    lastName: "Κοτζαπάσης",
    congregation: "Backnang",
    phone: "+4917687973722",
    availableTalks: [35],
  },
  // --- Besigheim ---------------------------------------------------------------
  {
    firstName: "Δημήτρης",
    lastName: "Φρίκης",
    congregation: "Besigheim",
    phone: "+491607716797",
    availableTalks: [25, 67],
  },
  {
    firstName: "Β.",
    lastName: "Τζιμόπουλος",
    congregation: "Besigheim",
    phone: "+4915752591599",
    availableTalks: [67, 41, 180],
  },
  {
    firstName: "Ευγένης",
    lastName: "Τζιφρής",
    congregation: "Besigheim",
    phone: "+491786613208",
    availableTalks: [88],
  },
  {
    firstName: "Ν.",
    lastName: "Βιζέλης",
    congregation: "Besigheim",
    phone: "+4917680557508",
    availableTalks: [7, 66, 70, 144],
  },
  {
    firstName: "Φ.",
    lastName: "Μίχος",
    congregation: "Besigheim",
    phone: "+491776312155",
    availableTalks: [89],
  },
  {
    firstName: "Μ.",
    lastName: "Βρακάς",
    congregation: "Besigheim",
    phone: "+491715738403",
    availableTalks: [53],
  },
  {
    firstName: "Φ.",
    lastName: "Βρακάς",
    congregation: "Besigheim",
    phone: "+4917655520321",
    availableTalks: [31, 72],
  },
  {
    firstName: "Φ.",
    lastName: "Βρακάς",
    congregation: "Besigheim",
    phone: "+4917655521078",
    availableTalks: [75, 23, 121, 14],
  },
  {
    firstName: "Χ.",
    lastName: "Γκανταΐδης",
    congregation: "Besigheim",
    phone: "+491776312155",
    availableTalks: [8],
  },
  {
    firstName: "Μ.",
    lastName: "Μουμτζόγλου",
    congregation: "Besigheim",
    phone: "+491732534349",
    availableTalks: [93, 179, 32, 42, 73, 158, 194],
  },
  // --- Karlsruhe ---------------------------------------------------------------
  {
    firstName: "Ν.",
    lastName: "Αλμπανίδης",
    congregation: "Karlsruhe",
    phone: "+491714719364",
    availableTalks: [79, 113, 137],
  },
  {
    firstName: "Γιώργος",
    lastName: "Μπακέας",
    congregation: "Karlsruhe",
    phone: "+4917634213974",
    availableTalks: [32, 72],
  },
  {
    firstName: "Α.",
    lastName: "Ντεμίρ",
    congregation: "Karlsruhe",
    phone: "+4917623931604",
    availableTalks: [55, 32, 72, 77],
  },
  {
    firstName: "Γ.",
    lastName: "Ντεμίρ",
    congregation: "Karlsruhe",
    phone: "+4915122547294",
    availableTalks: [22, 62, 132, 145],
  },
  // --- Böblingen ---------------------------------------------------------------
  {
    firstName: "Γ.",
    lastName: "Κωστελίδης",
    congregation: "Böblingen",
    phone: "+491799207387",
    availableTalks: [65, 132],
  },
  {
    firstName: "Σ.",
    lastName: "Λυκίδης",
    congregation: "Böblingen",
    phone: "+4915758497996",
    availableTalks: [24, 65, 184],
  },
  {
    firstName: "Γ.",
    lastName: "Παρουτσής",
    congregation: "Böblingen",
    phone: "+4917638568878",
    availableTalks: [179],
  },
  {
    firstName: "Τόνης",
    lastName: "Παρουτσής",
    congregation: "Böblingen",
    phone: "+491793205844",
    availableTalks: [28, 161],
  },
  {
    firstName: "Ν.",
    lastName: "Πεννολίδης",
    congregation: "Böblingen",
    phone: "+4915734864630",
    availableTalks: [192],
  },
  // --- Mannheim ----------------------------------------------------------------
  {
    firstName: "Γ.",
    lastName: "Καραγιάννης",
    congregation: "Mannheim",
    phone: "+491608671623",
    availableTalks: [15, 37, 107, 189, 190],
  },
  {
    firstName: "Π.",
    lastName: "Πεπόνης",
    congregation: "Mannheim",
    phone: "+4915254517805",
    availableTalks: [18, 44],
  },
  {
    firstName: "Π.",
    lastName: "Κοτανίδης",
    congregation: "Mannheim",
    phone: "+491788485837",
    availableTalks: [74, 45, 113],
  },
  {
    firstName: "Γ.",
    lastName: "Χανιώτης",
    congregation: "Mannheim",
    phone: "+491737643378",
    availableTalks: [153, 159, 187],
  },
  {
    firstName: "Κ.",
    lastName: "Λαγγούσης",
    congregation: "Mannheim",
    phone: "+491722048872",
    availableTalks: [7, 10, 76, 98],
  },
  {
    firstName: "Ε.",
    lastName: "Ρίζος",
    congregation: "Mannheim",
    phone: "+4917657786778",
    availableTalks: [62, 88, 180],
  },
  {
    firstName: "Π.",
    lastName: "Ξυλούρης",
    congregation: "Mannheim",
    phone: "+4917631063066",
    availableTalks: [105],
  },
  // --- StuttgartNord ------------------------------------------------------------
  {
    firstName: "Αποστόλης",
    lastName: "Βραβοσινός",
    congregation: "StuttgartNord",
    phone: "+4915773801984",
    availableTalks: [81, 29],
  },
  {
    firstName: "Β.",
    lastName: "Στεφανόπουλος",
    congregation: "StuttgartNord",
    phone: "+4917647078327",
    availableTalks: [67, 65],
  },
  {
    firstName: "Ν.",
    lastName: "Τζούνας",
    congregation: "StuttgartNord",
    phone: "+491727411254",
    availableTalks: [11, 7, 72, 121],
  },
  {
    firstName: "Γ.",
    lastName: "Ψαλτόπουλος",
    congregation: "StuttgartNord",
    phone: "+4917642779222",
    availableTalks: [115],
  },
  {
    firstName: "Τ.",
    lastName: "Βραβοσινός",
    congregation: "StuttgartNord",
    phone: "+491727218433",
    availableTalks: [101, 61],
  },
  {
    firstName: "Ν.",
    lastName: "Μπακλατζής",
    congregation: "StuttgartNord",
    phone: "+4917654030611",
    availableTalks: [25, 31, 179],
  },
  {
    firstName: "Παναγιώτης",
    lastName: "Δημόπουλος",
    congregation: "StuttgartNord",
    phone: "+4917657940509",
    availableTalks: [72, 113, 132, 160],
  },
  {
    firstName: "Κ.",
    lastName: "Κιούρτης",
    congregation: "StuttgartNord",
    phone: "+491636781173",
    availableTalks: [7, 32],
  },
  {
    firstName: "Τ.",
    lastName: "Καρακάσης",
    congregation: "StuttgartNord",
    phone: "+4917624835992",
    availableTalks: [62, 185],
  },
  {
    firstName: "Π.",
    lastName: "Κωνσταντάκης",
    congregation: "StuttgartNord",
    phone: "+491736635642",
    availableTalks: [71],
  },
  {
    firstName: "Π.",
    lastName: "Λεωνίδης",
    congregation: "StuttgartNord",
    phone: "+4915127076341",
    availableTalks: [55, 62, 172],
  },
  // --- StuttgartSüd ------------------------------------------------------------
  {
    firstName: "Στέφανος",
    lastName: "Αποστολόπουλος",
    congregation: "StuttgartSüd",
    phone: "+491734074424",
    availableTalks: [56, 78],
  },
  {
    firstName: "Παναγιώτης",
    lastName: "Γρηγοριάδης",
    congregation: "StuttgartSüd",
    phone: "+4916097746427",
    availableTalks: [53, 71],
  },
  {
    firstName: "Κ.",
    lastName: "Λιάτσιος",
    congregation: "StuttgartSüd",
    phone: "+4917631478423",
    availableTalks: [44, 68],
  },
  {
    firstName: "Γ.",
    lastName: "Μανωλάκης",
    congregation: "StuttgartSüd",
    phone: "+491743073674",
    availableTalks: [177],
  },
  {
    firstName: "Ι.",
    lastName: "Μαυροειδάκος",
    congregation: "StuttgartSüd",
    phone: "+4915757402164",
    availableTalks: [62],
  },
  {
    firstName: "Χ.",
    lastName: "Μπακάρης",
    congregation: "StuttgartSüd",
    phone: "+491639735933",
    availableTalks: [68],
  },
  {
    firstName: "Σ.",
    lastName: "Ζάχος",
    congregation: "StuttgartSüd",
    phone: "+4917681093564",
    availableTalks: [26],
  },
  // --- Villingen ---------------------------------------------------------------
  {
    firstName: "Γ.",
    lastName: "Καμπούρης",
    congregation: "Villingen",
    phone: "+4915780989122",
    availableTalks: [26, 24, 183],
  },
  {
    firstName: "Μιχάλης",
    lastName: "Καμπούρης",
    congregation: "Villingen",
    phone: "+4915904974029",
    availableTalks: [79, 65, 138],
  },
  {
    firstName: "Π.",
    lastName: "Κοκκίνης",
    congregation: "Villingen",
    phone: "+4915755548494",
    availableTalks: [36, 169],
  },
  {
    firstName: "Δ.",
    lastName: "Κουτσογιάννης",
    congregation: "Villingen",
    phone: "+4915774042170",
    availableTalks: [112, 158],
  },
  // --- Weinstadt ---------------------------------------------------------------
  {
    firstName: "Μ.",
    lastName: "Τατσάκης",
    congregation: "Weinstadt",
    phone: "+491732001818",
    availableTalks: [175, 178, 188, 194, 19],
  },
  {
    firstName: "Γ.",
    lastName: "Σιώμος",
    congregation: "Weinstadt",
    phone: "+491729591801",
    availableTalks: [6],
  },
  {
    firstName: "Ι.",
    lastName: "Κωνσταντάκης",
    congregation: "Weinstadt",
    phone: "+491784626647",
    availableTalks: [24, 186],
  },
  {
    firstName: "Ν.",
    lastName: "Ευσταθίου",
    congregation: "Weinstadt",
    phone: "+4916096969107",
    availableTalks: [32, 192],
  },
  {
    firstName: "Ε.",
    lastName: "Αρτζόγλου",
    congregation: "Weinstadt",
    phone: "+491629070786",
    availableTalks: [177],
  },
  {
    firstName: "Κ.",
    lastName: "Κοντοδήμος",
    congregation: "Weinstadt",
    phone: "+4917621985879",
    availableTalks: [55, 26],
  },
  {
    firstName: "Σ.",
    lastName: "Τζιβανάκης",
    congregation: "Weinstadt",
    phone: "+491633041059",
    availableTalks: [118],
  },
  // --- Zürich (local congregation) ---------------------------------------------
  {
    firstName: "Παναγιώτης",
    lastName: "Αντωνιάδης",
    congregation: "Zürich",
    phone: "+41784024824",
    availableTalks: [34, 81, 93, 98],
  },
  {
    firstName: "Δημήτρης",
    lastName: "Μετόζης",
    congregation: "Zürich",
    phone: "+41763433532",
    availableTalks: [9, 110, 116, 190],
  },
  {
    firstName: "Δημήτρης",
    lastName: "Πένος",
    congregation: "Zürich",
    phone: "+41763236922",
    availableTalks: [8, 70, 110, 137],
  },
  {
    firstName: "Αντρέας",
    lastName: "Φραντζής",
    congregation: "Zürich",
    phone: "+41788790069",
    availableTalks: [16, 32, 63],
  },
  {
    firstName: "Βασίλης",
    lastName: "Νάκας",
    congregation: "Zürich",
    phone: "+306975915378",
    availableTalks: [18, 40, 72, 77, 112, 122, 193],
  },
  {
    firstName: "Θωμάς",
    lastName: "Κλουπώδης",
    congregation: "Zürich",
    phone: "+41786258270",
    availableTalks: [24, 40, 119, 157],
  },
  {
    firstName: "Τιμόθεος",
    lastName: "Τσιγκαρίδας",
    congregation: "Zürich",
    phone: "+41765612499",
    availableTalks: [58, 60, 169, 191],
  },
  {
    firstName: "Στέργιος",
    lastName: "Σωτηρόπουλος",
    congregation: "Zürich",
    phone: "+41793358822",
    availableTalks: [55, 64, 104, 117, 190],
  },
  {
    firstName: "Αργύρης",
    lastName: "Κόκκαλης",
    congregation: "Zürich",
    phone: "+41767025436",
    availableTalks: [71, 74, 162, 166, 177, 189, 192],
  },
  // --- New speakers (from 2025 schedule, congregation/phone unknown) -----------
  {
    firstName: "Γιώργος",
    lastName: "Βλάσης",
    congregation: "",
    phone: "",
    availableTalks: [113],
  },
  {
    firstName: "Βασίλης",
    lastName: "Κλουπώδης",
    congregation: "",
    phone: "",
    availableTalks: [100],
  },
  {
    firstName: "Χρήστος",
    lastName: "Αϊβάτης",
    congregation: "",
    phone: "",
    availableTalks: [183],
  },
  {
    firstName: "Χρήστος",
    lastName: "Σταθάκης",
    congregation: "",
    phone: "",
    availableTalks: [84],
  },
  {
    firstName: "Στέφανος",
    lastName: "Αδάμος",
    congregation: "",
    phone: "",
    availableTalks: [75],
  },
  {
    firstName: "Αλέκος",
    lastName: "Αναστασιάδης",
    congregation: "",
    phone: "",
    availableTalks: [189],
  },
  {
    firstName: "Αλέκος",
    lastName: "Τσάνταλης",
    congregation: "",
    phone: "",
    availableTalks: [46, 142],
  },
  {
    firstName: "Γιώργος",
    lastName: "Καλεντερίδης",
    congregation: "",
    phone: "",
    availableTalks: [77],
  },
  {
    firstName: "Μαρσελ",
    lastName: "Βίλλας",
    congregation: "",
    phone: "",
    availableTalks: [7],
  },
  {
    firstName: "Γιώργος",
    lastName: "Μπακάρης",
    congregation: "",
    phone: "",
    availableTalks: [144],
  },
  {
    firstName: "Βαγγέλης",
    lastName: "Κουκάρας",
    congregation: "",
    phone: "",
    availableTalks: [120],
  },
  {
    firstName: "Γιώργος",
    lastName: "Παρλάτζας",
    congregation: "",
    phone: "",
    availableTalks: [],
  },
  {
    firstName: "Βασίλης",
    lastName: "Σταφυλάς",
    congregation: "",
    phone: "",
    availableTalks: [164],
  },
  {
    firstName: "Σάκης",
    lastName: "Τσάνταλης",
    congregation: "",
    phone: "",
    availableTalks: [172],
  },
  {
    firstName: "Βασίλης",
    lastName: "Δώδος",
    congregation: "",
    phone: "",
    availableTalks: [33],
  },
  {
    firstName: "Ευγένιος",
    lastName: "Ντογατζής",
    congregation: "",
    phone: "",
    availableTalks: [118],
  },
  {
    firstName: "Φώτης",
    lastName: "Σουλτάνης",
    congregation: "",
    phone: "",
    availableTalks: [80],
  },
  {
    firstName: "Στρατός",
    lastName: "Ζομπόνος",
    congregation: "",
    phone: "",
    availableTalks: [1],
  },
  {
    firstName: "Βασίλης",
    lastName: "Παύλου",
    congregation: "",
    phone: "",
    availableTalks: [102],
  },
  {
    firstName: "Στέφανος",
    lastName: "Αντύρας",
    congregation: "",
    phone: "",
    availableTalks: [17],
  },
  {
    firstName: "Δημήτρης",
    lastName: "Κατσαβριάς",
    congregation: "",
    phone: "",
    availableTalks: [115],
  },
];

/**
 * 2025 schedule — real historical data.
 * Each entry: { date, talkId (null if N/A), speaker ("firstName lastName"), notes }.
 * All regular entries are "confirmed" (past). Special events are "cancelled".
 */
const schedule2025 = [
  { date: "2025-01-05", talkId: 113, speaker: "Γιώργος Βλάσης", notes: "" },
  { date: "2025-01-12", talkId: 100, speaker: "Βασίλης Κλουπώδης", notes: "" },
  { date: "2025-01-19", talkId: 183, speaker: "Χρήστος Αϊβάτης", notes: "" },
  { date: "2025-01-26", talkId: 84, speaker: "Χρήστος Σταθάκης", notes: "" },
  { date: "2025-02-02", talkId: 75, speaker: "Στέφανος Αδάμος", notes: "" },
  { date: "2025-02-09", talkId: 192, speaker: "Αργύρης Κόκκαλης", notes: "" },
  { date: "2025-02-16", talkId: 161, speaker: "Τόνης Παρουτσής", notes: "" },
  {
    date: "2025-02-23",
    talkId: 189,
    speaker: "Αλέκος Αναστασιάδης",
    notes: "",
  },
  { date: "2025-03-02", talkId: 142, speaker: "Αλέκος Τσάνταλης", notes: "" },
  { date: "2025-03-09", talkId: 88, speaker: "Ευγένης Τζιφρής", notes: "" },
  { date: "2025-03-16", talkId: null, speaker: null, notes: "Συνέλευση" },
  {
    date: "2025-03-23",
    talkId: 77,
    speaker: "Γιώργος Καλεντερίδης",
    notes: "",
  },
  { date: "2025-03-30", talkId: 7, speaker: "Μαρσέλ Βίλλας", notes: "" },
  { date: "2025-04-06", talkId: null, speaker: "Θωμάς Κλουπώδης", notes: "" },
  {
    date: "2025-04-13",
    talkId: null,
    speaker: "Στέργιος Σωτηρόπουλος",
    notes: "",
  },
  {
    date: "2025-04-20",
    talkId: 191,
    speaker: "Τιμόθεος Τσιγκαρίδας",
    notes: "",
  },
  { date: "2025-04-27", talkId: 144, speaker: "Γιώργος Μπακάρης", notes: "" },
  { date: "2025-05-04", talkId: 138, speaker: "Μιχάλης Καμπούρης", notes: "" },
  {
    date: "2025-05-11",
    talkId: 93,
    speaker: "Παναγιώτης Αντωνιάδης",
    notes: "",
  },
  {
    date: "2025-05-18",
    talkId: null,
    speaker: null,
    notes: "Επίσκεψη κεντρικά γραφεία",
  },
  { date: "2025-05-25", talkId: 32, speaker: "Γιώργος Μπακέας", notes: "" },
  { date: "2025-06-01", talkId: 120, speaker: "Βαγγέλης Κουκάρας", notes: "" },
  { date: "2025-06-08", talkId: 63, speaker: "Αντρέας Φραντζής", notes: "" },
  { date: "2025-06-15", talkId: 23, speaker: "Δαυίδ Αγγελιδάκης", notes: "" },
  {
    date: "2025-06-22",
    talkId: 71,
    speaker: "Παναγιώτης Γρηγοριάδης",
    notes: "",
  },
  { date: "2025-06-29", talkId: 70, speaker: "Δημήτρης Πένος", notes: "" },
  { date: "2025-07-06", talkId: null, speaker: null, notes: "Συνέλευση" },
  { date: "2025-07-13", talkId: null, speaker: "Γιώργος Παρλάτζας", notes: "" },
  { date: "2025-07-20", talkId: 40, speaker: "Βασίλης Νάκας", notes: "" },
  { date: "2025-07-27", talkId: 164, speaker: "Βασίλης Σταφυλάς", notes: "" },
  {
    date: "2025-08-03",
    talkId: 60,
    speaker: "Τιμόθεος Τσιγκαρίδας",
    notes: "",
  },
  {
    date: "2025-08-10",
    talkId: 72,
    speaker: "Παναγιώτης Δημόπουλος",
    notes: "",
  },
  { date: "2025-08-17", talkId: 46, speaker: "Αλέκος Τσάνταλης", notes: "" },
  { date: "2025-08-24", talkId: 172, speaker: "Σάκης Τσάνταλης", notes: "" },
  { date: "2025-08-31", talkId: 33, speaker: "Βασίλης Δώδος", notes: "" },
  { date: "2025-09-07", talkId: 118, speaker: "Ευγένιος Ντογατζής", notes: "" },
  { date: "2025-09-14", talkId: 110, speaker: "Δημήτρης Μετόζης", notes: "" },
  { date: "2025-09-21", talkId: 80, speaker: "Φώτης Σουλτάνης", notes: "" },
  { date: "2025-09-28", talkId: 122, speaker: "Βασίλης Νάκας", notes: "" },
  { date: "2025-10-05", talkId: 67, speaker: "Δημήτρης Φρίκης", notes: "" },
  {
    date: "2025-10-12",
    talkId: null,
    speaker: null,
    notes: "Συνέλευση περιοχής",
  },
  { date: "2025-10-19", talkId: 1, speaker: "Στρατός Ζομπόνος", notes: "" },
  { date: "2025-10-26", talkId: 102, speaker: "Βασίλης Παύλου", notes: "" },
  {
    date: "2025-11-02",
    talkId: 78,
    speaker: "Στέφανος Αποστολόπουλος",
    notes: "",
  },
  {
    date: "2025-11-09",
    talkId: 34,
    speaker: "Παναγιώτης Αντωνιάδης",
    notes: "",
  },
  {
    date: "2025-11-16",
    talkId: 81,
    speaker: "Αποστόλης Βραβοσινός",
    notes: "",
  },
  { date: "2025-11-23", talkId: 16, speaker: "Αντρέας Φραντζής", notes: "" },
  { date: "2025-11-30", talkId: 166, speaker: "Αργύρης Κόκκαλης", notes: "" },
  { date: "2025-12-07", talkId: 17, speaker: "Στέφανος Αντύρας", notes: "" },
  { date: "2025-12-14", talkId: 157, speaker: "Θωμάς Κλουπώδης", notes: "" },
  { date: "2025-12-21", talkId: 9, speaker: "Δημήτρης Μετόζης", notes: "" },
  {
    date: "2025-12-28",
    talkId: 115,
    speaker: "Δημήτρης Κατσαβριάς",
    notes: "",
  },
];

/**
 * 2026 schedule — real data (Saturdays).
 * Each entry: { date, talkId (null if N/A), speaker ("firstName lastName" | null), notes }.
 */
const schedule2026 = [
  {
    date: "2026-01-03",
    talkId: 98,
    speaker: "Παναγιώτης Αντωνιάδης",
    notes: "",
  },
  {
    date: "2026-01-10",
    talkId: 180,
    speaker: "Βασίλης Τζιμόπουλος",
    notes: "",
  },
  { date: "2026-01-17", talkId: 120, speaker: "Παύλος Παπαδάκης", notes: "" },
  { date: "2026-01-24", talkId: 54, speaker: "Δημήτρης Μετόζης", notes: "" },
  { date: "2026-01-31", talkId: null, speaker: "Παύλος Τιμμ", notes: "" },
  { date: "2026-02-07", talkId: null, speaker: null, notes: "Συνέλευση" },
  { date: "2026-02-14", talkId: 26, speaker: "Γιάννης Καμπούρης", notes: "" },
  { date: "2026-02-21", talkId: 62, speaker: "Βαγγέλης Ρίζος", notes: "" },
  { date: "2026-02-28", talkId: 122, speaker: "Άγγελος Καπανδελής", notes: "" },
  {
    date: "2026-03-07",
    talkId: 158,
    speaker: "Δημήτρης Κουτσογιάννης",
    notes: "",
  },
  {
    date: "2026-03-14",
    talkId: 132,
    speaker: "Παναγιώτης Δημόπουλος",
    notes: "",
  },
  { date: "2026-03-21", talkId: 143, speaker: "Παντελής Παππάς", notes: "" },
  {
    date: "2026-03-28",
    talkId: null,
    speaker: "Αργύρης Κόκκαλης",
    notes: "Ποιος θα αποκαταστήσει τη Γη;",
  },
  { date: "2026-04-04", talkId: null, speaker: "Τάκης Τομαράς", notes: "" },
  { date: "2026-04-11", talkId: null, speaker: "Άλεξ Φραντζής", notes: "" },
  { date: "2026-04-18", talkId: 18, speaker: "Παναγιώτης Πεπόνης", notes: "" },
  {
    date: "2026-04-25",
    talkId: null,
    speaker: null,
    notes: "Besuch von Vertretern der Weltzentrale",
  },
  { date: "2026-05-02", talkId: 65, speaker: "Μιχάλης Καμπούρης", notes: "" },
  {
    date: "2026-05-09",
    talkId: 11,
    speaker: "Βασίλης Στεφανόπουλος",
    notes: "",
  },
  { date: "2026-05-16", talkId: null, speaker: "Αντρέας Φραντζής", notes: "" },
  { date: "2026-05-23", talkId: 25, speaker: "Γιώργος Κοτζαπάσης", notes: "" },
  { date: "2026-05-30", talkId: 61, speaker: "Τιμόθεος Βραβοσινός", notes: "" },
  { date: "2026-06-06", talkId: 66, speaker: "Νίκος Βιζέλης", notes: "" },
  { date: "2026-06-13", talkId: null, speaker: "Μαρσέλ Βίλλας", notes: "" },
  {
    date: "2026-06-20",
    talkId: 35,
    speaker: "Δημήτρης Καραθανάσης",
    notes: "",
  },
  { date: "2026-06-27", talkId: 72, speaker: "Γιάννης Μπαγκέας", notes: "" },
  { date: "2026-07-04", talkId: 73, speaker: "Μάκης Μουμτζόγλου", notes: "" },
  {
    date: "2026-07-11",
    talkId: null,
    speaker: "Παναγιώτης Αντωνιάδης",
    notes: "",
  },
  { date: "2026-07-18", talkId: null, speaker: "Βασίλης Κλουπώδης", notes: "" },
  { date: "2026-07-25", talkId: null, speaker: null, notes: "Συνέλευση" },
  { date: "2026-08-01", talkId: null, speaker: "Δημήτρης Πένος", notes: "" },
  { date: "2026-08-08", talkId: 185, speaker: "Κώστας Κυριαζίδης", notes: "" },
  { date: "2026-08-15", talkId: null, speaker: "Άλεξ Φραντζής", notes: "" },
  { date: "2026-08-22", talkId: null, speaker: "Αντρέας Φραντζής", notes: "" },
  { date: "2026-08-29", talkId: null, speaker: "Θωμάς Κλουπώδης", notes: "" },
  {
    date: "2026-09-05",
    talkId: null,
    speaker: "Γαλάτης Κωστελίδης",
    notes: "",
  },
  { date: "2026-09-12", talkId: 8, speaker: "Ευγένιος Ντογατζής", notes: "" },
  { date: "2026-09-19", talkId: null, speaker: "Βασίλης Νάκας", notes: "" },
  { date: "2026-09-26", talkId: 46, speaker: "Γιώργος Ψαλτόπουλος", notes: "" },
  {
    date: "2026-10-03",
    talkId: 56,
    speaker: "Στέφανος Αποστολόπουλος",
    notes: "",
  },
  {
    date: "2026-10-10",
    talkId: 53,
    speaker: "Παναγιώτης Γρηγοριάδης",
    notes: "",
  },
  { date: "2026-10-17", talkId: 169, speaker: "Πέτρος Κοκκίνης", notes: "" },
  { date: "2026-10-24", talkId: 28, speaker: "Τόνης Παρουτσής", notes: "" },
  {
    date: "2026-10-31",
    talkId: 51,
    speaker: "Γιώργος Καλεντερίδης",
    notes: "",
  },
  {
    date: "2026-11-07",
    talkId: 29,
    speaker: "Αποστόλης Βραβοσινός",
    notes: "",
  },
  {
    date: "2026-11-14",
    talkId: 77,
    speaker: "Κώστας Στεφανόπουλος",
    notes: "",
  },
  { date: "2026-11-21", talkId: 121, speaker: "Νίκος Τζούνας", notes: "" },
  { date: "2026-11-28", talkId: null, speaker: "Αργύρης Κόκκαλης", notes: "" },
  { date: "2026-12-05", talkId: 76, speaker: "Κυριάκος Λαγγούσης", notes: "" },
  {
    date: "2026-12-12",
    talkId: null,
    speaker: "Τιμόθεος Τσιγκαρίδας",
    notes: "",
  },
  { date: "2026-12-19", talkId: 79, speaker: "Δαυίδ Αγγελιδάκης", notes: "" },
  { date: "2026-12-26", talkId: 105, speaker: "Δημήτρης Μετόζης", notes: "" },
];

// =============================================================================
// Helpers
// =============================================================================

/**
 * Return every occurrence of a given weekday in a year.
 * @param {number} year
 * @param {number} targetDay — 0 = Sunday, 6 = Saturday
 * @returns {string[]} sorted "YYYY-MM-DD" strings
 */
function getWeekdays(year, targetDay) {
  const dates = [];
  const d = new Date(year, 0, 1);
  // Advance to the first occurrence of targetDay
  while (d.getDay() !== targetDay) d.setDate(d.getDate() + 1);
  while (d.getFullYear() === year) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dates.push(`${year}-${mm}-${dd}`);
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

// =============================================================================
// Seeding
// =============================================================================

async function seed() {
  console.log("🌱 Seeding Firestore …\n");

  // 1. Settings -----------------------------------------------------------------
  console.log("  → settings/global");
  await setDoc(doc(db, "settings", "global"), settings);

  // 2. Talks --------------------------------------------------------------------
  console.log(`  → ${talks.length} talks`);
  {
    const BATCH_SIZE = 400;
    for (let i = 0; i < talks.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      for (const t of talks.slice(i, i + BATCH_SIZE)) {
        batch.set(doc(db, "talks", String(t.id)), t);
      }
      await batch.commit();
    }
  }

  // 3. Speakers -----------------------------------------------------------------
  console.log(`  → ${speakers.length} speakers`);

  // Build a lookup: "firstName lastName" → Firestore ID
  const speakerIdByName = new Map();
  {
    const BATCH_SIZE = 400;
    for (let i = 0; i < speakers.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      for (const s of speakers.slice(i, i + BATCH_SIZE)) {
        const ref = doc(collection(db, "speakers"));
        batch.set(ref, { ...s, id: ref.id });
        const key = `${s.firstName} ${s.lastName}`;
        speakerIdByName.set(key, ref.id);
      }
      await batch.commit();
    }
  }

  // 4. Schedule entries for 2025 (real data — all confirmed) --------------------
  console.log(
    `  → ${schedule2025.length} schedule entries (2025 — historical)`,
  );
  {
    const BATCH_SIZE = 400;
    for (let i = 0; i < schedule2025.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      for (const entry of schedule2025.slice(i, i + BATCH_SIZE)) {
        const ref = doc(collection(db, "schedule"));
        const speakerId = entry.speaker
          ? (speakerIdByName.get(entry.speaker) ?? null)
          : null;

        // Events without a speaker are "cancelled"; everything else is "confirmed"
        const status =
          entry.speaker === null && entry.talkId === null
            ? "cancelled"
            : "confirmed";

        batch.set(ref, {
          id: ref.id,
          date: entry.date,
          talkId: entry.talkId,
          customTalkTitle: "",
          speakerId,
          status,
          notes: entry.notes,
        });
      }
      await batch.commit();
    }
  }

  // 5. Schedule entries for 2026 (real data — Saturdays) ------------------------
  const today = new Date().toISOString().slice(0, 10);
  console.log(`  → ${schedule2026.length} schedule entries (2026 — Saturdays)`);
  {
    const BATCH_SIZE = 400;
    for (let i = 0; i < schedule2026.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      for (const entry of schedule2026.slice(i, i + BATCH_SIZE)) {
        const ref = doc(collection(db, "schedule"));
        const speakerId = entry.speaker
          ? (speakerIdByName.get(entry.speaker) ?? null)
          : null;

        let status;
        if (entry.speaker === null && entry.talkId === null) {
          status = "cancelled";
        } else if (entry.date < today) {
          status = "confirmed";
        } else {
          status = "open";
        }

        batch.set(ref, {
          id: ref.id,
          date: entry.date,
          talkId: entry.talkId,
          customTalkTitle: "",
          speakerId,
          status,
          notes: entry.notes,
        });
      }
      await batch.commit();
    }
  }

  console.log("\n✅ Done! Firestore is seeded.\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
