import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
    EditorAdvancedSettingsComponent
} from '../editor-advanced-settings/components/editor-advanced-settings/editor-advanced-settings.component';
import {EditorWorkspaceComponent} from './components/editor-workspace/editor-workspace.component';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EditorWorkspaceRoutingModule { }
