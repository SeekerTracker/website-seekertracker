import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const size = {
    width: 1200,
    height: 630,
};

const winners = [
    { handle: 'iclipz', num: 1 },
    { handle: 'ImmaDominion', num: 2 },
    { handle: 'Trololo', num: 3, img: 'https://pbs.twimg.com/media/G9uidFmasAUFKZV.jpg' },
    { handle: 'VersatileBeingX', num: 4 },
    { handle: 'LookWhatIbuild', num: 5 },
    { handle: 'RVAClassic', num: 6 },
    { handle: 'nickshirleyy', num: 7 },
    { handle: '0xharp', num: 8 },
    { handle: 'Fahimul_Shihab', num: 9 },
    { handle: 'guillaumetch', num: 10 },
    { handle: 'OmegaXhealth', num: 11 },
];

export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #002a2a 0%, #001a1a 50%, #000000 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'system-ui, sans-serif',
                    position: 'relative',
                    padding: 60,
                }}
            >
                {/* Grid overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `
                            linear-gradient(rgba(0, 255, 217, 0.06) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 217, 0.06) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                        display: 'flex',
                    }}
                />

                {/* Border frame */}
                <div
                    style={{
                        position: 'absolute',
                        top: 24,
                        left: 24,
                        right: 24,
                        bottom: 24,
                        border: '3px solid rgba(0, 255, 217, 0.25)',
                        borderRadius: 22,
                        display: 'flex',
                    }}
                />

                {/* Top badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background: 'linear-gradient(135deg, #00FF66 0%, #00E6C0 100%)',
                        padding: '10px 24px',
                        borderRadius: 30,
                    }}
                >
                    <span style={{ fontSize: 22, display: 'flex' }}>🏆</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#07271D' }}>
                        Seeker Winners
                    </span>
                </div>

                {/* Title */}
                <div
                    style={{
                        fontSize: 64,
                        fontWeight: 700,
                        color: '#00ffd9',
                        marginTop: 20,
                        lineHeight: 1.1,
                        display: 'flex',
                    }}
                >
                    11 Seeker Awards
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        fontSize: 26,
                        color: '#b0b0b0',
                        marginTop: 8,
                        display: 'flex',
                    }}
                >
                    Solana ecosystem contributors awarded a Solana Mobile Seeker
                </div>

                {/* Winner profile pics - two rows */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        position: 'absolute',
                        bottom: 90,
                        left: 60,
                        right: 60,
                        alignItems: 'center',
                    }}
                >
                    {/* Row 1: 1-6 */}
                    <div style={{ display: 'flex', gap: 16 }}>
                        {winners.slice(0, 6).map((w) => (
                            <div
                                key={w.num}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <div
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        border: '3px solid rgba(0, 255, 217, 0.5)',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        background: 'rgba(0, 255, 217, 0.1)',
                                    }}
                                >
                                    <img
                                        src={w.img || `https://unavatar.io/twitter/${w.handle}`}
                                        width={80}
                                        height={80}
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                                <div style={{ fontSize: 14, color: '#00ffd9', fontWeight: 600, display: 'flex' }}>
                                    #{w.num}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Row 2: 7-11 */}
                    <div style={{ display: 'flex', gap: 16 }}>
                        {winners.slice(6).map((w) => (
                            <div
                                key={w.num}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <div
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        border: '3px solid rgba(0, 255, 217, 0.5)',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        background: 'rgba(0, 255, 217, 0.1)',
                                    }}
                                >
                                    <img
                                        src={w.img || `https://unavatar.io/twitter/${w.handle}`}
                                        width={80}
                                        height={80}
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                                <div style={{ fontSize: 14, color: '#00ffd9', fontWeight: 600, display: 'flex' }}>
                                    #{w.num}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 48,
                        left: 60,
                        fontSize: 22,
                        fontWeight: 600,
                        color: '#00e6c0',
                        display: 'flex',
                    }}
                >
                    seekertracker.com/winners
                </div>
            </div>
        ),
        { ...size }
    );
}
