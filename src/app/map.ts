export class Map {
    rows: Rows;
    mapHeight: number;
    mapWidth: number;
    startCell: Cell;
    finishCell: Cell;
    openCells: Array<Cell>;
    closedCells: Array<Cell>;
    originalStartCell: Cell;
    async generateMap() {
        let index = 0;
        for (let y = 0; y < this.mapHeight; y += 1) {
            const row = new Row();
            for (let x = 0; x < this.mapWidth; x += 1) {
                index++;
                const cell = new Cell(x, y, index);
                row.push(cell);
            }
            this.rows.push(row);
        }
    }

    setPoints(startCell: Cell = null, finishCell: Cell = null) {
        this.startCell = startCell ? startCell : this.rows[0][0];
        if (this.startCell) {
            this.rows[this.startCell.y][this.startCell.x].setStartCell();
        }
        this.finishCell = finishCell ? finishCell : this.rows[this.rows.length - 1][this.rows[this.rows.length - 1].length - 1];
        this.rows[this.finishCell.y][this.finishCell.x].setFinishCell();
        this.closedCells.push(this.startCell);
        this.originalStartCell = this.startCell;
    }

    async setDimensions() {
        if (!this.rows || !this.mapWidth || !this.mapHeight) {
            return;
        }
        await this.resetObject(null, null);
        this.setPoints();
    }
    calculateDistance() {
        this.openCells.forEach(cell => {
            cell.calculateDistanceFromEnd((this.finishCell.x - cell.x), (this.finishCell.y - cell.y));
            cell.calculateDistanceFromStart((this.originalStartCell.x - cell.x), (this.originalStartCell.y - cell.y));
            cell.calculateDistance();
        });
    }

    getCellSiblings(cell: Cell) {
        const higheRow = this.rows[cell.y + 1];
        const sameRow = this.rows[cell.y];
        const lowerRow = this.rows[cell.y - 1];
        cell.siblings = [
            this.getCellInRow(higheRow, cell.x - 1, cell),
            this.getCellInRow(higheRow, cell.x, cell),
            this.getCellInRow(higheRow, cell.x + 1, cell),
            this.getCellInRow(sameRow, cell.x - 1, cell),
            this.getCellInRow(sameRow, cell.x + 1, cell),
            this.getCellInRow(lowerRow, cell.x - 1, cell),
            this.getCellInRow(lowerRow, cell.x, cell),
            this.getCellInRow(lowerRow, cell.x + 1, cell)];

        cell.siblings = cell.siblings.filter(s => s);
        this.openCells = [...this.openCells, ...cell.siblings];
    }

    getCellInRow(row: Row, index: number, cell: Cell) {
        if (!row || !row[index] || this.closedCells.includes(row[index]) || row[index].isSibling) {
            return;
        }
        row[index].isSibling = true;
        row[index].setParent(cell);
        row[index].calculateCost(this.finishCell);
        return row[index];
    }

    findMin() {
        const min = this.openCells.reduce((prev, curr) => prev.cost > curr.cost ? curr : prev);
        const potentialMins = this.openCells.filter(c => c.cost === min.cost).sort((a, b) => a.index - b.index);
        return potentialMins.reduce((prev, curr) => prev.distanceFromEnd > curr.distanceFromEnd ? curr : prev);
    }

    constructor(mapWidth: number = 20, mapHeight: number = 20) {
        this.resetObject(mapWidth, mapHeight);
        this.setPoints();
    }

    async resetObject(mapWidth: number = 20, mapHeight: number = 20, startCell: Cell = null, finishCell: Cell = null) {
        this.rows = new Rows();
        if (mapWidth) {
            this.mapWidth = mapWidth;
        }
        if (mapHeight) {
            this.mapHeight = mapHeight;
        }
        this.startCell = startCell;
        this.finishCell = finishCell;
        this.openCells = new Array<Cell>();
        this.closedCells = new Array<Cell>();
        this.originalStartCell = startCell;
        await this.generateMap();
    }
}

