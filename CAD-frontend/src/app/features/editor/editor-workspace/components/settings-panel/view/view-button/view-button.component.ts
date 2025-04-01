import {Component, Input} from '@angular/core';
import {NgClass} from '@angular/common';
import {ICameraPosition} from '../../../../../../../core/interfaces/three-js/ICameraPosition.interface';
import {CameraEventService} from '../../../../../../../core/services/state/camera-event.service';
import {ViewButtonEventService} from '../../../../../../../core/services/state/view-button-event.service';

@Component({
    selector: 'app-view-button',
    imports: [
        NgClass
    ],
    templateUrl: './view-button.component.html',
    standalone: true,
    styleUrl: './view-button.component.scss'
})
export class ViewButtonComponent {

    currentViewButton: number = 5;

    @Input() buttonNumber!: number;
    @Input() buttonTitle!: string;
    @Input() cameraPosition!: ICameraPosition;

    constructor(private cameraEventService: CameraEventService,
                private viewButtonEventService: ViewButtonEventService) {
    }

    onButtonClick(buttonNumber: number): void {
        this.viewButtonEventService.viewButtonChanges(buttonNumber)
        this.cameraEventService.CameraChangePosition(this.cameraPosition)
    }

    public ngOnInit(): void {
        this.viewButtonEventService.viewButtonEvent$.subscribe(buttonNumber => {
            this.currentViewButton = buttonNumber;
        });
    }

}
