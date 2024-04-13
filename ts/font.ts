import { ASCII } from "./ascii";
import { EventEmitter } from "./EventEmitter";

export class Glyph {

	public readonly updateEmitter = new EventEmitter<void>();

	private data: boolean[] = [];

	constructor(
		public readonly rows: number,
		public readonly columns: number,
		data: boolean[] = new Array(rows * columns).fill(false),
	) {
		this.setData(data);
	}

	public getData(): boolean[] {
		return this.data;
	}

	public setData(data: boolean[]) {
		if (this.rows * this.columns !== data.length) {
			throw new Error('Invalid data length');
		}

		this.data = data;
		this.updateEmitter.trigger();
	}

	public setPixel(row: number, column: number, value: boolean) {
		this.data[row * this.columns + column] = value;
		this.updateEmitter.trigger();
	}

	private exportHexBlob5x8(): string {
		let out = "";
		for (let c = 0; c < 5; c++) {
			let char1 = 0;
			for (let r = 0; r < 8; r++) {
				if (this.data[r * this.columns + c]) {
					char1 += 1 << r;
				}
			}

			out += "0x" + char1.toString(16).padStart(2, "0") + ", ";
		}

		return out;
	}

	private importHexBlob5x8(data: string) {
		let myregexp = /0x([0-9a-f]{2})/ig;
		let match = myregexp.exec(data);
		let i = 0;
		while (match != null) {
			const value = parseInt(match[1], 16);
			for (let r = 0; r < 8; r++) {
				this.data[r * this.columns + i] = !!(value & (1 << r));
			}
			i++;
			match = myregexp.exec(data);
		}

		this.updateEmitter.trigger();
	}

	private exportHexBlob9x16(): string {
		let out = "";
		for (let c = 0; c < 9; c++) {
			let char1 = 0;
			for (let r = 0; r < 8; r++) {
				if (this.data[r * this.columns + c]) {
					char1 += 1 << r;
				}
			}

			out += "0x" + char1.toString(16).padStart(2, "0") + ", ";
		}

		for (let c = 0; c < 9; c++) {
			let char1 = 0;
			for (let r = 8; r < 16; r++) {
				if (this.data[r * this.columns + c]) {
					char1 += 1 << (r - 8);
				}
			}

			out += "0x" + char1.toString(16).padStart(2, "0") + ", ";
		}

		return out;
	}

	private importHexBlob9x16(data: string) {
		let myregexp = /0x([0-9a-f]{2})/ig;
		let match = myregexp.exec(data);
		let i = 0;

		// First set of 9 bytes for the first 8 rows
		while (match != null && i < 9) {
			const value = parseInt(match[1], 16);
			for (let r = 0; r < 8; r++) {
				this.data[r * this.columns + i] = !!(value & (1 << r));
			}
			i++;
			match = myregexp.exec(data);
		}

		// Start the second set of 9 bytes for the second 8 rows from the current position
		i = 0; // reset i for the second block of data
		while (match != null && i < 9) {
			const value = parseInt(match[1], 16);
			for (let r = 8; r < 16; r++) {
				this.data[r * this.columns + i] = !!(value & (1 << (r - 8)));
			}
			i++;
			match = myregexp.exec(data);
		}

		this.updateEmitter.trigger();
	}

	public exportHexBlob(): string {
		let out = "";
		switch (this.columns) {
			// this is a hack - it works for now
			case 5:
				out = this.exportHexBlob5x8();
				break;
			case 9:
				out = this.exportHexBlob9x16();
				break;
			default:
				throw new Error('Invalid glyph size');
		}

		return "{" + out.replace(/, $/, "") + "}";
	}

	public importHexBlob(data: string) {
		switch (this.columns) {
			// this is a hack - it works for now
			case 5:
				this.importHexBlob5x8(data);
				break;
			case 9:
				this.importHexBlob9x16(data);
				break;
			default:
				throw new Error('Invalid glyph size');
		}
	}

	public clear() {
		this.setData(new Array(this.rows * this.columns).fill(false));
	}
}


interface SerializedGlyph {
	data: boolean[];
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

		const newGlyph = new Glyph(rows, columns);
		this.addGlyph(newGlyph);

		return newGlyph;
	}

	public addGlyph(glyph: Glyph) {
		this.glyphs.push(glyph);
		glyph.updateEmitter.add(() => {
			this.updateEmitter.trigger();
		});
	}

	public serialize(): string {
		const x = this.glyphs.map<SerializedGlyph>((glyph) => {
			return {
				data: glyph.getData(),
				rows: glyph.rows,
				columns: glyph.columns
			};
		});

		return JSON.stringify(x);
	}

	public deserialize(data: string) {
		const x = JSON.parse(data);

		for (const sglyph of x) {
			if (!isSerializedGlyph(sglyph)) {
				console.log('invalid glyph', sglyph);
				continue;
			}

			const glyph = this.getGlyph(sglyph.rows, sglyph.columns);
			glyph.setData(sglyph.data);
		}
	}

	public clear() {
		for (const glyph of this.glyphs) {
			glyph.clear();
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

	public getChar(char: string): Char {
		const code = char.charCodeAt(0);
		if (!this.chars[code]) {
			throw new Error('Char not found');
		}

		return this.chars[code];
	}

	public serialize(): string {
		const x = this.chars.map((char) => char.serialize());

		return JSON.stringify(x);
	}

	public deserialize(data: string) {
		const x = JSON.parse(data);

		x.forEach((charText: string, code: number) => {
			if (!this.chars[code]) {
				console.log('adding unknown char: ', code);
				this.add(new Char(code));
			}

			const char = this.chars[code];
			char.deserialize(charText);
		});
	}

	public exportHexBlob(rows: number, columns: number): string {
		let output = "";
		for (const char of this.chars) {
			output += char.getGlyph(rows, columns).exportHexBlob() + ",\n";
		}

		return output.replace(/,\n$/, "");
	}

	public importHexBlob(data: string) {
		const myregexp = /{([^}]+)}/ig;
		let match = myregexp.exec(data);
		let i = 0;
		while (match != null) {
			const value = match[1];

			const size = value.split(',').length;
			// todo: this is gross
			if (size === 18) {
				console.log('importing 9x16');
				this.chars[i].getGlyph(16, 9).importHexBlob(value);
			} else if (size === 5) {
				console.log('importing 5x8');
				this.chars[i].getGlyph(8, 5).importHexBlob(value);
			} else {
				throw new Error('Invalid glyph size ' + size);
			}
			i++;
			match = myregexp.exec(data);
		}
	}

	public clear() {
		for (const char of this.chars) {
			char.clear();
		}
	}
}
