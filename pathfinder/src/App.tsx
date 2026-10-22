import { useState } from "react";
import "./App.css";

// Grid dimensions
const ROWS = 12;
const COLS = 20;

// Start and end positions
const START = { row: 5, col: 2 };
const END = { row: 5, col: 17 };

// Possible cell types
type CellType = "empty" | "start" | "end" | "wall";

type Position = {
  row: number;
  col: number;
}

type SearchResult = {
  path: Position[];
  visitedOrder: Position[];
}

type SearchStats = {
  algorithm: "BFS" | "DFS";
  visited: number;
  steps: number;
  found: boolean;
};

type Cell = {
  row: number;
  col: number;
  type: CellType;
};

// Build the initial grid
function createGrid(): Cell[][] {
  return Array.from({ length: ROWS }, (_, row) => 
    Array.from({ length: COLS }, (_, col) => {
      let type: CellType = "empty";

      if (row === START.row && col === START.col) {
        type = "start";
      } else if (row === END.row && col === END.col) {
        type = "end";
      }

      return { row, col, type };
    })
  );
}

function getNeighbors(row: number, col: number) {
  const directions = [
    [-1, 0], // UP
    [1, 0],  // DOWN
    [0, -1], // LEFT
    [0, 1],  // RIGHT
  ];

  const neighbors = [];

  for (const [rowChange, colChange] of directions) {
    const newRow = row + rowChange;
    const newCol = col + colChange;

    if (
      newRow >= 0 &&
      newRow < ROWS &&
      newCol >= 0 &&
      newCol < COLS
    ) {
      neighbors.push({ row: newRow, col: newCol });
    }
  }

  return neighbors;
}

