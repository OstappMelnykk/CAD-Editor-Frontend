import {Component, inject} from '@angular/core';
import {NavigationEnd, RouterOutlet, Router} from '@angular/router';
import {NavbarComponent} from './shared/components/navbar/navbar.component';
import {WindowResizeService} from './core/services/ui/window-resize.service';
import {filter} from 'rxjs';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, NavbarComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {

    constructor(private windowResizeService: WindowResizeService) {}
}
