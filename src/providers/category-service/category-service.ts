import { Injectable } from '@angular/core';
import { Category } from '../../models/Category';
import { FirebaseProvider } from '../firebase/firebase';
import { ErrorProvider } from '../error/error';
import { AutenticationProvider } from '../autentication/autentication';
import { LoadingController, Spinner } from 'ionic-angular';
import { PhrasesProvider } from '../phrases/phrases';
import { FavoriteProvider } from '../favorite/favorite';
import { HomePage } from '../../pages/home/home';


@Injectable()
export class CategoryServiceProvider {

  public categories = [];
  private allUserPhrases = [];
  //categories that have parent category, and shown only at theirs parentCategory's page (next the phrases)
  private subCategories = [];

  //import categories collection from db and initialize categories attr.
  constructor(
    public firebaseProvider: FirebaseProvider,
    public error: ErrorProvider,
    public authentication: AutenticationProvider,
    public loadingCtrl: LoadingController,
    public phrasesProvider: PhrasesProvider
  ) {

    if (authentication.afAuth.auth.currentUser)
      this.updateCategoriesArray();

  }


  /**
   * updating the categories and favorites local arrays and refreshing the page, the method return a Promise object"
   * for catching error use "promise.then().catch(e){...handling error...}"
   * @returns Promise object
   */
  public updateCategoriesArray(): Promise<Category[]> {
    this.firebaseProvider.importCategories();
    return new Promise((resolve, reject) => {
      this.firebaseProvider.getCategoriesObservable.subscribe(a => {
        this.categories = a;
        this.categories.forEach(element1 => {//initilize all user's phrases local array
          let promise = this.phrasesProvider.getPhrases(element1);
          promise.then((data) => {
            data.forEach(element2 => {
              if (!this.allUserPhrases.some(phrase => phrase.id == element2.id))
                this.allUserPhrases.push(element2);
            });
          })
        })
        this.categories = a.filter(cat => cat.parentCategoryID == "");
        resolve(this.subCategories = a.filter(cat => cat.parentCategoryID != ""))
      })
    })
  }

  /**
   * get sub-category of specific category by its name, the method return a Promise object.
   * for catching error use "promise.then().catch(e){...handling error...}"
   * @param parentCategory parent category id of the wanted sub-category
   * @param name name of the wanted sub-category
   * @returns Promise object
   */
  public getSubCategoryByName(parentCategoryID: string, name: string): Promise<Category> {
    return new Promise((resolve, reject) => {
      let temp = this.subCategories.filter(cat => cat.parentCategoryID == parentCategoryID);
      let temp1 = temp.find(cat => cat.name == name);
      if (temp1 == undefined)
        reject(undefined)
      resolve(temp1);
    })
  }

  /**
   * get sub-categories array of specific category, the method return a Promise object.
   * for catching error use "promise.then().catch(e){...handling error...}"
   * @param parentCategory parent category id of the wanted sub-categories array
   * @returns Promise object
   */
  public getSubCategoriesOfParent(parentCategoryID: string): Promise<Category[]> {
    return new Promise((resolve, reject) => {
      let temp = this.subCategories.filter(cat => cat.parentCategoryID == parentCategoryID);
      resolve(temp);
    })
  }

  /**
   * Rearrange all categories, and sub-categories by new order.
   * usually used after adding or removing of category. 
   */
  public arrangeCategoriesByOrder() {
    for (var i = 0; i < this.categories.length; i++) {
      this.setOrder(this.categories[i], i);
    }

    for (var i = 0; i < this.subCategories.length; i++) {
      this.setOrder(this.subCategories[i], i);
    }
  }

  //GETTERS
  public get getCategories() {
    return this.categories;
  }

  public get getSubCategories() {
    return this.subCategories;
  }

  public get getAllUserPhrases() {
    return this.allUserPhrases;
  }


  /**
   * for handling the promise returned, use "promise.then((data) =>{'data' hold the wanted category...})"
   * for catching error use "promise.then().catch(e){...handling error...}"
   * @param n name of category
   * @returns Promise object
   */
  public getCategoryByName(n: string): Promise<Category> {
    return new Promise((resolve, reject) => {
      try {
        let temp = this.categories.find(cat => cat.name == n);
        if (temp == undefined)
          reject("category undefined");
        else
          resolve(temp);
      }
      catch (e) {
        this.error.simpleToast("The wanted category doesn't exist")
      }
    })
  }

