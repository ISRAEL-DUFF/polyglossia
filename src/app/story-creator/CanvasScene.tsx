
"use client";

import React, { useRef, useEffect } from 'react';

interface CharacterAsset {
    spriteUrl: string;
    position: { x: number; y: number };
    scale: number;
}

interface CanvasSceneProps {
    backgroundUrl: string;
    characters: CharacterAsset[];
    width?: number;
    height?: number;
}

const CanvasScene: React.FC<CanvasSceneProps> = ({ backgroundUrl, characters, width = 1280, height = 720 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageSources = [backgroundUrl, ...characters.map(c => c.spriteUrl)];
        const images: { [src: string]: HTMLImageElement } = {};
        let loadedImages = 0;

        const drawScene = () => {
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            
            // Draw background
            const bgImage = images[backgroundUrl];
            if (bgImage) {
                ctx.drawImage(bgImage, 0, 0, width, height);
            }

            // Draw characters
            characters.forEach(char => {
                const charImage = images[char.spriteUrl];
                if (charImage) {
                    const charWidth = charImage.width * char.scale;
                    const charHeight = charImage.height * char.scale;
                    const xPos = (char.position.x / 100) * width - (charWidth / 2);
                    const yPos = (char.position.y / 100) * height - (charHeight / 2);
                    ctx.drawImage(charImage, xPos, yPos, charWidth, charHeight);
                }
            });
        };

        imageSources.forEach(src => {
            if (!src) return;
            const img = new Image();
            img.crossOrigin = "anonymous"; // Handle potential CORS issues with data URIs from different origins in some browsers
            img.src = src;
            img.onload = () => {
                images[src] = img;
                loadedImages++;
                if (loadedImages === imageSources.length) {
                    drawScene();
                }
            };
            img.onerror = () => {
                 console.error(`Failed to load image: ${src}`);
                 // still attempt to draw with what we have
                 loadedImages++;
                 if (loadedImages === imageSources.length) {
                    drawScene();
                }
            }
        });

    }, [backgroundUrl, characters, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full object-contain"
        />
    );
};

export default CanvasScene;
