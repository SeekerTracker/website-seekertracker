export function getSeekerMetadata(userDomain: string, webDomain: string, showAge?: boolean) {
    const imageUrl = `${webDomain}/image/${encodeURIComponent(userDomain)}${showAge ? "?age=true" : ""}`;
    const profileUrl = `${webDomain}/id/${encodeURIComponent(userDomain)}`;

    return {
        title: `${userDomain} - SeekerID Profile`,
        description: `Complete SeekerID profile with activation details and analytics.`,
        ogDescription: `🔥 SeekerID Profile for ${userDomain} - View rank, analytics, token holdings and activation details on Seeker Tracker`,
        imageUrl,
        profileUrl,
        siteName: "Seeker Tracker",
        imageWidth: 1200,
        imageHeight: 630,
    };
}

export function generateMetaTagsHtml(userDomain: string, webDomain: string, showAge?: boolean): string {
    const meta = getSeekerMetadata(userDomain, webDomain, showAge);
    // Add ?raw=true to image URL so the image route knows to serve actual image, not HTML
    const rawImageUrl = `${meta.imageUrl}${meta.imageUrl.includes("?") ? "&" : "?"}raw=true`;

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${meta.title}</title>
    <meta property="og:type" content="website">
    <meta property="og:title" content="${meta.title}">
    <meta property="og:description" content="${meta.ogDescription}">
    <meta property="og:image" content="${rawImageUrl}">
    <meta property="og:image:width" content="${meta.imageWidth}">
    <meta property="og:image:height" content="${meta.imageHeight}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:url" content="${meta.profileUrl}">
    <meta property="og:site_name" content="${meta.siteName}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${meta.title}">
    <meta name="twitter:description" content="${meta.description}">
    <meta name="twitter:image" content="${rawImageUrl}">
</head>
<body>
    <script>window.location.href = "${meta.profileUrl}";</script>
</body>
</html>`;
}

export function isSocialMediaBot(userAgent: string): boolean {
    return /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|Discordbot|TelegramBot/i.test(userAgent);
}
