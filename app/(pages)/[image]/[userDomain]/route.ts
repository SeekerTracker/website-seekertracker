import { getApiUserData } from "app/(utils)/onchainData";
import { generateMetaTagsHtml, isSocialMediaBot } from "app/(utils)/metadata";
import { createCanvas, loadImage, registerFont } from "canvas";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";


// ✅ Register monospace font before creating canvas
registerFont(path.join(process.cwd(), "public", "fonts", "JetBrainsMono-Bold.ttf"), {
    family: "JetBrainsMono",
    weight: "normal",
});





export async function GET(request: Request) {
    const url = new URL(request.url);

    // ✅ Extract whatever comes *after* /image/
    const pathname = url.pathname; // e.g. "/image/0815user.skr"
    let userDomain = decodeURIComponent(pathname.replace(/^\/image\//, ""));

    // ✅ Get query params (e.g. ?age=true)
    const showAge = url.searchParams.get("age") === "true";
    // ✅
    //  Ensure it ends with .skr, if not provided
    if (!userDomain.includes(".")) {
        userDomain = `${userDomain}.skr`;
    }

    const baseName = userDomain.replace(/\.skr$/i, "").replace(/\.png$/i, "");

    // Check if request is from social media bots - serve HTML with meta tags
    // Unless ?raw=true is set (used by the meta tags to fetch actual image)
    const isRawRequest = url.searchParams.get("raw") === "true";
    const userAgent = request.headers.get("user-agent") || "";

    if (!isRawRequest && isSocialMediaBot(userAgent)) {
        const protocol = url.protocol;
        const host = url.host;
        const webDomain = `${protocol}//${host}`;
        const html = generateMetaTagsHtml(userDomain, webDomain, showAge);

        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "public, max-age=3600",
            },
        });
    }

    const domainData = await getApiUserData(userDomain);
    const isAvailable = !domainData?.owner;

    const bottomText = isAvailable ? "Claim yours @SeekerTracker.com" : "Check yours @SeekerTracker.com";
    const statusText = isAvailable ? "Available" : "Activated";
    const subtitleText = isAvailable ? "SeekerID - Available" : "SeekerID Profile";

    // Only get these if domain exists
    const rank = domainData?.rank;
    const createdAt = domainData?.createdAt;
    const { age, formattedDate } = createdAt ? getAgeInfo(createdAt) : { age: '', formattedDate: '' };




    // ✅ Prepare canvas
    const width = 1200;
    const height = 630;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Test font rendering to ensure it works
    ctx.font = '20px JetBrainsMono';

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#002a2a');
    gradient.addColorStop(0.5, '#001a1a');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid overlay
    const drawGrid = (spacing: number, lineColor: string, lineAlpha: number) => {
        ctx.save();
        ctx.strokeStyle = lineColor;
        ctx.globalAlpha = lineAlpha;
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        ctx.restore();

    };

    // Large rounded outline container
    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.save();
        ctx.strokeStyle = 'rgba(0,255,217,0.25)';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();

        ctx.stroke();
        ctx.restore();
    };

    const drawLogo = async () => {
        const imagePath = path.join(process.cwd(), "public", "logo.png");
        const logoBuffer = await fs.readFile(imagePath);
        const logo = await loadImage(logoBuffer);
        const logoSize = 96;
        ctx.globalAlpha = 0.85;
        ctx.drawImage(logo, width - logoSize - 36, 36, logoSize, logoSize);
        ctx.globalAlpha = 1;
    }

    //status text
    const drawStatusText = async (
        startX: number,
        startY: number,
        height: number,
        paddingX: number
    ) => {
        const iconSize = 30;
        ctx.font = '700 32px sans-serif';

        const textWidth = ctx.measureText(statusText).width;
        const pillW = paddingX * 2 + iconSize + 14 + textWidth;

        // Draw pill background - different colors for Available vs Activated
        ctx.save();
        drawRoundedRect(startX, startY, pillW, height, 22);
        const pillGradient = ctx.createLinearGradient(startX, startY, startX, startY + height);
        if (isAvailable) {
            // Yellow/gold gradient for available
            pillGradient.addColorStop(0, '#FFD700');
            pillGradient.addColorStop(1, '#FFA500');
        } else {
            // Green gradient for activated
            pillGradient.addColorStop(0, '#00FF66');
            pillGradient.addColorStop(1, '#00E6C0');
        }
        ctx.fillStyle = pillGradient;
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.restore();

        // Icon circle
        ctx.save();
        const iconCx = startX + paddingX + iconSize / 2;
        const iconCy = startY + height / 2;
        ctx.fillStyle = isAvailable ? '#CC9900' : '#01C772';
        ctx.beginPath();
        ctx.arc(iconCx, iconCy, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon - checkmark for activated, star for available
        ctx.strokeStyle = '#FFFFFF';
        ctx.fillStyle = '#FFFFFF';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (isAvailable) {
            // Draw a star/sparkle for available
            ctx.moveTo(iconCx, iconCy - 8);
            ctx.lineTo(iconCx, iconCy + 8);
            ctx.moveTo(iconCx - 8, iconCy);
            ctx.lineTo(iconCx + 8, iconCy);
            ctx.stroke();
        } else {
            // Checkmark for activated
            ctx.moveTo(iconCx - 7, iconCy);
            ctx.lineTo(iconCx - 2, iconCy + 7);
            ctx.lineTo(iconCx + 9, iconCy - 7);
            ctx.stroke();
        }
        ctx.restore();

        // Status text
        ctx.fillStyle = isAvailable ? '#4A3000' : '#07271D';
        ctx.textBaseline = 'middle';
        ctx.fillText(statusText, startX + paddingX + iconSize + 14, startY + height / 2);
        ctx.textBaseline = 'top';
    }

    // Title text - auto-scales font for long names
    const drawWrappedText = (x: number, y: number, lineHeight: number) => {
        ctx.fillStyle = '#00FFD9';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const maxWidth = width - 180; // Leave room for logo
        const maxFontSize = 110;
        const minFontSize = 48;

        // Find the right font size to fit the text
        let fontSize = maxFontSize;
        ctx.font = `bold ${fontSize}px sans-serif`;

        while (ctx.measureText(userDomain).width > maxWidth && fontSize > minFontSize) {
            fontSize -= 4;
            ctx.font = `bold ${fontSize}px sans-serif`;
        }

        // If still too wide at min size, we'll need to truncate or wrap
        const textWidth = ctx.measureText(userDomain).width;

        if (textWidth <= maxWidth) {
            // Fits on one line
            ctx.fillText(userDomain, x, y);
            return y + fontSize + 10;
        } else {
            // Split into two lines at a reasonable point
            const chars = userDomain.split('');
            let line1 = '';
            let line2 = '';

            // Find split point (around middle, prefer before the dot)
            const dotIndex = userDomain.lastIndexOf('.');
            let splitIndex = dotIndex > 0 ? dotIndex : Math.floor(chars.length / 2);

            // Adjust split to fit first line
            for (let i = splitIndex; i > 0; i--) {
                const testLine = userDomain.substring(0, i);
                ctx.font = `bold ${fontSize}px sans-serif`;
                if (ctx.measureText(testLine).width <= maxWidth) {
                    line1 = testLine;
                    line2 = userDomain.substring(i);
                    break;
                }
            }

            // If we couldn't find a good split, just force it
            if (!line1) {
                line1 = userDomain.substring(0, Math.floor(chars.length / 2));
                line2 = userDomain.substring(Math.floor(chars.length / 2));
            }

            const adjustedLineHeight = fontSize + 10;
            ctx.fillText(line1, x, y);
            ctx.fillText(line2, x, y + adjustedLineHeight);
            return y + adjustedLineHeight * 2;
        }
    };

    // SeekerId Text
    const drawSubtitleText = (startX: number, startY: number) => {
        if (!subtitleText) return startY;
        ctx.fillStyle = '#B0B0B0';
        ctx.font = '400 46px sans-serif';
        ctx.fillText(subtitleText, startX, startY);
        return startY + 54; // 46px font + 8px spacing
    }
    const drawFooterText = async (bottomText: string) => {
        ctx.fillStyle = '#00E6C0';
        ctx.font = '600 30px sans-serif';
        ctx.fillText(bottomText, 60, height - 48);
        ctx.save();

    }


    const drawStats = async () => {
        const stats = [];

        if (isAvailable) {
            // Stats for available domains
            const nameLength = baseName.length;
            stats.push({ primary: `${nameLength}`, label: 'Characters' });
            stats.push({ primary: 'Available', label: 'Status' });
            stats.push({ primary: 'Register', label: 'SeekerID' });
        } else {
            // Stats for activated domains
            stats.push({ primary: `#${rank}`, label: 'Seeker Rank' });
            if (showAge) {
                stats.push({ primary: age, label: 'Age' });
            }
            stats.push({ primary: formattedDate, label: 'Activated' });
        }

        const visible = stats?.slice(0, 3);
        const gap = 24;
        const marginX = 60;
        const cardsTop = height - 250;
        const cardWidth = Math.floor((width - marginX * 2 - gap * (visible.length - 1)) / visible.length);
        const cardHeight = 120;

        ctx.save();
        // Helper to fit primary text within card width
        const fitPrimaryFont = (text: string, maxW: number): string => {
            let size = 54;
            const min = 28;
            while (size >= min) {
                const fontSpec = `700 ${size}px sans-serif`;
                ctx.font = fontSpec;
                if (ctx.measureText(text).width <= maxW) return fontSpec;
                size -= 2;
            }
            return `700 ${min}px sans-serif`;
        };

        for (let i = 0; i < visible.length; i++) {
            const cardX = marginX + i * (cardWidth + gap);
            const cardY = cardsTop;

            // Card background
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = '#00ffd9';
            drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 18);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Card border
            ctx.strokeStyle = 'rgba(0,255,217,0.4)';
            ctx.lineWidth = 2;
            drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 18);
            ctx.stroke();

            // Primary text (auto-fit to width)
            ctx.fillStyle = '#00FFD9';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const maxPrimaryWidth = cardWidth - 24; // padding
            ctx.font = fitPrimaryFont(visible[i].primary, maxPrimaryWidth);
            ctx.fillText(visible[i].primary, cardX + cardWidth / 2, cardY + 8);

            // Label (centered at bottom)
            ctx.fillStyle = '#B0B0B0';
            ctx.font = '400 26px sans-serif';
            ctx.textBaseline = 'middle';
            ctx.fillText(visible[i].label, cardX + cardWidth / 2, cardY + cardHeight - 30);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
        }
        ctx.restore();

    }


    await drawGrid(50, '#00ffd9', 0.08);
    await drawRoundedRect(24, 24, width - 48, height - 48, 22);
    await drawLogo();
    await drawFooterText(bottomText);



    const startX = 60;
    let currentY = 140;

    await drawStatusText(startX, 36, 60, 26);
    const endY = drawWrappedText(startX, currentY, 120);
    currentY = endY + 8;

    const subTitleY = drawSubtitleText(startX, currentY);
    currentY = subTitleY

    await drawStats();


    // ✅ Convert to PNG
    const buffer = canvas.toBuffer("image/png");

    const uni8 = new Uint8Array(buffer);
    // ✅ Return with correct filename

    return new NextResponse(uni8, {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Content-Length': buffer.length.toString(),
            'Access-Control-Allow-Origin': '*',
            name: `seeker-${baseName}.png`,
        },
    });

}

function getAgeInfo(created_at: string | number | Date) {
    if (typeof created_at === "number" && created_at < 10000000000) {
        created_at *= 1000;
    }
    const created = new Date(created_at);
    const currTime = Date.now();
    const diffMs = currTime - created.getTime();

    // Convert differences
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // ✅ Human readable “age”
    let ageStr = "";
    if (seconds < 60) {
        ageStr = `${seconds}s`;
    } else if (minutes < 60) {
        ageStr = `${minutes}m`;
    } else if (hours < 24) {
        ageStr = `${hours}h`;
    } else {
        ageStr = `${days}d`;
    }


    // ✅ Format created date like "Oct 10, 2025"
    const formattedDate = created.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return { age: ageStr, formattedDate };
}
