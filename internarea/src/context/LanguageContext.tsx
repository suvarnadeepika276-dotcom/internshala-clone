"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { toast } from "react-toastify";

export type LanguageCode = "en" | "es" | "hi" | "pt" | "zh" | "fr";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://internshala-clone-ahv9.onrender.com/api";

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (key: string) => string;
    isOtpModalOpen: boolean;
    closeOtpModal: () => void;
    pendingFrenchEmail: string;
    setPendingFrenchEmail: (email: string) => void;
    handleSendFrenchOtp: (emailOverride?: string) => Promise<boolean>;
    handleVerifyFrenchOtp: (otp: string) => Promise<boolean>;
    otpSentSuccess: boolean;
    otpHint: string | null;
}

const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
    en: {
        internships: "Internships",
        jobs: "Jobs",
        resumeBuilder: "Resume Builder",
        searchPlaceholder: "Search opportunities...",
        login: "Login",
        logout: "Logout",
        applyNow: "Apply Now",
        activelyHiring: "Actively Hiring",
        location: "Location",
        startDate: "Start Date",
        duration: "Duration",
        stipend: "Stipend",
        aboutCompany: "About Company",
        aboutInternship: "About Internship",
        whoCanApply: "Who Can Apply",
        perks: "Perks",
        additionalInfo: "Additional Info",
        numberOfOpenings: "Number of Openings",
        coverLetter: "Cover Letter",
        availability: "Your Availability",
        submitApplication: "Submit Application",
        viewDetails: "View Details",
        filters: "Filters",
        home: "Home",
        profile: "Profile",
        applications: "Applications",
        languageChanged: "Language changed to English",
        frenchOtpRequired: "Security Verification: Email OTP required to switch to French.",
    },
    es: {
        internships: "Pasantías",
        jobs: "Empleos",
        resumeBuilder: "Creador de CV",
        searchPlaceholder: "Buscar oportunidades...",
        login: "Iniciar sesión",
        logout: "Cerrar sesión",
        applyNow: "Postularse ahora",
        activelyHiring: "Contratando activamente",
        location: "Ubicación",
        startDate: "Fecha de inicio",
        duration: "Duración",
        stipend: "Estipendio",
        aboutCompany: "Sobre la empresa",
        aboutInternship: "Sobre la pasantía",
        whoCanApply: "Quién puede postularse",
        perks: "Beneficios",
        additionalInfo: "Información adicional",
        numberOfOpenings: "Vacantes disponibles",
        coverLetter: "Carta de presentación",
        availability: "Tu disponibilidad",
        submitApplication: "Enviar postulación",
        viewDetails: "Ver detalles",
        filters: "Filtros",
        home: "Inicio",
        profile: "Perfil",
        applications: "Postulaciones",
        languageChanged: "Idioma cambiado a Español",
        frenchOtpRequired: "Verificación de seguridad: se requiere OTP para cambiar a francés.",
    },
    hi: {
        internships: "इंटर्नशिप",
        jobs: "नौकरियां",
        resumeBuilder: "रेज़्यूमे बिल्डर",
        searchPlaceholder: "अवसर खोजें...",
        login: "लॉग इन करें",
        logout: "लॉग आउट करें",
        applyNow: "अभी आवेदन करें",
        activelyHiring: "सक्रिय रूप से भर्ती जारी",
        location: "स्थान",
        startDate: "शुरुआती तारीख",
        duration: "अवधि",
        stipend: "वजीफा",
        aboutCompany: "कंपनी के बारे में",
        aboutInternship: "इंटर्नशिप के बारे में",
        whoCanApply: "कौन आवेदन कर सकता है",
        perks: "लाभ और भत्ते",
        additionalInfo: "अतिरिक्त जानकारी",
        numberOfOpenings: "रिक्तियों की संख्या",
        coverLetter: "कवर लेटर",
        availability: "आपकी उपलब्धता",
        submitApplication: "आवेदन जमा करें",
        viewDetails: "विवरण देखें",
        filters: "फ़िल्टर",
        home: "होम",
        profile: "प्रोफ़ाइल",
        applications: "आवेदन",
        languageChanged: "भाषा बदलकर हिन्दी कर दी गई है",
        frenchOtpRequired: "सुरक्षा सत्यापन: फ्रेंच भाषा में बदलने के लिए ईमेल OTP आवश्यक है।",
    },
    pt: {
        internships: "Estágios",
        jobs: "Vagas de Emprego",
        resumeBuilder: "Criador de Currículo",
        searchPlaceholder: "Pesquisar vagas...",
        login: "Entrar",
        logout: "Sair",
        applyNow: "Candidatar-se",
        activelyHiring: "Contratação ativa",
        location: "Localização",
        startDate: "Data de início",
        duration: "Duração",
        stipend: "Bolsa",
        aboutCompany: "Sobre a empresa",
        aboutInternship: "Sobre o estágio",
        whoCanApply: "Quem pode se candidatar",
        perks: "Benefícios",
        additionalInfo: "Informações adicionais",
        numberOfOpenings: "Número de vagas",
        coverLetter: "Carta de apresentação",
        availability: "Sua disponibilidade",
        submitApplication: "Enviar candidatura",
        viewDetails: "Ver detalhes",
        filters: "Filtros",
        home: "Início",
        profile: "Perfil",
        applications: "Candidaturas",
        languageChanged: "Idioma alterado para Português",
        frenchOtpRequired: "Verificação de segurança: OTP de e-mail necessário para o francês.",
    },
    zh: {
        internships: "实习机会",
        jobs: "全职工作",
        resumeBuilder: "简历构建器",
        searchPlaceholder: "搜索工作与实习...",
        login: "登录",
        logout: "退出登录",
        applyNow: "立即申请",
        activelyHiring: "火热招聘中",
        location: "工作地点",
        startDate: "开始日期",
        duration: "实习周期",
        stipend: "薪资津贴",
        aboutCompany: "公司介绍",
        aboutInternship: "实习介绍",
        whoCanApply: "申请条件",
        perks: "福利待遇",
        additionalInfo: "补充信息",
        numberOfOpenings: "招聘人数",
        coverLetter: "求职信",
        availability: "到岗时间",
        submitApplication: "提交申请",
        viewDetails: "查看详情",
        filters: "筛选条件",
        home: "首页",
        profile: "个人资料",
        applications: "我的申请",
        languageChanged: "语言已切换为中文",
        frenchOtpRequired: "安全验证：切换到法语需要电子邮箱验证码。",
    },
    fr: {
        internships: "Stages",
        jobs: "Emplois",
        resumeBuilder: "Créateur de CV",
        searchPlaceholder: "Rechercher des opportunités...",
        login: "Connexion",
        logout: "Déconnexion",
        applyNow: "Postuler maintenant",
        activelyHiring: "Recrutement actif",
        location: "Emplacement",
        startDate: "Date de début",
        duration: "Durée",
        stipend: "Indemnité",
        aboutCompany: "À propos de l'entreprise",
        aboutInternship: "À propos du stage",
        whoCanApply: "Profil recherché",
        perks: "Avantages",
        additionalInfo: "Informations complémentaires",
        numberOfOpenings: "Postes ouverts",
        coverLetter: "Lettre de motivation",
        availability: "Votre disponibilité",
        submitApplication: "Envoyer ma candidature",
        viewDetails: "Voir les détails",
        filters: "Filtres",
        home: "Accueil",
        profile: "Profil",
        applications: "Candidatures",
        languageChanged: "Langue changée en Français avec succès",
        frenchOtpRequired: "Vérification de sécurité : code OTP requis pour le français.",
    },
};

