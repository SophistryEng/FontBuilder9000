import { ASCII } from "./ascii"
import { Char, CharCollection } from "./font";
import { EditableGlyphTable, GlyphTable } from "./table";

// const defaultSentence = 'My faxed joke won a pager in the cable TV quiz show.';

const localStorageKey = 'working-font';

const glphySizes: { columns: number, rows: number }[] = [
	{ columns: 5, rows: 8 },
	{ columns: 9, rows: 16 },
];

export const init = (async (root: HTMLElement) => {
	root.innerHTML = '';
	root.className = 'root';

	const header = document.createElement('header');
	header.innerHTML = '<h1>µChord FontBuilder 9000</h1>';
	header.className = 'root-header';

	root.appendChild(header);

	const editorContainer = document.createElement('div');
	editorContainer.className = 'root-editor';
	root.appendChild(editorContainer);

	const charContainer = document.createElement('div');
	charContainer.className = 'root-char';
	root.appendChild(charContainer);

	const chars = ASCII.map((_, index) => {
		return new Char(index);
	});

	let storage = new CharCollection(chars);
	
	let cancelable : ReturnType<typeof setTimeout>;
	storage.updateEmitter.add(() => {
		clearTimeout(cancelable);
		cancelable = setTimeout(() => {
			console.log('saving to local storage');
			localStorage.setItem(localStorageKey, storage.serialize());
		}, 800);
	});

	for (const char of chars) {
		const charElement = document.createElement('div');
		charElement.className = 'char';
		charContainer.appendChild(charElement);

		const charName = document.createElement('div');
		charName.className = 'name';
		charName.appendChild(document.createTextNode(char.getName()));
		charElement.appendChild(charName);

		const editorTables: GlyphTable[] = [];
		for (const size of glphySizes) {
			const editorGlyph = char.getGlyph(size.rows, size.columns);
			const editorTable = new EditableGlyphTable(editorGlyph);
			editorTables.push(editorTable);

			const previewTable = new GlyphTable(editorGlyph);
			charElement.appendChild(previewTable.getTable());
		}

		charElement.addEventListener('click', () => {
			charContainer.querySelectorAll('.selected').forEach((e) => {
				e.classList.remove('selected');
			});
			charElement.classList.add('selected');

			editorContainer.innerHTML = '';

			const h2 = document.createElement('h2')
			h2.appendChild(document.createTextNode(char.getName()));
			editorContainer.appendChild(h2);

			for (const table of editorTables) {
				editorContainer.appendChild(table.getTable());
			}
		});
	}

	const saved = localStorage.getItem(localStorageKey);
	if (saved) {
		storage.deserialize(saved);
	}

});

