import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Seeker Tracker — .skr SeekerID Search, Solana dApp Store & more';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function getLiveStats(): Promise<{ activations: number; dApps: number }> {
    try {
        const [domainRes, dappRes] = await Promise.allSettled([
            fetch('https://api.seeker.solana.charity/allDomains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageSize: 1 }),
                next: { revalidate: 300 },
            }),
            fetch('https://seekertracker.com/api/dappstore', {
                next: { revalidate: 3600 },
            }),
        ]);

        const activations =
            domainRes.status === 'fulfilled'
                ? ((await domainRes.value.json()).pagination?.total ?? 0)
                : 0;

        const dApps =
            dappRes.status === 'fulfilled'
                ? ((await dappRes.value.json()).totalApps ?? 500)
                : 500;

        return { activations, dApps };
    } catch {
        return { activations: 0, dApps: 500 };
    }
}

export default async function Image() {
    const { activations, dApps } = await getLiveStats();

    const stats = [
        { value: activations > 0 ? activations.toLocaleString() : '—', label: '.skr Activations' },
        { value: `${dApps}+`, label: 'dApps on Seeker' },
        { value: 'LIVE', label: 'Real-Time Updates' },
    ];

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #020d08 0%, #000f07 60%, #000000 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'monospace',
                    position: 'relative',
                    padding: '56px 60px',
                }}
            >
                {/* Grid */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(20,241,149,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20,241,149,0.05) 1px, transparent 1px)',
                    backgroundSize: '48px 48px', display: 'flex',
                }} />

                {/* Border */}
                <div style={{
                    position: 'absolute', top: 20, left: 20, right: 20, bottom: 20,
                    border: '2px solid rgba(20,241,149,0.2)', borderRadius: 24, display: 'flex',
                }} />

                {/* Top badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(20,241,149,0.1)', border: '1.5px solid rgba(20,241,149,0.4)',
                        borderRadius: 30, padding: '8px 18px',
                    }}>
                        <div style={{
                            width: 8, height: 8, borderRadius: 4,
                            background: '#14F195', boxShadow: '0 0 8px #14F195', display: 'flex',
                        }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#14F195', letterSpacing: '0.12em' }}>
                            LIVE
                        </span>
                    </div>
                    <span style={{ fontSize: 14, color: 'rgba(20,241,149,0.5)', letterSpacing: '0.08em' }}>
                        seekertracker.com
                    </span>
                </div>

                {/* Main title */}
                <div style={{
                    fontSize: 88, fontWeight: 800, color: '#ffffff',
                    lineHeight: 1.05, marginTop: 28, zIndex: 1,
                    letterSpacing: '-0.02em',
                }}>
                    Seeker Tracker
                </div>

                {/* Subtitle */}
                <div style={{
                    fontSize: 30, color: '#14F195',
                    marginTop: 10, zIndex: 1, letterSpacing: '0.01em',
                }}>
                    Track .skr SeekerIDs · Browse the dApp Store · Get Alpha
                </div>

                {/* Stats row */}
                <div style={{
                    display: 'flex', gap: 20,
                    position: 'absolute', bottom: 56, left: 60, right: 60,
                    zIndex: 1,
                }}>
                    {stats.map((s) => (
                        <div key={s.label} style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '20px 16px',
                            background: 'rgba(20,241,149,0.07)',
                            border: '1.5px solid rgba(20,241,149,0.25)',
                            borderRadius: 16,
                        }}>
                            <div style={{ fontSize: 44, fontWeight: 800, color: '#14F195', display: 'flex' }}>
                                {s.value}
                            </div>
                            <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', marginTop: 6, display: 'flex' }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ),
        { ...size }
    );
}
