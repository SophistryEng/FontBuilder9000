import { ASCII } from "./ascii";
import { EventEmitter } from "./EventEmitter";

export class Glyph {

	public readonly updateEmitter = new EventEmitter<void>();

	private data: Boolean[] = [];

	constructor(
		public readonly rows: number,
		public readonly columns: number,
		data: Boolean[] = new Array(rows * columns).fill(false),
	) {
		this.setData(data);
	}

	public getData(): Boolean[] {
		return this.data;
	}

	public setData(data: Boolean[]) {
		if (this.rows * this.columns !== data.length) {
			throw new Error('Invalid data length');
		}

		this.data = data;
		this.updateEmitter.trigger();
	}

	public setPixel(row: number, column: number, value: Boolean) {
		this.data[row * this.columns + column] = value;
		this.updateEmitter.trigger();
	}
}


interface SerializedGlyph {
	data: Boolean[];
	rows: number;
	columns: number;
}

function isSerializedGlyph(x: any): x is SerializedGlyph {
	return typeof x.data === 'object' && typeof x.rows === 'number' && typeof x.columns === 'number';
}

export class Char {

	public readonly updateEmitter = new EventEmitter<void>();

	private glyphs: Glyph[] = [];

	constructor(
		public readonly code: number,
		glyphs: Glyph[] = [],
	) {
		for (const glyph of glyphs) {
			this.addGlyph(glyph);
		}
	}

	public getChar(): string {
		return String.fromCharCode(this.code);
	}

	public getName(): string {
		return ASCII[this.code];
	}

	public getGlyph(rows: number, columns: number): Glyph {
		for (const glyph of this.glyphs) {
			if (glyph.rows === rows && glyph.columns === columns) {
				return glyph;
			}
		}

		const glyph = new Glyph(rows, columns);
		this.addGlyph(glyph);

		return glyph;
	}

	public addGlyph(glyph: Glyph) {
		this.glyphs.push(glyph);
		glyph.updateEmitter.add(() => {
			this.updateEmitter.trigger();
		});
	}

	public serialize(): string {
		let x = this.glyphs.map<SerializedGlyph>((glyph) => {
			return {
				data: glyph.getData(),
				rows: glyph.rows,
				columns: glyph.columns
			};
		});

		return JSON.stringify(x);
	}

	public deserialize(data: string) {
		let x = JSON.parse(data);

		for (const sglyph of x) {
			if (!isSerializedGlyph(sglyph)) {
				console.log('invalid glyph', sglyph);
				continue;
			}

			const glyph = this.getGlyph(sglyph.rows, sglyph.columns);
			glyph.setData(sglyph.data);
		}
	}

}

export class CharCollection {

	public readonly updateEmitter = new EventEmitter<void>();

	private chars: Char[] = [];

	constructor(
		chars: Char[] = [],
	) {
		for (const char of chars) {
			this.add(char);
		}
	}

	public add(char: Char) {
		if (this.chars[char.code]) {
			throw new Error('Char already exists');
		}

		this.chars[char.code] = char;
		char.updateEmitter.add(() => {
			this.updateEmitter.trigger();
		});
	}

	public serialize(): string {
		let x = this.chars.map((char) => char.serialize());
		console.log(x);

		return JSON.stringify(x);
	}

	public deserialize(data: string) {
		let x = JSON.parse(data);

		x.forEach((charText: string, code: number) => {
			if (!this.chars[code]) {
				console.log('adding uknown char: ', code);
				this.add(new Char(code));
			}

			let char = this.chars[code];
			char.deserialize(charText);
		});
	}
}
