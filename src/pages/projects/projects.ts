import { Component } from '@angular/core';
import { ProjectPage } from '../project/project';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import common from '../../common';
import { Project, State } from '../../types';
import Q from 'q';
import $ from 'jquery';
import ta from 'time-ago';

interface Cache {
  projects: any[];
};

@IonicPage()
@Component({
  selector: 'page-projects',
  templateUrl: 'projects.html',
})
export class ProjectsPage {
  projects: any[];
  cache:Cache = {projects: undefined};
  state:State = common.state; // TODO authentication should be handled in form of a middleware
  projectStructure:Project = common.getProjectStructure();

  // TODO use native cordova http module for fetching
  constructor(public navCtrl: NavController, public navParams: NavParams, public alertCtrl: AlertController) {
    this.projects = [];
    this.projects.push(this.projectStructure);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProjectsPage');
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter ProjectsPage');
    if (!this.cache.projects) this.loadUserProjects();
  }

  itemSelected(project) {
    this.navCtrl.push(ProjectPage, {project});
  }

  generateFakeProject() {
    let projects = [];
    let deferred = Q.defer();
    setTimeout(() => {
      for(let i=0; i<10; i++){
        let proj = <Project> Object.assign({}, this.projectStructure);
        proj.name = proj.name + i
        projects.push(proj);
      }
      this.projects = projects;
      deferred.resolve(projects);
    }, 3000)
    return deferred.promise;
  }

  loadProjects() {
    // TODO display loading
    return $.ajax({
      url: 'https://jsonplaceholder.typicode.com/posts'
    })
      .then(resp => {
        return resp.data;
      })
      .catch(e => {
        let alert = this.alertCtrl.create({
          title:'Loading Failed', 
          subTitle:'Please retry.',
          buttons:['OK']
        });
        alert.present();
      })
  }

  // loads the projects from cache or request the server for projects
  loadUserProjects() {
    console.log('loading projects');
    if (this.cache.projects) {
      console.log('loading projects from cache');
      this.projects = [...this.cache.projects];
      return;
    }
    let url = common.SERVER_ADDRESS + '/api/getProjectList?format=json';
    $.ajax({
      url, 
      method: 'GET',
      xhrFields: {
          withCredentials: true
      },
      crossDomain: true
    })
      .then(resp => {
        console.log('received user projects', resp);
        this.state.loggedIn = true;
        let projects = resp.map(proj => {
          return {
            name: proj.ProjectName,
            description: proj.Notes,
            thumbnail: proj.Thumbnail,
            updatedAt: new Date(proj.Updated),
            updatedAtRelative: ta().ago(new Date(proj.Updated))
          };
        });
        this.cache.projects = projects;  
        this.projects = [...projects];
      })
      .catch(console.error);
  }

  filterItems(ev: any) {
    this.loadUserProjects();
    let val = ev.target.value;
    if (val && val.trim() !== '') {
      this.projects = this.projects.filter(project => {
        return project.name.toLowerCase().includes(val.toLowerCase());
      });
    }
  }

}
