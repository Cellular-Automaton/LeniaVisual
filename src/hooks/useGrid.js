import { useState, useCallback } from 'react';

export const useGrid = (defaultRows = 10, defaultCols = 10) => {
    const [cells, setCells] = useState([]);
    const [rows, setRows] = useState(defaultRows);
    const [cols, setCols] = useState(defaultCols);
    const [stats, setStats] = useState({ totalCells: 0, aliveCells: 0 });
    const [frames, setFrames] = useState([]);   // Used to see previous states of simulation

    // Create a grid with specified rows and columns
    const createGrid = useCallback((newRows = 10, newCols = 10) => {
        const newCells = [];

        for (let col = 0; col < newCols; col++) {
            for (let row = 0; row < newRows; row++) {
                newCells.push({ 
                    id: `${row}-${col}`, 
                    row,
                    col,
                    state: 0 // 0 = dead, 1 = alive
                });
            }
        }
        setStats({ totalCells: newRows * newCols, aliveCells: 0 });
        setCells(newCells);
        setRows(newRows);
        setCols(newCols);
    }, [rows, cols]);

    // Clear the grid (set all cells to dead)
    const clearGrid = useCallback(() => {
        setCells(cells.map(cell => ({ ...cell, state: 0 })));
    }, [cells]);

    // Empty the grid (remove all cells)
    const emptyGrid = useCallback(() => {
        setCells([]);
        setRows(0);
        setCols(0);
    }, []);

    // Toggle the state of a cell
    const toggleCell = useCallback((cellId, value) => {
        setCells(cells.map(cell => 
            cell.id === cellId ? { ...cell, state: cell.state === 0 ? value : 0 } : cell
        ));
        const aliveCount = cells.reduce((count, cell) => count + (cell.id === cellId ? (cell.state === 0 ? value : 0) : cell.state), 0);
        setStats(prevStats => ({ ...prevStats, aliveCells: aliveCount }));
    }, [cells]);

    // Get the states of all cells
    const getAllStates = useCallback(() => {
        return cells.map(cell => ({ id: cell.id, state: cell.state }));
    }, [cells]);

    const getCellStates = useCallback(() => {
        return cells.map(cell => (cell.state));
    }, [cells]);

    const updateCellStates = useCallback((newStates) => {
        setCells(cells => {
            console.log("Length cells:", cells.length, " - newStates:", newStates.length);
            if (newStates.length !== cells.length) {
                console.error("New states array length does not match the number of cells.");
                return cells;
            }
            return cells.map((cell, index) => ({ ...cell, state: newStates[index] }));
        });
    }, []);

    return {
        // Values
        cells,
        rows,
        cols,
        stats,
        frames,

        // Functions
        createGrid,
        clearGrid,
        emptyGrid,
        toggleCell,
        getAllStates,
        getCellStates,
        updateCellStates,
        setFrames
    };
};