import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {authGuard} from '../../core/guards/auth.guard';
import {EditProfileComponent} from './components/edit-profile/edit-profile.component';
import {ProfileComponent} from './components/profile/profile.component';

const routes: Routes = [
  {
    path: '',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'edit',
    component: EditProfileComponent,
    canActivate: [authGuard],
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }
