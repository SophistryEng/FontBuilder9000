import { Glyph } from "./font";

export class GlyphTable {

	protected readonly container = document.createElement('div');

	constructor(
		protected glyph: Glyph,
	) {
		this.container.className = 'glyph-table-container';
		this.render();

		this.glyph.updateEmitter.add(() => {
			this.render();
		});
	}

	public getTable(): HTMLElement {
		return this.container;
	}

	protected render() {
		this.container.innerHTML = '';
		const data = this.glyph.getData();

		const table = document.createElement('table');
		this.container.appendChild(table);

		for (let row = 0; row < this.glyph.rows; row++) {
			const tr = document.createElement('tr');
			for (let column = 0; column < this.glyph.columns; column++) {
				const td = document.createElement('td');
				const filled = data[row * this.glyph.columns + column];
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

export class EditableGlyphTable extends GlyphTable {

	constructor(
		glyph: Glyph,
	) {
		super(glyph);

		this.container.addEventListener('mousedown', (event: MouseEvent) => {

			const flipped: boolean[] = [];
			const over = (overEvent: MouseEvent) => {
				const target = overEvent.target as HTMLElement;
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
				document.removeEventListener('mouseup', up);
				this.container.removeEventListener('mouseover', over);
			}

			document.addEventListener('mouseup', up);
		});
	}

	protected render() {
		super.render();

		const clear = document.createElement('button');
		clear.innerText = 'Clear';

		clear.addEventListener('click', () => {
			this.glyph.clear();
		});

		this.container.appendChild(clear);
	}

}
