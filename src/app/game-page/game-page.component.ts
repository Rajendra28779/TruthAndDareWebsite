
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
  /** Honeymoon (cat 6): 1 = light, 2 = romantic, 3 = dirty */
  honeymoonMode: 1 | 2 | 3 = 1;


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
      const savedMode = sessionStorage.getItem('honeymoonDareMode');
      if (savedMode === '2' || savedMode === '3') {
        this.honeymoonMode = parseInt(savedMode, 10) as 1 | 2 | 3;
      } else {
        this.honeymoonMode = 1;
      }
      this.applyHoneymoonDareList();
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

  spin() {
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

  get isHoneymoonCategory(): boolean {
    return this.cat == 6 || this.cat === '6';
  }

  get honeymoonModeLabel(): string {
    if (this.honeymoonMode === 1) {
      return 'Light';
    }
    if (this.honeymoonMode === 2) {
      return 'Romantic';
    }
    return 'Dirty';
  }

  applyHoneymoonDareList(): void {
    if (!this.isHoneymoonCategory) {
      return;
    }
    if (this.honeymoonMode === 1) {
      this.darelist = [...this.dareserv.honeymoondarelist1];
    } else if (this.honeymoonMode === 2) {
      this.darelist = [...this.dareserv.honeymoondarelist2];
    } else {
      this.darelist = [...this.dareserv.honeymoondarelist3];
    }
  }

  setHoneymoonMode(mode: 1 | 2 | 3): void {
    this.honeymoonMode = mode;
    sessionStorage.setItem('honeymoonDareMode', String(mode));
    this.applyHoneymoonDareList();
  }

  /** Icon class (without `bi`) for scoreboard / cells — duo uses gender, else stable pool per name */
  playerIconClass(player: { name?: string; gender?: string } | null | undefined): string {
    if (!player?.name) {
      return 'bi-person';
    }
    const g = String(player.gender || '').toLowerCase();
    if (g === 'male') {
      return 'bi-gender-male';
    }
    if (g === 'female') {
      return 'bi-gender-female';
    }
    const pool = [
      'bi-suit-spade-fill',
      'bi-suit-heart-fill',
      'bi-suit-diamond-fill',
      'bi-suit-club-fill',
      'bi-star-fill',
      'bi-lightning-charge-fill',
      'bi-moon-stars',
      'bi-fire',
      'bi-emoji-laughing-fill'
    ];
    let h = 0;
    for (let i = 0; i < player.name.length; i++) {
      h += player.name.charCodeAt(i);
    }
    return pool[h % pool.length];
  }

  get categoryVibe(): { icon: string; headline: string; sub: string } | null {
    const key = String(this.cat ?? '');
    const vibes: Record<string, { icon: string; headline: string; sub: string }> = {
      '1': { icon: 'bi-balloon-heart-fill', headline: 'Friendly', sub: 'Party-safe fun' },
      '2': { icon: 'bi-people-fill', headline: 'Single-gender night', sub: 'Boys-only or girls-only' },
      '3': { icon: 'bi-fire', headline: 'Mixed — normal', sub: 'Turn up the heat a little' },
      '4': { icon: 'bi-heart-pulse-fill', headline: 'Mixed — 18+', sub: 'Bold & grown-up' },
      '5': { icon: 'bi-arrow-through-heart', headline: 'Duo', sub: 'Just the two of you' },
      '6': { icon: 'bi-moon-stars-fill', headline: 'Honeymoon', sub: 'Pick your dare mood below' }
    };
    return vibes[key] ?? null;
  }
}
