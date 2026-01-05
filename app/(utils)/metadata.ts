export function getSeekerMetadata(userDomain: string, webDomain: string, showAge?: boolean) {
    // 1. Ensure webDomain is clean (no trailing slash)
    const baseUrl = webDomain.replace(/\/$/, "");
    const encodedDomain = encodeURIComponent(userDomain);

    // 2. Construct the Image URL
    // Telegram prefers standard extensions if possible, but a query param 'raw' is fine 
    // as long as the content-type header is correct.
    const imgUrlObj = new URL(`${baseUrl}/image/${encodedDomain}`);
    if (showAge) imgUrlObj.searchParams.append('age', 'true');
    imgUrlObj.searchParams.append('raw', 'true');

    // 3. Construct the Profile URL
    const profileUrl = `${baseUrl}/id/${encodedDomain}`;

    return {
        title: `${userDomain} - SeekerID Profile`,
        description: `Complete SeekerID profile with activation details and analytics.`,
        ogDescription: `🔥 SeekerID Profile for ${userDomain} - View rank, analytics, token holdings and activation details on Seeker Tracker`,
        imageUrl: imgUrlObj.toString(),
        profileUrl,
        siteName: "Seeker Tracker",
        imageWidth: "1200",
        imageHeight: "630",
    };
}

export function generateMetaTagsHtml(userDomain: string, webDomain: string, showAge?: boolean): string {
    const meta = getSeekerMetadata(userDomain, webDomain, showAge);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${meta.title}</title>
    
    <meta name="title" content="${meta.title}">
    <meta name="description" content="${meta.description}">

    <meta property="og:type" content="website">
    <meta property="og:url" content="${meta.profileUrl}">
    <meta property="og:title" content="${meta.title}">
    <meta property="og:description" content="${meta.ogDescription}">
    <meta property="og:image" content="${meta.imageUrl}">
    <meta property="og:image:secure_url" content="${meta.imageUrl}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="${meta.imageWidth}">
    <meta property="og:image:height" content="${meta.imageHeight}">
    <meta property="og:site_name" content="${meta.siteName}">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${meta.profileUrl}">
    <meta name="twitter:title" content="${meta.title}">
    <meta name="twitter:description" content="${meta.ogDescription}">
    <meta name="twitter:image" content="${meta.imageUrl}">

    <meta http-equiv="refresh" content="0; url=${meta.profileUrl}">
</head>
<body style="background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
    <div style="text-align: center;">
        <p>Redirecting to Seeker Profile...</p>
        <p><a href="${meta.profileUrl}" style="color: #00ffa3; text-decoration: none;">Click here if you are not redirected</a></p>
    </div>
    <script>
        // Only redirect if not a bot (though the meta-refresh handles this too)
        window.location.href = "${meta.profileUrl}";
    </script>
</body>
</html>`;
}

export function isSocialMediaBot(userAgent: string): boolean {
    // Added WhatsApp and AppleNewsBot for broader mobile support
    return /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|Discordbot|TelegramBot|WhatsApp|AppleNewsBot/i.test(userAgent);
}