function bfs(grid: Cell[][]): SearchResult{
  // Start with the starting position
  const queue: Position[] = [START];

  // Remember which cells we have visited
  const visited = new Set<string>();

  const parents = new Map<string, Position | null>();
  const visitedOrder: Position[] = [];

  const startKey = `${START.row}-${START.col}`;

  visited.add(startKey)
  parents.set(startKey, null);

  // Points to the next item to process
  let head = 0;

  while (head < queue.length) {
    // Take the next cell from the queue
    
    // This is a queue because BFS use queue to work because is FIFO
    const current = queue[head];
    head++;

    visitedOrder.push(current);
    // Check if we reached the destination
    if (current.row === END.row && current.col === END.col) {
      const path: Position[] = [];
      let position: Position | null = current;

      // Follow parent backward
      while (position !== null) {
        path.push(position);

        const key: string = `${position.row}-${position.col}`;
        position = parents.get(key) ?? null;
      }

      return {
        path: path.reverse(),
        visitedOrder: visitedOrder,
      };
    }

    // Explore neighboring cells
    for (const neighbor of getNeighbors(current.row, current.col)) {
      const key = `${neighbor.row}-${neighbor.col}`;

      // Skip visited cells
      if (visited.has(key)) {
        continue;
      }

      // Skip walls
      if (grid[neighbor.row][neighbor.col].type === "wall") {
        continue;
      }

      // Mark the neighbor as visitedd
      visited.add(key);

      // Remember where we came from 
      parents.set(key, current);
      // Add it to the queue
      queue.push(neighbor);
    }
  }

  return {
    path: [],
    visitedOrder: visitedOrder,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dfs(grid: Cell[][]) : SearchResult {
  const stack: Position[] = [START]; 

  const visited = new Set<string>();
  const parents = new Map<string, Position | null>();
  const visitedOrder: Position[] =[];

  const startKey = `${START.row}-${START.col}`;

  visited.add(startKey);
  parents.set(startKey, null);

  while (stack.length > 0) {
    //LIFO: take the last item
    const current = stack.pop()!;

    visitedOrder.push(current);

    if (current.row === END.row && current.col === END.col) {
      const path: Position[] = [];
      let position: Position | null = current;

      while (position !== null) {
        path.push(position);

        const key: string = `${position.row}-${position.col}`;
        position = parents.get(key) ?? null;
      }

      return {
        path: path.reverse(),
        visitedOrder,
      };
    }

    // Explore neighbors
    for (const neighbor of getNeighbors(current.row, current.col).reverse()) {
      const key = `${neighbor.row}-${neighbor.col}`;

      if (visited.has(key)) continue;

      if (grid[neighbor.row] [neighbor.col].type === "wall") {
        continue;
      }

      visited.add(key);
      parents.set(key, current);
      stack.push(neighbor);
    }
  }

  return {
    path: [],
    visitedOrder,
  }
}

function App() {

  const [grid, setGrid] = useState<Cell[][]>(createGrid);
  const [path, setPath] = useState<Position[]>([]);
  const [visitedCells, setVisitedCells] = useState<Position[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [speed, setSpeed] = useState(20);


  async function animateSearch(algorithm: "BFS" | "DFS") {
    if (isRunning) return;
    setStats(null);
    setIsRunning(true);

    // Clear previous animation
    setVisitedCells([]);
    setPath([]);

    try {
      // Choose the algorithm
      const result = algorithm === "BFS"
        ? bfs(grid)
        : dfs(grid);

      // Animate explored cells
      for (const cell of result.visitedOrder) {
        await sleep(speed);

        setVisitedCells((previous) => [
          ...previous,
          cell,
        ]);
      }

      // Animate the shortest path
      for (const cell of result.path) {
        await sleep(speed *2);

        setPath((previous) => [
          ...previous,
          cell,
        ]);
      }

      setStats({
        algorithm: algorithm,
        visited: result.visitedOrder.length,
        steps: result.path.length > 0 ? result.path.length - 1 : 0,
        found: result.path.length > 0,
      });
    } finally {
      setIsRunning(false);
    } 
  }

  // Click a cell to add or remove a wall
  function toggleWall(row: number, col: number) {
    setPath([])

    setGrid((current) => 
      current.map((currentRow) =>
        currentRow.map((cell) => {
          if (cell.row != row || cell.col != col) {
            return cell;
          }

          if (cell.type === "start" || cell.type === "end") {
            return cell;
          }

          return {
            ...cell,
            type: cell.type === "wall" ? "empty" : "wall",
          };
        })
      )
    )
  }

  return (
    <main className="app">
      <header>
        <p className="eyebrow"> ALGORITHM VISUALIZER</p>
        <h1>PathFinder.</h1>
        <p>Draw walls and explore how algorithms find paths.</p>
      </header>

      <section className="panel">
        <div className="toolbar">
          <label>
            Animation Speed:

            <select
              value={speed}
              disabled={isRunning}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={100}>Slow</option>
              <option value={20}>Normal</option>
              <option value={5}>Fast</option>
            </select>
          </label>
          <span>Click cells to draw walls</span>

          <button
            className="clear-button"
            disabled={isRunning}
            onClick={() => {
              setGrid(createGrid());
              setPath([]);
              setVisitedCells([]);
            }}
          >
            Clear Walls
          </button>
          <button
            className="clear-button"
            onClick={() => animateSearch("BFS")}
            disabled={isRunning}
          >
            Run BFS
          </button>

          <button
            className="clear-button"
            onClick={() => animateSearch("DFS")}
            disabled={isRunning}
          >
            Run DFS
          </button>

        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          }}
        >
          {grid.flat().map((cell) => (
            <button
              key={`${cell.row}-${cell.col}`}
              className={`cell ${cell.type} ${
                visitedCells.some(
                  (position) =>
                    position.row === cell.row && position.col === cell.col
                )
                  ? "visited"
                  : ""
              } ${
                path.some(
                  (position) => 
                    position.row === cell.row && position.col === cell.col
                )
                  ? "path"
                  : ""
              }`}
              onClick={() => toggleWall(cell.row, cell.col)}
              disabled={
                isRunning || cell.type === "start" || cell.type === "end"}
              aria-label={`Row ${cell.row + 1}, column ${cell.col + 1}: ${cell.type}`}            
            />
          ))}
        </div>

        {stats && (
          <div className="stats">
            <h3>{stats.algorithm} Results</h3>

            <p>Cells explored: {stats.visited}</p>

            <p>
              Path steps: {stats.found ? stats.steps : "N/A"}
            </p>

            <p>
              Status: {stats.found ? "Path found!" : "No path found"}
            </p>
          </div>
        )}

        <div className="legend">
          <div className="legend-item">
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                backgroundColor: "#10b981",
                borderRadius: "4px",
              }}
            />
            <span>Start</span>
          </div>

          <div className="legend-item">
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                backgroundColor: "#f59e0b",
                borderRadius: "4px",
              }}
            />
            <span>End</span>
          </div>

          <div className="legend-item">
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                backgroundColor: "#94a3b8",
                borderRadius: "4px",
              }}
            />
            <span>Wall</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App;
