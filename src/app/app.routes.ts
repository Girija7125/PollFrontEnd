import { Routes } from '@angular/router';
import { Auth } from './auth/auth';
import { Poll } from './poll/poll';
import { Voting } from './voting/voting';
import { Admin } from './admin/admin';


export const routes: Routes = [
    { path: '',             redirectTo: '/login',  pathMatch: 'full' },
    { path: 'login',        component: Auth },
    { path: 'admin', component: Admin },
    { path:'polls',          component:Poll},
    {path:'vote',            component:Voting},
    {path: 'vote/:id',       component:Voting}
];
