
"use client";

import React, { useRef, useEffect } from 'react';

export interface CharacterAsset {
    spriteUrl?: string; // Make optional
    position: { x: number; y: number };
    scale: number;
    name: string;
}

export interface CanvasSceneProps {
    backgroundUrl?: string; // Make optional
    characters: CharacterAsset[];
    width?: number;
    height?: number;
}

const CanvasScene: React.FC<CanvasSceneProps> = ({ backgroundUrl, characters, width = 1280, height = 720 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const loadedImagesRef = useRef<{ [src: string]: HTMLImageElement }>({});

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let isMounted = true;

        const allImageUrls = [backgroundUrl, ...characters.map(c => c.spriteUrl)].filter((url): url is string => !!url);
        const uniqueImageUrls = [...new Set(allImageUrls)];

        let imagesToLoadCount = uniqueImageUrls.length;

        const onImageLoad = () => {
            imagesToLoadCount--;
            if (imagesToLoadCount === 0 && isMounted) {
                animate();
            }
        };

        if (imagesToLoadCount === 0) {
             animate(); // Start animation even if no images to load
        } else {
            uniqueImageUrls.forEach(src => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = onImageLoad;
                img.onerror = () => {
                    console.error(`Failed to load image: ${src}`);
                    onImageLoad(); 
                };
                img.src = src;
                loadedImagesRef.current[src] = img;
            });
        }


        const processAndDrawCharacter = (charImage: HTMLImageElement, char: CharacterAsset, time: number) => {
            if (!ctx) return;
            
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            tempCanvas.width = charImage.naturalWidth;
            tempCanvas.height = charImage.naturalHeight;
            tempCtx.drawImage(charImage, 0, 0);

            try {
                const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
                        data[i + 3] = 0;
                    }
                }
                tempCtx.putImageData(imageData, 0, 0);
                
                const charWidth = tempCanvas.width * char.scale;
                const charHeight = tempCanvas.height * char.scale;
                const xPos = (char.position.x / 100) * width - (charWidth / 2);
                
                const bobbingAmount = Math.sin(time / 600 + char.position.x) * 3;
                const yPos = (char.position.y / 100) * height - (charHeight / 2) + bobbingAmount;
                
                ctx.drawImage(tempCanvas, xPos, yPos, charWidth, charHeight);

            } catch (e) {
                console.error("Could not process image for chroma keying, drawing as-is. Error:", e);
                const charWidth = charImage.naturalWidth * char.scale;
                const charHeight = charImage.naturalHeight * char.scale;
                const xPos = (char.position.x / 100) * width - (charWidth / 2);
                const yPos = (char.position.y / 100) * height - (charHeight / 2);
                ctx.drawImage(charImage, xPos, yPos, charWidth, charHeight);
            }
        };

        const drawScene = () => {
            if (!ctx || !isMounted) return;
            const time = Date.now();
            ctx.clearRect(0, 0, width, height);

            const bgImage = backgroundUrl ? loadedImagesRef.current[backgroundUrl] : undefined;
            if (bgImage && bgImage.complete) {
                ctx.drawImage(bgImage, 0, 0, width, height);
            } else {
                // Fallback background
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#2e3a59'); // A nice night sky gradient
                gradient.addColorStop(1, '#1e293b');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }

            characters.forEach(char => {
                const charImage = char.spriteUrl ? loadedImagesRef.current[char.spriteUrl] : undefined;
                if (charImage && charImage.complete) {
                    processAndDrawCharacter(charImage, char, time);
                } else {
                    // Fallback to drawing text for the character
                    const xPos = (char.position.x / 100) * width;
                    const bobbingAmount = Math.sin(time / 600 + char.position.x) * 3;
                    const yPos = (char.position.y / 100) * height + bobbingAmount;
                    
                    ctx.font = 'bold 24px serif';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 4;
                    ctx.strokeText(char.name, xPos, yPos);
                    ctx.fillText(char.name, xPos, yPos);
                }
            });
        };

        const animate = () => {
            if (!isMounted) return;
            drawScene();
            animationFrameId.current = requestAnimationFrame(animate);
        };

        return () => {
            isMounted = false;
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };

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
