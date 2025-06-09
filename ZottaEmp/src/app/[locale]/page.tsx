
// src/app/[locale]/page.tsx
import { LoginView } from '@/components/auth/login-view';
import { getDictionary, type Locale, type Dictionary } from '@/lib/getDictionary';

export default async function LoginPage({
    params,
}: {
    params: { locale: string }; // Use string here
}) {
    const currentLocale = params.locale as Locale;
    const dictionary = await getDictionary(currentLocale) as Dictionary;
    return <LoginView dictionary={dictionary} locale={currentLocale} />;
}
