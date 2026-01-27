"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './PixelSnake.module.css';

interface Position {
    x: number;
    y: number;
}

interface Phone {
    id: number;
    x: number;
    y: number;
}

const SNAKE_LENGTH = 8;
const MOVE_SPEED = 120;
const PHONE_SPAWN_INTERVAL = 3000;
const MAX_PHONES = 5;

const getSegmentSize = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        return 10;
    }
    return 14;
};

const PixelSnake = () => {
    const [segments, setSegments] = useState<Position[]>([]);
    const [direction, setDirection] = useState<{ dx: number; dy: number }>({ dx: 1, dy: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const [phones, setPhones] = useState<Phone[]>([]);
    const [score, setScore] = useState(0);
    const directionRef = useRef(direction);
    const phoneIdRef = useRef(0);

    const [segmentSize, setSegmentSize] = useState(14);

    // Get viewport bounds with padding
    const getViewportBounds = useCallback(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        const padding = isMobile ? 60 : 100;
        return {
            width: typeof window !== 'undefined' ? window.innerWidth - padding : 800,
            height: typeof window !== 'undefined' ? window.innerHeight - padding : 600
        };
    }, []);

    // Initialize snake position
    useEffect(() => {
        const size = getSegmentSize();
        setSegmentSize(size);
        const bounds = getViewportBounds();
        const initialSegments: Position[] = [];
        const startX = Math.min(200, bounds.width / 2);
        const startY = Math.min(200, bounds.height / 2);
        for (let i = 0; i < SNAKE_LENGTH; i++) {
            initialSegments.push({
                x: startX - i * size,
                y: startY
            });
        }
        setSegments(initialSegments);
    }, [getViewportBounds]);

    // Update direction ref when direction changes
    useEffect(() => {
        directionRef.current = direction;
    }, [direction]);

    // Spawn phones randomly
    useEffect(() => {
        const spawnPhone = () => {
            const bounds = getViewportBounds();
            const newPhone: Phone = {
                id: phoneIdRef.current++,
                x: 50 + Math.random() * (bounds.width - 100),
                y: 50 + Math.random() * (bounds.height - 100)
            };
            setPhones(prev => {
                if (prev.length >= MAX_PHONES) {
                    return [...prev.slice(1), newPhone];
                }
                return [...prev, newPhone];
            });
        };

        // Spawn initial phones
        for (let i = 0; i < 3; i++) {
            setTimeout(() => spawnPhone(), i * 500);
        }

        const interval = setInterval(spawnPhone, PHONE_SPAWN_INTERVAL);
        return () => clearInterval(interval);
    }, [getViewportBounds]);

    // Change direction randomly
    const changeDirection = useCallback(() => {
        const currentDir = directionRef.current;
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 1 },
            { dx: -1, dy: -1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
        ];

        const validDirections = directions.filter(d =>
            !(d.dx === -currentDir.dx && d.dy === -currentDir.dy)
        );

        const newDir = validDirections[Math.floor(Math.random() * validDirections.length)];
        setDirection(newDir);
    }, []);

    // Move snake and check for phone collisions
    useEffect(() => {
        if (segments.length === 0) return;

        const moveSnake = () => {
            setSegments(prevSegments => {
                if (prevSegments.length === 0) return prevSegments;

                const head = prevSegments[0];
                const bounds = getViewportBounds();
                const size = getSegmentSize();

                let newX = head.x + directionRef.current.dx * size;
                let newY = head.y + directionRef.current.dy * size;

                // Bounce off viewport edges
                if (newX < 20 || newX > bounds.width) {
                    directionRef.current = { ...directionRef.current, dx: -directionRef.current.dx };
                    newX = head.x + directionRef.current.dx * size;
                    setDirection({ ...directionRef.current });
                }
                if (newY < 20 || newY > bounds.height) {
                    directionRef.current = { ...directionRef.current, dy: -directionRef.current.dy };
                    newY = head.y + directionRef.current.dy * size;
                    setDirection({ ...directionRef.current });
                }

                const newHead = { x: newX, y: newY };
                const newSegments = [newHead, ...prevSegments.slice(0, -1)];

                // Check for phone collision
                setPhones(prevPhones => {
                    const collisionDistance = size + 15;
                    const remainingPhones = prevPhones.filter(phone => {
                        const dist = Math.sqrt(
                            Math.pow(newHead.x - phone.x, 2) +
                            Math.pow(newHead.y - phone.y, 2)
                        );
                        if (dist < collisionDistance) {
                            setScore(s => s + 1);
                            return false;
                        }
                        return true;
                    });
                    return remainingPhones;
                });

                return newSegments;
            });
        };

        const moveInterval = setInterval(moveSnake, MOVE_SPEED);
        const directionInterval = setInterval(() => {
            if (Math.random() > 0.6) {
                changeDirection();
            }
        }, 800);

        return () => {
            clearInterval(moveInterval);
            clearInterval(directionInterval);
        };
    }, [segments.length, changeDirection, getViewportBounds]);

    if (segments.length === 0) return null;

    return (
        <div className={styles.snakeContainer}>
            {/* Phones to collect */}
            {phones.map(phone => (
                <div
                    key={phone.id}
                    className={styles.phone}
                    style={{ left: phone.x, top: phone.y }}
                >
                    📱
                </div>
            ))}

            {/* Score display */}
            {score > 0 && (
                <div className={styles.score}>
                    📱 {score}
                </div>
            )}

            {/* Snake */}
            <Link href="/snake" className={styles.snakeLink}>
                <div
                    className={`${styles.snake} ${isHovered ? styles.hovered : ''}`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    title="Click to play Snake!"
                >
                    {segments.map((segment, index) => (
                        <div
                            key={index}
                            className={`${styles.segment} ${index === 0 ? styles.head : ''}`}
                            style={{
                                left: segment.x,
                                top: segment.y,
                            }}
                        >
                            {index === 0 && (
                                <>
                                    <div className={styles.eye} style={{
                                        left: directionRef.current.dx >= 0 ? '8px' : '2px',
                                        top: '3px'
                                    }} />
                                    <div className={styles.eye} style={{
                                        left: directionRef.current.dx >= 0 ? '8px' : '2px',
                                        top: '8px'
                                    }} />
                                </>
                            )}
                        </div>
                    ))}
                    {isHovered && (
                        <div
                            className={styles.tooltip}
                            style={{
                                left: segments[0]?.x,
                                top: segments[0]?.y - 35
                            }}
                        >
                            Click to play!
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
};

export default PixelSnake;
