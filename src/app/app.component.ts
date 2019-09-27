import { Component, Renderer2, OnInit } from '@angular/core';
import { Map, Cell } from './map';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  map: Map;
  ngOnInit() {
    this.map = new Map();
  }
  constructor(private renderer: Renderer2) {
  }

  addWall(cell: Cell) {
    if (!cell.isWall) {
      cell.isWall = true;
      this.map.closedCells.push(cell);
      this.renderer.addClass(document.getElementById(cell.y + '-' + cell.x), 'wall');
      return;
    }
    cell.isWall = false;
    this.map.closedCells.splice(this.map.closedCells.indexOf(cell), 1);
    this.renderer.removeClass(document.getElementById(cell.y + '-' + cell.x), 'wall');
  }

  reset() {
    this.map.resetObject(null, null);
    this.map.setPoints();
  }


  async onCellClick(cell: Cell) {
    if (!cell.isStartCell && !this.map.startCell) {
        cell.isStartCell = true;
        this.map.closedCells.push(cell);
        this.map.startCell = cell;
        this.map.originalStartCell = cell;
        return;
    } else if (cell.isStartCell) {
        this.map.closedCells.splice(this.map.closedCells.indexOf(this.map.startCell), 1);
        this.map.startCell = null;
        cell.isStartCell = false;
        return;
    }
    if (!cell.isFinishCell && !this.map.finishCell) {
        cell.isFinishCell = true;
        this.map.finishCell = cell;
        return;
    } else if (cell.isFinishCell) {
        this.map.finishCell.isFinishCell = false;
        this.map.finishCell = null;
        return;
    }
    this.addWall(cell);
  }

  async start(startCell: Cell = null) {
    if (startCell) {
      this.map.startCell = startCell;
    } else {
      startCell = this.map.startCell;
    }
    this.map.closedCells.push(startCell);
    this.map.getCellSiblings(startCell);
    for (const s of startCell.siblings) {
      this.renderer.addClass(document.getElementById(s.y + '-' + s.x), 'surroundings');
      await this.sleep(0.3);
    }
    this.map.openCells = [...this.map.openCells, ...startCell.siblings];
    if (this.map.openCells.length === 0) {
      return;
    }
    this.map.calculateDistance();
    const ifCellIsOpen = this.map.openCells.indexOf(startCell);
    if (ifCellIsOpen > -1) {
      this.map.openCells.splice(ifCellIsOpen, 1);
    }
    startCell = this.map.findMin();
    if (startCell === this.map.finishCell) {
      this.backTrack();
      return;
    }
    this.start(startCell);
  }

  onMouseOver(cell: Cell, event) {
    if (event.buttons === 1 || event.buttons === 3) {
      this.onCellClick(cell);
    }
  }

  async backTrack(startCell: Cell = null) {
    startCell = startCell ? startCell : this.map.finishCell.parent;
    if (startCell === this.map.originalStartCell) {
      return;
    }
    if (startCell) {
      const element = document.getElementById(startCell.y + '-' + startCell.x);
      this.renderer.addClass(element, 'finalPath');
      await this.sleep(10);
    }
    const parent: Cell = startCell.parent;
    if (startCell.parent.x !== startCell.x &&
      startCell.parent.y !== startCell.y &&
      startCell.parent.parent) {
      const Grandparent = startCell.parent.parent;
      if (Grandparent.x === startCell.x) {
        startCell.parent = Grandparent.y < startCell.y ?
          [...this.map.closedCells, ...this.map.openCells].filter(c => !c.isWall)
            .find(c => c.x === startCell.x && c.y === (startCell.y - 1)) :
          [...this.map.closedCells, ...this.map.openCells].filter(c => !c.isWall)
            .find(c => c.x === startCell.x && c.y === (startCell.y + 1));
      } else if (Grandparent.y === startCell.y) {
        startCell.parent = Grandparent.x < startCell.x ?
          [...this.map.closedCells, ...this.map.openCells].filter(c => !c.isWall)
            .find(c => c.y === startCell.y && c.x === (startCell.x - 1)) :
          [...this.map.closedCells, ...this.map.openCells].filter(c => !c.isWall)
            .find(c => c.y === startCell.y && c.x === (startCell.x + 1));
      }
      startCell.parent = startCell.parent ? startCell.parent : parent;
      startCell.parent.parent = Grandparent;
    }
    this.backTrack(startCell.parent);
  }
  async sleep(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }
}
