
"use client";

import React, { useRef, useEffect } from 'react';

export interface CharacterAsset {
    spriteUrl?: string;
    position: { x: number; y: number };
    scale: number;
    name: string;
    animation?: "idle" | "enter_from_left" | "enter_from_right" | "exit_to_left" | "exit_to_right";
}

export interface CanvasSceneProps {
    backgroundUrl?: string;
    characters: CharacterAsset[];
    width?: number;
    height?: number;
}

interface AnimatedCharacterState {
    currentX: number;
    currentY: number;
    targetX: number;
    targetY: number;
    image?: HTMLImageElement;
}

const CanvasScene: React.FC<CanvasSceneProps> = ({ backgroundUrl, characters, width = 1280, height = 720 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const loadedImagesRef = useRef<{ [src: string]: HTMLImageElement }>({});
    const animatedCharsRef = useRef<Map<string, AnimatedCharacterState>>(new Map());


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let isMounted = true;
        // Cancel any previous animation loop
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }

        const allImageUrls = [backgroundUrl, ...characters.map(c => c.spriteUrl)].filter((url): url is string => !!url);
        const uniqueImageUrls = [...new Set(allImageUrls)];

        let imagesToLoadCount = uniqueImageUrls.length;
        let imagesLoaded = 0;

        const onImageLoad = (img: HTMLImageElement) => {
            imagesLoaded++;
            loadedImagesRef.current[img.src] = img;
            if (imagesLoaded === imagesToLoadCount && isMounted) {
                setupInitialCharacterStates();
                animate();
            }
        };

        const setupInitialCharacterStates = () => {
            const newAnimatedChars = new Map<string, AnimatedCharacterState>();
            characters.forEach(char => {
                const charImage = char.spriteUrl ? loadedImagesRef.current[char.spriteUrl] : undefined;
                const charWidth = charImage ? charImage.naturalWidth * char.scale : 100;
                
                const targetX = (char.position.x / 100) * width;
                const targetY = (char.position.y / 100) * height;
                
                let startX = targetX;
                // If a character was already on screen, keep its last position to animate from
                const existingState = animatedCharsRef.current.get(char.name);

                switch (char.animation) {
                    case 'enter_from_left':
                        startX = -charWidth;
                        break;
                    case 'enter_from_right':
                        startX = width;
                        break;
                    default:
                         startX = existingState ? existingState.currentX : targetX;
                }

                newAnimatedChars.set(char.name, {
                    currentX: startX,
                    currentY: targetY, // Start at target Y for simplicity
                    targetX: targetX,
                    targetY: targetY,
                    image: charImage,
                });
            });
            animatedCharsRef.current = newAnimatedChars;
        };


        if (imagesToLoadCount === 0) {
            setupInitialCharacterStates();
            animate();
        } else {
            uniqueImageUrls.forEach(src => {
                if (loadedImagesRef.current[src]?.complete) {
                     onImageLoad(loadedImagesRef.current[src]);
                     return;
                }
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => onImageLoad(img);
                img.onerror = () => {
                    console.error(`Failed to load image: ${src}`);
                    onImageLoad(img);
                };
                img.src = src;
            });
        }
        
        const processAndDrawCharacter = (charState: AnimatedCharacterState, charProps: CharacterAsset, time: number) => {
             if (!ctx) return;
             const charImage = charState.image;

             const charHeight = charImage ? charImage.naturalHeight * charProps.scale : 150;
             const charWidth = charImage ? charImage.naturalWidth * charProps.scale : 100;
             const bobbingAmount = charProps.animation === 'idle' ? Math.sin(time / 500 + charProps.position.x) * 5 : 0;
             const yPos = charState.currentY - charHeight + bobbingAmount;
             const xPos = charState.currentX - (charWidth / 2); // Center the image

            if (!charImage || !charImage.complete || charImage.naturalHeight === 0) {
                 ctx.font = 'bold 24px serif';
                 ctx.fillStyle = 'white';
                 ctx.textAlign = 'center';
                 ctx.strokeStyle = 'black';
                 ctx.lineWidth = 4;
                 ctx.strokeText(charProps.name, xPos + charWidth / 2, yPos + charHeight / 2);
                 ctx.fillText(charProps.name, xPos + charWidth / 2, yPos + charHeight / 2);
                 return;
             }

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
                ctx.drawImage(tempCanvas, xPos, yPos, charWidth, charHeight);

            } catch (e) {
                console.error("Could not process image for chroma keying, drawing as-is. Error:", e);
                ctx.drawImage(charImage, xPos, yPos, charWidth, charHeight);
            }
        };

        const animate = () => {
            if (!ctx || !isMounted) return;
            const time = Date.now();

            ctx.clearRect(0, 0, width, height);

            const bgImage = backgroundUrl ? loadedImagesRef.current[backgroundUrl] : undefined;
            if (bgImage && bgImage.complete) {
                ctx.drawImage(bgImage, 0, 0, width, height);
            } else {
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#2e3a59');
                gradient.addColorStop(1, '#1e293b');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }

            characters.forEach(charProps => {
                const charState = animatedCharsRef.current.get(charProps.name);
                if (!charState) return;

                const charWidth = charState.image ? charState.image.naturalWidth * charProps.scale : 100;
                let finalTargetX = charState.targetX;

                switch(charProps.animation) {
                    case 'exit_to_left':
                        finalTargetX = -charWidth;
                        break;
                    case 'exit_to_right':
                        finalTargetX = width + charWidth;
                        break;
                }

                charState.currentX += (finalTargetX - charState.currentX) * 0.05;

                processAndDrawCharacter(charState, charProps, time);
            });
            
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
