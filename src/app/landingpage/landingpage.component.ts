import { Component } from "@angular/core";
import { Router } from "@angular/router";

declare let $:any;

@Component({
  selector: 'app-landingpage',
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.scss']
})
export class LandingpageComponent {
  nameList:any=[];
  message:any;
  show1st:any=true;
  cat:any;
  showgender:any=false;

  constructor(private route : Router) { }

  ngOnInit(): void {
    sessionStorage.clear();
    this.cat = localStorage.getItem('catgory');
  }


  addname(){
    if(this.nameList.length > 8){
      this.message = "Maximum 8 people Allowed !"
      $('#name').val('');
      return ;
    }

    let name= $('#name').val();
    let stat=true;
    for(let element of this.nameList){
      if(element == name){
        stat=false;
        $('#name').val('');
      }
    }
    if(stat){
      this.nameList.push(name);
      $('#name').val('');
    }

    if(this.cat == 5 || this.cat == 6){
      if(this.nameList.length == 2){
       this.next();
      }
    }
  }

  removename(item:any){
    for(let element of this.nameList){
      if(element == item){
        let index = this.nameList.indexOf(element);
          if (index !== -1) {
            this.nameList.splice(index, 1);
          }
      }
    }
  }

  catgory(no:any){
    localStorage.setItem('catgory',no);
    this.show1st=false;
    if(no == 5 || no == 6){
      this.showgender=true;
    }else{
      this.showgender=false;
    }
  }

  privious(){
    localStorage.removeItem('catgory');
    this.show1st=true;
    this.nameList=[];
  }

  next(){
    sessionStorage.setItem('name',JSON.stringify(this.nameList));
    this.route.navigate(['/gamepage'])
  }

  next1(){

  }
}
