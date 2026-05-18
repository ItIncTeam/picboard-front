export default async function LocaleLayout({
                                               children,
                                               params,
                                           }: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params

    return (
        <>
            {/* locale = {locale} — потом сюда переводы */}
            {children}
        </>
    )
}