export class Rows extends Array<Row> {

}

export class Row extends Array<Cell> {
}

export class Cell {
    x: number;
    y: number;
    distanceFromStart: number;
    distanceFromEnd: number;
    isStartCell: boolean;
    isFinishCell: boolean;
    isWall: boolean;
    siblings: Array<Cell>;
    index: number;
    finalDistance: number;
    isCorrectPath: boolean;
    isSibling: boolean;
    parent: Cell;
    cost: number;
    constructor(x = 0, y = 0, index = 0) {
        this.x = x;
        this.y = y;
        this.distanceFromStart = 0;
        this.distanceFromEnd = 0;
        this.isStartCell = false;
        this.isFinishCell = false;
        this.isWall = false;
        this.siblings = new Array<Cell>();
        this.index = index;
        this.finalDistance = 0;
        this.isCorrectPath = false;
        this.isSibling = false;
        this.cost = 0;
    }

    setParent(parent: Cell) {
        this.parent = parent;
    }

    setStartCell = () => this.isStartCell = true;
    setFinishCell = () => this.isFinishCell = true;

    calculateDistanceFromEnd = (x, y) => this.distanceFromEnd = Math.round((Math.abs(x) + Math.abs(y)));
    calculateDistanceFromStart = (x, y) => this.distanceFromStart = Math.round((Math.abs(x) + Math.abs(y)));
    calculateDistance = () => this.finalDistance = (this.distanceFromEnd + this.distanceFromStart);

    calculateCost = (finishCell: Cell) => {
        const direction = this.getDirection(finishCell);
        switch (direction) {
            case Direction.Vertical:
                this.cost = this.getVerticalCost(finishCell);
                break;
            case Direction.Horizontal:
                this.cost = this.getHorizontalCost(finishCell);
                break;
            default:
                this.cost = this.getDiagonalCost(finishCell, direction);
        }
    }
    private getDiagonalCost(finishCell: Cell, direction: Direction) {
        const x = Math.abs(finishCell.x - this.x);
        let numOfDMoves = 0;
        let numOfVHMoves = 0;
        if (direction === Direction.DiagonalUpper) {
            if (this.y + x < finishCell.y) {
                numOfDMoves = x;
                numOfVHMoves = Math.abs((this.y + x) - finishCell.y);
            } else if (this.y + x >= finishCell.y) {
                numOfDMoves = Math.abs(this.y - finishCell.y);
                numOfVHMoves = Math.abs(Math.abs(this.x + numOfDMoves) - finishCell.x);
            }
        } else {
            if (this.y - x >= finishCell.y) {
                numOfDMoves = x;
                numOfVHMoves = Math.abs((this.y - x) - finishCell.y);
            } else if (this.y - x < finishCell.y) {
                numOfDMoves = Math.abs(this.y - finishCell.y);
                numOfVHMoves = Math.abs(Math.abs(this.x + numOfDMoves) - finishCell.x);
            }
        }
        return (numOfDMoves * 14) + (numOfVHMoves * 10);
    }

    private getVerticalCost(finishCell: Cell) {
        return Math.abs(finishCell.y - this.y) * 10;
    }

    private getHorizontalCost(finishCell: Cell) {
        return Math.abs(finishCell.x - this.x) * 10;
    }

    private getDirection(finishCell: Cell) {
        let direction: Direction = null;
        if (finishCell.x === this.x) {
            direction = Direction.Vertical;
        } else if (finishCell.y === this.y) {
            direction = Direction.Horizontal;
        } else if (finishCell.y !== this.y &&
            finishCell.x !== this.x &&
            finishCell.y > this.y) {
            direction = Direction.DiagonalUpper;
        } else if (finishCell.y !== this.y &&
            finishCell.x !== this.x &&
            finishCell.y < this.y) {
            direction = Direction.DiagonalLower;
        }
        return direction;
    }
}

export enum Direction { Horizontal, Vertical, DiagonalLower, DiagonalUpper }
