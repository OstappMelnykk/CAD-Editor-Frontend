import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditorWorkspaceRoutingModule } from './editor-workspace-routing.module';
import {CanvasComponent} from './components/canvas/canvas.component';


@NgModule({
  declarations: [],
  imports: [
      CommonModule,
      EditorWorkspaceRoutingModule,
      CanvasComponent,
  ]
})
export class EditorWorkspaceModule { }
