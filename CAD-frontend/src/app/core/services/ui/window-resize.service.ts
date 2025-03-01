import {Injectable, OnDestroy} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class WindowResizeService  implements OnDestroy {

    screenWidth!: number;
    screenHeight!: number;
    windowWidth!: number;
    windowHeight!: number;

    sizeReferenceWidth!: number;
    sizeReferenceHeight!: number;

    col1!: number;
    col2!: number;
    col3!: number;
    row1!: number;
    row2!: number;
    row3!: number;

    isSettingsPanelHidden: boolean = false;

    private resizeListener!: () => void;

    constructor() {
        this.onResize();

        this.resizeListener = () => this.onResize();
        window.addEventListener('resize', this.resizeListener);
    }

    onResize(): void {

        this.screenWidth = window.screen.width;
        this.screenHeight = window.screen.height;
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
        this.sizeReferenceWidth = Math.max(this.screenWidth, this.windowWidth);
        this.sizeReferenceHeight = Math.max(this.screenHeight, this.windowHeight);

        this.col1 = this.sizeReferenceWidth * 0.03;
        this.col2 = this.sizeReferenceWidth * 0.17;
        this.col3 = this.windowWidth - (this.col1 + this.col2);

        this.row1 = this.sizeReferenceHeight * 0.05;
        this.row3 = this.sizeReferenceHeight * 0.03;
        this.row2 = this.windowHeight - (this.row1 + this.row3)

        document.documentElement.style.setProperty('--col1-const', `${this.col1}px`);
        document.documentElement.style.setProperty('--col2-const', `${this.col2}px`);
        document.documentElement.style.setProperty('--col3-const', `${this.col3}px`);

        document.documentElement.style.setProperty('--row1-const', `${this.row1}px`);
        document.documentElement.style.setProperty('--row2-const', `${this.row2}px`);
        document.documentElement.style.setProperty('--row3-const', `${this.row3}px`);


        if (!this.isSettingsPanelHidden) {
            if (this.windowWidth <= this.col1 + this.col2 + this.col2) {
                const fr = (this.windowWidth - this.col1) / 2
                this.col2 = fr
                this.col3 = fr
                console.log("1 case")
            }
        } else {
            const fr = this.windowWidth - this.col1
            this.col2 = 0
            this.col3 = fr
        }

        document.documentElement.style.setProperty('--col1', `${this.col1}px`);
        document.documentElement.style.setProperty('--col2', `${this.col2}px`);
        document.documentElement.style.setProperty('--col3', `${this.col3}px`);

        document.documentElement.style.setProperty('--row1', `${this.row1}px`);
        document.documentElement.style.setProperty('--row2', `${this.row2}px`);
        document.documentElement.style.setProperty('--row3', `${this.row3}px`);
    }

    ngOnDestroy(): void {
        window.removeEventListener('resize', this.resizeListener);
    }
}

