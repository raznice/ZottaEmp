// src/components/layout/app-header.tsx
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppHeader = void 0;
const button_1 = require("@/components/ui/button");
const auth_provider_1 = require("@/providers/auth-provider");
const lucide_react_1 = require("lucide-react");
const link_1 = require("next/link");
const image_1 = require("next/image");
const react_1 = require("react");
const language_switcher_1 = require("./language-switcher");
function AppHeader({ dictionary, locale }) {
    const { user, logout } = (0, auth_provider_1.useAuth)();
    const [isDarkMode, setIsDarkMode] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const root = window.document.documentElement;
        const currentThemeIsDark = root.classList.contains('dark');
        setIsDarkMode(currentThemeIsDark);
    }, []);
    const toggleTheme = () => {
        const root = window.document.documentElement;
        root.classList.toggle('dark');
        root.classList.toggle('light', !root.classList.contains('dark'));
        setIsDarkMode(!isDarkMode);
    };
    const baseDashboardPath = (user === null || user === void 0 ? void 0 : user.role) === 'admin' ? `/${locale}/admin/dashboard` : `/${locale}/employee/dashboard`;
    return (<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <link_1.default href={baseDashboardPath} className="flex items-center space-x-2">
                    <image_1.default src="/zotta-logo.png" alt={dictionary.TimeWiseAgro} width={40} height={35} className="object-contain" data-ai-hint="company logo"/>
                    <span className="text-2xl font-bold text-primary hidden sm:inline">
                        {dictionary.TimeWiseAgro}
                    </span>
                </link_1.default>
                <div className="flex items-center space-x-2 md:space-x-4">
                    {user && (<div className="flex items-center space-x-2 text-sm">
                            <lucide_react_1.UserCircle className="h-5 w-5 text-muted-foreground"/>
                            <span>{user.name} ({user.role === 'admin' ? dictionary.UserRoleAdmin : dictionary.UserRoleEmployee})</span>
                        </div>)}
                    <language_switcher_1.LanguageSwitcher currentLocale={locale} dictionary={{
            LanguageLabel: dictionary.LanguageLabel,
            LanguageSwitcherEnglish: dictionary.LanguageSwitcherEnglish,
            LanguageSwitcherItalian: dictionary.LanguageSwitcherItalian,
        }}/>
                    <button_1.Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dictionary.ToggleTheme} title={dictionary.ToggleTheme}>
                        {isDarkMode ? <lucide_react_1.Sun className="h-5 w-5"/> : <lucide_react_1.Moon className="h-5 w-5"/>}
                    </button_1.Button>
                    <button_1.Button variant="outline" size="sm" onClick={() => logout(locale)}>
                        <lucide_react_1.LogOut className="mr-2 h-4 w-4"/>
                        {dictionary.Logout}
                    </button_1.Button>
                </div>
            </div>
        </header>);
}
exports.AppHeader = AppHeader;
//# sourceMappingURL=app-header.js.map