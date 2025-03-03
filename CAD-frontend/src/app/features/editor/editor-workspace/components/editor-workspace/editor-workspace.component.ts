import { Component } from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {WindowResizeService} from '../../../../../core/services/ui/window-resize.service';
import {CanvasComponent} from '../canvas/canvas.component';
import {NgClass, NgStyle} from '@angular/common';

@Component({
  selector: 'app-editor-workspace',
    imports: [
        RouterOutlet,
        CanvasComponent,
        NgClass,
        NgStyle,
        RouterLink,
    ],
  templateUrl: './editor-workspace.component.html',
  styleUrl: './editor-workspace.component.scss'
})
export class EditorWorkspaceComponent {
    isSettingsPanelHidden: boolean = false;

    currentMenuIcon: number = 1;
    settingsPath: string = '../../../../../../../assets/icons/settings/Settings.png';

    constructor(private windowResizeService: WindowResizeService) {
        this.isSettingsPanelHidden = this.windowResizeService.isSettingsPanelHidden;
    }

    buttons = [
        { id: 1, title: 'Division', backgroundImg: '../../../../../../../assets/icons/division-feature/CubeDivision.png' },
        { id: 2, title: 'Design', backgroundImg: '../../../../../../../assets/icons/design/Brush.png' },
        { id: 3, title: 'View', backgroundImg: '../../../../../../../assets/icons/view/View.png' },
        //{ id: 4, title: 'Settings', backgroundImg: '.' },
    ];


    onIconButtonClick(id: number) {
        if (this.currentMenuIcon === id)
            this.toggleSettingsPanel();
        else {
            if (this.isSettingsPanelHidden)
                this.toggleSettingsPanel();

            this.currentMenuIcon = id; // Вибираємо нову кнопку
        }
    }


    private toggleSettingsPanel(): void {
        this.isSettingsPanelHidden = !this.isSettingsPanelHidden;
        this.windowResizeService.isSettingsPanelHidden = this.isSettingsPanelHidden;
        window.dispatchEvent(new Event('resize'));
    }

}
