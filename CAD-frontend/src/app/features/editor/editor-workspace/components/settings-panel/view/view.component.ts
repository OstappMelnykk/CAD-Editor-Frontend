import {Component} from '@angular/core';
import {ViewButtonComponent} from './view-button/view-button.component';

@Component({
    selector: 'app-view',
    standalone: true,

    imports: [
        ViewButtonComponent
    ],
    templateUrl: './view.component.html',
    styleUrl: './view.component.scss'
})
export class ViewComponent {
    title: string = 'View';

    viewButtons = [
        { number: 1, title: 'Positive X axis', cameraPosition: {x: 10, y: 0, z: 0}},
        { number: 2, title: 'Negative X axis', cameraPosition: {x: -10, y: 0, z: 0}},
        { number: 3, title: 'Positive Y axis', cameraPosition: {x: 0, y: 10, z: 0}},
        { number: 4, title: 'Negative Y axis', cameraPosition: {x: 0, y: -10, z: 0}},
        { number: 5, title: 'Positive Z axis', cameraPosition: {x: 0, y: 0, z: 10}},
        { number: 6, title: 'Negative Z axis', cameraPosition: {x: 0, y: 0, z: -10}},
    ];
}
