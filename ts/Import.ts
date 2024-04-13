import { AbstractBaseController } from "./AbstractController";
import { CharCollection } from "./font";

export class ImportModal extends AbstractBaseController<HTMLDialogElement> {

	private input = document.createElement("textarea");

	private importButton = (() => {
		let elm = document.createElement("button");
		elm.textContent = "Import";

		return elm;
	})();

	private hideButton = (() => {
		let elm = document.createElement("button");
		elm.textContent = "Close";

		return elm;
	})();

	constructor(
		charCollection: CharCollection,
	) {
		super('import-modal', document.createElement('dialog'));

		this.container.append(
			this.hideButton,
			this.input,
			this.importButton,
		);

		this.hideButton.addEventListener("click", () => {
			this.container.close();
		});

		this.importButton.addEventListener("click", () => {
			let subject = this.input.value;
			subject = subject.replace(/\s*\/\/.*/g, "");
			charCollection.importHexBlob(subject);
			
			this.container.close();
		});
	}

	public show() {
		this.container.showModal();
	}
}