  /**
   * for handling the promise returned, use "promise.then((data) =>{'data' hold the wanted category...})"
   * for catching error use "promise.then().catch(e){...handling error...}"
   * @param n id of category, id that given by firebase
   * @returns Promise object
   */
  public getCategoryById(id: string): Promise<Category> {
    return new Promise((resolve, reject) => {
      try {
        let temp = this.categories.find(cat => cat.id === id)
        resolve(temp)
      }
      catch (e) {
        this.error.simpleToast("The wanted category doesn't exist")
      }
    })
  }

  public addCategory(category: Category, callFromAppBuilder = false): Promise<void> {
    let promise = this.firebaseProvider.addCategory(category);
    if (callFromAppBuilder == false) {
      this.updateCategoriesArray().then(res => {
        // this.arrangeCategoriesByOrder();
      }).catch((err) =>{
        console.log(err);
      })
    }
    return promise;
  }

  /**
   * remove category from db, but before that, the method remove:
   * 1. sub-categories's phrases
   * 2. sub-categories.
   * 3. the category's phrases 
   * the method know to handle if the wanted remove category is sub-category.
   * also update favorites
   * @param category category to remove.
   */
  public removeCategory(category: Category): Promise<any> {
    return new Promise((resolve, reject) => {
      let favoriteProvider = new FavoriteProvider(HomePage.favClass)
      let promise = this.phrasesProvider.getPhrases(category);
      promise.then((data) => {
        let phrases = data;
        if (category.parentCategoryID == "") {//if the wanted remove category isn't a sub-category.
          let subCategories = this.subCategories.filter(cat => cat.parentCategoryID == category.id);
          subCategories.forEach(element => {
            favoriteProvider.remove_fav_cat(element);
            favoriteProvider.remove_from_commom_cat(element);
            let promise2 = this.phrasesProvider.getPhrases(element);//remove the sub-categories's phrases
            promise2.then((data) => {
              let phrases2 = data;
              phrases2.forEach(element => {
                this.firebaseProvider.removePhrase(element);
                favoriteProvider.remove_fav_phrases(element)
                favoriteProvider.remove_from_commom_phrases(element)
              })
            });
            this.firebaseProvider.removeCategory(element);
          })
        }
        favoriteProvider.remove_fav_cat(category);
        favoriteProvider.remove_from_commom_cat(category);

        phrases.forEach(element => {
          this.firebaseProvider.removePhrase(element);
          favoriteProvider.remove_fav_phrases(element)
          favoriteProvider.remove_from_commom_phrases(element)
        });

        this.firebaseProvider.removeCategory(category);
        let promise = this.updateCategoriesArray();
        promise.then(() => {
          // this.arrangeCategoriesByOrder();//TODO: Check if needed here, it update all the items in the DB
          resolve(true);
        })
      })
    })
  }

  //SETTERS
  public setName(category: Category, newName: string) {
    category.name = newName;
    this.firebaseProvider.updateCategory(category)
  }
  public setUrl(category: Category, newURL: string) {
    category.imageURL = newURL;
    this.firebaseProvider.updateCategory(category)
  }
  public setParentCategoryID(category: Category, newCategoryParent: string) {
    category.parentCategoryID = newCategoryParent;
    this.firebaseProvider.updateCategory(category)
  }
  public setIsFav(category: Category, isFav: boolean) {
    category.isFav = isFav;
    this.firebaseProvider.updateCategory(category)
  }
  //each time a category is chosen, its views increase by 1.
  public increaseViews(category: Category) {
    category.views++;
    this.firebaseProvider.updateCategory(category)
  }

  public updateCategory(category: Category) {
    this.firebaseProvider.updateCategory(category);
  }

  public setOrder(category: Category, order: number) {
    category.order = order;
    this.firebaseProvider.updateCategory(category);
  }

  public changeVisibility(category: Category) {
    category.visibility = !category.visibility;
    this.firebaseProvider.updateCategory(category);
  }

}