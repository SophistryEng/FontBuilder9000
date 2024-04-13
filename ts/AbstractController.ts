export interface ControllerInterface<T extends HTMLElement = HTMLElement> {
	// attach(elm: HTMLElement): void;
	getContainer(): HTMLElement;
}

export abstract class AbstractBaseController<T extends HTMLElement = HTMLElement> implements ControllerInterface<T> {

	protected container: T;

	constructor(
		private name: string,
		container: T|keyof HTMLElementTagNameMap = "div",
	) {
		if (typeof container === "string") {
			this.container = document.createElement(container) as T;
		} else {
			this.container = container;
		}

		this.container.classList.add(`${this.name}--controller`);
	}

	public getContainer() {
		return this.container;
	}

}
