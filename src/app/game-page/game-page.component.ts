
import { Component } from '@angular/core';
import { DateService } from '../date.service';
declare let $: any;

@Component({
  selector: 'app-game-page',
  templateUrl: './game-page.component.html',
  styleUrls: ['./game-page.component.scss']
})
export class GamePageComponent {
  names: string[] = [];
  scorelist: any[] = [];
  newName: string = ''; // New name input
  activeName: string | null = null; // Highlighted name
  staticno:any=0;
  showbtn:any=false;
  truthlist:any=[];
  darelist:any=[];
  activettask:any="";
  resultmessage:any="";


  constructor(private dareserv:DateService) { }

  ngOnInit(): void {
    let cat:any = localStorage.getItem('catgory');
    let gender1:any = sessionStorage.getItem('gerder');
    let data:any = sessionStorage.getItem("name");
    this.names = JSON.parse(data);

    for(let element of this.names) {
      let obj:any ={
        name:element,
        score:0
      }
      this.scorelist.push(obj);
    }
    sessionStorage.setItem('score',JSON.stringify(this.scorelist));

    if(cat == 1){
      this.truthlist = this.dareserv.friendlytruthList;
      this.darelist = this.dareserv.friendlydareList;
    }else if (cat == 2){
      if(gender1 == 1){
        this.truthlist = this.dareserv.boystruthList;
        this.darelist = this.dareserv.boysdareList;
      }else{
        this.truthlist = this.dareserv.girlstruthList;
        this.darelist = this.dareserv.girlsdareList;
      }
    }else if (cat == 3){
      this.truthlist = this.dareserv.adultnormaltruthList;
      this.darelist = this.dareserv.adultnormaldareList;
    }else if (cat == 4){
      this.truthlist = this.dareserv.adultdeadtruthlist;
      this.darelist = this.dareserv.adultdeaddarelist;
    }else if (cat == 5){
      this.truthlist = this.dareserv.duocoupletruthlist;
      this.darelist = this.dareserv.duocoupledarelist;
    }else if (cat == 6){
      this.truthlist = this.dareserv.honeymoontruthlist;
      this.darelist = this.dareserv.honeymoondarelist;
    }

  }

  // Get rows for the grid
  getRows(): string[][] {
    const rows: string[][] = [];
    for (let i = 0; i < 9; i += 3) {
      rows.push(this.names.slice(i, i + 3));
    }
    return rows;
  }

  // Select a name manually
  selectName(name: string) {
    this.activeName = name;
  }

  // Highlight a random name

  spin() {
    if (this.names.length > 3) {
      const randomIndex = Math.floor(Math.random() * this.names.length);
      this.activeName = this.names[randomIndex];
    }else{
      this.activeName = this.names[this.staticno];
      this.staticno=this.staticno+1;
      if(this.staticno>this.names.length - 1){
        this.staticno=0;
      }
    }
    this.showbtn=true;
  }

  truthdata(){
    this.activettask="";
    if (this.truthlist.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.truthlist.length);
      this.activettask = this.truthlist[randomIndex];
    }
    $('#showcnct').show();
  }

  daredata(){
    this.activettask="";
    if (this.darelist.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.darelist.length);
      this.activettask = this.darelist[randomIndex];
    }
    $('#showcnct').show();
  }

  complete(no:any){
    $('#showcnct').hide();
    this.activettask = "";
    this.showbtn=false;

    let score:any = sessionStorage.getItem("score");
    this.scorelist = JSON.parse(score);
    for (let element of this.scorelist){
      if(element.name == this.activeName){
        if(no==1){
          element.score=element.score+no;
        }else{
          element.score=element.score-1;
        }
        break;
      }
    }
    sessionStorage.setItem('score',JSON.stringify(this.scorelist));
    this.activeName = "";
  }


  showresult(){
    $('#showresult').show();
    let score:any = sessionStorage.getItem("score");
    this.scorelist = JSON.parse(score);
    this.scorelist.sort((a:any, b:any) => a.score - b.score);
  }

  closemodal(){
    $('#showresult').hide();
    $('#showcnct').hide()
  }
}
