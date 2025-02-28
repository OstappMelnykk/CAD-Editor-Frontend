import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ProfileComponent} from '../profile/components/profile/profile.component';
import {authGuard} from '../../core/guards/auth.guard';
import {EditProfileComponent} from '../profile/components/edit-profile/edit-profile.component';
import {EditorWorkspaceComponent} from './components/editor-workspace/editor-workspace.component';
import {
  EditorAdvancedSettingsComponent
} from './components/editor-advanced-settings/editor-advanced-settings.component';

const routes: Routes = [
  {
    path: '',
    component: EditorWorkspaceComponent,
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    component: EditorAdvancedSettingsComponent,
    canActivate: [authGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EditorRoutingModule { }