const LanguageContext = createContext<LanguageContextType>({
    language: "en",
    setLanguage: () => {},
    t: (key: string) => key,
    isOtpModalOpen: false,
    closeOtpModal: () => {},
    pendingFrenchEmail: "",
    setPendingFrenchEmail: () => {},
    handleSendFrenchOtp: async () => false,
    handleVerifyFrenchOtp: async () => false,
    otpSentSuccess: false,
    otpHint: null,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguageState] = useState<LanguageCode>("en");
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [pendingFrenchEmail, setPendingFrenchEmail] = useState("");
    const [otpSentSuccess, setOtpSentSuccess] = useState(false);
    const [otpHint, setOtpHint] = useState<string | null>(null);
    const user = useSelector(selectuser);

    const getBrowserInfo = () => {
        if (typeof window === "undefined") return { browser: "Unknown", device: "Desktop" };
        const ua = navigator.userAgent;
        let browser = "Other";
        if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Google Chrome";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
        else if (ua.includes("Firefox")) browser = "Mozilla Firefox";
        else if (ua.includes("Edg")) browser = "Microsoft Edge";

        const device = /Mobi|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";
        return { browser, device };
    };

    // Load persisted language preference on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("preferred_language") as LanguageCode;
            if (saved && TRANSLATIONS[saved]) {
                setLanguageState(saved);
            }
        }
    }, []);

    // Set default user email if logged in
    useEffect(() => {
        if (user?.email && !pendingFrenchEmail) {
            setPendingFrenchEmail(user.email);
        }
    }, [user]);

    const t = (key: string): string => {
        return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
    };

    // Request French OTP from backend
    const handleSendFrenchOtp = async (emailOverride?: string): Promise<boolean> => {
        const targetEmail = emailOverride || pendingFrenchEmail || user?.email;
        if (!targetEmail) {
            toast.error("Please enter a valid email address.");
            return false;
        }

        try {
            setOtpSentSuccess(false);
            // Show a toast while waiting — Render free tier may take ~30s to wake up
            const toastId = toast.info("Connecting to server... (may take up to 30 seconds if server is waking up)", {
                autoClose: false,
            });

            const res = await axios.post(
                `${API_BASE}/language/french-otp/request`,
                { email: targetEmail },
                { timeout: 60000 } // 60 second timeout for cold-start
            );

            toast.dismiss(toastId);
            setOtpSentSuccess(true);
            if (res.data?.demoOtp) {
                setOtpHint(res.data.demoOtp);
            }
            toast.success(`OTP sent to ${targetEmail}`);
            return true;
        } catch (err: any) {
            console.error("French OTP request error:", err);
            const errMsg = err?.response?.data?.error
                || (err?.code === "ECONNABORTED" ? "Server took too long to respond. Please try again — the server may be waking up." : null)
                || "Could not connect to server. Please try again in a moment.";
            toast.dismiss();
            toast.error(errMsg);
            return false;
        }
    };

    // Switch language function
    const setLanguage = async (newLang: LanguageCode) => {
        if (newLang === language) return;

        // Special Security Rule: Switching to French requires OTP verification
        if (newLang === "fr") {
            const emailToUse = user?.email || pendingFrenchEmail || "";
            setPendingFrenchEmail(emailToUse);
            setIsOtpModalOpen(true);
            setOtpHint(null);
            setOtpSentSuccess(false);
            // Only auto-send if we already have the user's email (they are logged in)
            // If not logged in, they must enter email manually and click Send OTP
            if (emailToUse) {
                // Don't block UI — fire in background
                handleSendFrenchOtp(emailToUse);
            }
            return;
        }

        // For standard languages (en, es, hi, pt, zh)
        applyLanguageChange(newLang);
    };

    const applyLanguageChange = async (newLang: LanguageCode) => {
        const prev = language;
        setLanguageState(newLang);
        if (typeof window !== "undefined") {
            localStorage.setItem("preferred_language", newLang);
        }

        // Sync with backend audit log & user profile
        try {
            const { browser, device } = getBrowserInfo();
            await axios.post(`${API_BASE}/language/change`, {
                language: newLang,
                previousLanguage: prev,
                email: user?.email || "guest",
                browser,
                device,
            });
            toast.success(TRANSLATIONS[newLang]?.languageChanged || `Language switched`);
        } catch (err) {
            console.warn("Could not sync language preference with backend", err);
        }
    };

    // Verify OTP for French language switch
    const handleVerifyFrenchOtp = async (otp: string): Promise<boolean> => {
        try {
            const { browser, device } = getBrowserInfo();
            await axios.post(`${API_BASE}/language/french-otp/verify`, {
                email: pendingFrenchEmail || user?.email,
                otp,
                previousLanguage: language,
                browser,
                device,
            });

            setLanguageState("fr");
            if (typeof window !== "undefined") {
                localStorage.setItem("preferred_language", "fr");
            }
            setIsOtpModalOpen(false);
            setOtpHint(null);
            toast.success("✅ Identity verified! Website language switched to French (Français).");
            return true;
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Invalid or expired OTP. Please try again.");
            return false;
        }
    };

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage,
                t,
                isOtpModalOpen,
                closeOtpModal: () => {
                    setIsOtpModalOpen(false);
                    setOtpHint(null);
                },
                pendingFrenchEmail,
                setPendingFrenchEmail,
                handleSendFrenchOtp,
                handleVerifyFrenchOtp,
                otpSentSuccess,
                otpHint,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
