import { Component } from '@angular/core';
import {WindowResizeService} from '../../../../core/services/ui/window-resize.service';

@Component({
  selector: 'app-editor-workspace',
    imports: [],
  templateUrl: './editor-workspace.component.html',
  styleUrl: './editor-workspace.component.scss'
})
export class EditorWorkspaceComponent {

    isSettingsPanelHidden: boolean = false;

    constructor(private windowResizeService: WindowResizeService) {
        this.isSettingsPanelHidden = this.windowResizeService.isSettingsPanelHidden;
    }

    buttons = [
        { id: 1, title: 'Division', backgroundImg: '.' },
        { id: 2, title: 'Design', backgroundImg: '.' },
        { id: 3, title: 'View', backgroundImg: '.' },
        { id: 4, title: 'Settings', backgroundImg: '.' },
    ];
}
