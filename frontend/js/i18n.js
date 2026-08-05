/**
 * Internationalization (i18n) — English + Marathi
 *
 * Usage:
 *   t('dashboard')         → "Dashboard" (en) or "डॅशबोर्ड" (mr)
 *   t('welcome_back')      → "Welcome back" / "पुन्हा स्वागत आहे"
 *
 * Language is stored in localStorage as 'vs_lang'. Default is 'en'.
 * Call applyTranslations() after any DOM update to translate elements
 * with data-i18n attributes.
 */

const TRANSLATIONS = {
  en: {
    // Brand
    brand_name: 'आशापुरी कॉम्प्युटर सर्विस कर्ले',
    brand_tagline: 'Computer Service Karle',

    // Sidebar / nav
    dashboard: 'Dashboard',
    residents: 'Residents',
    documents: 'Documents',
    reports: 'Reports',
    audit_logs: 'Audit Logs',
    users: 'Users',

    // Login page
    welcome_back: 'Welcome back',
    sign_in_to_access: 'Sign in to access your dashboard',
    email_address: 'Email address',
    password: 'Password',
    show: 'Show',
    hide: 'Hide',
    sign_in: 'Sign In',
    remember_me: 'Remember me',
    remember_hint_on: 'Keeps you logged in after closing the browser',
    remember_hint_off: 'Logs out automatically when you close the browser',

    // Dashboard
    overview: 'Overview of residents, documents & activity',
    quick_search: 'Quick Global Search',
    quick_search_placeholder: 'Search residents, documents…',
    recent_activity: 'Recent Activity',
    view_all: 'View all',
    new_residents: 'New Residents',
    no_activity: 'No activity yet.',
    no_residents: 'No residents yet.',
    total_documents: 'Documents',
    pending_apps: 'Pending Tasks',

    // Residents page
    manage_residents: 'Manage resident records',
    add_resident: 'Add Resident',
    search_placeholder: 'Search name, ID, mobile…',
    village: 'Village',
    all_categories: 'All Categories',
    all_genders: 'All Genders',
    search: 'Search',
    reset: 'Reset',
    newest_first: 'Newest first',
    oldest_first: 'Oldest first',
    name_az: 'Name A→Z',
    name_za: 'Name Z→A',
    download_list: 'Download List',
    contact: 'Contact',
    village_ward: 'Village / गट',
    age: 'Age',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    no_residents_found: 'No residents found.',
    showing: 'Showing',
    of: 'of',
    page: 'Page',
    prev: 'Prev',
    next: 'Next',

    // Resident form fields
    first_name: 'First Name',
    middle_name: 'Middle Name',
    last_name: 'Last Name',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    dob: 'Date of Birth',
    mobile: 'Mobile Number',
    alternate_no: 'Alternate Number',
    address: 'Address',
    pin: 'PIN Code',
    aadhaar: 'Aadhaar Number',
    farmer_id: 'Farmer ID',
    gat_number: 'गट नंबर',
    personal: 'Personal',
    contact_address: 'Contact & Address',
    identity: 'Identity',
    save_changes: 'Save Changes',
    cancel: 'Cancel',
    create: 'Create',

    // Resident profile
    print: 'Print',
    back_to_list: '← Back to list',

    // Documents
    document_vault: 'Upload, preview & manage documents',
    upload: 'Upload',
    upload_document: 'Upload Document',
    document_type: 'Document Type',
    title_optional: 'Title (optional)',
    file: 'File',
    preview: 'Preview',
    download: 'Download',
    versions: 'Versions',
    no_documents_found: 'No documents found.',
    resident_id: 'Resident ID',
    apply_filters: 'Apply Filters',

    // Common
    loading: 'Loading…',
    save: 'Save',
    close: 'Close',
    confirm_delete: 'Are you sure you want to delete?',
    yes: 'Yes',
    no: 'No',
    copied: 'copied to clipboard',
    copy_failed: 'Copy failed',

    // Reports
    export_reports: 'Export Reports',
    export_reports_desc: 'Choose a report, then click your preferred format.',
    resident_report: 'Resident Report',
    resident_report_desc: 'Complete resident master list.',
    custom_report_hint: 'Use the filters on the Residents page to narrow down your list.',
    need_custom_report: 'Need a custom report?',

    // Users
    manage_users: 'Manage admin & operator accounts',
    add_user: 'Add User',
    full_name: 'Full Name',
    role: 'Role',
    status: 'Status',
    active: 'Active',
    disabled: 'Disabled',
    last_login: 'Last Login',
    never: 'Never',

    // Logout
    logout: 'Logout',

    // Language
    language: 'Language',
    english: 'English',
    marathi: 'मराठी',
  },

  mr: {
    // Brand
    brand_name: 'आशापुरी कॉम्प्युटर सर्विस कर्ले',
    brand_tagline: 'कर्ले 💻',

    // Sidebar / nav
    dashboard: 'डॅशबोर्ड',
    residents: 'रहिवासी',
    documents: 'कागदपत्रे',
    reports: 'अहवाल',
    audit_logs: 'ऑडिट लॉग',
    users: 'वापरकर्ते',

    // Login page
    welcome_back: 'पुन्हा स्वागत आहे',
    sign_in_to_access: 'डॅशबोर्ड वापरण्यासाठी साइन इन करा',
    email_address: 'ईमेल पत्ता',
    password: 'पासवर्ड',
    show: 'दाखवा',
    hide: 'लपवा',
    sign_in: 'साइन इन करा',
    remember_me: 'मला लक्षात ठेवा',
    remember_hint_on: 'ब्राउझर बंद केल्यावरही लॉग इन राहाल',
    remember_hint_off: 'ब्राउझर बंद केल्यावर लॉग आउट होईल',

    // Dashboard
    overview: 'रहिवासी, कागदपत्रे आणि कार्याचा आढावा',
    quick_search: 'जलद शोध',
    quick_search_placeholder: 'रहिवासी, कागदपत्रे शोधा…',
    recent_activity: 'अलीकडील क्रिया',
    view_all: 'सर्व पाहा',
    new_residents: 'नवीन रहिवासी',
    no_activity: 'अजून कोणतीही क्रिया नाही.',
    no_residents: 'अजून कोणतेही रहिवासी नाहीत.',
    total_documents: 'कागदपत्रे',
    pending_apps: 'प्रलंबित कामे',

    // Residents page
    manage_residents: 'रहिवासी नोंदी व्यवस्थापन',
    add_resident: 'रहिवासी जोडा',
    search_placeholder: 'नाव, आयडी, मोबाइल शोधा…',
    village: 'गाव',
    all_categories: 'सर्व वर्ग',
    all_genders: 'सर्व लिंग',
    search: 'शोधा',
    reset: 'रीसेट',
    newest_first: 'नवीन आधी',
    oldest_first: 'जुने आधी',
    name_az: 'नाव A→Z',
    name_za: 'नाव Z→A',
    download_list: 'यादी डाउनलोड',
    contact: 'संपर्क',
    village_ward: 'गाव / गट',
    age: 'वय',
    actions: 'क्रिया',
    view: 'पाहा',
    edit: 'संपादन',
    delete: 'हटवा',
    no_residents_found: 'कोणतेही रहिवासी सापडले नाहीत.',
    showing: 'दर्शवित आहे',
    of: 'पैकी',
    page: 'पृष्ठ',
    prev: 'मागील',
    next: 'पुढील',

    // Resident form fields
    first_name: 'पहिले नाव',
    middle_name: 'मधले नाव',
    last_name: 'आडनाव',
    gender: 'लिंग',
    male: 'पुरुष',
    female: 'स्त्री',
    other: 'इतर',
    dob: 'जन्म तारीख',
    mobile: 'मोबाइल नंबर',
    alternate_no: 'पर्यायी नंबर',
    address: 'पत्ता',
    pin: 'पिन कोड',
    aadhaar: 'आधार नंबर',
    farmer_id: 'शेतकरी आयडी',
    gat_number: 'गट नंबर',
    personal: 'वैयक्तिक',
    contact_address: 'संपर्क आणि पत्ता',
    identity: 'ओळख',
    save_changes: 'बदल जतन करा',
    cancel: 'रद्द करा',
    create: 'तयार करा',

    // Resident profile
    print: 'प्रिंट',
    back_to_list: '← यादीकडे परत',

    // Documents
    document_vault: 'कागदपत्रे अपलोड आणि व्यवस्थापन',
    upload: 'अपलोड',
    upload_document: 'कागदपत्र अपलोड करा',
    document_type: 'कागदपत्राचा प्रकार',
    title_optional: 'शीर्षक (पर्यायी)',
    file: 'फाइल',
    preview: 'पूर्वावलोकन',
    download: 'डाउनलोड',
    versions: 'आवृत्त्या',
    no_documents_found: 'कोणतीही कागदपत्रे सापडली नाहीत.',
    resident_id: 'रहिवासी आयडी',
    apply_filters: 'फिल्टर लागू करा',

    // Common
    loading: 'लोड होत आहे…',
    save: 'जतन करा',
    close: 'बंद करा',
    confirm_delete: 'तुम्हाला नक्की हटवायचे आहे का?',
    yes: 'होय',
    no: 'नाही',
    copied: 'क्लिपबोर्डवर कॉपी केले',
    copy_failed: 'कॉपी अयशस्वी',

    // Reports
    export_reports: 'अहवाल निर्यात करा',
    export_reports_desc: 'अहवाल निवडा आणि स्वरूप निवडा.',
    resident_report: 'रहिवासी अहवाल',
    resident_report_desc: 'संपूर्ण रहिवासी यादी.',
    custom_report_hint: 'रहिवासी पृष्ठावर फिल्टर वापरून यादी निवडा.',
    need_custom_report: 'सानुकूल अहवाल हवा आहे?',

    // Users
    manage_users: 'ॲडमिन आणि ऑपरेटर खाती व्यवस्थापन',
    add_user: 'वापरकर्ता जोडा',
    full_name: 'पूर्ण नाव',
    role: 'भूमिका',
    status: 'स्थिती',
    active: 'सक्रिय',
    disabled: 'अक्षम',
    last_login: 'शेवटचे लॉगिन',
    never: 'कधीच नाही',

    // Logout
    logout: 'लॉग आउट',

    // Language
    language: 'भाषा',
    english: 'English',
    marathi: 'मराठी',
  },
};

// --- Public API -----------------------------------------------------------

function getLang() {
  return localStorage.getItem('vs_lang') || 'en';
}

function setLang(lang) {
  if (lang !== 'en' && lang !== 'mr') lang = 'en';
  localStorage.setItem('vs_lang', lang);
}

function t(key) {
  const lang = getLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}

/**
 * Translate all elements with data-i18n attributes.
 * Call this after any DOM update (page render, modal open, etc.).
 */
function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (text) el.textContent = text;
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = t(key);
    if (text) el.setAttribute('placeholder', text);
  });
  // Update <html lang> for accessibility
  document.documentElement.lang = getLang();
}

// Make available globally
window.t = t;
window.getLang = getLang;
window.setLang = setLang;
window.applyTranslations = applyTranslations;
window.TRANSLATIONS = TRANSLATIONS;
