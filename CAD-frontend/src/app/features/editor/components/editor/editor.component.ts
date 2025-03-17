import {Component} from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';

@Component({
    selector: 'app-editor',
    imports: [
        RouterOutlet,
    ],
    standalone: true,
    templateUrl: './editor.component.html',
    styleUrl: './editor.component.scss'
})
export class EditorComponent {

}
