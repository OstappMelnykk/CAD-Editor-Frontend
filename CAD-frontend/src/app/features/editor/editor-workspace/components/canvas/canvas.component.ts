import {Component, OnInit} from '@angular/core';
import {GlobalVariablesService} from '../../../../../core/services/three-js/global-variables.service';
import {InitService} from '../../../../../core/services/three-js/init.service';
import {CanvasResizeService} from '../../../../../core/services/three-js/canvas-resize.service';

@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements OnInit  {


    private resizeListener!: () => void;

    constructor(private globalVariablesService: GlobalVariablesService,
                private initService: InitService,
                private canvasResizeService: CanvasResizeService) {}

    ngOnInit() {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement

        if (!canvas) {
            console.error("Canvas element not found!");
            return;
        }


        this.initService.init(canvas);


        window.addEventListener('resize', () => this.canvasResizeService.onCanvasResize());
        window.dispatchEvent(new Event('resize'));

    }

}
