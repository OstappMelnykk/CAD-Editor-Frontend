import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditorWorkspaceRoutingModule } from './editor-workspace-routing.module';
import {CanvasComponent} from './components/canvas/canvas.component';


@NgModule({
  declarations: [CanvasComponent
  ],
  imports: [
    CommonModule,
    EditorWorkspaceRoutingModule,

  ]
})
export class EditorWorkspaceModule { }
