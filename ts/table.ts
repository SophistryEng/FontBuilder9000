import { Glyph } from "./font";

export class GlyphTable {

	protected readonly container = document.createElement('div');

	constructor(
		private glyph: Glyph,
	) {
		this.container.className = 'glyph-table-container';
		this.render();

		this.glyph.updateEmitter.add(() => {
			console.log('x');
			this.render();
		});
	}

	public getTable(): HTMLElement {
		return this.container;
	}

	private render() {
		this.container.innerHTML = '';
		let data = this.glyph.getData();

		const table = document.createElement('table');
		this.container.appendChild(table);

		for (let row = 0; row < this.glyph.rows; row++) {
			let tr = document.createElement('tr');
			for (let column = 0; column < this.glyph.columns; column++) {
				let td = document.createElement('td');
				let filled = data[row * this.glyph.columns + column];
				if (filled) {
					td.className = 'filled';
				}
				tr.appendChild(td);

				td.dataset.row = row.toString();
				td.dataset.column = column.toString();

			}
			table.appendChild(tr);
		}
	}

}

export class EditableGlyphTable extends GlyphTable  {

	constructor(
		glyph: Glyph,
	) {
		super(glyph);

		this.container.addEventListener('mousedown', (event: MouseEvent) => {
			console.log('down');

			let flipped: boolean[] = [];
			const over = (event: MouseEvent) => {
				console.log('over');
				const target = event.target as HTMLElement;
				if (target.tagName === 'TD') {
					const row = parseInt(target.dataset.row || '0', 10);
					const column = parseInt(target.dataset.column || '0', 10);

					if (!flipped[row * glyph.columns + column]) {
						glyph.setPixel(row, column, !glyph.getData()[row * glyph.columns + column]);
					}

					flipped[row * glyph.columns + column] = true;
				}
			}

			over(event);

			this.container.addEventListener('mouseover', over);

			const up = () => {
				console.log('up');
				document.removeEventListener('mouseup', up);
				this.container.removeEventListener('mouseover', over);
			}

			document.addEventListener('mouseup', up);
		});
	}

}