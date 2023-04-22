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

	public exportHexBlob(): string {
		const steps = Math.floor(this.data.length / 8);

		let out = "";
		for (let s = 0; s < steps; s++) {
			let char = 0;
			for (let i = 0; i <= 7; i++) {
				char += this.data[i] ? 1 << i : 0;
			}

			let str = char.toString(16).toUpperCase();
			if (str.length === 0) {
				str = "00";
			} else if (str.length === 1) {
				str = "0" + str;
			}

			out += "0x" + str + ", ";
		}

		return "{" + out.replace(/, $/, "") + "}";
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
				console.log('adding uknown char: ', code);
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

	public clear() {
		for (const char of this.chars) {
			char.clear();
		}
	}
}
