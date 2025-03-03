import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
    EditorAdvancedSettingsComponent
} from './components/editor-advanced-settings/editor-advanced-settings.component';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EditorAdvancedSettingsRoutingModule { }
