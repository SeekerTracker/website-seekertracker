import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Seeker Tracker Winners - Solana Ecosystem Contributors';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

const winners = [
    { handle: 'iclipz', image: 'https://pbs.twimg.com/media/G9uhDR-asAEagDI.jpg' },
    { handle: 'ImmaDominion', image: 'https://pbs.twimg.com/media/G9uherIbgAA0dw4.jpg' },
    { handle: 'Trololo', image: 'https://pbs.twimg.com/media/G9uidFmasAUFKZV.jpg' },
    { handle: 'VersatileBeingX', image: 'https://pbs.twimg.com/media/G9uiv_EaYAA5uA7.jpg' },
    { handle: 'LookWhatIbuild', image: 'https://pbs.twimg.com/media/G9ukaBbasAgTmAh.jpg' },
    { handle: 'RVAClassic', image: 'https://pbs.twimg.com/media/G9uk4RUasAgSQl7.jpg' },
    { handle: 'nickshirleyy', image: 'https://pbs.twimg.com/media/G9ul24Qa8AAXGJK.jpg' },
    { handle: '0xharp', image: 'https://pbs.twimg.com/media/G94ZYn9a0AAie6u.jpg' },
    { handle: 'Fahimul_Shihab', image: 'https://pbs.twimg.com/media/G-fYXL9bQAAqXRV.jpg' },
    { handle: 'guillaumetch', image: 'https://pbs.twimg.com/media/G_OWXK6bAAACSpC.jpg' },
    { handle: 'OmegaXhealth', image: 'https://pbs.twimg.com/media/HAwMUokakAAwAqX.jpg' },
];

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #1a1000 0%, #0d0800 50%, #000000 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'system-ui, sans-serif',
                    position: 'relative',
                    padding: 50,
                }}
            >
                {/* Grid overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `
                            linear-gradient(rgba(255, 215, 0, 0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 215, 0, 0.04) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                        display: 'flex',
                    }}
                />

                {/* Border frame */}
                <div
                    style={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        right: 20,
                        bottom: 20,
                        border: '3px solid rgba(255, 215, 0, 0.25)',
                        borderRadius: 22,
                        display: 'flex',
                    }}
                />

                {/* Title section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 52, display: 'flex' }}>🏆</div>
                    <div
                        style={{
                            fontSize: 56,
                            fontWeight: 700,
                            color: '#ffd700',
                            display: 'flex',
                        }}
                    >
                        Seeker Winners
                    </div>
                </div>

                <div
                    style={{
                        fontSize: 26,
                        color: '#aaa',
                        marginTop: 8,
                        display: 'flex',
                    }}
                >
                    Solana Ecosystem contributors awarded a brand new Solana Mobile Seeker
                </div>

                {/* Winner profile pics in two rows */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                        marginTop: 40,
                        alignItems: 'center',
                    }}
                >
                    {/* Row 1: winners 1-6 */}
                    <div style={{ display: 'flex', gap: 20 }}>
                        {winners.slice(0, 6).map((w, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <div
                                    style={{
                                        width: 120,
                                        height: 120,
                                        borderRadius: 60,
                                        border: '3px solid #ffd700',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        position: 'relative',
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`https://unavatar.io/twitter/${w.handle}`}
                                        width={120}
                                        height={120}
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                                <div
                                    style={{
                                        fontSize: 16,
                                        color: '#ffd700',
                                        fontWeight: 600,
                                        display: 'flex',
                                    }}
                                >
                                    #{i + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Row 2: winners 7-11 */}
                    <div style={{ display: 'flex', gap: 20 }}>
                        {winners.slice(6).map((w, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <div
                                    style={{
                                        width: 120,
                                        height: 120,
                                        borderRadius: 60,
                                        border: '3px solid #ffd700',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        position: 'relative',
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`https://unavatar.io/twitter/${w.handle}`}
                                        width={120}
                                        height={120}
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                                <div
                                    style={{
                                        fontSize: 16,
                                        color: '#ffd700',
                                        fontWeight: 600,
                                        display: 'flex',
                                    }}
                                >
                                    #{i + 7}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        left: 50,
                        right: 50,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 600,
                            color: '#ffd700',
                            display: 'flex',
                        }}
                    >
                        seekertracker.com/winners
                    </div>
                    <div
                        style={{
                            fontSize: 22,
                            color: '#666',
                            display: 'flex',
                        }}
                    >
                        11 Winners • Solana Mobile Seeker
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
