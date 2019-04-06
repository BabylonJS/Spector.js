export class ScrollIntoViewHelper {
    public static scrollIntoView(element: HTMLElement): void {
        const elementRect = element.getBoundingClientRect();

        let parentElement = element.parentElement;
        while (parentElement) {
            if (parentElement.clientHeight !== parentElement.offsetHeight) {
                break;
            }
            parentElement = parentElement.parentElement;
        }

        if (!parentElement) {
            return;
        }

        const parentRect = parentElement.getBoundingClientRect();
        if (elementRect.top < parentRect.top) {
            element.scrollIntoView(true);
        }
        else if (elementRect.bottom > parentRect.bottom) {
            element.scrollIntoView(false);
        }
    }
}
