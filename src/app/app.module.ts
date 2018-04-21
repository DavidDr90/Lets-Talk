import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { PhrasesPage } from '../pages/phrases/phrases';
import { PhraseComponent } from '../components/phrase/phrase';
import { PhrasesProvider } from '../providers/phrases/phrases';


@NgModule({
  declarations: [
    MyApp,
    HomePage,
    PhrasesPage,
    PhraseComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    PhrasesProvider
  ]
})
export class AppModule {}
