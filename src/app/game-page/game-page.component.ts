
import { Component } from '@angular/core';
import { DateService } from '../date.service';
declare let $: any;

@Component({
  selector: 'app-game-page',
  templateUrl: './game-page.component.html',
  styleUrls: ['./game-page.component.scss']
})
export class GamePageComponent {
  names: any[] = [];
  scorelist: any[] = [];
  newName: any = ''; // New name input
  activeName: any=""; // Highlighted name
  staticno:any=0;
  showbtn:any=false;
  truthlist:any=[];
  darelist:any=[];
  activettask:any="";
  resultmessage:any="";
  cat:any=1;


  constructor(private readonly dareserv:DateService) { }

  ngOnInit(): void {
    let cat:any = localStorage.getItem('catgory');
    this.cat=cat;
    let gender1:any = sessionStorage.getItem('gerder');
    let data:any=sessionStorage.getItem("name");
      this.names = JSON.parse(data);
      for(let element of this.names) {
        let obj:any ={
          name:element.name,
          gender:element.gender,
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
      this.darelist = this.dareserv.honeymoondarelist1;
    }


    $('rotateimage').hide();

  }

  // Get rows for the grid
  getRows(): any[][] {
    const rows: any[][] = [];
    for (let i = 0; i < 9; i += 3) {
      rows.push(this.names.slice(i, i + 3));
    }
    return rows;
  }

  // Select a name manually
  selectName(name: any) {
    this.activeName = name;
  }

  handleButtonClick() {
  this.activettask="";
    const image = document.getElementById("overlay") as HTMLImageElement;
    const audio = document.getElementById("buttonSound") as HTMLAudioElement;

  // Play the sound effect
  audio.currentTime = 2; // Reset the audio to the beginning
  audio.play();

  // Show the rotating image
  image.style.display = "block";

  // Stop the image rotation and hide it after 3 seconds
    setTimeout(() => {
      image.style.display = "none"; // Hide the image
      audio.pause(); // Stop the audio
      audio.currentTime = 0; // Reset the audio
      this.spin(); // Call your custom method
    }, 1000);
  }

  spincount:any =0;
  spin() {
    if (this.cat == 6){
      this.spincount = this.spincount+1;
      if(this.spincount == 21){
        this.darelist = this.dareserv.honeymoondarelist3;
      }
      if(this.spincount == 10){
        this.darelist = this.dareserv.honeymoondarelist2;
      }
    }

    if (this.names.length > 3) {
      const randomIndex = Math.floor(Math.random() * this.names.length);
      this.activeName = this.names[randomIndex].name;
    }else{
      this.activeName = this.names[this.staticno].name;
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
    this.scorelist.sort((a:any, b:any) => b.score - a.score);
  }

  closemodal(){
    $('#showresult').hide();
    $('#showcnct').hide()
  }
}
