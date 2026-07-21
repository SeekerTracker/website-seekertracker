/**
 * Shared shell for /apps, /apps/[package], and /apps/manage.
 * Store-level metadata lives on the catalog page only so dedicated
 * package pages can set their own title, canonical, and OG cards.
 */
export default function AppsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
