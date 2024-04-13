import { ImportModal } from "./Import";
import { ASCII } from "./ascii"
import { Char, CharCollection } from "./font";
import { EditableGlyphTable, GlyphTable } from "./table";

const defaultSentences = [
	'My faxed joke won a pager in the cable TV quiz show.',
	'Sphinx of black quartz, judge my vow',
	'Jackdaws love my big sphinx of quartz',
	'Cozy lummox gives smart squid who asks for job pen',
	'How vexingly quick daft zebras jump!',
];

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

	const outputElm = document.createElement('div');
	outputElm.className = 'root-output';
	root.appendChild(outputElm);

	const chars = ASCII.map((_, index) => {
		return new Char(index);
	});

	const collection = new CharCollection(chars);

	let cancelable: ReturnType<typeof setTimeout>;
	collection.updateEmitter.add(() => {
		clearTimeout(cancelable);
		cancelable = setTimeout(() => {
			console.log('saving to local storage');
			localStorage.setItem(localStorageKey, collection.serialize());

			outputElm.innerHTML = '';
			for (const size of glphySizes) {
				const ta = document.createElement('textarea');
				ta.readOnly = true;
				ta.value = collection.exportHexBlob(size.rows, size.columns);

				ta.addEventListener('click', () => {
					ta.select();
					navigator.clipboard.writeText(ta.value);
				});

				outputElm.appendChild(ta);
			}
		}, 800);
	});

	for (const char of chars) {
		const charElement = document.createElement('div');
		charElement.className = 'char';
		charContainer.appendChild(charElement);

		const charName = document.createElement('div');
		charName.className = 'name';
		const dechex = (n: number) => n.toString(16).padStart(2, '0');
		charName.appendChild(document.createTextNode(`${dechex(char.code)}: ${char.getName()}`));
		charElement.appendChild(charName);

		const editorTables: GlyphTable[] = [];
		for (const size of glphySizes) {
			const editorGlyph = char.getGlyph(size.rows, size.columns);
			const editorTable = new EditableGlyphTable(editorGlyph);
			editorTables.push(editorTable);

			const previewTable = new GlyphTable(editorGlyph);
			charElement.appendChild(previewTable.getTable());
		}

		const select = () => {
			charElement.scrollIntoView({ behavior: 'smooth' });

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
		};

		charElement.addEventListener('click', select);

		document.addEventListener('keyup', (e) => {
			if (e.key === char.getName()) {
				select();
			}
		});
	}

	const saved = localStorage.getItem(localStorageKey);
	if (saved) {
		collection.deserialize(saved);
	}

	const clearButton = document.createElement('button');
	clearButton.appendChild(document.createTextNode('Reset Font'));
	clearButton.addEventListener('click', () => {
		if (confirm('Are you sure you want to completely reset the font?')) {
			collection.clear();
		}
	});

	header.appendChild(clearButton);

	const importButton = document.createElement('button');
	importButton.appendChild(document.createTextNode('Import'));
	const im = new ImportModal(collection);
	document.body.appendChild(im.getContainer());
	importButton.addEventListener('click', () => { im.show(); });

	header.appendChild(importButton);

	const previewElm = document.createElement('div');
	previewElm.className = 'root-preview';
	root.appendChild(previewElm);

	const previewText = document.createElement('input');
	previewElm.innerHTML = '<h2>Preview</h2>';
	previewText.value = defaultSentences[Math.floor(Math.random() * defaultSentences.length)];
	previewElm.appendChild(previewText);

	const previewContainer = document.createElement('div');
	previewContainer.className = 'preview-container';
	previewElm.appendChild(previewContainer);

	const renderPreview = () => {
		previewContainer.innerHTML = '';

		for (const size of glphySizes) {
			const previewOutput = document.createElement('div');
			previewOutput.className = `font-preview`;

			previewContainer.appendChild(previewOutput);

			previewText.value.split('').forEach((char) => {
				const c = collection.getChar(char);
				const g = c.getGlyph(size.rows, size.columns);

				const p = new GlyphTable(g);
				previewOutput.appendChild(p.getTable());

				// hack to add space between characters
				const space = document.createElement('div');
				space.className = 'glyph-table-container';
				space.innerHTML = '<table><tr><td></td></tr></table>';

				previewOutput.appendChild(space);

			});
		}
	};

	previewText.addEventListener('input', renderPreview);

	renderPreview();

});

