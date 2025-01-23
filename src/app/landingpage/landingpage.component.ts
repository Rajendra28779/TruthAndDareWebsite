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
  genderval:any=0;

  constructor(private readonly route : Router) { }

  ngOnInit(): void {
    sessionStorage.clear();
    this.cat = localStorage.getItem('catgory');
  }


  addname(){
    if(this.nameList.length > 8){
      this.message = "Maximum 9 people Allowed !"
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
    this.cat=no;
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
    if(this.cat==2 && (this.genderval == 0 || this.genderval == undefined)){
      this.message = "Please Specify Gender."
      return;
    }
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('gerder');
    let nameobjlist:any=[];

    for (let element of this.nameList){
      let obj:any ={
        name:element,
        gender:''
      }
      nameobjlist.push(obj);
    }
    sessionStorage.setItem('name',JSON.stringify(nameobjlist));
    sessionStorage.setItem('gerder',this.genderval);
    this.route.navigate(['/gamepage'])
  }

  next1(){
    sessionStorage.removeItem('name');

    let boyname = $('#malename').val();
    let girlname = $('#femalename').val();

    if(boyname == null || boyname == undefined || boyname == ""){
      $('#malename').focus();
      this.message = "Please enter Name ."
      return;
    }
    if(girlname == null || girlname == undefined || girlname == ""){
      $('#femalename').focus();
      this.message = "Please enter Name ."
      return;
    }

    let obj:any ={
      name:boyname,
      gender:'male'
    }

    let obj1:any ={
      name:girlname,
      gender:'female'
    }

    let duolist:any=[];
    duolist.push(obj);
    duolist.push(obj1);

    sessionStorage.setItem('name',JSON.stringify(duolist));
    this.route.navigate(['/gamepage'])
  }

  gend(no:any){
    this.genderval=no;
  }
}
