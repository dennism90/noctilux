/* Streaming rhythm estimation: no decoding/upload of the whole soundtrack. */
(() => {
 'use strict';
 class NoctiluxRhythm {
  constructor(){this.reset();}
  reset(){this.previous=0;this.mean=0;this.meanRise=0;this.lastTime=null;this.lastBeat=null;this.intervals=[];this.bpm=null;this.confidence=0;this.bucket=null;this.pulse=0;}
  sample({bass=0,rms=0,time,active=false,manualBpm=null}){
   if(!active||!Number.isFinite(time)){this.pulse=0;this.previous=0;this.lastTime=null;this.lastBeat=null;this.bucket=null;return this.state();}
   bass=Number.isFinite(bass)?Math.max(0,Math.min(1,bass)):0;rms=Number.isFinite(rms)?Math.max(0,Math.min(1,rms)):0;
   if(this.lastTime!==null&&(time<this.lastTime||time-this.lastTime>1.6))this.reset();
   const first=this.lastTime===null;this.lastTime=time;
   const level=.65*bass+.35*rms,rise=Math.max(0,level-this.previous);
   if(first){this.mean=level;this.previous=level;}
   let hit=false;
   if(Number.isFinite(manualBpm)&&manualBpm>=40&&manualBpm<=220){
    const bucket=Math.floor(time*manualBpm/60);hit=this.bucket!==bucket&&level>.012;this.bucket=bucket;this.bpm=manualBpm;this.confidence=1;
   }else{
    this.bucket=null;
    hit=!first&&rise>Math.max(.025,this.meanRise*1.8)&&level>Math.max(.05,this.mean*1.1)&&(this.lastBeat===null||time-this.lastBeat>=.26);
    if(hit&&this.lastBeat!==null){
     const interval=time-this.lastBeat;
     if(interval>=.27&&interval<=1.5){
      this.intervals.push(interval);if(this.intervals.length>14)this.intervals.shift();
      if(this.intervals.length>=3){const sorted=this.intervals.slice().sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)];const good=this.intervals.filter(x=>Math.abs(x-median)<median*.18);this.bpm=Math.round(60/median);this.confidence=Math.min(1,good.length/8)*(good.length/this.intervals.length);}
     }
    }
    this.mean+=(level-this.mean)*.05;this.meanRise+=(rise-this.meanRise)*.04;
   }
   if(hit)this.lastBeat=time;
   this.pulse=this.lastBeat===null?0:Math.exp(-Math.max(0,time-this.lastBeat)*9);
   // Silence never continues a synthetic metronome pulse.
   if(level<.012)this.pulse=0;
   this.previous=level;return this.state();
  }
  state(){return {bpm:this.bpm,confidence:this.confidence,pulse:this.pulse};}
 }
 window.NoctiluxRhythm=NoctiluxRhythm;
})();
