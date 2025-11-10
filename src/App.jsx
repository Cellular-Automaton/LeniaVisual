import { useEffect, useState } from 'react';
import { useGrid } from './hooks/useGrid';
import PixiRenderer from './components/PixiRenderer';
import { Button, ButtonGroup, Slider, TextField } from '@mui/material';

function App() {
    const {
        cells,
        rows,
        cols,
        frames,

        createGrid,
        toggleCell,
        clearGrid,
        getCellStates,
        updateCellStates,
        setFrames
    } = useGrid(); // Custom hook to manage the grid
    const [parameters, setParameters] = useState({
        R: 13,
        Kernel_mu: 0.5,
        Kernel_sigma: 0.15,
        Growth_mu: 0.15,
        Growth_sigma: 0.015,
        time: 0.1,
        width: 20,
        height: 20
    });
    const [pencil, setPencil] = useState(0.8);
    const [isRunning, setIsRunning] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [pendingImportTable, setPendingImportTable] = useState([]);

    useEffect(() => {
        window.addEventListener('message', (event) => {
            const message = event.data;
            const data = message.data;
            console.log("Data from host:", data);

            if (message.action === "UPDATE_TABLE") {
                // Update the grid with the new table data
                const { table } = data;
                console.log("Updating table with:", table);
                updateCellStates(table);
                setCurrentFrame(currentFrame => currentFrame + 1);
                setFrames(prev => [...prev, table]);
            }

            if (message.action === "PARAMETERS") {
                const { parameters: newParameters } = data;
                console.log(data);

                console.log("Updating parameters with:", newParameters);
            }

            if (message.action === "IMPORTED_DATA") {
                const { table, parameters: params } = data;
                console.log("Importing data:", table, params);

                setParameters(prev => {
                    Object.entries(params).forEach(([key, value]) => {
                        if (key in prev) {
                            console.log(`Setting parameter ${key} to ${value} (was ${prev[key]})`);
                            prev[key] = value;
                        }
                    });
                    return { ...prev };
                })
                setPendingImportTable(table);
                setCurrentFrame(0);
            }
        });
    }, [])

    useEffect(() => {
        if (pendingImportTable.length <= 0 || cells.length !== pendingImportTable.length)
            return;

        updateCellStates(pendingImportTable);
        setFrames([pendingImportTable]);
        setCurrentFrame(1);
        setPendingImportTable([]);
    }, [pendingImportTable, cells.length])

    useEffect(() => {
        createGrid(parameters.width, parameters.height);
    }, [createGrid]);

    useEffect(() => {
        if (parameters.width <= 0 || parameters.height <= 0 || !parameters.width || !parameters.height)
            return;

        createGrid(parameters.width, parameters.height);
    }, [parameters.width, parameters.height]);

    useEffect(() => {
        if (currentFrame <= 0 || currentFrame > frames.length)
            return;

        updateCellStates(frames[currentFrame - 1]);
    }, [currentFrame]);

    const handleCellClick = (cellId, pencil) => {
        toggleCell(cellId, pencil);
    };

    const handleClearGrid = () => {
        clearGrid();
    };

    const handleExportData = () => {
        const data = getCellStates();
        const params = {};

        Object.entries(parameters).forEach(([key, value]) => {
            params[key] = {
                value: value,
                type: typeof value
            };
        });
        window.electronAPI.sendToHost({
            action: "EXPORT",
            data: {
                table: data,
                parameters: params
            }
        });
    };

    const handleImportData = () => {
        window.electronAPI.sendToHost({
            action: "IMPORT"
        });
    };

    const handlePlay = () => {
        setIsRunning(true);

        setCurrentFrame(1);
        setFrames([]);
        setFrames(prev => [...prev, getCellStates()]);
        window.electronAPI.sendToHost({
            action: "PLAY_SIMULATION",
            data: {
                parameters: parameters,
                table: getCellStates()
            }
        })
    };

    const handlePause = () => {
        setIsRunning(false);

        window.electronAPI.sendToHost({
            action: "PAUSE_SIMULATION"
        });
    };

    return (
            <div className='h-full w-full relative'>

                <div id='pencil-panel' className='absolute top-2 left-1/2 transform -translate-x-1/2 z-10 bg-white/80 backdrop-blur-md rounded-md p-2 shadow-md min-w-80 w-1/3 text-black flex justify-center items-center gap-4 mb-4'>
                    <TextField
                        key={'pencil'}
                        disabled={isRunning}
                        label={'Pencil'}
                        value={pencil}
                        type='number'
                        slotProps={{ htmlInput: { min: 0, max: 1 } }}
                        onChange={(e) => {
                            let val = e.target.value;
                            if (val.length > 6)
                                val = val.slice(0, 6);
                            setPencil(parseFloat(val))}
                        }
                        className='w-full mb-2 text-white border-white'
                    />
                </div>

                <div id='parameters-panel' className='absolute text-black top-1/2 right-2 transform -translate-y-1/2 min-w-80 w-1/5 z-10 bg-white/80 backdrop-blur-md rounded-md p-2 shadow-md'>
                    <div className='mb-2 font-bold text-center text-2xl'>Parameters</div>
                    <div className='flex flex-col gap-4 mb-4'>
                        {
                            Object.entries(parameters).map(([key, value]) => {
                                    if (value >= 0 && value <= 1) {
                                        return (<TextField
                                        key={key}
                                        disabled={isRunning}
                                        label={key.charAt(0).toUpperCase() + key.slice(1)}
                                        value={value}
                                        type='number'
                                        slotProps={{ htmlInput: { min: 0, max: 1 } }}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (val.length > 6)
                                                val = val.slice(0, 6);
                                            setParameters({ ...parameters, [key]: val })}
                                        }
                                        className='mb-2 text-white border-white'
                                    />)
                                    } else {
                                        return (<TextField
                                            key={key}
                                            disabled={isRunning}
                                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                                            value={value}
                                            type='number'
                                            slotProps={{ htmlInput: { min: 1, max: 100 } }}
                                            onChange={(e) => {
                                                let val = e.target.value;
                                                if (Number(val) > 100)
                                                    val = "100";
                                                if (Number(val) < 1)
                                                    val = "1";
                                                if (val.length > 3)
                                                    val = val.slice(0, 3);
                                                setParameters({ ...parameters, [key]: val })}
                                            }
                                            className='mb-2 text-white border-white'
                                        />)
                                    }
                                })
                        }
                    </div>

                    <div className='w-full flex flex-col justify-center gap-2'>
                            <Button variant='contained' className='w-full' onClick={handleClearGrid} disabled={isRunning}>
                                Clear
                            </Button>
                        <ButtonGroup className='w-full'>
                            <Button variant='contained' onClick={handleExportData} className='w-full' disabled={isRunning}>
                                Export Data
                            </Button>
                            <Button variant='contained' onClick={handleImportData} className='w-full' disabled={isRunning}>
                                Import Data
                            </Button>
                        </ButtonGroup>
                    </div>
                </div>

                <div id='player-panel' className='absolute flex flex-col bottom-4 left-1/2 transform -translate-x-1/2 text-black min-w-80 w-1/2 z-10 bg-white/80 backdrop-blur-md rounded-md py-2 px-5 shadow-md justify-center items-center gap-2'>
                    <ButtonGroup className='justify-center w-1/5'>
                        <Button variant='contained' className='w-full' disabled={isRunning} onClick={handlePlay}>
                            Play
                        </Button>
                        <Button variant='contained' className='w-full' disabled={!isRunning} onClick={handlePause}>
                            Pause
                        </Button>
                    </ButtonGroup>
                    <div className='w-full flex flex-col'>
                        <label className='flex w-full font-bold justify-start'>
                            Frames
                        </label>
                        <Slider
                            className='w-1/2'
                            disabled={isRunning}
                            value={currentFrame}
                            onChange={(e, newValue) => setCurrentFrame(newValue)}
                            aria-labelledby="continuous-slider"
                            min={1}
                            max={frames.length}
                        />
                        <span className='flex w-full justify-end'>{currentFrame} / {frames.length}</span>
                    </div>
                </div>

                <PixiRenderer
                    pencil={pencil}
                    cells={cells}
                    rows={rows}
                    cols={cols}
                    onCellClick={handleCellClick}
                />
            </div>
    );
}

export default App;
