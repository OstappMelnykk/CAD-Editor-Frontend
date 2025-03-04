import {Component, inject, Input} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-view-button',
    imports: [
        NgClass
    ],
  templateUrl: './view-button.component.html',
  styleUrl: './view-button.component.scss'
})
export class ViewButtonComponent {
    @Input() buttonNumber!: number;
    @Input() buttonTitle!: string;
    //@Input() cameraPosition!: ICameraPosition;

    /*private viewSettingsStateService = inject(CurrentViewButton);
    private threejsStateService = inject(CameraPositionService);*/

    currentViewPositionButton: number = 5;


    onButtonClick(buttonNumber: number): void {
        /*this.viewSettingsStateService.setCurrentViewPositionButton(buttonNumber);
        this.threejsStateService.updateCameraPosition(this.cameraPosition)*/
    }

    public ngOnInit(): void {
        /*this.viewSettingsStateService.currentViewButton$.subscribe(buttonNumber => {
            this.currentViewPositionButton = buttonNumber;
        });*/
    }

}
