import { useRef, useEffect, useState } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

const PixiRenderer = ({ pencil, cells, rows, cols, onCellClick }) => {
    const appRef = useRef(null);
    const containerRef = useRef(null);
    const viewportRef = useRef(null);
    const [isPixiReady, setIsPixiReady] = useState(false);
    const dragInfoRef = useRef({
        active: false,
        alreadyDoneCells: new Set()
    });
    const cellGraphicsRef = useRef(new Map()); // Map pour stocker chaque cellule PIXI

    useEffect(() => {
        initPixi();

        return () => {
            if (appRef.current) {
                const pixiContainer = document.getElementById('pixi-container');
                if (pixiContainer && appRef.current.canvas) {
                    pixiContainer.removeChild(appRef.current.canvas);
                }
                appRef.current.destroy();
            }
        };
    }, []);

    useEffect(() => {
        if (!isPixiReady)
            return;

        createTableGraphics();
    }, [cells, isPixiReady]);


    const createTableGraphics = () => {
        if (!containerRef.current)
            return;

        cellGraphicsRef.current.forEach(graphic => {
            containerRef.current.removeChild(graphic);
            graphic.destroy();
        });
        cellGraphicsRef.current.clear();

        cells.forEach(cell => {
            createCellGraphics(cell);
        });
    }

    const initPixi = async () => {
        const app = new Application();
        const container = new Container();

        app.stage.interactive = true;
        appRef.current = app;

        await app.init({
            background: 0x1B3C53,
            resizeTo: window,
        });

        const pixiContainer = document.getElementById('pixi-container');
        if (pixiContainer) {
            pixiContainer.appendChild(app.canvas);
        }

        const viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            worldWidth: 1000,
            worldHeight: 1000,
            events: app.renderer.events,
        });

        viewport.clampZoom({
            minScale: 0.05,
            maxScale: 3
        });

        app.stage.addChild(viewport);

        viewport.drag().pinch().wheel().decelerate();

        containerRef.current = container;
        viewportRef.current = viewport;
        viewport.addChild(container);

        viewport.setZoom(1);

        window.addEventListener('resize', () => {
            viewport.resize(window.innerWidth, window.innerHeight, cols * 110, rows * 110);
            viewport.moveCenter((cols * 110) / 2, (rows * 110) / 2);
        });
        viewport.moveCenter((cols * 110) / 2, (rows * 110) / 2);

        window.addEventListener('mouseup', () => {
            dragInfoRef.current.active = false;
            dragInfoRef.current.alreadyDoneCells.clear();
            viewportRef.current.plugins.resume("drag");
            viewportRef.current.plugins.resume("pinch");
            viewportRef.current.plugins.resume("wheel");
        });

        setIsPixiReady(true);
    };

    const lerpColor = (color1, color2, t) => {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;

        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return (r << 16) + (g << 8) + b;
    };

    const getCellColor = (state) => {
        const white = 0xF7F7F7;
        const violet = 0x8000FF;
        const black = 0x212121;

        if (state <= 0) return white;
        if (state >= 1) return black;
        if (state <= 0.5) {
            const t = state / 0.5;
            return lerpColor(white, violet, t);
        } else {
            const t = (state - 0.5) / 0.5;
            return lerpColor(violet, black, t);
        }
    };

    const createCellGraphics = (cell) => {
        const graphics = cellGraphicsRef.current.get(cell.id);
        if (graphics)
            return graphics;

        const cellSize = 100;
        const newGraphics = new Graphics();

        newGraphics.rect(0, 0, cellSize, cellSize);
        newGraphics.fill(getCellColor(cell.state));
        newGraphics.interactive = true;
        newGraphics.buttonMode = true;
        newGraphics.x = cell.row * (cellSize + 10);
        newGraphics.y = cell.col * (cellSize + 10);

        newGraphics.on('pointerdown', () => {
            dragInfoRef.current.active = true;
            if (onCellClick) {
                onCellClick(cell.id, pencil);
                dragInfoRef.current.alreadyDoneCells.add(cell.id);
                viewportRef.current.plugins.pause("drag");
                viewportRef.current.plugins.pause("pinch");
                viewportRef.current.plugins.pause("wheel");
            }
        });
        newGraphics.on('pointerover', () => {
            newGraphics.alpha = 0.7;
            if (dragInfoRef.current.active && !dragInfoRef.current.alreadyDoneCells.has(cell.id)) {
                onCellClick(cell.id, pencil);
                dragInfoRef.current.alreadyDoneCells.add(cell.id);
            }
        });
        newGraphics.on('pointerout', () => {
            newGraphics.alpha = 1.0;
        });

        cellGraphicsRef.current.set(cell.id, newGraphics);
        containerRef.current.addChild(newGraphics);
        return;
    }

    return (
        <div id="pixi-container" className="w-full h-full">
        </div>
    );
};

export default PixiRenderer;