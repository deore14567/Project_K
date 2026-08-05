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
    residents: 'Farmers',
    documents: 'Documents',
    reports: 'Reports',
    audit_logs: 'Audit Logs',
    users: 'Users',
    farmer_card: 'Farmer Card',

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
    overview: 'Overview of farmers, documents & activity',
    quick_search: 'Quick Global Search',
    quick_search_placeholder: 'Search farmers, documents…',
    recent_activity: 'Recent Activity',
    view_all: 'View all',
    new_residents: 'New Farmers',
    no_activity: 'No activity yet.',
    no_residents: 'No farmers yet.',
    total_documents: 'Documents',
    pending_apps: 'Pending Tasks',

    // Farmers page
    manage_residents: 'Manage farmer records',
    add_resident: 'Add Farmer',
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
    no_residents_found: 'No farmers found.',
    showing: 'Showing',
    of: 'of',
    page: 'Page',
    prev: 'Prev',
    next: 'Next',
    go_to_farmers: 'Go to Farmers',

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
    resident_report: 'Farmer Report',
    resident_report_desc: 'Complete farmer master list.',
    custom_report_hint: 'Use the filters on the Farmers page to narrow down your list.',
    need_custom_report: 'Need a custom report?',
    all_applications: 'All Applications',
    all_applications_desc: 'Every application regardless of status.',
    village_report: 'Village Report',
    village_report_desc: 'Farmer counts aggregated per village.',
    status_filter: 'Status filter (optional)',
    all_statuses: 'All statuses',
    applied: 'Applied',
    pending: 'Pending',
    processing: 'Processing',
    approved: 'Approved',
    rejected: 'Rejected',
    excel: 'Excel',
    pdf: 'PDF',
    word: 'Word',
    csv: 'CSV',
    txt: 'Text',

    // Farmer Card page
    farmer_card_title: 'Farmer Card Generator',
    farmer_card_subtitle: 'Generate printable farmer ID cards with QR code',
    select_farmers: 'Select Farmers',
    select_farmers_desc: 'Tick the checkbox next to each farmer to include them in the card download.',
    download_selected_cards: 'Download Selected Cards',
    download_pdf: 'Download PDF',
    download_jpg: 'Download JPG',
    print_card: 'Print Card',
    no_farmers_selected: 'No farmers selected',
    cards_ready: 'cards ready to download',
    card_front: 'Front',
    card_back: 'Back',
    card_layout: 'Card Layout',
    farmer_name: 'Farmer Name',
    aadhaar: 'Aadhaar Number',
    mobile: 'Mobile',
    qr_code: 'QR Code',
    optional: 'optional',
    logos: 'logos',
    top_left: 'top-left',
    top_middle: 'top-middle',
    top_right: 'top-right',
    name: 'Name',
    dob: 'Date of Birth',
    gender: 'Gender',
    address: 'Address',
    clear: 'Clear',
    downloaded: 'downloaded',
    download_failed: 'Download failed',

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
    residents: 'शेतकरी',
    documents: 'कागदपत्रे',
    reports: 'अहवाल',
    audit_logs: 'ऑडिट लॉग',
    users: 'वापरकर्ते',
    farmer_card: 'शेतकरी कार्ड',

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
    overview: 'शेतकरी, कागदपत्रे आणि कार्याचा आढावा',
    quick_search: 'जलद शोध',
    quick_search_placeholder: 'शेतकरी, कागदपत्रे शोधा…',
    recent_activity: 'अलीकडील क्रिया',
    view_all: 'सर्व पाहा',
    new_residents: 'नवीन शेतकरी',
    no_activity: 'अजून कोणतीही क्रिया नाही.',
    no_residents: 'अजून कोणतेही शेतकरी नाहीत.',
    total_documents: 'कागदपत्रे',
    pending_apps: 'प्रलंबित कामे',

    // Farmers page
    manage_residents: 'शेतकरी नोंदी व्यवस्थापन',
    add_resident: 'शेतकरी जोडा',
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
    no_residents_found: 'कोणतेही शेतकरी सापडले नाहीत.',
    showing: 'दर्शवित आहे',
    of: 'पैकी',
    page: 'पृष्ठ',
    prev: 'मागील',
    next: 'पुढील',
    go_to_farmers: 'शेतकऱ्यांकडे जा',

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
    resident_report: 'शेतकरी अहवाल',
    resident_report_desc: 'संपूर्ण शेतकरी यादी.',
    custom_report_hint: 'शेतकरी पृष्ठावर फिल्टर वापरून यादी निवडा.',
    need_custom_report: 'सानुकूल अहवाल हवा आहे?',
    all_applications: 'सर्व अर्ज',
    all_applications_desc: 'स्थितीची पर्वानगी न देता प्रत्येक अर्ज.',
    village_report: 'गाव अहवाल',
    village_report_desc: 'प्रति गाव शेतकरी संख्या.',
    status_filter: 'स्थिती फिल्टर (पर्यायी)',
    all_statuses: 'सर्व स्थिती',
    applied: 'अर्ज केले',
    pending: 'प्रलंबित',
    processing: 'प्रक्रिया',
    approved: 'मंजूर',
    rejected: 'नाकारले',
    excel: 'एक्सेल',
    pdf: 'PDF',
    word: 'वर्ड',
    csv: 'CSV',
    txt: 'मजकूर',

    // Farmer Card page
    farmer_card_title: 'शेतकरी कार्ड निर्मिती',
    farmer_card_subtitle: 'QR कोडसह छापण्यायोग्य शेतकरी ओळखपत्रे तयार करा',
    select_farmers: 'शेतकरी निवडा',
    select_farmers_desc: 'कार्ड डाउनलोडमध्ये समाविष्ट करण्यासाठी प्रत्येक शेतकऱ्याच्या आजूबाजूला असलेला टिकबॉक्स टिक करा.',
    download_selected_cards: 'निवडलेली कार्डे डाउनलोड करा',
    download_pdf: 'PDF डाउनलोड',
    download_jpg: 'JPG डाउनलोड',
    print_card: 'कार्ड प्रिंट करा',
    no_farmers_selected: 'कोणतेही शेतकरी निवडले नाहीत',
    cards_ready: 'कार्डे डाउनलोडसाठी तयार',
    card_front: 'समोर',
    card_back: 'मागे',
    card_layout: 'कार्ड रचना',
    farmer_name: 'शेतकरीचे नाव',
    aadhaar: 'आधार नंबर',
    mobile: 'मोबाइल',
    qr_code: 'QR कोड',
    optional: 'पर्यायी',
    logos: 'लोगो',
    top_left: 'वर-डावीकडे',
    top_middle: 'वर-मध्य',
    top_right: 'वर-उजवीकडे',
    name: 'नाव',
    dob: 'जन्म तारीख',
    gender: 'लिंग',
    address: 'पत्ता',
    clear: 'साफ करा',
    downloaded: 'डाउनलोड केले',
    download_failed: 'डाउनलोड अयशस्वी',

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
